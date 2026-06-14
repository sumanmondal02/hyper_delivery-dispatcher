import express from 'express';
import { AddressModel } from '../models/index.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const addressRoute = express.Router();

// All address routes require authentication — no public access
addressRoute.use(verifyToken);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/address
// Add a new saved address for the logged-in user.
//
// Body: {
//   fullAddress:  String (required),
//   landmark:     String (optional),
//   city:         String (optional),
//   pincode:      String (optional, 6 digits),
//   label:        'Home' | 'Office' | 'Other' (optional, default 'Home'),
//   location: {
//     coordinates: [longitude, latitude]   ← GeoJSON order (required)
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────
addressRoute.post('/', async (req, res, next) => {
  try {
    const { fullAddress, landmark, city, pincode, label, location } = req.body;

    // ── Required field checks ───────────────────────────────────────────────
    if (!fullAddress) {
      return res.status(400).json({
        success: false,
        message: 'fullAddress is required',
      });
    }

    if (
      !location?.coordinates ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: 'location.coordinates must be an array of [longitude, latitude]',
      });
    }

    const [lng, lat] = location.coordinates;

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates — longitude must be −180 to 180, latitude −90 to 90',
      });
    }

    // ── Cap addresses per user at 5 ─────────────────────────────────────────
    // Keeps the saved-address list manageable on the frontend
    const count = await AddressModel.countDocuments({ userId: req.user._id });
    if (count >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 saved addresses allowed. Please delete one before adding a new one.',
      });
    }

    const address = await AddressModel.create({
      userId: req.user._id,
      fullAddress,
      landmark:  landmark  || '',
      city:      city      || '',
      pincode:   pincode   || '',
      label:     label     || 'Home',
      location: {
        type:        'Point',
        coordinates: [lng, lat],
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/address
// Get all saved addresses for the logged-in user.
// Returns newest first.
// ─────────────────────────────────────────────────────────────────────────────
addressRoute.get('/', async (req, res, next) => {
  try {
    const addresses = await AddressModel.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/address/:id
// Get a single address by ID (must belong to the logged-in user).
// ─────────────────────────────────────────────────────────────────────────────
addressRoute.get('/:id', async (req, res, next) => {
  try {
    const address = await AddressModel.findOne({
      _id:    req.params.id,
      userId: req.user._id,  // ownership check — users can only read their own
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    return res.status(200).json({
      success: true,
      address,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/address/:id
// Update an existing address (must belong to the logged-in user).
//
// Body: any subset of {
//   fullAddress, landmark, city, pincode, label, location: { coordinates }
// }
// Only provided fields are updated — others are left unchanged.
// ─────────────────────────────────────────────────────────────────────────────
addressRoute.put('/:id', async (req, res, next) => {
  try {
    const { fullAddress, landmark, city, pincode, label, location } = req.body;

    // ── Build update payload — only include what was sent ───────────────────
    const updates = {};

    if (fullAddress !== undefined) updates.fullAddress = fullAddress;
    if (landmark    !== undefined) updates.landmark    = landmark;
    if (city        !== undefined) updates.city        = city;
    if (pincode     !== undefined) updates.pincode     = pincode;
    if (label       !== undefined) updates.label       = label;

    // If coordinates are being updated, validate and rebuild the GeoJSON object
    if (location?.coordinates !== undefined) {
      if (
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message: 'location.coordinates must be an array of [longitude, latitude]',
        });
      }

      const [lng, lat] = location.coordinates;

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates — longitude must be −180 to 180, latitude −90 to 90',
        });
      }

      updates.location = {
        type:        'Point',
        coordinates: [lng, lat],
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update',
      });
    }

    // ── Find by ID + userId together — prevents users editing others' addresses
    const address = await AddressModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      {
        new:         true,  // return updated document
        runValidators: true,  // run schema validators on the update
      }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/address/:id
// Delete a saved address (must belong to the logged-in user).
// ─────────────────────────────────────────────────────────────────────────────
addressRoute.delete('/:id', async (req, res, next) => {
  try {
    const address = await AddressModel.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,  // ownership check
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default addressRoute;