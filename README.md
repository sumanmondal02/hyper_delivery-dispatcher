# Hyper Local Delivery Dispatcher

A real-time delivery management platform connecting **customers**, **vendors**, and **delivery partners** for hyper-local deliveries — with live GPS tracking, distance-based pricing, and instant status updates.

> Full developer documentation → [`Documentation.md`](./Documentation.md)

---

## What It Does

| Role | What They Can Do |
|------|-----------------|
| **Customer** | Browse nearby vendors, place orders, track delivery live on map, view history |
| **Vendor** | Receive orders in real-time, manage menu & images, update order status |
| **Delivery Partner** | Accept deliveries, get optimized route, share live location, track earnings |
| **Admin** | Monitor all deliveries on map, manage users, configure pricing, view analytics |

---

## Tech Stack

**Backend** — Node.js · Express.js · MongoDB · Socket.io · JWT · Cloudinary · Google Maps API

**Frontend** — React.js · TailwindCSS · Zustand · socket.io-client · @react-google-maps/api

**Hosting** — Render (backend) · Vercel (frontend) · MongoDB Atlas · Cloudinary

---

## Key Features

- **Unique Order IDs** — every order gets a human-readable ID like `ORD-20260517-A3X9K`
- **Live GPS tracking** — delivery partner location streams to customer map every 5–10 seconds via Socket.io
- **Distance-based pricing** — ₹20 base + ₹10/km, capped at ₹200 (configurable by admin)
- **Smart partner matching** — nearest available partner found using MongoDB geospatial queries
- **Cash on Delivery** — default payment method, no payment gateway required
- **Role-based access** — separate flows and dashboards for all four roles

---

## Project Structure

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

## Order Lifecycle

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

## Pricing Logic

| Parameter | Default | Configurable |
|-----------|---------|--------------|
| Base fare | ₹20 | ✅ Admin panel |
| Per km rate | ₹10/km | ✅ Admin panel |
| Minimum fee | ₹20 | — |
| Maximum fee | ₹200 | — |
| Platform commission | 20% | ✅ Admin panel |

Partner earns **80%** of the delivery fee after platform commission.

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | Render | Set all `.env` vars in Render dashboard |
| Frontend | Vercel | Set `REACT_APP_*` vars in Vercel project settings |
| Database | MongoDB Atlas | Whitelist Render's IP or use `0.0.0.0/0` for dev |
| Images | Cloudinary | Auto-configured via env vars |