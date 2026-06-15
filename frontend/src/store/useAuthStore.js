import { create } from 'zustand';
import api from '../api/api';
import { connectSocket, disconnectSocket } from '../socket/socket';

const useAuthStore = create((set) => ({
  user:    JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error:   null,

  // ─── Register ───────────────────────────────────────────────────────────────
  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      const { user, token } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
      disconnectSocket();
      connectSocket();
      return { success: true, role: user.role };
    } catch (err) {
      const error = err.response?.data?.message || 'Registration failed';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  // ─── Login ──────────────────────────────────────────────────────────────────
  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', data);
      const { user, token } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
      disconnectSocket();
      connectSocket();
      return { success: true, role: user.role };
    } catch (err) {
      const error = err.response?.data?.message || 'Login failed';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  // ─── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    disconnectSocket();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },

  // ─── Update profile ─────────────────────────────────────────────────────────
  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put('/auth/profile', data);
      const user = res.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Update failed';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;