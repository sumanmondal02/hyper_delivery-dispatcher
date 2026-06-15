import { create } from 'zustand';

const BASE_FARE   = 20;
const PER_KM_RATE = 10;
const MIN_FEE     = 20;
const MAX_FEE     = 200;

const calcDeliveryFee = (distanceKm = 0) => {
  const fee = BASE_FARE + distanceKm * PER_KM_RATE;
  return Math.round(Math.max(MIN_FEE, Math.min(MAX_FEE, fee)));
};

const useCartStore = create((set, get) => ({
  items:      [],
  vendor:     null,
  distanceKm: 0,

  addItem: (product, vendor) => {
    const { items, vendor: currentVendor } = get();
    if (currentVendor && currentVendor._id !== vendor._id) {
      set({ items: [], vendor: null });
    }
    const existing = get().items.find((i) => i.productId === product._id);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
        ),
        vendor,
      });
    } else {
      set({
        items: [...get().items, {
          productId: product._id,
          name:      product.name,
          price:     product.price,
          quantity:  1,
          image:     product.image || null,
        }],
        vendor,
      });
    }
  },

  removeItem: (productId) => {
    const items = get().items.filter((i) => i.productId !== productId);
    set({ items, vendor: items.length === 0 ? null : get().vendor });
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return; }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i
      ),
    });
  },

  clearCart:   () => set({ items: [], vendor: null, distanceKm: 0 }),
  setDistance: (km) => set({ distanceKm: km }),

  // Computed as regular functions (Zustand v5 compatible)
  getItemsTotal:  () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getDeliveryFee: () => calcDeliveryFee(get().distanceKm),
  getTotalAmount: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0) + calcDeliveryFee(get().distanceKm),
  getItemCount:   () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

export default useCartStore;