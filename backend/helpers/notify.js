import { NotificationModel } from '../models/index.js';
import { getIO } from '../config/socket.js';

// ─────────────────────────────────────────────────────────────────────────────
// notify
//    Creates a DB notification record AND pushes a real-time socket event
//    to the user's notification channel — in a single call.
//
//    You'll use this everywhere: when an order is placed, status changes,
//    delivery is assigned, etc. Having it in one place means you never
//    forget to do one or the other.
//
//    @param userId   — ObjectId or string
//    @param title    — short heading (max 100 chars per NotificationModel)
//    @param message  — body text (max 200 chars)
//    @param type     — 'order' | 'delivery' | 'payment' | 'system'
//    @param metadata — optional object e.g. { orderId: 'ORD-...' }
//
//    Usage examples:
//
//    // When customer places order
//    await notify(customerId, 'Order placed', `Your order ${orderId} has been placed.`, 'order', { orderId });
//
//    // When vendor accepts order
//    await notify(customerId, 'Order accepted', 'Your order is being prepared.', 'order', { orderId });
//
//    // When delivery is assigned
//    await notify(customerId, 'Rider assigned', `${partnerName} will deliver your order.`, 'delivery', { orderId });
//
//    // When order is delivered
//    await notify(customerId, 'Delivered!', `Order ${orderId} delivered. Enjoy!`, 'delivery', { orderId });
//    await notify(partnerId,  'Earnings credited', `₹${earnings} added to your wallet.`, 'payment', { orderId });
// ─────────────────────────────────────────────────────────────────────────────
export const notify = async (userId, title, message, type, metadata = {}) => {
  try {
    // 1. Persist to DB (TTL index will auto-delete after 30 days)
    const notification = await NotificationModel.create({
      userId,
      title,
      message,
      type,
      metadata,
    });

    // 2. Push real-time event — fire and forget, don't block the caller
    try {
      const io = getIO();
      io.to(`user_${userId}`).emit('new_notification', {
        _id:      notification._id,
        title,
        message,
        type,
        metadata,
        isRead:   false,
        createdAt: notification.createdAt,
      });
    } catch {
      // Socket.io not initialised yet (e.g. during tests) — silently skip
    }

    return notification;
  } catch (err) {
    // Notifications are non-critical — log and continue rather than crashing
    // the request that triggered the notification
    console.error('notify() failed:', err.message);
    return null;
  }
};

// ─── Socket room for user notifications ──────────────────────────────────────
// In socket.js, add this inside io.on('connection', ...) to let clients
// join their personal notification channel:
//
//   socket.on('join_user_room', () => {
//     socket.join(`user_${userId}`);
//   });
//
// The client emits this right after connecting and authenticating.