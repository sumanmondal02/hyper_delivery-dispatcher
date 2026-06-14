import express from 'express';
import { OrderModel, ProductModel, VendorModel, DeliveryModel, UserModel } from '../models/index.js';
import { verifyToken, verifyRole } from '../middlewares/verifyToken.js';
import { AddressModel } from '../models/index.js';
import { getDistanceMatrix, calculateDistance } from '../helpers/maps.js';
import { calculateDeliveryFee, calculatePartnerEarnings, calculateEstimatedDeliveryTime, calculateOrderTotal } from '../helpers/pricing.js';
import { findNearestPartner, broadcastDeliveryRequest } from '../helpers/partnerMatcher.js';
import { notify } from '../helpers/notify.js';
import { getIO } from '../config/socket.js';

const orderRoute = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders  — Customer places a new order
// Body: { vendorId, items: [{ productId, quantity }], deliveryAddressId, specialInstructions? }
// ─────────────────────────────────────────────────────────────────────────────
orderRoute.post('/', verifyToken, verifyRole('customer'), async (req, res, next) => {
  try {
    const { vendorId, items, deliveryAddressId, specialInstructions } = req.body;

    if (!vendorId || !items?.length || !deliveryAddressId)
      return res.status(400).json({ success: false, message: 'vendorId, items, and deliveryAddressId are required' });

    // ── Fetch vendor, delivery address, and all products in parallel ────────
    const [vendor, deliveryAddress, products] = await Promise.all([
      VendorModel.findById(vendorId),
      AddressModel.findOne({ _id: deliveryAddressId, userId: req.user._id }),
      ProductModel.find({ _id: { $in: items.map((i) => i.productId) }, vendorId, isAvailable: true }),
    ]);

    if (!vendor)          return res.status(404).json({ success: false, message: 'Vendor not found' });
    if (!vendor.isApproved || !vendor.isOpen)
      return res.status(400).json({ success: false, message: 'Vendor is not accepting orders right now' });
    if (!deliveryAddress) return res.status(404).json({ success: false, message: 'Delivery address not found' });

    // ── Validate every requested product exists and is available ────────────
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    for (const item of items) {
      if (!productMap.has(item.productId.toString()))
        return res.status(400).json({ success: false, message: `Product ${item.productId} is unavailable or not from this vendor` });
      if (!item.quantity || item.quantity < 1)
        return res.status(400).json({ success: false, message: 'Each item must have quantity ≥ 1' });
    }

    // ── Build items snapshot ────────────────────────────────────────────────
    const orderItems = items.map((item) => {
      const p = productMap.get(item.productId.toString());
      return {
        productId: p._id,
        name:      p.name,
        price:     p.price,
        quantity:  item.quantity,
        subtotal:  Math.round(p.price * item.quantity),
      };
    });

    // ── Distance + fee via Distance Matrix (lightweight, no polyline needed yet) ──
    const pickup  = { coordinates: vendor.location.coordinates };   // [lng, lat]
    const dropoff = { coordinates: deliveryAddress.location.coordinates };

    const { distance, duration } = await getDistanceMatrix(pickup, dropoff);

    // Max prep time across all items in the order
    const maxPrepTime = Math.max(...orderItems.map((oi) => {
      const p = productMap.get(oi.productId.toString());
      return p?.preparationTime || 15;
    }));

    const deliveryFee = calculateDeliveryFee(distance);
    const totals      = calculateOrderTotal(orderItems, deliveryFee);
    const eta         = calculateEstimatedDeliveryTime(maxPrepTime, duration);
    const earnings    = calculatePartnerEarnings(deliveryFee);

    // ── Generate unique orderId with collision retry ─────────────────────────
    let orderId;
    let attempts = 0;
    do {
      orderId = OrderModel.generateOrderId();
      attempts++;
    } while (await OrderModel.exists({ orderId }) && attempts < 5);

    // ── Create order ────────────────────────────────────────────────────────
    const order = await OrderModel.create({
      orderId,
      customerId: req.user._id,
      vendorId:   vendor._id,
      items:      orderItems,
      deliveryAddress: {
        fullAddress: deliveryAddress.fullAddress,
        landmark:    deliveryAddress.landmark || '',
        city:        deliveryAddress.city     || '',
        pincode:     deliveryAddress.pincode  || '',
        location:    deliveryAddress.location,
      },
      pickupAddress: {
        businessName: vendor.businessName,
        address:      vendor.address,
        location:     vendor.location,
      },
      ...totals,
      distance,
      estimatedDeliveryTime: eta,
      specialInstructions: specialInstructions || '',
    });

    // ── Increment vendor total orders ────────────────────────────────────────
    await VendorModel.findByIdAndUpdate(vendor._id, { $inc: { totalOrders: 1 } });

    // ── Notify vendor via socket (new order in queue) ───────────────────────
    const io = getIO();
    io.to(`vendor_${vendor._id}`).emit('new_order', {
      orderId:     order.orderId,
      orderDbId:   order._id,
      items:       order.items,
      itemsTotal:  order.itemsTotal,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      specialInstructions: order.specialInstructions,
      createdAt:   order.createdAt,
    });

    // ── Find nearest partner and broadcast delivery request ─────────────────
    const partners = await findNearestPartner(vendor.location, 5000);
    if (partners.length) {
      broadcastDeliveryRequest(io, partners[0], order, earnings);
    }

    // ── Notifications (DB + socket) ─────────────────────────────────────────
    await Promise.all([
      notify(req.user._id, 'Order placed!', `Your order ${orderId} has been placed.`, 'order', { orderId }),
      notify(vendor.userId, 'New order received', `Order ${orderId} — ₹${order.totalAmount}`, 'order', { orderId }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        _id:                   order._id,
        orderId:               order.orderId,
        orderStatus:           order.orderStatus,
        items:                 order.items,
        itemsTotal:            order.itemsTotal,
        deliveryFee:           order.deliveryFee,
        totalAmount:           order.totalAmount,
        distance,
        estimatedDeliveryTime: eta,
        paymentMethod:         order.paymentMethod,
      },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/track/:orderId  — Public order tracking by orderId string
// ─────────────────────────────────────────────────────────────────────────────
orderRoute.get('/track/:orderId', async (req, res, next) => {
  try {
    const order = await OrderModel.findOne({ orderId: req.params.orderId })
      .select('-__v')
      .populate('vendorId', 'businessName address location');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const delivery = await DeliveryModel.findOne({ orderId: order._id })
      .select('status pickedUpAt deliveredAt partnerId')
      .populate('partnerId', 'name phone partnerDetails.vehicleType partnerDetails.currentLocation');

    return res.status(200).json({ success: true, order, delivery: delivery || null });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/history  — Customer order history (paginated)
// Query: ?page=1&limit=10&status=delivered
// ─────────────────────────────────────────────────────────────────────────────
orderRoute.get('/history', verifyToken, verifyRole('customer'), async (req, res, next) => {
  try {
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip   = (page - 1) * limit;
    const filter = { customerId: req.user._id };

    if (req.query.status) filter.orderStatus = req.query.status;

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .populate('vendorId', 'businessName image'),
      OrderModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      currentPage: page,
      totalPages:  Math.ceil(total / limit),
      total,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vendor/orders  — Vendor sees their own orders
// Query: ?status=placed  (optional filter)
// ─────────────────────────────────────────────────────────────────────────────
// orderRoute.get('/vendor/orders', verifyToken, verifyRole('vendor'), async (req, res, next) => {
//   try {
//     const vendor = await VendorModel.findOne({ userId: req.user._id }).select('_id');
//     if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

//     const filter = { vendorId: vendor._id };
//     if (req.query.status) filter.orderStatus = req.query.status;

//     const orders = await OrderModel.find(filter)
//       .sort({ createdAt: -1 })
//       .select('-__v')
//       .populate('customerId', 'name phone');

//     return res.status(200).json({ success: true, count: orders.length, orders });
//   } catch (err) { next(err); }
// });

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/vendor/orders/:id  — Vendor updates order status
// Body: { status: 'accepted' | 'preparing' | 'ready' }
// Mounted in server.js under /api/vendor so path becomes /api/vendor/orders/:id
// ─────────────────────────────────────────────────────────────────────────────
// orderRoute.put('/vendor/:id/status', verifyToken, verifyRole('vendor'), async (req, res, next) => {
//   try {
//     const { status } = req.body;
//     const allowed    = ['accepted', 'preparing', 'ready'];
//     if (!allowed.includes(status))
//       return res.status(400).json({ success: false, message: `status must be one of: ${allowed.join(', ')}` });

//     const vendor = await VendorModel.findOne({ userId: req.user._id }).select('_id');
//     if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

//     const order = await OrderModel.findOne({ _id: req.params.id, vendorId: vendor._id });
//     if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

//     // Enforce state machine: accepted → preparing → ready
//     const flow = { placed: 'accepted', accepted: 'preparing', preparing: 'ready' };
//     if (flow[order.orderStatus] !== status)
//       return res.status(400).json({ success: false, message: `Cannot move from ${order.orderStatus} to ${status}` });

//     order.orderStatus = status;
//     await order.save();

//     const io = getIO();
//     const statusMessages = {
//       accepted:  'Your order has been accepted',
//       preparing: 'Your order is being prepared',
//       ready:     'Your order is ready for pickup',
//     };

//     io.to(`order_${order.orderId}`).emit('order_status_update', {
//       orderId: order.orderId,
//       status,
//       message: statusMessages[status],
//     });

//     // When order is ready, notify all partners again in case none accepted yet
//     if (status === 'ready') {
//       const partners = await findNearestPartner(vendor.location, 5000);
//       const earnings  = calculatePartnerEarnings(order.deliveryFee);
//       if (partners.length) broadcastDeliveryRequest(io, partners[0], order, earnings);
//     }

//     await notify(order.customerId.toString(), statusMessages[status], `Order ${order.orderId}: ${statusMessages[status]}`, 'order', { orderId: order.orderId });

//     return res.status(200).json({ success: true, order });
//   } catch (err) { next(err); }
// });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id  — Get single order detail (customer sees own, vendor sees own)
// ─────────────────────────────────────────────────────────────────────────────
orderRoute.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const order = await OrderModel.findById(req.params.id)
      .select('-__v')
      .populate('vendorId', 'businessName address location image');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Ownership: customer sees own orders, vendor sees orders for their shop
    const isCustomer = req.user.role === 'customer' && order.customerId.equals(req.user._id);
    const isAdmin    = req.user.role === 'admin';
    let   isVendor   = false;

    if (req.user.role === 'vendor') {
      const vendor = await VendorModel.findOne({ userId: req.user._id }).select('_id');
      isVendor = vendor && order.vendorId._id.equals(vendor._id);
    }

    if (!isCustomer && !isVendor && !isAdmin)
      return res.status(403).json({ success: false, message: 'Access denied' });

    return res.status(200).json({ success: true, order });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/cancel  — Customer cancels order (only before picked_up)
// Body: { reason? }
// ─────────────────────────────────────────────────────────────────────────────
orderRoute.put('/:id/cancel', verifyToken, verifyRole('customer'), async (req, res, next) => {
  try {
    const order = await OrderModel.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const cancellableStatuses = ['placed', 'accepted', 'preparing', 'ready'];
    if (!cancellableStatuses.includes(order.orderStatus))
      return res.status(400).json({ success: false, message: `Cannot cancel an order that is ${order.orderStatus}` });

    order.orderStatus       = 'cancelled';
    order.cancelledBy       = 'customer';
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    await order.save();

    // Notify vendor
    const io = getIO();
    io.to(`vendor_${order.vendorId}`).emit('order_cancelled', {
      orderId: order.orderId,
      reason:  order.cancellationReason,
    });
    io.to(`order_${order.orderId}`).emit('order_status_update', {
      orderId: order.orderId,
      status:  'cancelled',
      message: 'Order has been cancelled',
    });

    await notify(order.vendorId.toString(), 'Order cancelled', `Order ${order.orderId} was cancelled by customer`, 'order', { orderId: order.orderId });

    return res.status(200).json({ success: true, message: 'Order cancelled', order });
  } catch (err) { next(err); }
});



export default orderRoute;