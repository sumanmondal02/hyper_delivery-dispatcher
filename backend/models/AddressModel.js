import { Schema, model, Types} from 'mongoose';

const addressSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    label: {
      type: String,
      trim: true,
      // e.g. 'Home', 'Office', 'Other'
      enum: {
        values: ['Home', 'Office', 'Other'],
        message: 'Label must be Home, Office, or Other',
      },
      default: 'Home',
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, 'Landmark cannot exceed 100 characters'],
      default: '',
    },

    // GeoJSON Point for distance calculations
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
              v[0] >= -180 && v[0] <= 180 &&
              v[1] >= -90  && v[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt needed
    versionKey: false,
    strict: "throw", // Prevent saving fields not defined in the schema
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
addressSchema.index({ userId: 1 }); // Get all addresses for a user
// Optional 2dsphere if you ever need nearest-address queries
addressSchema.index({ location: '2dsphere' });

const AddressModel = model('Address', addressSchema);
export default AddressModel;