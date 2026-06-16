# Hyper Local Delivery Dispatcher - Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [User Roles](#user-roles)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Socket.io Events](#socketio-events)
8. [Business Logic](#business-logic)
9. [Project Roadmap](#project-roadmap)
10. [Environment Variables](#environment-variables)

---

## Project Overview

Real-time delivery management system connecting customers, delivery partners, and vendors for hyper-local deliveries with live tracking.

**Key Highlights:**
- Unique Order ID tracking system
- Real-time location tracking
- Distance-based pricing
- Cash on Delivery (COD)
- Socket.io for real-time updates
- Google Maps API for routing, distance calculation & live map display

---

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **Socket.io** | Real-time communication |
| **JWT** | Authentication |
| **bcrypt** | Password hashing |
| **Multer** | File upload handling |
| **Cloudinary** | Image storage |
| **Google Maps API** | Distance Matrix, Directions, Geocoding |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React.js** | UI framework |
| **TailwindCSS** | Styling |
| **Axios** | HTTP requests |
| **socket.io-client** | Real-time client |
| **React Router** | Routing |
| **Zustand** | State management |
| **@react-google-maps/api** | Google Maps React integration |

### Hosting & Services

| Service | Purpose |
|---------|---------|
| **Render** | Backend hosting |
| **Vercel** | Frontend hosting |
| **MongoDB Atlas** | Database hosting |
| **Cloudinary** | Image storage |
| **Google Maps Platform** | Maps, Directions & Distance Matrix |

---

## User Roles

### 1. Customer
- Browse vendors and products
- Place orders
- Cancel orders before dispatch / cancel via delivery partner during delivery
- Track deliveries in real-time on a Google Map
- View order history

### 2. Delivery Partner
- Accept/reject delivery requests
- Cancel order during delivery if the customer wishes to
- View optimized route on Google Maps
- Update delivery status
- Track earnings
- View delivery history

### 3. Vendor
- Manage menu items
- Receive and process orders
- Update order status
- View sales analytics

### 4. Admin
- Manage all users
- Monitor active deliveries on a live map
- View platform analytics
- Configure pricing settings for delivery partners

---

## Core Features

### Customer Features
- Browse nearby vendors by location
- Search and filter products
- Add items to cart
- Place order with delivery address
- **Receive unique Order ID** (e.g., `ORD-20260517-A3X9K`)
- Cancel order
- Track order status in real-time
- View delivery partner's live location on Google Map
- Order history with all past orders
- Cash on Delivery (COD) payment
- Real-time notifications about order status

### Delivery Partner Features
- View available delivery requests with distance & earnings
- Accept or reject orders
- View optimized route from pickup to delivery (Google Maps Directions)
- Update delivery status (`picked_up → in_transit → delivered`)
- Cancel order if customer wishes to
- Real-time location sharing
- Earnings dashboard
- Delivery history
- Toggle availability (online/offline)

### Vendor Features
- Manage menu (add/edit/delete products)
- Upload product images
- Receive orders in real-time
- Update order status (`received → preparing → ready`)
- View active orders queue
- Basic sales analytics
- Set opening/closing hours

### Admin Features
- Dashboard with key metrics (total orders, revenue, active users)
- Monitor all active deliveries on Google Map
- View all orders with filters
- Platform analytics (daily/weekly/monthly)
- Configure pricing (base fare, per km rate)
- Manage vendor approvals to sell on the platform

---

## Database Schema

### Collection: `users`

```javascript
{
  _id: ObjectId,                          // Auto-generated
  name: String,                           // Required
  email: String,                          // Required, unique, lowercase
  password: String,                       // Required, hashed with bcrypt
  phone: String,                          // Required, unique
  role: String,                           // Enum: ['customer', 'partner', 'vendor'] — admin created manually only
  profileImage: String,                   // Cloudinary URL
  isActive: Boolean,                      // Default: true
  createdAt: Date,                        // Auto-generated
  updatedAt: Date,                        // Auto-generated

  // Only for role = 'partner'
  partnerDetails: {
    vehicleType: String,                  // Enum: ['bike', 'scooter', 'truck']
    vehicleNumber: String,
    drivingLicense: String,
    isAvailable: Boolean,                 // Default: false (online/offline toggle)
    currentLocation: {
      type: String,                       // Always 'Point'
      coordinates: [Number]              // [longitude, latitude]
    },
    totalEarnings: Number,               // Default: 0
    completedDeliveries: Number          // Default: 0
  }
}

// Indexes
users.email: unique
users.phone: unique
users.partnerDetails.currentLocation: 2dsphere  // Required for geospatial queries
```

### Collection: `vendors`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                       // Reference to users collection
  businessName: String,                   // Required
  description: String,
  category: String,                       // Enum: ['restaurant', 'grocery', 'pharmacy', 'bakery', 'other']
  image: String,                          // Store image / logo — Cloudinary URL
  location: {
    type: String,                         // Always 'Point'
    coordinates: [Number],               // [longitude, latitude]
    address: String,
    city: String,
    pincode: String
  },
  openingTime: String,                    // Format: "09:00"
  closingTime: String,                    // Format: "22:00"
  isOpen: Boolean,                        // Default: true
  totalOrders: Number,                    // Default: 0
  createdAt: Date,
  updatedAt: Date
}

// Indexes
vendors.userId: unique
vendors.location: 2dsphere
```

### Collection: `products`

```javascript
{
  _id: ObjectId,
  vendorId: ObjectId,                     // Reference to vendors collection
  name: String,                           // Required
  description: String,
  price: Number,                          // Required
  category: String,                       // e.g., 'Burgers', 'Beverages', 'Desserts'
  image: String,                          // Cloudinary URL
  isAvailable: Boolean,                   // Default: true
  preparationTime: Number,                // In minutes
  createdAt: Date,
  updatedAt: Date
}

// Indexes
products.vendorId: indexed
```

### Collection: `addresses`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                       // Reference to users collection
  fullAddress: String,                    // Required
  landmark: String,
  location: {
    type: String,                         // Always 'Point'
    coordinates: [Number]               // [longitude, latitude]
  },
  city: String,
  pincode: String,
  createdAt: Date
}

// Indexes
addresses.userId: indexed
```

### Collection: `orders`

```javascript
{
  _id: ObjectId,
  orderId: String,                        // Unique — e.g., "ORD-20260517-A3X9K"
  customerId: ObjectId,                   // Reference to users collection
  vendorId: ObjectId,                     // Reference to vendors collection

  // EMBEDDED: Order items snapshot
  items: [
    {
      productId: ObjectId,
      name: String,                       // Product name at time of order
      price: Number,                      // Price at time of order
      quantity: Number,
      subtotal: Number                    // price * quantity
    }
  ],

  // EMBEDDED: Delivery address snapshot
  deliveryAddress: {
    fullAddress: String,
    landmark: String,
    location: {
      type: String,                       // Always 'Point'
      coordinates: [Number]
    }
  },

  // EMBEDDED: Pickup address snapshot
  pickupAddress: {
    businessName: String,
    address: String,
    location: {
      type: String,                       // Always 'Point'
      coordinates: [Number]
    }
  },

  itemsTotal: Number,                     // Sum of all item subtotals
  deliveryFee: Number,                    // Calculated based on distance
  totalAmount: Number,                    // itemsTotal + deliveryFee

  paymentMethod: String,                  // Default: 'COD'
  paymentStatus: String,                  // Enum: ['pending', 'paid'] — Default: 'pending'

  orderStatus: String,                    // Enum: ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled']

  distance: Number,                       // In kilometers (from Google Distance Matrix)
  estimatedDeliveryTime: Number,          // In minutes

  specialInstructions: String,

  createdAt: Date,
  updatedAt: Date,
  deliveredAt: Date                       // Set when status = 'delivered'
}

// Indexes
orders.orderId: unique
orders.customerId: indexed
orders.vendorId: indexed
orders.orderStatus: indexed
```

### Collection: `deliveries`

```javascript
{
  _id: ObjectId,
  orderId: ObjectId,                      // Reference to orders collection
  partnerId: ObjectId,                    // Reference to users collection (partner)

  status: String,                         // Enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']

  partnerEarnings: Number,

  pickedUpAt: Date,
  deliveredAt: Date,

  // EMBEDDED: Real-time location tracking history
  trackingHistory: [
    {
      location: {
        type: String,                     // Always 'Point'
        coordinates: [Number]
      },
      timestamp: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date
}

// Indexes
deliveries.orderId: unique
deliveries.partnerId: indexed
deliveries.status: indexed
```

### Collection: `notifications`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  message: String,
  type: String,                           // Enum: ['order', 'delivery', 'payment', 'system']
  isRead: Boolean,                        // Default: false
  metadata: Object,                       // e.g., { orderId: 'ORD-20260517-A3X9K' }
  createdAt: Date
}

// Indexes
notifications.userId: indexed
notifications.isRead: indexed
```

---

## API Endpoints

### Authentication Routes — `/api/auth`

#### Register User
```
POST /api/auth/register
Body:     { name, email, password, phone, role }
Response: { success, token, user }
```

#### Login User
```
POST /api/auth/login
Body:     { email, password }
Response: { success, token, user }
```

#### Logout User
```
POST /api/auth/logout
Headers:  Authorization: Bearer <token>
Response: { success, message }
```

#### Update Profile
```
PUT /api/auth/profile
Headers:  Authorization: Bearer <token>
Body:     { name, phone, email, profileImage }
Response: { success, user }
```

---

### Customer Routes — `/api`

#### Get Nearby Vendors
```
GET /api/vendors/nearby?lat=17.385&lng=78.486&radius=5
Response: { success, vendors: [...] }
```

#### Get Vendor Details
```
GET /api/vendors/:id
Response: { success, vendor: {...} }
```

#### Get Vendor Menu
```
GET /api/vendors/:id/menu
Response: { success, products: [...] }
```

#### Add Address
```
POST /api/address
Headers:  Authorization: Bearer <token>
Body:     { fullAddress, landmark, location, city, pincode }
Response: { success, address: {...} }
```

#### Get User Addresses
```
GET /api/address
Headers:  Authorization: Bearer <token>
Response: { success, addresses: [...] }
```

#### Update Address
```
PUT /api/address/:id
Headers:  Authorization: Bearer <token>
Body:     { fullAddress, landmark }
Response: { success, address: {...} }
```

#### Delete Address
```
DELETE /api/address/:id
Headers:  Authorization: Bearer <token>
Response: { success, message }
```

#### Create Order
```
POST /api/orders
Headers:  Authorization: Bearer <token>
Body:     { vendorId, items: [{ productId, quantity }], deliveryAddressId, specialInstructions }
Response: { success, order: { orderId, ... } }
```

#### Track Order by Order ID
```
GET /api/orders/track/:orderId
Response: { success, order: {...}, delivery: {...} }
```

#### Get Order History
```
GET /api/orders/history?page=1&limit=10&status=delivered
Headers:  Authorization: Bearer <token>
Response: { success, orders: [...], totalPages, currentPage }
```

#### Get Order Details
```
GET /api/orders/:id
Headers:  Authorization: Bearer <token>
Response: { success, order: {...} }
```

---

### Vendor Routes — `/api/vendor`

#### Get Vendor Orders
```
GET /api/vendor/orders?status=placed
Headers:  Authorization: Bearer <token>
Response: { success, orders: [...] }
```

#### Update Order Status
```
PUT /api/vendor/orders/:id
Headers:  Authorization: Bearer <token>
Body:     { status: 'preparing' | 'ready' }
Response: { success, order: {...} }
```

#### Add Product
```
POST /api/vendor/products
Headers:  Authorization: Bearer <token>
Body:     { name, description, price, category, image, preparationTime }
Response: { success, product: {...} }
```

#### Get Vendor Products
```
GET /api/vendor/products
Headers:  Authorization: Bearer <token>
Response: { success, products: [...] }
```

#### Update Product
```
PUT /api/vendor/products/:id
Headers:  Authorization: Bearer <token>
Body:     { name, price, isAvailable, ... }
Response: { success, product: {...} }
```

#### Delete Product
```
DELETE /api/vendor/products/:id
Headers:  Authorization: Bearer <token>
Response: { success, message }
```

#### Get Analytics
```
GET /api/vendor/analytics
Headers:  Authorization: Bearer <token>
Response: { success, analytics: { totalOrders, revenue, popularItems } }
```

#### Update Vendor Settings
```
PUT /api/vendor/settings
Headers:  Authorization: Bearer <token>
Body:     { openingTime, closingTime, isOpen }
Response: { success, vendor: {...} }
```

---

### Delivery Partner Routes — `/api/partner`

#### Get Available Orders
```
GET /api/partner/available-orders
Headers:  Authorization: Bearer <token>
Response: { success, orders: [{ orderId, distance, earnings, ... }] }
```

#### Accept Order
```
PUT /api/partner/orders/:id/accept
Headers:  Authorization: Bearer <token>
Response: { success, delivery: {...} }
```

#### Update Delivery Status
```
PUT /api/partner/orders/:id/status
Headers:  Authorization: Bearer <token>
Body:     { status: 'picked_up' | 'in_transit' | 'delivered' }
Response: { success, delivery: {...} }
```

#### Update Live Location
```
PUT /api/partner/location
Headers:  Authorization: Bearer <token>
Body:     { location: { coordinates: [lng, lat] } }
Response: { success, message }
```

#### Get Earnings
```
GET /api/partner/earnings
Headers:  Authorization: Bearer <token>
Response: { success, earnings: { total, today, thisWeek, thisMonth } }
```

#### Get Delivery History
```
GET /api/partner/history?page=1&limit=10
Headers:  Authorization: Bearer <token>
Response: { success, deliveries: [...] }
```

#### Toggle Availability
```
PUT /api/partner/availability
Headers:  Authorization: Bearer <token>
Body:     { isAvailable: true | false }
Response: { success, message }
```

---

### Admin Routes — `/api/admin`

#### Get Dashboard Stats
```
GET /api/admin/dashboard
Headers:  Authorization: Bearer <token>
Response: { success, stats: { totalOrders, totalRevenue, activeDeliveries, totalCustomers, totalPartners, totalVendors } }
```

#### Get All Users
```
GET /api/admin/users?role=vendor&page=1&limit=20
Headers:  Authorization: Bearer <token>
Response: { success, users: [...], totalPages, currentPage }
```

#### Get All Orders
```
GET /api/admin/orders?status=delivered&date=2026-05-17
Headers:  Authorization: Bearer <token>
Response: { success, orders: [...] }
```

#### Get All Deliveries
```
GET /api/admin/deliveries
Headers:  Authorization: Bearer <token>
Response: { success, deliveries: [...] }
```

#### Get Platform Analytics
```
GET /api/admin/analytics
Headers:  Authorization: Bearer <token>
Response: { success, analytics: { daily, weekly, monthly } }
```

#### Update Platform Settings
```
PUT /api/admin/settings
Headers:  Authorization: Bearer <token>
Body:     { baseFare, perKmRate, commissionRate }
Response: { success, settings: {...} }
```

---

## Socket.io Events

### Server Setup

```javascript
// server.js
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Authenticate socket connections via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT and attach user to socket
  next();
});
```

---

### Customer Events

#### Join Order Room
```javascript
// Client emits
socket.emit('join_order_room', { orderId: 'ORD-20260517-A3X9K' });

