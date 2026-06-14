import express from 'express';
import { VendorModel, ProductModel, OrderModel } from '../models/index.js';
import { verifyToken, verifyRole } from '../middlewares/verifyToken.js';
import { upload } from '../config/multer.js';
import { uploadToCloudinary } from '../config/cloudinaryUpload.js';
import { findNearestPartner, broadcastDeliveryRequest } from '../helpers/partnerMatcher.js';
import { calculatePartnerEarnings } from '../helpers/pricing.js';
import { notify } from '../helpers/notify.js';
import { getIO } from '../config/socket.js';

const vendorRoute = express.Router();

// ─── Helper ───────────────────────────────────────────────────────────────────
// Reused by all /me/* handlers — avoids repeating VendorModel.findOne({ userId })
const getOwnVendor = (userId) => VendorModel.findOne({ userId });

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED /me/* ROUTES  —  must come BEFORE /:id
// Express matches top-to-bottom. Without this order, GET /me/profile would
// hit GET /:id with id="me", causing a Mongoose CastError.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendors/me/profile
// Return the logged-in vendor's own full profile (with isCurrentlyOpen virtual).
vendorRoute.get(
  '/me/profile',
  verifyToken,
  verifyRole('vendor'),
  async (req, res, next) => {
    try {
      const vendor = await getOwnVendor(req.user._id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor profile not found — please contact support' });
      }

      const vendorObj = vendor.toObject({ virtuals: true });
      vendorObj.isCurrentlyOpen = vendor.isCurrentlyOpen;

      return res.status(200).json({ success: true, vendor: vendorObj });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/vendors/me/settings
// Update opening hours, isOpen toggle, description, city, pincode, or store image.
// Accepts multipart/form-data for optional image upload.
//
// Body (all fields optional — only provided fields are updated):
//   openingTime  — "HH:MM"
//   closingTime  — "HH:MM"
//   isOpen       — boolean
//   description  — string
//   city         — string
//   pincode      — string
//   image        — file (multipart)
vendorRoute.put(
  '/me/settings',
  verifyToken,
  verifyRole('vendor'),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const vendor = await getOwnVendor(req.user._id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor profile not found' });
      }

      const { openingTime, closingTime, isOpen, description, city, pincode } = req.body;
      const updates  = {};
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

      if (openingTime !== undefined) {
        if (!timeRegex.test(openingTime)) {
          return res.status(400).json({ success: false, message: 'openingTime must be in HH:MM format (e.g. 09:00)' });
        }
        updates.openingTime = openingTime;
      }

      if (closingTime !== undefined) {
        if (!timeRegex.test(closingTime)) {
          return res.status(400).json({ success: false, message: 'closingTime must be in HH:MM format (e.g. 22:00)' });
        }
        updates.closingTime = closingTime;
      }

      // Validate opening < closing using whichever values are effective after this update
      const effectiveOpen  = updates.openingTime || vendor.openingTime;
      const effectiveClose = updates.closingTime  || vendor.closingTime;
      if (effectiveOpen >= effectiveClose) {
        return res.status(400).json({ success: false, message: 'openingTime must be earlier than closingTime' });
      }

      if (isOpen       !== undefined) updates.isOpen       = isOpen === 'true' || isOpen === true;
      if (description  !== undefined) updates.description  = description;
      if (city         !== undefined) updates.city         = city;
      if (pincode      !== undefined) updates.pincode      = pincode;

      if (req.file) {
        const result  = await uploadToCloudinary(req.file.buffer);
        updates.image = result.secure_url;
      }

      if (!Object.keys(updates).length) {
        return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
      }

      const updated = await VendorModel.findOneAndUpdate(
        { userId: req.user._id },
        updates,
        { new: true, runValidators: true }
      );

      return res.status(200).json({ success: true, message: 'Settings updated successfully', vendor: updated });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/vendors/me/analytics
// Basic sales analytics: total orders, revenue, active orders, top 5 products.
vendorRoute.get(
  '/me/analytics',
  verifyToken,
  verifyRole('vendor'),
  async (req, res, next) => {
    try {
      const vendor = await getOwnVendor(req.user._id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor profile not found' });
      }

      // Lazy import — avoids circular dependency if OrderModel is added later
      const { OrderModel } = await import('../models/index.js');

      const completedStatuses = ['delivered'];
      const activeStatuses    = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'in_transit'];

      // Run all three DB operations in parallel for speed
      const [revenueAgg, popularAgg, activeCount] = await Promise.all([

        // Total delivered orders + revenue (vendor earns itemsTotal; deliveryFee goes to platform/partner)
        OrderModel.aggregate([
          { $match: { vendorId: vendor._id, orderStatus: { $in: completedStatuses } } },
          { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$itemsTotal' } } },
        ]),

        // Top 5 products by quantity sold across delivered orders
        OrderModel.aggregate([
          { $match: { vendorId: vendor._id, orderStatus: { $in: completedStatuses } } },
          { $unwind: '$items' },
          {
            $group: {
              _id:           '$items.productId',
              name:          { $first: '$items.name' },
              totalQuantity: { $sum: '$items.quantity' },
              totalRevenue:  { $sum: '$items.subtotal' },
            },
          },
          { $sort:  { totalQuantity: -1 } },
          { $limit: 5 },
          { $project: { _id: 1, name: 1, totalQuantity: 1, totalRevenue: 1 } },
        ]),

        // Count of orders currently in progress
        OrderModel.countDocuments({ vendorId: vendor._id, orderStatus: { $in: activeStatuses } }),
      ]);

      const summary = revenueAgg[0] || { totalOrders: 0, totalRevenue: 0 };

      return res.status(200).json({
        success: true,
        analytics: {
          totalOrders:  summary.totalOrders,
          totalRevenue: summary.totalRevenue,
          activeOrders: activeCount,
          popularItems: popularAgg,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES  —  no auth required
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/vendors/nearby?lat=17.385&lng=78.486&radius=5&category=restaurant
// Find open, approved vendors within a radius of the customer's location.
//
// Query params:
//   lat      — customer latitude  (required)
//   lng      — customer longitude (required)
//   radius   — search radius in km (optional, default 5, capped at 20)
//   category — filter by vendor category (optional)
vendorRoute.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng query parameters are required' });
    }

    const latitude  = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'lat and lng must be valid numbers' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates — latitude −90 to 90, longitude −180 to 180' });
    }

    const radiusMetres = Math.min(parseFloat(radius) || 5, 20) * 1000;

    const filter = {
      isOpen:     true,
      isApproved: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] }, // GeoJSON: [lng, lat]
          $maxDistance: radiusMetres,
        },
      },
    };

    if (category) {
      const allowed = ['restaurant', 'grocery', 'pharmacy', 'bakery', 'other'];
      if (!allowed.includes(category)) {
        return res.status(400).json({ success: false, message: `category must be one of: ${allowed.join(', ')}` });
      }
      filter.category = category;
    }

    const vendors = await VendorModel.find(filter)
      .limit(20)
      .select('-__v')
      .populate('userId', 'name phone');

    return res.status(200).json({ success: true, count: vendors.length, vendors });
  } catch (err) {
    next(err);
  }
});

// GET /api/vendors/orders?status=placed
vendorRoute.get('/orders', verifyToken, verifyRole('vendor'), async (req, res, next) => {
  try {
    const vendor = await getOwnVendor(req.user._id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    const filter = { vendorId: vendor._id };
    if (req.query.status) filter.orderStatus = req.query.status;
    const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).select('-__v').populate('customerId', 'name phone');
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) { next(err); }
});

// PUT /api/vendors/orders/:id/status
vendorRoute.put('/orders/:id/status', verifyToken, verifyRole('vendor'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'preparing', 'ready'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `status must be one of: ${allowed.join(', ')}` });
    const vendor = await getOwnVendor(req.user._id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    const order = await OrderModel.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const flow = { placed: 'accepted', accepted: 'preparing', preparing: 'ready' };
    if (flow[order.orderStatus] !== status)
      return res.status(400).json({ success: false, message: `Cannot move from ${order.orderStatus} to ${status}` });
    order.orderStatus = status;
    await order.save();
    const io = getIO();
    const msgs = { accepted: 'Your order has been accepted', preparing: 'Your order is being prepared', ready: 'Your order is ready for pickup' };
    io.to(`order_${order.orderId}`).emit('order_status_update', { orderId: order.orderId, status, message: msgs[status] });
    if (status === 'ready') {
      const partners = await findNearestPartner(vendor.location, 5000);
      const earnings = calculatePartnerEarnings(order.deliveryFee);
      if (partners.length) broadcastDeliveryRequest(io, partners[0], order, earnings);
    }
    await notify(order.customerId.toString(), msgs[status], `Order ${order.orderId}: ${msgs[status]}`, 'order', { orderId: order.orderId });
    return res.status(200).json({ success: true, order });
  } catch (err) { next(err); }
});

// GET /api/vendors/:id
// Get full details of a single vendor by their Vendor document _id.
vendorRoute.get('/:id', async (req, res, next) => {
  try {
    const vendor = await VendorModel.findById(req.params.id).populate('userId', 'name phone');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const vendorObj = vendor.toObject({ virtuals: true });
    vendorObj.isCurrentlyOpen = vendor.isCurrentlyOpen;

    return res.status(200).json({ success: true, vendor: vendorObj });
  } catch (err) {
    next(err);
  }
});

// GET /api/vendors/:id/menu?category=Burgers
// Get all available products for a vendor.
// Returns a unique category list alongside products for frontend tab/filter UI.
vendorRoute.get('/:id/menu', async (req, res, next) => {
  try {
    const vendor = await VendorModel.findById(req.params.id).select('_id isApproved businessName');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    if (!vendor.isApproved) {
      return res.status(403).json({ success: false, message: 'This vendor is not yet approved' });
    }

    const filter = { vendorId: vendor._id, isAvailable: true };
    if (req.query.category) filter.category = req.query.category;

    const products   = await ProductModel.find(filter).select('-__v').sort({ category: 1, name: 1 });
    const categories = [...new Set(products.map((p) => p.category))];

    return res.status(200).json({
      success: true,
      vendor:  { _id: vendor._id, businessName: vendor.businessName },
      count:   products.length,
      categories,
      products,
    });
  } catch (err) {
    next(err);
  }
});

export default vendorRoute;