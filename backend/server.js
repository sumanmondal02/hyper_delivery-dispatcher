import express from "express";
import cookieParser from "cookie-parser";
import http from "http";
import cors from "cors";
import { config } from "dotenv";
import mongoose from "mongoose";
import { init as initSocket } from './config/socket.js';
import { errorHandler } from './middlewares/verifyToken.js'
import authRoute from './APIs/authRoute.js';
import vendorRoute from './APIs/vendorRoute.js';
import productRoute from './APIs/productRoute.js';
import orderRoute from './APIs/orderRoute.js';
import partnerRoute from './APIs/partnerRoute.js';
import addressRoute from './APIs/addressRoute.js';
import adminRoute from './APIs/adminRoute.js';
import notificationRoute from './APIs/notificationRoute.js';

config();

const app = express();
const server = http.createServer(app); //required for socket.io
initSocket(server);

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter(Boolean);

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      return callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));

// cookie parser middleware
app.use(cookieParser());

//for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// JSON body parser middleware
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV });
});

//path for routes
app.use('/api/auth', authRoute);
app.use('/api/vendors', vendorRoute);
app.use('/api/vendor/products', productRoute);
app.use('/api/orders', orderRoute);
app.use('/api/address', addressRoute);
app.use('/api/partner', partnerRoute);
app.use('/api/admin', adminRoute);
app.use('/api/notifications', notificationRoute);

//to handle invalid path
app.use((req, res) => {
    res.status(404).json({message: `Path ${req.url} is invalid`})
})

app.use(errorHandler);

// connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {dbName: "hyper-dispatcher"});
        console.log("Database Connected");
        const PORT = process.env.PORT || 6436;
        server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.error("Error connecting to Database:", error.message);
        process.exit(1);
    }
};

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} — shutting down…`);
  await mongoose.connection.close();
  server.close(() => { console.log('Server closed'); process.exit(0); });
};
 
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

connectDB();

export default app;