// Server handles
socket.on('join_order_room', ({ orderId }) => {
  socket.join(`order_${orderId}`);
});
```

#### Listen for Order Status Updates
```javascript
// Client listens
socket.on('order_status_update', (data) => {
  // data: { orderId, status, message }
  console.log(`Order ${data.orderId} is now ${data.status}`);
});

// Server emits (when vendor or partner updates status)
io.to(`order_${orderId}`).emit('order_status_update', {
  orderId,
  status: 'preparing',
  message: 'Your order is being prepared'
});
```

#### Listen for Partner Live Location
```javascript
// Client listens — update Google Maps marker position
socket.on('partner_location_update', (data) => {
  // data: { orderId, location: { coordinates: [lng, lat] } }
  marker.setPosition({ lat: data.location.coordinates[1], lng: data.location.coordinates[0] });
});
```

#### Listen for Delivery Assignment
```javascript
// Client listens
socket.on('delivery_assigned', (data) => {
  // data: { orderId, partnerName, estimatedTime }
  console.log(`${data.partnerName} will deliver your order`);
});
```

---

### Vendor Events

#### Join Vendor Room
```javascript
// Client emits
socket.emit('join_vendor_room', { vendorId: '507f1f77bcf86cd799439011' });

// Server handles
socket.on('join_vendor_room', ({ vendorId }) => {
  socket.join(`vendor_${vendorId}`);
});
```

#### Listen for New Orders
```javascript
// Client listens
socket.on('new_order', (order) => {
  // order: { orderId, items, totalAmount, ... }
  // Show notification, add to order queue
});

