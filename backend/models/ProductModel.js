import { Schema, model, Types } from 'mongoose';

const productSchema = new Schema(
  {
    vendorId: {
      type: Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [50, 'Product name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least ₹1'],
    },
    category: {
      type: String,
      trim: true,
      // Free-form: 'Burgers', 'Beverages', 'Desserts', etc.
      default: 'General',
    },
    image: {
      type: String, // Cloudinary URL
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true, // Vendor can mark item unavailable without deleting
    },
    preparationTime: {
      type: Number, // In minutes
      default: 15,
      min: [1, 'Preparation time must be at least 1 minute'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
    strict: "throw", // Prevent saving fields not defined in the schema
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
productSchema.index({ vendorId: 1 }); // Fast queries for vendor's menu
productSchema.index({ vendorId: 1, isAvailable: 1 }); // Filter available items per vendor
productSchema.index({ vendorId: 1, category: 1 }); // Filter by category per vendor

const ProductModel = model('Product', productSchema);
export default ProductModel;