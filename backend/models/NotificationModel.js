import { Schema, model, Types } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [200, 'Message cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['order', 'delivery', 'payment', 'system'],
        message: 'Type must be order, delivery, payment, or system',
      },
      required: [true, 'Notification type is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Flexible metadata (e.g. { orderId: 'ORD-...' } for deep-linking)
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt
    versionKey: false,
    strict: "throw", // Prevent saving fields not defined in the schema
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
notificationSchema.index({ userId: 1 });
notificationSchema.index({ userId: 1, isRead: 1 }); // Unread count queries
notificationSchema.index({ createdAt: -1 });         // Latest first

// ─── Static: Create Notification Helper ──────────────────────────────────────
notificationSchema.statics.notify = async function ({
  userId,
  title,
  message,
  type,
  metadata = {},
}) {
  return this.create({ userId, title, message, type, metadata });
};

// ─── TTL Index: Auto-delete notifications older than 30 days ─────────────────
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 } // 30 days
);

const NotificationModel = model('Notification', notificationSchema);
export default NotificationModel;