// Server emits (when customer places order)
io.to(`vendor_${vendorId}`).emit('new_order', order);
```

#### Listen for Order Cancellation
```javascript
// Client listens
socket.on('order_cancelled', (data) => {
  // data: { orderId, reason }
});
```

---

### Delivery Partner Events

#### Join Partner Room
```javascript
// Client emits
socket.emit('join_partner_room', { partnerId: '507f1f77bcf86cd799439012' });

// Server handles
socket.on('join_partner_room', ({ partnerId }) => {
  socket.join(`partner_${partnerId}`);
});
```

#### Listen for New Delivery Requests
```javascript
// Client listens
socket.on('new_delivery_request', (data) => {
  // data: { orderId, pickupLocation, dropLocation, distance, earnings }
  // Show accept/reject modal
});

// Server emits (when order is ready for pickup)
io.to(`partner_${partnerId}`).emit('new_delivery_request', {
  orderId: 'ORD-20260517-A3X9K',
  distance: 3.5,
  earnings: 55
});
```

#### Listen for Order Ready
```javascript
// Client listens
socket.on('order_ready', (data) => {
  // data: { orderId }
  // Notify partner to proceed to pickup
});
```

#### Emit Live Location Updates
```javascript
// Client emits every 5–10 seconds while on delivery
socket.emit('update_location', {
  partnerId: '507f1f77bcf86cd799439012',
  location: { coordinates: [78.486, 17.385] }  // [lng, lat]
});

