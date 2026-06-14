import { Schema, model, Types } from 'mongoose';

// ─── Sub-schema: Single Location Ping ────────────────────────────────────────
const trackingPointSchema = new Schema(
  {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ─── Main Delivery Schema ─────────────────────────────────────────────────────
const deliverySchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      unique: true, // One delivery record per order
    },
    partnerId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'Partner reference is required'],
    },

    status: {
      type: String,
      enum: {
        values: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
        message: 'Invalid delivery status',
      },
      default: 'assigned',
    },

    partnerEarnings: {
      type: Number,
      required: [true, 'Partner earnings is required'],
      min: 0,
      // = deliveryFee * (1 - PLATFORM_COMMISSION)
    },

    // Timestamps for each stage
    pickedUpAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Real-time GPS pings (kept in memory; pruned or archived for large orders)
    trackingHistory: {
      type: [trackingPointSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
    strict: "throw", // Prevent saving fields not defined in the schema
  }
);

// ─── Pre-save Hook: Auto-set stage timestamps ─────────────────────────────────
deliverySchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'picked_up' && !this.pickedUpAt) {
      this.pickedUpAt = new Date();
    }
    if (this.status === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }
});

// ─── Instance Method: Add Location Ping ──────────────────────────────────────
deliverySchema.methods.addTrackingPoint = function (coordinates) {
  this.trackingHistory.push({
    location: { type: 'Point', coordinates },
    timestamp: new Date(),
  });

  // Cap history at 200 points to avoid document bloat
  if (this.trackingHistory.length > 200) {
    this.trackingHistory = this.trackingHistory.slice(-200);
  }
};

// ─── Instance Method: Latest Location ────────────────────────────────────────
deliverySchema.methods.getLatestLocation = function () {
  if (!this.trackingHistory.length) return null;
  return this.trackingHistory[this.trackingHistory.length - 1].location;
};

deliverySchema.index({ partnerId: 1, status: 1 });

const DeliveryModel = model('Delivery', deliverySchema);
export default DeliveryModel;