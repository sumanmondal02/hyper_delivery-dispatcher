import { Schema, model, Types} from 'mongoose';

// ─── Sub-schema: Order Item (snapshot at time of order) ───────────────────────
const orderItemSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true, // Snapshot — survives product edits/deletion
    },
    price: {
      type: Number,
      required: true, // Price at time of order, not current price
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    subtotal: {
      type: Number,
      required: true, // price * quantity
      min: 0,
    },
  },
  { _id: false }
);

// ─── Sub-schema: GeoJSON Address Snapshot ────────────────────────────────────
const locationSnapshotSchema = new Schema(
  {
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
  { _id: false }
);

const deliveryAddressSchema = new Schema(
  {
    fullAddress: { type: String, required: true },
    landmark:    { type: String, default: '' },
    city:        { type: String },
    pincode:     { type: String },
    location:    { type: locationSnapshotSchema, required: true },
  },
  { _id: false }
);

const pickupAddressSchema = new Schema(
  {
    businessName: { type: String, required: true },
    address:      { type: String, required: true },
    location:     { type: locationSnapshotSchema, required: true },
  },
  { _id: false }
);

// ─── Order Status Flow ────────────────────────────────────────────────────────
// placed → accepted → preparing → ready → picked_up → in_transit → delivered
//                                                 ↘ cancelled (any stage before picked_up)

// ─── Main Order Schema ────────────────────────────────────────────────────────
const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      // Format: ORD-YYYYMMDD-XXXXX  e.g. ORD-20260517-A3X9K
    },
    customerId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
    },
    vendorId: {
      type: Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor reference is required'],
    },

    // Embedded snapshots — preserve data even if product/address is deleted
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must have at least one item',
      },
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: [true, 'Delivery address is required'],
    },
    pickupAddress: {
      type: pickupAddressSchema,
      required: [true, 'Pickup address is required'],
    },

    // Pricing
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment
    paymentMethod: {
      type: String,
      enum: ['COD'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },

    // Order lifecycle
    orderStatus: {
      type: String,
      enum: {
        values: [
          'placed',      // Customer placed order
          'accepted',    // Vendor accepted
          'preparing',   // Vendor is preparing
          'ready',       // Ready for pickup
          'picked_up',   // Partner picked up
          'in_transit',  // On the way to customer
          'delivered',   // Successfully delivered
          'cancelled',   // Cancelled by customer / partner
        ],
        message: 'Invalid order status',
      },
      default: 'placed',
    },

    // Delivery details
    distance: {
      type: Number, // In kilometers
      min: 0,
    },
    estimatedDeliveryTime: {
      type: Number, // In minutes
      min: 0,
    },

    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [100, 'Instructions cannot exceed 100 characters'],
      default: '',
    },

    // Set when order is delivered
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Track who cancelled and why
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'partner', 'vendor', 'admin', null],
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
    strict: "throw", // Prevent saving fields not defined in the schema
  }
);

// ─── Pre-save Hook: Auto-set deliveredAt ─────────────────────────────────────
orderSchema.pre('save', function (next) {
  if (
    this.isModified('orderStatus') &&
    this.orderStatus === 'delivered' &&
    !this.deliveredAt
  ) {
    this.deliveredAt = new Date();
  }

  // Mark payment as paid on delivery (COD)
  if (this.isModified('orderStatus') && this.orderStatus === 'delivered') {
    this.paymentStatus = 'paid';
  }

  next();
});

// ─── Static: Generate Unique Order ID ────────────────────────────────────────
orderSchema.statics.generateOrderId = function () {
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const random = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 chars
  return `ORD-${date}-${random}`;
};

orderSchema.index({ 'pickupAddress.location': '2dsphere' });
orderSchema.index({ 'deliveryAddress.location': '2dsphere' });

const OrderModel = model('Order', orderSchema);
export default OrderModel;