// Server handles — broadcasts to the customer tracking this order
socket.on('update_location', ({ partnerId, location }) => {
  // Lookup active delivery by partnerId
  io.to(`order_${orderId}`).emit('partner_location_update', { location });
});
```

---

### Admin Events

#### Join Admin Room
```javascript
// Client emits
socket.emit('join_admin_room');

// Server handles
socket.on('join_admin_room', () => {
  socket.join('admin_room');
});
```

#### Listen for All Delivery Updates
```javascript
// Client listens — update admin dashboard Google Map
socket.on('delivery_update', (data) => {
  // data: { orderId, status, partnerId, location }
});

// Server emits on any delivery status change
io.to('admin_room').emit('delivery_update', deliveryData);
```

---

## Business Logic

### 1. Order ID Generation

```javascript
/**
 * Generate a unique Order ID.
 * Format: ORD-YYYYMMDD-XXXXX
 * Example: ORD-20260517-A3X9K
 */
const generateOrderId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const random = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 chars
  return `ORD-${date}-${random}`;
};
```

---

### 2. Distance & Route Calculation (Google Maps Directions API)

> Uses the **Google Maps Directions API** on the backend to get real driving distance,
> estimated duration, and an encoded polyline for map display.

```javascript
const axios = require('axios');

/**
 * Calculate driving distance and estimated time between two coordinates
 * using the Google Maps Directions API.
 *
 * @param {Object} pickup  - { lat: Number, lng: Number }
 * @param {Object} dropoff - { lat: Number, lng: Number }
 * @returns {Object} - { distance: Number (km), duration: Number (minutes), polyline: String }
 */
