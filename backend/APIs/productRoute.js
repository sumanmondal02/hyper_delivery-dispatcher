import express from 'express';
import { ProductModel, VendorModel } from '../models/index.js';
import { verifyToken, verifyRole } from '../middlewares/verifyToken.js';
import { upload } from '../config/multer.js';
import { uploadToCloudinary } from '../config/cloudinaryUpload.js';

const productRoute = express.Router();

// All routes: vendor only
productRoute.use(verifyToken, verifyRole('vendor'));

// Helper — get vendor _id from logged-in userId
const getVendorId = async (userId) => {
  const v = await VendorModel.findOne({ userId }).select('_id isApproved');
  return v;
};

// ── POST /api/vendor/products ─────────────────────────────────────────────────
productRoute.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const vendor = await getVendorId(req.user._id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    if (!vendor.isApproved) return res.status(403).json({ success: false, message: 'Vendor not yet approved' });

    const { name, description, price, category, preparationTime } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: 'name and price are required' });

    let image = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      image = result.secure_url;
    }

    const product = await ProductModel.create({
      vendorId: vendor._id,
      name,
      description:     description     || '',
      price:           parseFloat(price),
      category:        category        || 'General',
      preparationTime: preparationTime ? parseInt(preparationTime) : 15,
      image,
    });

    return res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
});

// ── GET /api/vendor/products ──────────────────────────────────────────────────
productRoute.get('/', async (req, res, next) => {
  try {
    const vendor = await getVendorId(req.user._id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    const filter = { vendorId: vendor._id };
    if (req.query.category)    filter.category    = req.query.category;
    if (req.query.isAvailable !== undefined)
      filter.isAvailable = req.query.isAvailable === 'true';

    const products = await ProductModel.find(filter).sort({ category: 1, name: 1 });
    return res.status(200).json({ success: true, count: products.length, products });
  } catch (err) { next(err); }
});

// ── PUT /api/vendor/products/:id ──────────────────────────────────────────────
productRoute.put('/:id', upload.single('image'), async (req, res, next) => {
  try {
    const vendor = await getVendorId(req.user._id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    const { name, description, price, category, preparationTime, isAvailable } = req.body;
    const updates = {};

    if (name            !== undefined) updates.name            = name;
    if (description     !== undefined) updates.description     = description;
    if (price           !== undefined) updates.price           = parseFloat(price);
    if (category        !== undefined) updates.category        = category;
    if (preparationTime !== undefined) updates.preparationTime = parseInt(preparationTime);
    if (isAvailable     !== undefined) updates.isAvailable     = isAvailable === 'true' || isAvailable === true;

    if (req.file) {
      const result  = await uploadToCloudinary(req.file.buffer);
      updates.image = result.secure_url;
    }

    if (!Object.keys(updates).length)
      return res.status(400).json({ success: false, message: 'No valid fields to update' });

    const product = await ProductModel.findOneAndUpdate(
      { _id: req.params.id, vendorId: vendor._id }, // ownership check
      updates,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.status(200).json({ success: true, product });
  } catch (err) { next(err); }
});

// ── DELETE /api/vendor/products/:id ──────────────────────────────────────────
productRoute.delete('/:id', async (req, res, next) => {
  try {
    const vendor = await getVendorId(req.user._id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    const product = await ProductModel.findOneAndDelete({ _id: req.params.id, vendorId: vendor._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
});

export default productRoute;