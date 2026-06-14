import { UserModel } from '../models/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// findNearestPartner
//    Uses MongoDB $near to find the closest available delivery partner
//    within a given radius of the pickup location.
//    Partners must have role='partner', isActive=true, and
//    partnerDetails.isAvailable=true (online toggle).
//
//    @param pickupLocation — GeoJSON Point { coordinates: [lng, lat] }
//                           (same format as vendor.location / order.pickupAddress.location)
//    @param maxDistance    — search radius in metres (default 5 km)
//    @param limit          — max candidates to return (default 5)
//    @returns Array        — partner documents sorted nearest-first,
//                           or [] if none found within radius
//
//    Usage in orderRoute.js:
//      const partners = await findNearestPartner(
//        order.pickupAddress.location,   // GeoJSON Point
//        5000                            // 5 km radius
//      );
//      const partner = partners[0];      // nearest available
// ─────────────────────────────────────────────────────────────────────────────
export const findNearestPartner = async (
  pickupLocation,
  maxDistance = 5000,
  limit = 5
) => {
  return UserModel.find({
    role:                         'partner',
    isActive:                     true,
    'partnerDetails.isAvailable': true,
    'partnerDetails.currentLocation': {
      $near: {
        $geometry: {
          type:        'Point',
          coordinates: pickupLocation.coordinates, // [lng, lat]
        },
        $maxDistance: maxDistance,
      },
    },
  })
    .limit(limit)
    .select('name phone partnerDetails.vehicleType partnerDetails.currentLocation');
};

// ─────────────────────────────────────────────────────────────────────────────
// broadcastDeliveryRequest
//    Emits a new_delivery_request socket event to the nearest available partner.
//    Called after findNearestPartner — pass in the partner and the order data.
//    If the partner rejects or doesn't respond within TIMEOUT_MS,
//    call this again with the next candidate (partners[1], etc.).
//
//    @param io       — Socket.io server instance (from getIO())
//    @param partner  — UserModel document (from findNearestPartner result)
//    @param order    — OrderModel document (freshly created order)
//    @param earnings — Number, from calculatePartnerEarnings()
//
//    Usage in orderRoute.js:
//      const io = getIO();
//      broadcastDeliveryRequest(io, partner, order, earnings);
// ─────────────────────────────────────────────────────────────────────────────
export const broadcastDeliveryRequest = (io, partner, order, earnings) => {
  io.to(`partner_${partner._id}`).emit('new_delivery_request', {
    orderId:        order.orderId,
    orderDbId:      order._id,
    pickupLocation: order.pickupAddress.location,
    pickupAddress:  order.pickupAddress.address,
    dropLocation:   order.deliveryAddress.location,
    dropAddress:    order.deliveryAddress.fullAddress,
    distance:       order.distance,         // km
    duration:       order.estimatedDeliveryTime, // min (includes prep + buffer)
    earnings,                                // ₹ partner payout
    itemsTotal:     order.itemsTotal,
    totalAmount:    order.totalAmount,
  });
};