const calculateDistance = async (pickup, dropoff) => {
  const url = 'https://maps.googleapis.com/maps/api/directions/json';

  const response = await axios.get(url, {
    params: {
      origin: `${pickup.lat},${pickup.lng}`,
      destination: `${dropoff.lat},${dropoff.lng}`,
      mode: 'driving',
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });

  if (response.data.status !== 'OK') {
    throw new Error(`Google Maps Directions error: ${response.data.status}`);
  }

  const leg = response.data.routes[0].legs[0];

  return {
    distance: (leg.distance.value / 1000).toFixed(2),   // meters → km
    duration: Math.ceil(leg.duration.value / 60),        // seconds → minutes
    polyline: response.data.routes[0].overview_polyline.points // for map rendering
  };
};

// Usage
const pickup  = { lat: 17.385, lng: 78.486 };
const dropoff = { lat: 17.390, lng: 78.491 };
const result  = await calculateDistance(pickup, dropoff);
// result = { distance: '3.52', duration: 12, polyline: 'abc...' }
```

> **Note:** You can also use the **Google Maps Distance Matrix API** if you only need
> distance/duration without the polyline (e.g. for partner matching or fee calculation).

```javascript
/**
 * Lightweight distance/duration lookup via Distance Matrix API.
 * Useful when you don't need the route polyline.
 */
const getDistanceMatrix = async (pickup, dropoff) => {
  const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  const response = await axios.get(url, {
    params: {
      origins: `${pickup.lat},${pickup.lng}`,
      destinations: `${dropoff.lat},${dropoff.lng}`,
      mode: 'driving',
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });

  const element = response.data.rows[0].elements[0];

  if (element.status !== 'OK') {
    throw new Error(`Distance Matrix error: ${element.status}`);
  }

  return {
    distance: (element.distance.value / 1000).toFixed(2), // km
    duration: Math.ceil(element.duration.value / 60)      // minutes
  };
};
```

---

### 3. Delivery Fee Calculation

```javascript
/**
 * Calculate delivery fee based on distance.
 * @param {Number} distanceKm
 * @returns {Number} - Delivery fee in rupees
 */
const calculateDeliveryFee = (distanceKm) => {
  const BASE_FARE   = 20;   // ₹20 base
  const PER_KM_RATE = 10;   // ₹10 per km
  const MIN_FEE     = 20;   // ₹20 minimum
  const MAX_FEE     = 200;  // ₹200 maximum

  const fee = BASE_FARE + distanceKm * PER_KM_RATE;
  return Math.round(Math.max(MIN_FEE, Math.min(MAX_FEE, fee)));
};

// Examples
calculateDeliveryFee(2.5);  // ₹45
calculateDeliveryFee(0.5);  // ₹20  (hits minimum)
calculateDeliveryFee(25);   // ₹200 (hits maximum)
```

---

### 4. Partner Earnings Calculation

```javascript
/**
 * Calculate partner earnings after platform commission.
 * @param {Number} deliveryFee
 * @returns {Number} - Partner payout in rupees
 */
const calculatePartnerEarnings = (deliveryFee) => {
  const PLATFORM_COMMISSION = 0.20; // 20%
  return Math.round(deliveryFee * (1 - PLATFORM_COMMISSION));
};

// Example: ₹50 fee → ₹40 partner payout
```

---

### 5. Partner Matching Algorithm (MongoDB Geospatial)

```javascript
const User = require('./models/User');

/**
 * Find the nearest available delivery partner using MongoDB $near.
 * @param {Object} pickupLocation - { coordinates: [lng, lat] }
 * @param {Number} maxDistance    - Search radius in metres (default 5000)
 * @returns {Object|null}         - Nearest partner or null
 */
const findNearestPartner = async (pickupLocation, maxDistance = 5000) => {
  const partners = await User.find({
    role: 'partner',
    'partnerDetails.isAvailable': true,
    'partnerDetails.currentLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: pickupLocation.coordinates // [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  })
  .limit(5)
  .select('name phone partnerDetails');

  return partners.length > 0 ? partners[0] : null;
};
```

---

### 6. Estimated Delivery Time

```javascript
/**
 * Calculate total estimated delivery time.
 * @param {Number} preparationTime - Vendor prep time (minutes)
 * @param {Number} travelDuration  - Travel time from Directions API (minutes)
 * @returns {Number} - Total estimated minutes
 */
const calculateEstimatedDeliveryTime = (preparationTime, travelDuration) => {
  const BUFFER_TIME = 5; // 5-minute buffer
  return Math.ceil(preparationTime + travelDuration + BUFFER_TIME);
};

// Example: 15 min prep + 12 min travel + 5 buffer = 32 minutes
```

---

### 7. Order Total Calculation

```javascript
/**
 * Calculate order total.
 * @param {Array}  items       - [{ price, quantity }]
 * @param {Number} deliveryFee
 * @returns {Object} - { itemsTotal, deliveryFee, totalAmount }
 */
const calculateOrderTotal = (items, deliveryFee) => {
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    itemsTotal:   Math.round(itemsTotal),
    deliveryFee:  Math.round(deliveryFee),
    totalAmount:  Math.round(itemsTotal + deliveryFee)
  };
};

// Example
const items = [
  { price: 150, quantity: 2 },  // 2 Burgers = ₹300
  { price: 80,  quantity: 1 }   // 1 Fries   = ₹80
];
// itemsTotal: ₹380 | deliveryFee: ₹45 | totalAmount: ₹425
```

---

### 8. Find Nearby Vendors

```javascript
const Vendor = require('./models/Vendor');

/**
 * Fetch open vendors within a given radius of the user's location.
 * @param {Object} userLocation - { coordinates: [lng, lat] }
 * @param {Number} radius       - Radius in metres (default 5000)
 * @returns {Array}             - Array of vendor documents
 */
const findNearbyVendors = async (userLocation, radius = 5000) => {
  return Vendor.find({
    isOpen: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: userLocation.coordinates
        },
        $maxDistance: radius
      }
    }
  })
  .populate('userId', 'name email phone')
  .limit(20);
};
```

---

### 9. Google Maps Frontend Integration

> Use **`@react-google-maps/api`** on the frontend for all map rendering.

```bash
npm install @react-google-maps/api
```

#### Load the Maps Script

```javascript
// App.jsx (or index.jsx)
import { LoadScript } from '@react-google-maps/api';

