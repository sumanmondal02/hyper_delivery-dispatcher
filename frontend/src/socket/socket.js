import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:6436';

let socket = null;

// ─── Connect with JWT ─────────────────────────────────────────────────────────
export const connectSocket = () => {
  if (socket?.connected) return;

  const token = localStorage.getItem('token');
  socket = io(URL, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket.id);
    socket.emit('join_user_room');
  });
  socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));
  socket.on('connect_error', (err) => console.error('[socket] error:', err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// ─── Room helpers ─────────────────────────────────────────────────────────────
export const joinOrderRoom   = (orderId)   => socket?.emit('join_order_room',   { orderId });
export const joinVendorRoom  = (vendorId)  => socket?.emit('join_vendor_room',  { vendorId });
export const joinPartnerRoom = (partnerId) => socket?.emit('join_partner_room', { partnerId });
export const joinAdminRoom   = ()          => socket?.emit('join_admin_room');

// ─── Partner: emit live location every 8s while on delivery ──────────────────
let locationInterval = null;

export const startLocationBroadcast = (partnerId, orderId, getCoords) => {
  if (locationInterval) return;
  locationInterval = setInterval(async () => {
    try {
      const coords = await getCoords();
      socket?.emit('update_location', { orderId, location: { coordinates: coords } });
    } catch (_) {}
  }, 8000);
};

export const stopLocationBroadcast = () => {
  clearInterval(locationInterval);
  locationInterval = null;
};