import { create } from 'zustand';
import api from '../api/api';

const useOrderStore = create((set, get) => ({
  activeOrder:     null,   // current live order being tracked
  partnerLocation: null,   // { coordinates: [lng, lat] }
  orders:          [],     // order history list
  totalPages:      1,
  currentPage:     1,
  loading:         false,
  error:           null,

  // ─── Place order ─────────────────────────────────────────────────────────────
  placeOrder: async (payload) => {
    // payload: { vendorId, items, deliveryAddressId, specialInstructions }
    set({ loading: true, error: null });
    try {
      const res = await api.post('/orders', payload);
      set({ activeOrder: res.data.order, loading: false });
      return { success: true, order: res.data.order };
    } catch (err) {
      const error = err.response?.data?.message || 'Failed to place order';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  // ─── Track order by orderId string (public) ───────────────────────────────
  trackOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/orders/track/${orderId}`);
      set({ activeOrder: res.data.order, loading: false });
      return { success: true, data: res.data };
    } catch (err) {
      set({ error: 'Order not found', loading: false });
      return { success: false };
    }
  },

  // ─── Get order history ────────────────────────────────────────────────────
  fetchHistory: async (page = 1, status = '') => {
    set({ loading: true, error: null });
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const res = await api.get('/orders/history', { params });
      set({
        orders:      res.data.orders,
        totalPages:  res.data.totalPages,
        currentPage: res.data.currentPage,
        loading:     false,
      });
    } catch (err) {
      set({ error: 'Failed to load orders', loading: false });
    }
  },

  // ─── Cancel order ────────────────────────────────────────────────────────
  cancelOrder: async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/cancel`);
      set((s) => ({
        activeOrder: s.activeOrder?._id === orderId
          ? { ...s.activeOrder, orderStatus: 'cancelled' }
          : s.activeOrder,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  // ─── Socket updates (called from components listening to socket) ──────────
  setActiveOrder:     (order)    => set({ activeOrder: order }),
  updateOrderStatus:  (status)   => set((s) => ({
    activeOrder: s.activeOrder ? { ...s.activeOrder, orderStatus: status } : null,
  })),
  setPartnerLocation: (location) => set({ partnerLocation: location }),
  clearActiveOrder:   ()         => set({ activeOrder: null, partnerLocation: null }),
  clearError:         ()         => set({ error: null }),
}));

export default useOrderStore;