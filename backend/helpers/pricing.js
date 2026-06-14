// ─── Read pricing config (from env or hardcoded defaults) ────────────────────
const config = () => ({
  BASE_FARE:           parseFloat(process.env.BASE_FARE)           || 20,   // ₹20
  PER_KM_RATE:         parseFloat(process.env.PER_KM_RATE)         || 10,   // ₹10/km
  MIN_FEE:             20,                                                    // ₹20 floor
  MAX_FEE:             200,                                                   // ₹200 ceiling
  PLATFORM_COMMISSION: parseFloat(process.env.PLATFORM_COMMISSION) || 0.20, // 20%
  BUFFER_MINUTES:      5,                                                     // prep buffer
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. calculateDeliveryFee
//    @param distanceKm — number, from getDistanceMatrix / calculateDistance
//    @returns Number   — delivery fee in rupees (₹), clamped to MIN/MAX
//
//    Examples:
//      calculateDeliveryFee(0.5)  → ₹20  (hits minimum)
//      calculateDeliveryFee(2.5)  → ₹45
//      calculateDeliveryFee(25)   → ₹200 (hits maximum)
// ─────────────────────────────────────────────────────────────────────────────
export const calculateDeliveryFee = (distanceKm) => {
  const { BASE_FARE, PER_KM_RATE, MIN_FEE, MAX_FEE } = config();
  const raw = BASE_FARE + distanceKm * PER_KM_RATE;
  return Math.round(Math.max(MIN_FEE, Math.min(MAX_FEE, raw)));
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. calculatePartnerEarnings
//    Platform keeps PLATFORM_COMMISSION % and pays the rest to the partner.
//    @param deliveryFee — number, result of calculateDeliveryFee
//    @returns Number    — partner payout in rupees (₹)
//
//    Example: ₹50 fee × (1 − 0.20) = ₹40 partner payout
// ─────────────────────────────────────────────────────────────────────────────
export const calculatePartnerEarnings = (deliveryFee) => {
  const { PLATFORM_COMMISSION } = config();
  return Math.round(deliveryFee * (1 - PLATFORM_COMMISSION));
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. calculateEstimatedDeliveryTime
//    Total time = vendor prep time + travel time (from Maps) + buffer.
//    @param preparationTime — number (minutes), from vendor/product
//    @param travelDuration  — number (minutes), from calculateDistance / getDistanceMatrix
//    @returns Number        — estimated delivery time in minutes
//
//    Example: 15 min prep + 12 min travel + 5 buffer = 32 min
// ─────────────────────────────────────────────────────────────────────────────
export const calculateEstimatedDeliveryTime = (preparationTime, travelDuration) => {
  const { BUFFER_MINUTES } = config();
  return Math.ceil(preparationTime + travelDuration + BUFFER_MINUTES);
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. calculateOrderTotal
//    Combines item subtotals with the delivery fee.
//    @param items       — array of { price: Number, quantity: Number }
//    @param deliveryFee — number, result of calculateDeliveryFee
//    @returns { itemsTotal, deliveryFee, totalAmount }
//
//    Example:
//      items = [{ price: 150, quantity: 2 }, { price: 80, quantity: 1 }]
//      → itemsTotal: ₹380 | deliveryFee: ₹45 | totalAmount: ₹425
// ─────────────────────────────────────────────────────────────────────────────
export const calculateOrderTotal = (items, deliveryFee) => {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    itemsTotal:  Math.round(itemsTotal),
    deliveryFee: Math.round(deliveryFee),
    totalAmount: Math.round(itemsTotal + deliveryFee),
  };
};