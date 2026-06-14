import express from 'express';
import { NotificationModel } from '../models/index.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const notificationRoute = express.Router();

notificationRoute.use(verifyToken);

// ── GET /api/notifications?page=1&limit=20&unreadOnly=true ───────────────────
notificationRoute.get('/', async (req, res, next) => {
  try {
    const page      = Math.max(parseInt(req.query.page) || 1, 1);
    const limit     = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip      = (page - 1) * limit;
    const filter    = { userId: req.user._id };

    if (req.query.unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
      currentPage: page,
      totalPages:  Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
});

// ── PUT /api/notifications/read-all ──────────────────────────────────────────
notificationRoute.put('/read-all', async (req, res, next) => {
  try {
    await NotificationModel.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
notificationRoute.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.status(200).json({ success: true, notification });
  } catch (err) { next(err); }
});

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
notificationRoute.delete('/:id', async (req, res, next) => {
  try {
    const notification = await NotificationModel.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
});

export default notificationRoute;