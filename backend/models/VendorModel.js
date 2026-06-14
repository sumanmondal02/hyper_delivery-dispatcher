import { Schema, model, Types } from 'mongoose';

const vendorSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true, // One vendor profile per user account
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      minlength: [2, 'Business name must be at least 2 characters'],
      maxlength: [30, 'Business name cannot exceed 30 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: {
        values: ['restaurant', 'grocery', 'pharmacy', 'bakery', 'other'],
        message: 'Category must be restaurant, grocery, pharmacy, bakery, or other',
      },
      required: [true, 'Category is required'],
    },
    image: {
      type: String, // Cloudinary URL for store image / logo
      default: null,
    },

    // GeoJSON Point — required for $near queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: function (v) {
            return v.length === 2 &&
              v[0] >= -180 && v[0] <= 180 &&  // longitude
              v[1] >= -90  && v[1] <= 90;      // latitude
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    pincode: {
        type: String,
        trim: true,
        match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    openingTime: {
      type: String,
      default: '09:00',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'],
    },
    closingTime: {
      type: String,
      default: '22:00',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'],
    },
    isOpen: {
      type: Boolean,
      default: true, // Manual open/close toggle
    },

    // Admin approval before vendor can accept orders
    isApproved: {
      type: Boolean,
      default: false,
    },

    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
    strict: "throw", // Prevent saving fields not defined in the schema
  }
);

// ─── Virtual: Is Currently Open Based on Time ────────────────────────────────
vendorSchema.virtual('isCurrentlyOpen').get(function () {
  if (!this.isOpen) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= this.openingTime && currentTime <= this.closingTime;
});

vendorSchema.index({ location: '2dsphere' });

const VendorModel = model('Vendor', vendorSchema);
export default VendorModel;