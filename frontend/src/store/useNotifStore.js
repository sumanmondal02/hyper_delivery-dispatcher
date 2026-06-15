import { create } from 'zustand';
import api from '../api/api';

const useNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,
  loading:       false,

  // ─── Fetch notifications ──────────────────────────────────────────────────
  fetchNotifs: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/notifications');
      set({
        notifications: res.data.notifications || [],
        unreadCount: (res.data.notifications || []).filter((n) => !n.isRead).length,
        loading: false,
      });
    } catch (_) {
      set({ loading: false });
    }
  },

  // ─── Mark one as read ─────────────────────────────────────────────────────
  markRead: async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      set((s) => {
        const notifications = s.notifications.map((n) =>
          n._id === notifId ? { ...n, isRead: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        };
      });
    } catch (_) {}
  },

  // ─── Mark all as read ─────────────────────────────────────────────────────
  markAllRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (_) {}
  },

  // ─── Push a real-time notification (from socket) ──────────────────────────
  pushNotif: (notif) => {
    set((s) => ({
      notifications: [notif, ...s.notifications],
      unreadCount:   s.unreadCount + 1,
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

export default useNotifStore;