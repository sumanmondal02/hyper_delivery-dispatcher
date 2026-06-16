import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import UserModel from '../models/UserModel.js';

let io = null;

// ─── init — call once in server.js ───────────────────────────────────────────
export const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Socket: No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await UserModel.findById(decoded.id).select('-password');

      if (!user)          return next(new Error('Socket: User not found'));
      if (!user.isActive) return next(new Error('Socket: Account inactive'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Socket: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { _id: userId, role } = socket.user;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Socket connected: ${userId} [${role}]`);
    }

    // Customer joins order room for live tracking
    socket.on('join_order_room',   ({ orderId })   => orderId && socket.join(`order_${orderId}`));
    // Vendor joins their room to receive new orders
    socket.on('join_vendor_room', ({ vendorId } = {}) => {
      const roomId = vendorId || userId;
      socket.join(`vendor_${roomId}`);
    });
    // Partner joins their room to receive delivery requests
    socket.on('join_partner_room', () => socket.join(`partner_${userId}`));
    socket.on('join_user_room', () => socket.join(`user_${userId}`));
    // Admin joins global feed
    socket.on('join_admin_room', () => { if (role === 'admin') socket.join('admin_room'); });

    // Partner emits location every ~5-10 sec while delivering
    socket.on('update_location', ({ orderId, location }) => {
      if (!orderId || !location?.coordinates) return;
      UserModel.findByIdAndUpdate(userId, {
        'partnerDetails.currentLocation': { type: 'Point', coordinates: location.coordinates },
      }).catch(() => {});
      io.to(`order_${orderId}`).emit('partner_location_update', { orderId, location, timestamp: new Date() });
      io.to('admin_room').emit('delivery_update', { partnerId: userId, orderId, location, timestamp: new Date() });
    });

    socket.on('disconnect', async (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Socket disconnected: ${userId} — ${reason}`);
      }
    });
  });

  console.log('Socket.io initialised');
  return io;
};

// ─── getIO — import anywhere to emit events from controllers ──────────────────
export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised — call init(server) first');
  return io;
};