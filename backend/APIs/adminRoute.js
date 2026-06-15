import express from 'express';
import { UserModel, OrderModel, DeliveryModel, VendorModel } from '../models/index.js';
import { verifyToken, verifyRole } from '../middlewares/verifyToken.js';

const adminRoute = express.Router();

adminRoute.use(verifyToken, verifyRole('admin'));

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
adminRoute.get('/dashboard', async (req, res, next) => {
  try {
    const activeDeliveryStatuses = ['picked_up', 'in_transit'];

    const [
      totalOrders,
      totalCustomers,
      totalPartners,
      totalVendors,
      activeDeliveries,
      revenueAgg,
    ] = await Promise.all([
      OrderModel.countDocuments(),
      UserModel.countDocuments({ role: 'customer' }),
      UserModel.countDocuments({ role: 'partner' }),
      VendorModel.countDocuments(),
      OrderModel.countDocuments({ orderStatus: { $in: activeDeliveryStatuses } }),
      OrderModel.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue:    revenueAgg[0]?.totalRevenue || 0,
        activeDeliveries,
        totalCustomers,
        totalPartners,
        totalVendors,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/users?role=vendor&page=1&limit=20 ─────────────────────────
adminRoute.get('/users', async (req, res, next) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip   = (page - 1) * limit;
    const filter = {};

    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [users, total] = await Promise.all([
      UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      UserModel.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, users, currentPage: page, totalPages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
});

// ── PUT /api/admin/users/:id/toggle  — activate / deactivate a user ──────────
adminRoute.put('/users/:id/toggle', async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id).select('isActive role');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate an admin account' });

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) { next(err); }
});

// ── PUT /api/admin/vendors/:id/approve  — approve a vendor ───────────────────
adminRoute.put('/vendors/:id/approve', async (req, res, next) => {
  try {
    const vendor = await VendorModel.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    // Notify the vendor owner
    const { notify } = await import('../helpers/notify.js');
    await notify(vendor.userId.toString(), 'Store approved!', 'Your store has been approved. You can now receive orders.', 'system', {});

    return res.status(200).json({ success: true, message: 'Vendor approved', vendor });
  } catch (err) { next(err); }
});

// ── GET /api/admin/orders?status=delivered&date=2026-05-17 ───────────────────
adminRoute.get('/orders', async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.orderStatus = req.query.status;
    if (req.query.date) {
      const day   = new Date(req.query.date);
      const next  = new Date(day); next.setDate(day.getDate() + 1);
      filter.createdAt = { $gte: day, $lt: next };
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'name phone')
        .populate('vendorId',   'businessName'),
      OrderModel.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, orders, currentPage: page, totalPages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
});

// ── GET /api/admin/deliveries  — all active deliveries for live map ───────────
adminRoute.get('/deliveries', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const deliveries = await DeliveryModel.find(filter)
      .sort({ createdAt: -1 })
      .populate('partnerId', 'name phone partnerDetails.currentLocation partnerDetails.vehicleType')
      .populate('orderId',   'orderId orderStatus pickupAddress deliveryAddress totalAmount');

    return res.status(200).json({ success: true, count: deliveries.length, deliveries });
  } catch (err) { next(err); }
});

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
adminRoute.get('/analytics', async (req, res, next) => {
  try {
    const now        = new Date();
    const last7Days  = new Date(now); last7Days.setDate(now.getDate() - 7);
    const last30Days = new Date(now); last30Days.setDate(now.getDate() - 30);

    const [daily, weekly, monthly] = await Promise.all([
      // Daily — orders per day for last 7 days
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: last7Days }, orderStatus: 'delivered' } },
        { $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders:  { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        }},
        { $sort: { _id: 1 } },
      ]),
      // Weekly totals for last 4 weeks
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: last30Days }, orderStatus: 'delivered' } },
        { $group: {
          _id:     { $week: '$createdAt' },
          orders:  { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        }},
        { $sort: { _id: 1 } },
      ]),
      // Monthly total
      OrderModel.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $group: {
          _id:     { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          orders:  { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        }},
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);

    return res.status(200).json({ success: true, analytics: { daily, weekly, monthly } });
  } catch (err) { next(err); }
});

// ── PUT /api/admin/settings  — update pricing via env-like DB config ──────────
// NOTE: This updates process.env at runtime (affects current process only).
// For persistence across restarts, store settings in a DB config collection.
// For now this is the lightweight version matching your current architecture.
adminRoute.put('/settings', async (req, res, next) => {
  try {
    const { baseFare, perKmRate, commissionRate } = req.body;

    if (baseFare       !== undefined) process.env.BASE_FARE           = String(parseFloat(baseFare));
    if (perKmRate      !== undefined) process.env.PER_KM_RATE         = String(parseFloat(perKmRate));
    if (commissionRate !== undefined) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate <= 0 || rate >= 1)
        return res.status(400).json({ success: false, message: 'commissionRate must be between 0 and 1' });
      process.env.PLATFORM_COMMISSION = String(rate);
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated for current session',
      settings: {
        baseFare:       parseFloat(process.env.BASE_FARE)           || 20,
        perKmRate:      parseFloat(process.env.PER_KM_RATE)         || 10,
        commissionRate: parseFloat(process.env.PLATFORM_COMMISSION) || 0.20,
      },
    });
  } catch (err) { next(err); }
});

// Add this route:
adminRoute.put('/users/:id/toggle', async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    return res.json({ success: true, user });
  } catch (err) { next(err); }
});

export default adminRoute;