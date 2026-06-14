import express from 'express';
import { UserModel, OrderModel, DeliveryModel } from '../models/index.js';
import { verifyToken, verifyRole } from '../middlewares/verifyToken.js';
import { calculatePartnerEarnings } from '../helpers/pricing.js';
import { notify } from '../helpers/notify.js';
import { getIO } from '../config/socket.js';
import mongoose from 'mongoose';

const partnerRoute = express.Router();

partnerRoute.use(verifyToken, verifyRole('partner'));

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/partner/availability
// Body: { isAvailable: true | false }
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.put('/availability', async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    if (isAvailable === undefined)
      return res.status(400).json({ success: false, message: 'isAvailable is required' });

    const val = isAvailable === true || isAvailable === 'true';

    await UserModel.findByIdAndUpdate(req.user._id, {
      'partnerDetails.isAvailable': val,
    });

    return res.status(200).json({ success: true, message: `You are now ${val ? 'online' : 'offline'}` });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/partner/location
// Body: { location: { coordinates: [lng, lat] } }
// Updates partner's stored currentLocation in DB (REST fallback — prefer socket)
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.put('/location', async (req, res, next) => {
  try {
    const coords = req.body.location?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2)
      return res.status(400).json({ success: false, message: 'location.coordinates must be [longitude, latitude]' });

    await UserModel.findByIdAndUpdate(req.user._id, {
      'partnerDetails.currentLocation': { type: 'Point', coordinates: coords },
    });

    return res.status(200).json({ success: true, message: 'Location updated' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/partner/available-orders
// Orders in 'ready' status with no delivery assigned, within 5km of partner
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.get('/available-orders', async (req, res, next) => {
  try {
    const partner = await UserModel.findById(req.user._id)
      .select('partnerDetails.currentLocation partnerDetails.isAvailable');

    if (!partner.partnerDetails?.isAvailable)
      return res.status(400).json({ success: false, message: 'You are offline. Go online to see available orders.' });

    const coords = partner.partnerDetails.currentLocation?.coordinates;
    if (!coords || (coords[0] === 0 && coords[1] === 0))
      return res.status(400).json({ success: false, message: 'Update your location before viewing available orders' });

    // Find orders that are ready and have no delivery record yet
    const readyOrders = await OrderModel.find({ orderStatus: 'ready' }).select('_id');
    const assignedIds = await DeliveryModel.find({
      orderId: { $in: readyOrders.map((o) => o._id) },
    }).distinct('orderId');

    const unassignedIds = readyOrders
      .map((o) => o._id)
      .filter((id) => !assignedIds.some((a) => a.equals(id)));

    // Filter by proximity using pickup location stored on the order
    const orders = await OrderModel.find({
      _id: { $in: unassignedIds },
      'pickupAddress.location': {
        $near: {
          $geometry: { type: 'Point', coordinates: coords },
          $maxDistance: 5000,
        },
      },
    }).select('orderId pickupAddress deliveryAddress distance deliveryFee estimatedDeliveryTime items');

    const result = orders.map((o) => ({
      orderId:               o.orderId,
      orderDbId:             o._id,
      pickupAddress:         o.pickupAddress,
      dropAddress:           o.deliveryAddress.fullAddress,
      distance:              o.distance,
      estimatedDeliveryTime: o.estimatedDeliveryTime,
      earnings:              calculatePartnerEarnings(o.deliveryFee),
      itemCount:             o.items.length,
    }));

    return res.status(200).json({ success: true, count: result.length, orders: result });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/partner/orders/:id/accept
// Partner accepts a delivery — creates DeliveryModel record
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.put('/orders/:id/accept', async (req, res, next) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus !== 'ready')
      return res.status(400).json({ success: false, message: 'Order is not ready for pickup' });

    // Prevent double-accept
    const existing = await DeliveryModel.findOne({ orderId: order._id });
    if (existing) return res.status(400).json({ success: false, message: 'Order already accepted by another partner' });

    const earnings = calculatePartnerEarnings(order.deliveryFee);

    const delivery = await DeliveryModel.create({
      orderId:        order._id,
      partnerId:      req.user._id,
      status:         'assigned',
      partnerEarnings: earnings,
    });

    // Update order status
    order.orderStatus = 'picked_up'; // next state after partner accepts from ready
    await order.save();

    const io = getIO();
    io.to(`order_${order.orderId}`).emit('order_status_update', {
      orderId: order.orderId,
      status:  'picked_up',
      message: 'A delivery partner has been assigned and is on the way',
    });

    const partner = await UserModel.findById(req.user._id).select('name phone');
    io.to(`order_${order.orderId}`).emit('delivery_assigned', {
      orderId:       order.orderId,
      partnerName:   partner.name,
      partnerPhone:  partner.phone,
      estimatedTime: order.estimatedDeliveryTime,
    });
    io.to('admin_room').emit('delivery_update', {
      orderId:   order.orderId,
      partnerId: req.user._id,
      status:    'assigned',
    });

    await Promise.all([
      notify(order.customerId.toString(), 'Rider assigned!', `${partner.name} is picking up your order`, 'delivery', { orderId: order.orderId }),
      UserModel.findByIdAndUpdate(req.user._id, { 'partnerDetails.isAvailable': false }),
    ]);

    // Fetch route polyline for partner map display
    let routePolyline = null;
    try {
      const { calculateDistance: getRoute } = await import('../helpers/maps.js');
      const pickup  = { coordinates: order.pickupAddress.location.coordinates };
      const dropoff = { coordinates: order.deliveryAddress.location.coordinates };
      const route   = await getRoute(pickup, dropoff);
      routePolyline = route.polyline;
    } catch { /* non-critical */ }

    return res.status(200).json({
      success: true,
      delivery,
      order: {
        orderId:       order.orderId,
        pickupAddress: order.pickupAddress,
        dropAddress:   order.deliveryAddress,
        distance:      order.distance,
        earnings,
        routePolyline,
      },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/partner/orders/:id/status
// Body: { status: 'in_transit' | 'delivered' }
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['in_transit', 'delivered'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `status must be in_transit or delivered` });

    const delivery = await DeliveryModel.findOne({ orderId: req.params.id, partnerId: req.user._id });
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    // State machine: assigned → in_transit → delivered
    const flow = { assigned: 'in_transit', in_transit: 'delivered' };
    // Accept picked_up as entry point too (set during accept)
    const allowFrom = { in_transit: ['assigned', 'picked_up'], delivered: ['in_transit'] };
    if (!allowFrom[status]?.includes(delivery.status))
      return res.status(400).json({ success: false, message: `Cannot move from ${delivery.status} to ${status}` });

    delivery.status = status;
    await delivery.save(); // pre-save hook handles pickedUpAt / deliveredAt

    const order = await OrderModel.findById(req.params.id);
    if (order) {
      order.orderStatus = status === 'delivered' ? 'delivered' : 'in_transit';
      await order.save(); // pre-save hook handles deliveredAt + paymentStatus=paid

      const io = getIO();
      const messages = {
        in_transit: 'Your order is on the way!',
        delivered:  'Your order has been delivered. Enjoy!',
      };

      io.to(`order_${order.orderId}`).emit('order_status_update', {
        orderId: order.orderId,
        status:  order.orderStatus,
        message: messages[status],
      });
      io.to('admin_room').emit('delivery_update', {
        orderId: order.orderId, partnerId: req.user._id, status,
      });

      if (status === 'delivered') {
        await Promise.all([
          notify(order.customerId.toString(), 'Delivered!', `Order ${order.orderId} delivered. Enjoy!`, 'delivery', { orderId: order.orderId }),
          notify(req.user._id.toString(), 'Earnings credited', `₹${delivery.partnerEarnings} added for order ${order.orderId}`, 'payment', { orderId: order.orderId }),
          UserModel.findByIdAndUpdate(req.user._id, {
            $inc: {
              'partnerDetails.totalEarnings':        delivery.partnerEarnings,
              'partnerDetails.completedDeliveries':  1,
            },
            'partnerDetails.isAvailable': true, // back online after delivery
          }),
        ]);
      }
    }

    return res.status(200).json({ success: true, delivery });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/partner/orders/:id/cancel  — Partner cancels on customer's request
// Body: { reason? }
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.put('/orders/:id/cancel', async (req, res, next) => {
  try {
    const delivery = await DeliveryModel.findOne({ orderId: req.params.id, partnerId: req.user._id });
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status === 'delivered') return res.status(400).json({ success: false, message: 'Cannot cancel a delivered order' });

    delivery.status = 'failed';
    await delivery.save();

    const order = await OrderModel.findById(req.params.id);
    if (order) {
      order.orderStatus        = 'cancelled';
      order.cancelledBy        = 'partner';
      order.cancellationReason = req.body.reason || 'Cancelled by delivery partner';
      await order.save();

      const io = getIO();
      io.to(`order_${order.orderId}`).emit('order_status_update', {
        orderId: order.orderId,
        status:  'cancelled',
        message: 'Your order was cancelled by the delivery partner',
      });

      await notify(order.customerId.toString(), 'Order cancelled', `Order ${order.orderId} was cancelled by the rider`, 'order', { orderId: order.orderId });
    }

    await UserModel.findByIdAndUpdate(req.user._id, { 'partnerDetails.isAvailable': true });

    return res.status(200).json({ success: true, message: 'Delivery cancelled' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/partner/earnings
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.get('/earnings', async (req, res, next) => {
  try {
    const partner = await UserModel.findById(req.user._id)
      .select('partnerDetails.totalEarnings partnerDetails.completedDeliveries');

    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(todayStart); weekStart.setDate(todayStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month] = await Promise.all([
      DeliveryModel.aggregate([
        { $match: { partnerId: new mongoose.Types.ObjectId(req.user._id), status: 'delivered', createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$partnerEarnings' } } },
      ]),
      DeliveryModel.aggregate([
        { $match: { partnerId: new mongoose.Types.ObjectId(req.user._id), status: 'delivered', createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: '$partnerEarnings' } } },
      ]),
      DeliveryModel.aggregate([
        { $match: { partnerId: new mongoose.Types.ObjectId(req.user._id), status: 'delivered', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$partnerEarnings' } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      earnings: {
        total:               partner.partnerDetails?.totalEarnings          || 0,
        completedDeliveries: partner.partnerDetails?.completedDeliveries    || 0,
        today:               today[0]?.total  || 0,
        thisWeek:            week[0]?.total   || 0,
        thisMonth:           month[0]?.total  || 0,
      },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/partner/history?page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────
partnerRoute.get('/history', async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip  = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      DeliveryModel.find({ partnerId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'orderId totalAmount deliveryAddress pickupAddress'),
      DeliveryModel.countDocuments({ partnerId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      deliveries,
      currentPage: page,
      totalPages:  Math.ceil(total / limit),
      total,
    });
  } catch (err) { next(err); }
});

export default partnerRoute;