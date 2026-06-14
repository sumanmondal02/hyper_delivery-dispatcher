# 🛵 Hyper Local Delivery Dispatcher

A real-time delivery management platform connecting **customers**, **vendors**, and **delivery partners** for hyper-local deliveries — with live GPS tracking, distance-based pricing, and instant status updates.

> Full developer documentation → [`Documentation.md`](./Documentation.md)

---

## ✨ What It Does

| Role | What They Can Do |
|------|-----------------|
| **Customer** | Browse nearby vendors, place orders, track delivery live on map, view history |
| **Vendor** | Receive orders in real-time, manage menu & images, update order status |
| **Delivery Partner** | Accept deliveries, get optimized route, share live location, track earnings |
| **Admin** | Monitor all deliveries on map, manage users, configure pricing, view analytics |

---

## 🏗️ Tech Stack

**Backend** — Node.js · Express.js · MongoDB · Socket.io · JWT · Cloudinary · Google Maps API

**Frontend** — React.js · TailwindCSS · Zustand · socket.io-client · @react-google-maps/api

**Hosting** — Render (backend) · Vercel (frontend) · MongoDB Atlas · Cloudinary

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Google Cloud project with Maps APIs enabled
- Cloudinary account

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hyper-local-delivery-dispatcher.git
cd hyper-local-delivery-dispatcher
```

### 2. Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure Environment Variables

**Backend** — create `server/.env`:

```env
NODE_ENV=development
PORT=6436
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/hyperlocal
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_MAPS_API_KEY=AIza...your_server_key
FRONTEND_URL=http://localhost:3000
BASE_FARE=20
PER_KM_RATE=10
PLATFORM_COMMISSION=0.20
```

**Frontend** — create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:6436/api
REACT_APP_SOCKET_URL=http://localhost:6436
REACT_APP_GOOGLE_MAPS_API_KEY=AIza...your_browser_key
```

> ⚠️ Use **separate** Google Maps API keys for backend and frontend. Restrict the browser key to your domain in Google Cloud Console.

### 4. Google Maps APIs to Enable

In **Google Cloud Console → APIs & Services → Library**, enable:

- Maps JavaScript API *(frontend)*
- Directions API *(backend)*
- Distance Matrix API *(backend)*
- Geocoding API *(backend)*
- Places API *(frontend — for address autocomplete)*

### 5. Run Locally

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm start
```

Backend runs on `http://localhost:6436`  
Frontend runs on `http://localhost:3000`

---

## 📦 Key Features

- **Unique Order IDs** — every order gets a human-readable ID like `ORD-20260517-A3X9K`
- **Live GPS tracking** — delivery partner location streams to customer map every 5–10 seconds via Socket.io
- **Distance-based pricing** — ₹20 base + ₹10/km, capped at ₹200 (configurable by admin)
- **Smart partner matching** — nearest available partner found using MongoDB geospatial queries
- **Cash on Delivery** — default payment method, no payment gateway required
- **Role-based access** — separate flows and dashboards for all four roles

---

## 📁 Project Structure

```
hyper-local-delivery-dispatcher/
├── server/
│   ├── models/          # Mongoose schemas (User, Vendor, Product, Order, Delivery, ...)
│   ├── routes/          # Express route handlers (auth, customer, vendor, partner, admin)
│   ├── middleware/       # JWT auth guard, role-based access control
│   ├── utils/           # Business logic helpers (pricing, distance, partner matching)
│   ├── socket/          # Socket.io event handlers
│   └── server.js        # Entry point
│
├── client/
│   ├── src/
│   │   ├── pages/       # Customer, Vendor, Partner, Admin views
│   │   ├── components/  # Shared UI components (Map, Cart, Notifications, ...)
│   │   ├── store/       # Zustand state slices
│   │   └── socket.js    # Socket.io client setup
│   └── public/
│
├── README.md
└── DOCUMENTATION.md
```

---

## 🗺️ Order Lifecycle

```
Customer places order
        ↓
  Vendor receives (real-time)
        ↓
  Vendor: preparing → ready
        ↓
  Nearest partner notified
        ↓
  Partner accepts → picks up
        ↓
  Live location streams to customer
        ↓
  Partner marks delivered ✅
```

---

## 💰 Pricing Logic

| Parameter | Default | Configurable |
|-----------|---------|--------------|
| Base fare | ₹20 | ✅ Admin panel |
| Per km rate | ₹10/km | ✅ Admin panel |
| Minimum fee | ₹20 | — |
| Maximum fee | ₹200 | — |
| Platform commission | 20% | ✅ Admin panel |

Partner earns **80%** of the delivery fee after platform commission.

---

## 🌐 Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | Render | Set all `.env` vars in Render dashboard |
| Frontend | Vercel | Set `REACT_APP_*` vars in Vercel project settings |
| Database | MongoDB Atlas | Whitelist Render's IP or use `0.0.0.0/0` for dev |
| Images | Cloudinary | Auto-configured via env vars |