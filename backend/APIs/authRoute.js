import express from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, VendorModel } from '../models/index.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { upload } from '../config/multer.js';
import { uploadToCloudinary } from '../config/cloudinaryUpload.js';

const authRoute = express.Router();

// ─── Helper: sign JWT and set cookie ─────────────────────────────────────────
const signAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.cookie('token', token, {
    httpOnly: true,                                      // JS cannot read it
    secure: process.env.NODE_ENV === 'production',       // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1 * 24 * 60 * 60 * 1000,                    // 1 day in ms
  });

  return token;
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Public. Creates a user. If role is 'vendor', also creates a VendorModel doc.
// Accepts optional profile image (multipart/form-data).
authRoute.post('/register', upload.single('profileImage'), async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // ── Basic field presence check ──────────────────────────────────────────
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, phone, and role are required',
      });
    }

    // ── Prevent direct admin self-registration ──────────────────────────────
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be self-registered',
      });
    }

    // ── Vendor-specific fields ──────────────────────────────────────────────
    if (role === 'vendor') {
      const { businessName, category, address, coordinates } = req.body;
      if (!businessName || !category || !address || !coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Vendors must provide businessName, category, address, and coordinates',
        });
      }
    }

    // ── Partner-specific fields ─────────────────────────────────────────────
    if (role === 'partner') {
      const { vehicleType, vehicleNumber, drivingLicense } = req.body;
      if (!vehicleType || !vehicleNumber || !drivingLicense) {
        return res.status(400).json({
          success: false,
          message: 'Partners must provide vehicleType, vehicleNumber, and drivingLicense',
        });
      }
    }

    // ── Upload profile image if provided ────────────────────────────────────
    let profileImageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      profileImageUrl = result.secure_url;
    }

    // ── Build user payload ──────────────────────────────────────────────────
    const userData = {
      name,
      email,
      password,
      phone,
      role,
      profileImage: profileImageUrl,
    };

    if (role === 'partner') {
      userData.partnerDetails = {
        vehicleType: req.body.vehicleType,
        vehicleNumber: req.body.vehicleNumber,
        drivingLicense: req.body.drivingLicense,
      };
    }

    // ── Save user ───────────────────────────────────────────────────────────
    const user = await UserModel.create(userData);

    // ── If vendor, create vendor profile ────────────────────────────────────
    if (role === 'vendor') {
      let coordinates;
      try {
        // Accept coordinates as JSON string "[lng, lat]" or already parsed
        coordinates = typeof req.body.coordinates === 'string'
          ? JSON.parse(req.body.coordinates)
          : req.body.coordinates;
      } catch {
        // If user already deleted, clean up then error
        await UserModel.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          message: 'coordinates must be a valid JSON array [longitude, latitude]',
        });
      }

      try {
        await VendorModel.create({
          userId: user._id,
          businessName: req.body.businessName,
          description: req.body.description || '',
          category: req.body.category,
          address: req.body.address,
          city: req.body.city || '',
          pincode: req.body.pincode || '',
          location: {
            type: 'Point',
            coordinates,
          },
        });
      } catch (vendorErr) {
        // Roll back user creation if vendor profile fails
        await UserModel.findByIdAndDelete(user._id);
        return next(vendorErr);
      }
    }

    // ── Sign JWT and set cookie ─────────────────────────────────────────────
    const token = signAndSetCookie(res, user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Public. Email + password → JWT cookie.
authRoute.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Must explicitly select password since select: false in schema
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated — contact support',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Protected. Clears the JWT cookie.
authRoute.post('/logout', verifyToken, async (req, res) => {
  if (req.user.role === "partner") {
    await UserModel.findByIdAndUpdate(req.user._id, {"partnerDetails.isAvailable": false});
  }
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Protected. Returns the currently logged-in user.
// For vendors, also populates their vendor profile.
authRoute.get('/me', verifyToken, async (req, res, next) => {
  try {
    let userData = req.user.toObject();

    // Attach vendor profile if applicable
    if (req.user.role === 'vendor') {
      const vendorProfile = await VendorModel.findOne({ userId: req.user._id });
      userData.vendorProfile = vendorProfile || null;
    }

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
authRoute.put('/profile', verifyToken, upload.single('profileImage'), async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
 
    if (name  !== undefined) updates.name  = name;
    if (phone !== undefined) updates.phone = phone;
 
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updates.profileImage = result.secure_url;
    }
 
    if (!Object.keys(updates).length)
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
 
    const updated = await UserModel.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return res.status(200).json({ success: true, message: 'Profile updated', user: updated.toSafeObject() });
  } catch (err) { next(err); }
});

export default authRoute; 