const LIBRARIES = ['places']; // add 'geometry' if you need polyline decoding

function App() {
  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
      {/* routes / components */}
    </LoadScript>
  );
}
```

#### Customer: Live Tracking Map

```javascript
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';

function TrackingMap({ partnerLocation, pickupCoords, dropoffCoords, routePolyline }) {
  const center = partnerLocation || pickupCoords;

  return (
    <GoogleMap zoom={14} center={center} mapContainerStyle={{ width: '100%', height: '400px' }}>
      <Marker position={pickupCoords}  label="P" />  {/* Vendor/pickup */}
      <Marker position={dropoffCoords} label="D" />  {/* Customer/dropoff */}
      {partnerLocation && <Marker position={partnerLocation} label="🛵" />}
      {routePolyline && (
        <Polyline
          path={window.google.maps.geometry.encoding.decodePath(routePolyline)}
          options={{ strokeColor: '#4285F4', strokeWeight: 4 }}
        />
      )}
    </GoogleMap>
  );
}
```

#### Partner: Route Display

```javascript
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

function RouteMap({ pickup, dropoff }) {
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin:      pickup,
        destination: dropoff,
        travelMode:  window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK') setDirections(result);
      }
    );
  }, [pickup, dropoff]);

  return (
    <GoogleMap zoom={13} center={pickup} mapContainerStyle={{ width: '100%', height: '400px' }}>
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
}
```

#### Geocoding (Address → Coordinates)

> Useful when a customer types a delivery address manually rather than selecting a saved one.

```javascript
// Backend geocoding helper
const geocodeAddress = async (address) => {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const response = await axios.get(url, {
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY }
  });

  if (response.data.status !== 'OK') {
    throw new Error(`Geocoding failed: ${response.data.status}`);
  }

  const { lat, lng } = response.data.results[0].geometry.location;
  return { lat, lng };
};
```

---

### 10. Google Maps API Keys — Which APIs to Enable

Go to **Google Cloud Console → APIs & Services → Library** and enable:

| API | Used For |
|-----|---------|
| **Maps JavaScript API** | Frontend map rendering (`@react-google-maps/api`) |
| **Directions API** | Driving route & polyline (backend) |
| **Distance Matrix API** | Distance/duration for fee calc & partner matching (backend) |
| **Geocoding API** | Convert text addresses to lat/lng (backend) |
| **Places API** | Address autocomplete (frontend, optional) |

> Use **separate API keys** for backend (server key, no HTTP referrer restriction) and frontend
> (browser key, restrict to your domain). Never expose your backend key in the React app.

---

## Resources & Documentation

### Google Maps Platform
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Directions API](https://developers.google.com/maps/documentation/directions)
- [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [Places API](https://developers.google.com/maps/documentation/places/web-service)
- [@react-google-maps/api (npm)](https://www.npmjs.com/package/@react-google-maps/api)

### Other Docs
- [Socket.io Documentation](https://socket.io/docs/)
- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)