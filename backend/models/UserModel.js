import { Schema, model, Types } from 'mongoose';
import bcrypt from 'bcrypt';

// ─── Sub-schema: Partner Details ────────────────────────────────────────────
const partnerDetailsSchema = new Schema(
  {
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'truck'],
      required: [true, 'Vehicle type is required for partners'],
    },
    vehicleNumber: {
      type: String,
      trim: true,
      required: [true, 'Vehicle number is required for partners'],
    },
    drivingLicense: {
      type: String,
      trim: true,
      required: [true, 'Driving license number is required for partners'],
    },
    isAvailable: {
      type: Boolean,
      default: false, // Partner starts offline
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false } // No separate _id for sub-document
);

// ─── Main User Schema ────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [4, 'Name must be at least 4 characters'],
      maxlength: [25, 'Name cannot exceed 25 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'partner', 'vendor', 'admin'],
        message: 'Role must be customer, partner, vendor'
      },
      required: [true, 'Role is required'],
    },
    profileImage: {
      type: String, // Cloudinary URL
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Only populated when role === 'partner'
    partnerDetails: {
      type: partnerDetailsSchema,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
    strict: "throw", // Prevent saving fields not defined in the schema
  }
);

// 2dsphere for geospatial queries (find nearby partners)
userSchema.index({ 'partnerDetails.currentLocation': '2dsphere' });

// ─── Pre-save Hook: Hash Password ────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Compare Password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Safe User Object (no password) ─────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const UserModel = model('User', userSchema);
export default UserModel;