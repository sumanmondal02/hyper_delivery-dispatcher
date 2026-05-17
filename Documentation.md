# Hyper Local Delivery Dispatcher - Complete Project Documentation

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
- Mapbox for routing & distance calculation

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
| **Mapbox API** | Maps, routing, distance |
| **express-validator** | Input validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React.js** | UI framework |
| **TailwindCSS** | Styling |
| **Axios** | HTTP requests |
| **socket.io-client** | Real-time client |
| **React Router v6** | Routing |
| **Context API / Redux** | State management |
| **react-map-gl** | Mapbox integration |

### Hosting & Services
| Service | Purpose | Plan |
|---------|---------|------|
| **Render** | Backend hosting | Free tier |
| **Vercel** | Frontend hosting | Free tier |
| **MongoDB Atlas** | Database hosting | Free tier (512MB) |
| **Cloudinary** | Image storage | Free tier (25GB) |
| **Mapbox** | Maps & routing | Free tier (100k requests/month) |

---

## User Roles

### 1. Customer
- Browse vendors and products
- Place orders
- Track deliveries in real-time
- View order history
- Rate vendors and delivery partners

### 2. Delivery Partner
- Accept/reject delivery requests
- View optimized routes
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
- Monitor active deliveries
- View platform analytics
- Configure pricing settings

---

## Core Features

### Customer Features
✅ Browse nearby vendors by location  
✅ Search and filter products  
✅ Add items to cart  
✅ Place order with delivery address  
✅ **Receive unique Order ID** (e.g., ORD-20260517-A3X9K)  
✅ Track order status in real-time  
✅ View delivery partner's live location on map  
✅ Order history with all past orders  
✅ Rate vendor and delivery partner (1-5 stars)  
✅ Manage multiple delivery addresses  
✅ Cash on Delivery (COD) payment  
✅ Real-time notifications  

### Delivery Partner Features
✅ View available delivery requests with distance & earnings  
✅ Accept or reject orders  
✅ View optimized route from pickup to delivery  
✅ Update delivery status (picked up → in transit → delivered)  
✅ Real-time location sharing  
✅ Earnings dashboard  
✅ Delivery history  
✅ Toggle availability (online/offline)  

### Vendor Features
✅ Manage menu (add/edit/delete products)  
✅ Upload product images  
✅ Receive orders in real-time  
✅ Update order status (received → preparing → ready)  
✅ View active orders queue  
✅ Basic sales analytics  
✅ Set opening/closing hours  

### Admin Features
✅ Dashboard with key metrics (total orders, revenue, active users)  
✅ User management (view, activate, deactivate all users)  
✅ Monitor all active deliveries on map  
✅ View all orders with filters  
✅ Platform analytics (daily/weekly/monthly)  
✅ Configure pricing (base fare, per km rate)  
✅ Manage vendor approvals  

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
  role: String,                           // Enum: ['customer', 'partner', 'vendor', 'admin']
  profileImage: String,                   // Cloudinary URL
  isActive: Boolean,                      // Default: true
  createdAt: Date,                        // Auto-generated
  updatedAt: Date,                        // Auto-generated
  
  // Only for role = 'partner'
  partnerDetails: {
    vehicleType: String,                  // Enum: ['bike', 'scooter', 'bicycle']
    vehicleNumber: String,
    drivingLicense: String,
    isAvailable: Boolean,                 // Default: false (online/offline status)
    currentLocation: {
      type: String,                       // Always 'Point'
      coordinates: [Number]               // [longitude, latitude]
    },
    totalEarnings: Number,                // Default: 0
    completedDeliveries: Number,          // Default: 0
    rating: Number                        // Default: 0
  }
}

// Indexes
users.email: unique
users.phone: unique
users.partnerDetails.currentLocation: 2dsphere (for geospatial queries)
```

### Collection: `vendors`
```javascript
{
  _id: ObjectId,                          // Auto-generated
  userId: ObjectId,                       // Reference to users collection
  businessName: String,                   // Required
  description: String,
  category: String,                       // Enum: ['restaurant', 'grocery', 'pharmacy', 'bakery', 'other']
  images: [String],                       // Array of Cloudinary URLs
  location: {
    type: String,                         // Always 'Point'
    coordinates: [Number],                // [longitude, latitude]
    address: String,                      // Full address
    city: String,
    pincode: String
  },
  openingTime: String,                    // Format: "09:00"
  closingTime: String,                    // Format: "22:00"
  isOpen: Boolean,                        // Default: true
  rating: Number,                         // Default: 0
  totalOrders: Number,                    // Default: 0
  createdAt: Date,                        // Auto-generated
  updatedAt: Date                         // Auto-generated
}

// Indexes
vendors.userId: unique
vendors.location: 2dsphere (for geospatial queries)
```

### Collection: `products`
```javascript
{
  _id: ObjectId,                          // Auto-generated
  vendorId: ObjectId,                     // Reference to vendors collection
  name: String,                           // Required
  description: String,
  price: Number,                          // Required
  category: String,                       // e.g., 'Burgers', 'Beverages', 'Desserts'
  image: String,                          // Cloudinary URL
  isAvailable: Boolean,                   // Default: true
  preparationTime: Number,                // In minutes
  createdAt: Date,                        // Auto-generated
  updatedAt: Date                         // Auto-generated
}

// Indexes
products.vendorId: indexed for faster queries
```

### Collection: `addresses`
```javascript
{
  _id: ObjectId,                          // Auto-generated
  userId: ObjectId,                       // Reference to users collection
  label: String,                          // 'Home', 'Work', 'Other'
  fullAddress: String,                    // Required
  landmark: String,
  location: {
    type: String,                         // Always 'Point'
    coordinates: [Number]                 // [longitude, latitude]
  },
  city: String,
  pincode: String,
  isDefault: Boolean,                     // Default: false
  createdAt: Date                         // Auto-generated
}

// Indexes
addresses.userId: indexed
```

### Collection: `orders`
```javascript
{
  _id: ObjectId,                          // Auto-generated
  orderId: String,                        // Unique, e.g., "ORD-20260517-A3X9K"
  customerId: ObjectId,                   // Reference to users collection
  vendorId: ObjectId,                     // Reference to vendors collection
  
  // EMBEDDED: Order items (not separate collection)
  items: [
    {
      productId: ObjectId,                // Reference to products collection
      name: String,                       // Product name snapshot
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
      coordinates: [Number]               // [longitude, latitude]
    }
  },
  
  // EMBEDDED: Pickup address snapshot
  pickupAddress: {
    businessName: String,
    address: String,
    location: {
      type: String,                       // Always 'Point'
      coordinates: [Number]               // [longitude, latitude]
    }
  },
  
  itemsTotal: Number,                     // Sum of all item subtotals
  deliveryFee: Number,                    // Calculated based on distance
  totalAmount: Number,                    // itemsTotal + deliveryFee
  
  paymentMethod: String,                  // Default: 'COD'
  paymentStatus: String,                  // Enum: ['pending', 'paid'], Default: 'pending'
  
  orderStatus: String,                    // Enum: ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled']
  
  distance: Number,                       // In kilometers
  estimatedDeliveryTime: Number,          // In minutes
  
  specialInstructions: String,            // Optional customer notes
  
  createdAt: Date,                        // Auto-generated
  updatedAt: Date,                        // Auto-generated
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
  _id: ObjectId,                          // Auto-generated
  orderId: ObjectId,                      // Reference to orders collection
  partnerId: ObjectId,                    // Reference to users collection (partner)
  
  status: String,                         // Enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']
  
  partnerEarnings: Number,                // Amount partner will receive
  
  pickedUpAt: Date,                       // When partner picked up from vendor
  deliveredAt: Date,                      // When delivered to customer
  
  // EMBEDDED: Real-time location tracking history
  trackingHistory: [
    {
      location: {
        type: String,                     // Always 'Point'
        coordinates: [Number]             // [longitude, latitude]
      },
      timestamp: Date
    }
  ],
  
  createdAt: Date,                        // Auto-generated
  updatedAt: Date                         // Auto-generated
}

// Indexes
deliveries.orderId: unique
deliveries.partnerId: indexed
deliveries.status: indexed
```

### Collection: `ratings`
```javascript
{
  _id: ObjectId,                          // Auto-generated
  orderId: ObjectId,                      // Reference to orders collection
  customerId: ObjectId,                   // Reference to users collection
  
  // Vendor rating
  vendorId: ObjectId,                     // Reference to vendors collection
  vendorRating: Number,                   // 1-5 stars
  vendorReview: String,                   // Optional text review
  
  // Partner rating
  partnerId: ObjectId,                    // Reference to users collection
  partnerRating: Number,                  // 1-5 stars
  partnerReview: String,                  // Optional text review
  
  createdAt: Date                         // Auto-generated
}

// Indexes
ratings.orderId: unique
ratings.vendorId: indexed
ratings.partnerId: indexed
```

### Collection: `notifications`
```javascript
{
  _id: ObjectId,                          // Auto-generated
  userId: ObjectId,                       // Reference to users collection
  title: String,                          // Notification title
  message: String,                        // Notification body
  type: String,                           // Enum: ['order', 'delivery', 'payment', 'system']
  isRead: Boolean,                        // Default: false
  metadata: Object,                       // Extra data (e.g., { orderId: '...' })
  createdAt: Date                         // Auto-generated
}

// Indexes
notifications.userId: indexed
notifications.isRead: indexed
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```
POST /api/auth/register
Body: { name, email, password, phone, role }
Response: { success, token, user }
```

#### Login User
```
POST /api/auth/login
Body: { email, password }
Response: { success, token, user }
```

#### Refresh Token
```
POST /api/auth/refresh-token
Headers: { Authorization: Bearer <token> }
Response: { success, token }
```

#### Logout User
```
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

#### Get Current User
```
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { success, user }
```

#### Update Profile
```
PUT /api/auth/profile
Headers: { Authorization: Bearer <token> }
Body: { name, phone, profileImage }
Response: { success, user }
```

---

### Customer Routes (`/api`)

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
POST /api/addresses
Headers: { Authorization: Bearer <token> }
Body: { label, fullAddress, landmark, location, city, pincode, isDefault }
Response: { success, address: {...} }
```

#### Get User Addresses
```
GET /api/addresses
Headers: { Authorization: Bearer <token> }
Response: { success, addresses: [...] }
```

#### Update Address
```
PUT /api/addresses/:id
Headers: { Authorization: Bearer <token> }
Body: { label, fullAddress, landmark, isDefault }
Response: { success, address: {...} }
```

#### Delete Address
```
DELETE /api/addresses/:id
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

#### Create Order
```
POST /api/orders
Headers: { Authorization: Bearer <token> }
Body: { 
  vendorId, 
  items: [{ productId, quantity }], 
  deliveryAddressId,
  specialInstructions 
}
Response: { success, order: { orderId, ... } }
```

#### Track Order by Order ID
```
GET /api/orders/track/:orderId
Response: { success, order: {...}, delivery: {...} }
```

#### Get Order History
```
GET /api/orders/history
Headers: { Authorization: Bearer <token> }
Query: ?page=1&limit=10&status=delivered
Response: { success, orders: [...], totalPages, currentPage }
```

#### Get Order Details
```
GET /api/orders/:id
Headers: { Authorization: Bearer <token> }
Response: { success, order: {...} }
```

#### Submit Rating
```
POST /api/ratings
Headers: { Authorization: Bearer <token> }
Body: { 
  orderId, 
  vendorRating, 
  vendorReview, 
  partnerRating, 
  partnerReview 
}
Response: { success, rating: {...} }
```

---

### Vendor Routes (`/api/vendor`)

#### Get Vendor Orders
```
GET /api/vendor/orders?status=placed
Headers: { Authorization: Bearer <token> }
Response: { success, orders: [...] }
```

#### Update Order Status
```
PUT /api/vendor/orders/:id
Headers: { Authorization: Bearer <token> }
Body: { status: 'preparing' | 'ready' }
Response: { success, order: {...} }
```

#### Add Product
```
POST /api/vendor/products
Headers: { Authorization: Bearer <token> }
Body: { name, description, price, category, image, preparationTime }
Response: { success, product: {...} }
```

#### Get Vendor Products
```
GET /api/vendor/products
Headers: { Authorization: Bearer <token> }
Response: { success, products: [...] }
```

#### Update Product
```
PUT /api/vendor/products/:id
Headers: { Authorization: Bearer <token> }
Body: { name, price, isAvailable, ... }
Response: { success, product: {...} }
```

#### Delete Product
```
DELETE /api/vendor/products/:id
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

#### Get Analytics
```
GET /api/vendor/analytics
Headers: { Authorization: Bearer <token> }
Response: { success, analytics: { totalOrders, revenue, popularItems } }
```

#### Update Vendor Settings
```
PUT /api/vendor/settings
Headers: { Authorization: Bearer <token> }
Body: { openingTime, closingTime, isOpen }
Response: { success, vendor: {...} }
```

---

### Delivery Partner Routes (`/api/partner`)

#### Get Available Orders
```
GET /api/partner/available-orders
Headers: { Authorization: Bearer <token> }
Response: { success, orders: [{ orderId, distance, earnings, ... }] }
```

#### Accept Order
```
PUT /api/partner/orders/:id/accept
Headers: { Authorization: Bearer <token> }
Response: { success, delivery: {...} }
```

#### Update Delivery Status
```
PUT /api/partner/orders/:id/status
Headers: { Authorization: Bearer <token> }
Body: { status: 'picked_up' | 'in_transit' | 'delivered' }
Response: { success, delivery: {...} }
```

#### Update Live Location
```
PUT /api/partner/location
Headers: { Authorization: Bearer <token> }
Body: { location: { coordinates: [lng, lat] } }
Response: { success, message }
```

#### Get Earnings
```
GET /api/partner/earnings
Headers: { Authorization: Bearer <token> }
Response: { success, earnings: { total, today, thisWeek, thisMonth } }
```

#### Get Delivery History
```
GET /api/partner/history
Headers: { Authorization: Bearer <token> }
Query: ?page=1&limit=10
Response: { success, deliveries: [...] }
```

#### Toggle Availability
```
PUT /api/partner/availability
Headers: { Authorization: Bearer <token> }
Body: { isAvailable: true | false }
Response: { success, message }
```

---

### Admin Routes (`/api/admin`)

#### Get Dashboard Stats
```
GET /api/admin/dashboard
Headers: { Authorization: Bearer <token> }
Response: { success, stats: { totalOrders, totalRevenue, activeDeliveries, totalUsers } }
```

#### Get All Users
```
GET /api/admin/users?role=partner&page=1&limit=20
Headers: { Authorization: Bearer <token> }
Response: { success, users: [...], totalPages, currentPage }
```

#### Update User
```
PUT /api/admin/users/:id
Headers: { Authorization: Bearer <token> }
Body: { isActive: true | false }
Response: { success, user: {...} }
```

#### Delete User
```
DELETE /api/admin/users/:id
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

#### Get All Orders
```
GET /api/admin/orders?status=delivered&date=2026-05-17
Headers: { Authorization: Bearer <token> }
Response: { success, orders: [...] }
```

#### Get All Deliveries
```
GET /api/admin/deliveries
Headers: { Authorization: Bearer <token> }
Response: { success, deliveries: [...] }
```

#### Get Platform Analytics
```
GET /api/admin/analytics
Headers: { Authorization: Bearer <token> }
Response: { success, analytics: { daily, weekly, monthly } }
```

#### Update Platform Settings
```
PUT /api/admin/settings
Headers: { Authorization: Bearer <token> }
Body: { baseFare, perKmRate, commissionRate }
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

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT token
  // Attach user to socket
  next();
});
```

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

// Server emits (when vendor/partner updates status)
io.to(`order_${orderId}`).emit('order_status_update', {
  orderId,
  status: 'preparing',
  message: 'Your order is being prepared'
});
```

#### Listen for Partner Location Updates
```javascript
// Client listens
socket.on('partner_location_update', (data) => {
  // data: { orderId, location: { coordinates: [lng, lat] } }
  // Update map marker position
});

// Server emits (when partner updates location)
io.to(`order_${orderId}`).emit('partner_location_update', {
  orderId,
  location: { coordinates: [78.486, 17.385] }
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
  // Remove from order queue
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
  // Notify partner that order is ready for pickup
});
```

#### Emit Location Updates
```javascript
// Client emits (every 5-10 seconds while delivering)
socket.emit('update_location', {
  partnerId: '507f1f77bcf86cd799439012',
  location: { coordinates: [78.486, 17.385] }
});

// Server handles (broadcasts to customer tracking that order)
socket.on('update_location', ({ partnerId, location }) => {
  // Find active delivery by partnerId
  // Emit to customer's order room
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
// Client listens
socket.on('delivery_update', (data) => {
  // data: { orderId, status, partnerId, location }
  // Update admin dashboard map
});

// Server emits (on any delivery status change)
io.to('admin_room').emit('delivery_update', deliveryData);
```

---

## Business Logic

### 1. Order ID Generation

```javascript
/**
 * Generate unique order ID
 * Format: ORD-YYYYMMDD-XXXXX
 * Example: ORD-20260517-A3X9K
 */
const generateOrderId = () => {
  // Get current date in YYYYMMDD format
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Generate 5 random alphanumeric characters
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `ORD-${date}-${random}`;
};

// Usage in order creation
const orderId = generateOrderId(); // ORD-20260517-A3X9K
```

---

### 2. Distance Calculation (Mapbox)

```javascript
const axios = require('axios');

/**
 * Calculate distance and duration between two points using Mapbox Directions API
 * @param {Object} pickup - { lng: Number, lat: Number }
 * @param {Object} dropoff - { lng: Number, lat: Number }
 * @returns {Object} - { distance: Number (km), duration: Number (minutes), route: Object }
 */
const calculateDistance = async (pickup, dropoff) => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
    
    const response = await axios.get(url, {
      params: {
        access_token: process.env.MAPBOX_TOKEN,
        geometries: 'geojson',
        steps: true,
        overview: 'full'
      }
    });
    
    const route = response.data.routes[0];
    
    return {
      distance: (route.distance / 1000).toFixed(2), // Convert meters to km
      duration: Math.ceil(route.duration / 60),     // Convert seconds to minutes
      route: route.geometry                         // GeoJSON route for map display
    };
  } catch (error) {
    console.error('Mapbox API Error:', error);
    throw new Error('Unable to calculate distance');
  }
};

// Usage
const pickup = { lng: 78.486, lat: 17.385 };
const dropoff = { lng: 78.491, lat: 17.390 };
const result = await calculateDistance(pickup, dropoff);
// result = { distance: 3.52, duration: 12, route: {...} }
```

---

### 3. Delivery Fee Calculation

```javascript
/**
 * Calculate delivery fee based on distance
 * @param {Number} distanceKm - Distance in kilometers
 * @returns {Number} - Delivery fee in rupees
 */
const calculateDeliveryFee = (distanceKm) => {
  const BASE_FARE = 20;        // Base fare: ₹20
  const PER_KM_RATE = 10;      // Per km rate: ₹10/km
  const MIN_FEE = 20;          // Minimum delivery fee: ₹20
  const MAX_FEE = 200;         // Maximum delivery fee: ₹200
  
  let fee = BASE_FARE + (distanceKm * PER_KM_RATE);
  
  // Apply min and max constraints
  fee = Math.max(MIN_FEE, Math.min(MAX_FEE, fee));
  
  return Math.round(fee); // Round to nearest rupee
};

// Usage
const fee1 = calculateDeliveryFee(2.5);  // ₹45 (20 + 2.5*10)
const fee2 = calculateDeliveryFee(0.5);  // ₹20 (minimum)
const fee3 = calculateDeliveryFee(25);   // ₹200 (maximum)
```

---

### 4. Partner Earnings Calculation

```javascript
/**
 * Calculate partner earnings from delivery fee
 * @param {Number} deliveryFee - Total delivery fee
 * @returns {Number} - Partner earnings after platform commission
 */
const calculatePartnerEarnings = (deliveryFee) => {
  const PLATFORM_COMMISSION = 0.20; // 20% commission
  
  const earnings = deliveryFee * (1 - PLATFORM_COMMISSION);
  
  return Math.round(earnings);
};

// Usage
const deliveryFee = 50;
const partnerEarnings = calculatePartnerEarnings(deliveryFee); // ₹40
```

---

### 5. Partner Matching Algorithm

```javascript
const User = require('./models/User');

/**
 * Find nearest available delivery partner
 * @param {Object} pickupLocation - { coordinates: [lng, lat] }
 * @param {Number} maxDistance - Maximum search radius in meters (default: 5000m = 5km)
 * @returns {Object} - Nearest available partner or null
 */
const findNearestPartner = async (pickupLocation, maxDistance = 5000) => {
  try {
    // Query partners using MongoDB geospatial query
    const partners = await User.find({
      role: 'partner',
      'partnerDetails.isAvailable': true,
      'partnerDetails.currentLocation': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: pickupLocation.coordinates // [lng, lat]
          },
          $maxDistance: maxDistance // in meters
        }
      }
    })
    .limit(5)  // Get top 5 nearest partners
    .select('name phone partnerDetails');
    
    if (partners.length === 0) {
      return null; // No available partners nearby
    }
    
    // Return the closest partner (first in sorted results)
    return partners[0];
    
  } catch (error) {
    console.error('Partner matching error:', error);
    throw new Error('Unable to find delivery partner');
  }
};

// Usage
const pickupLocation = {
  type: 'Point',
  coordinates: [78.486, 17.385] // [longitude, latitude]
};

const partner = await findNearestPartner(pickupLocation);
if (partner) {
  console.log(`Found partner: ${partner.name}`);
} else {
  console.log('No partners available nearby');
}
```

---

### 6. Estimated Delivery Time

```javascript
/**
 * Calculate estimated delivery time
 * @param {Number} preparationTime - Vendor preparation time (minutes)
 * @param {Number} travelDuration - Travel time from Mapbox (minutes)
 * @returns {Number} - Total estimated time in minutes
 */
const calculateEstimatedDeliveryTime = (preparationTime, travelDuration) => {
  const BUFFER_TIME = 5; // Extra 5 minutes buffer
  
  const totalTime = preparationTime + travelDuration + BUFFER_TIME;
  
  return Math.ceil(totalTime);
};

// Usage
const prepTime = 15;      // Vendor needs 15 min to prepare
const travelTime = 12;    // 12 min travel time from Mapbox
const estimatedTime = calculateEstimatedDeliveryTime(prepTime, travelTime); // 32 minutes
```

---

### 7. Order Total Calculation

```javascript
/**
 * Calculate order total
 * @param {Array} items - [{ price, quantity }]
 * @param {Number} deliveryFee - Delivery fee
 * @returns {Object} - { itemsTotal, deliveryFee, totalAmount }
 */
const calculateOrderTotal = (items, deliveryFee) => {
  // Calculate items total
  const itemsTotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Total = items + delivery fee
  const totalAmount = itemsTotal + deliveryFee;
  
  return {
    itemsTotal: Math.round(itemsTotal),
    deliveryFee: Math.round(deliveryFee),
    totalAmount: Math.round(totalAmount)
  };
};

// Usage
const items = [
  { productId: 'xxx', price: 150, quantity: 2 },  // 2 Burgers
  { productId: 'yyy', price: 80, quantity: 1 }    // 1 Fries
];
const deliveryFee = 45;

const total = calculateOrderTotal(items, deliveryFee);
// total = { itemsTotal: 380, deliveryFee: 45, totalAmount: 425 }
```

---

### 8. Find Nearby Vendors

```javascript
const Vendor = require('./models/Vendor');

/**
 * Find nearby vendors based on user location
 * @param {Object} userLocation - { coordinates: [lng, lat] }
 * @param {Number} radius - Search radius in meters (default: 5000m = 5km)
 * @returns {Array} - Array of nearby vendors
 */
const findNearbyVendors = async (userLocation, radius = 5000) => {
  try {
    const vendors = await Vendor.find({
      isOpen: true, // Only show open vendors
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userLocation.coordinates // [lng, lat]
          },
          $maxDistance: radius
        }
      }
    })
    .populate('userId', 'name email phone') // Get vendor user details
    .limit(20); // Max 20 vendors
    
    return vendors;
    
  } catch (error) {
    console.error('Error finding nearby vendors:', error);
    throw new Error('Unable to fetch nearby vendors');
  }
};

// Usage
const userLocation = {
  type: 'Point',
  coordinates: [78.486, 17.385]
};

const vendors = await findNearbyVendors(userLocation, 3000); // 3km radius
```

---

## Project Roadmap

### Backend Foundation
**Goal:** Setup Node.js backend with MongoDB and authentication

- [x] Initialize Node.js project (`npm init`)
- [ ] Install dependencies (express, mongoose, dotenv, etc.)
- [ ] Setup Express server
- [ ] Connect to MongoDB Atlas
- [ ] Create Mongoose models (User, Vendor, Product, Order, Delivery, Rating, Notification, Address)
- [ ] Setup Cloudinary for image uploads
- [ ] Implement JWT authentication (register, login, logout)
- [ ] Create middleware (auth, role-based access)
- [ ] Test authentication with Postman
- [ ] Deploy backend to Render
- [ ] Setup environment variables

**Deliverables:**
- Working REST API with auth endpoints
- MongoDB connected
- Deployed on Render

---

### Vendor & Products
**Goal:** Vendor management and product catalog

- [ ] Create vendor registration/profile APIs
- [ ] Implement product CRUD APIs
- [ ] Setup Multer + Cloudinary for image uploads
- [ ] Implement geospatial queries (nearby vendors)
- [ ] Create vendor dashboard UI (React + Tailwind)
- [ ] Vendor login page
- [ ] Product management page (add/edit/delete)
- [ ] Image upload functionality
- [ ] Test vendor workflows

**Deliverables:**
- Vendor APIs working
- Vendor dashboard UI
- Image uploads working

---

### Orders & Delivery System
**Goal:** Order creation, Mapbox integration, partner matching

- [ ] Implement order creation API
- [ ] Order ID generation system
- [ ] Integrate Mapbox Directions API
- [ ] Distance and route calculation
- [ ] Delivery fee calculation logic
- [ ] Partner matching algorithm (geospatial)
- [ ] Order status workflow
- [ ] Create partner registration API
- [ ] Partner location update API
- [ ] Test order flow end-to-end

**Deliverables:**
- Order APIs working
- Mapbox integration complete
- Partner matching functional

---

### Real-time Features (Socket.io)
**Goal:** Live order tracking and notifications

- [ ] Setup Socket.io server
- [ ] Implement socket authentication
- [ ] Create socket rooms (order, vendor, partner, admin)
- [ ] Real-time order status updates
- [ ] Live partner location tracking
- [ ] Socket.io client setup in React
- [ ] Customer order tracking UI with map
- [ ] Partner app UI (accept orders, update status)
- [ ] Real-time notifications
- [ ] Test real-time features

**Deliverables:**
- Socket.io working
- Real-time tracking UI
- Notifications system

---

### Customer App
**Goal:** Complete customer-facing application

- [ ] Create React app structure
- [ ] Setup TailwindCSS
- [ ] Implement React Router
- [ ] Home page (browse vendors)
- [ ] Vendor details page (menu)
- [ ] Shopping cart functionality
- [ ] Checkout page
- [ ] Address management
- [ ] Order placement
- [ ] Order tracking page with live map
- [ ] Order history
- [ ] User profile page
- [ ] Responsive design
- [ ] Deploy frontend to Vercel

**Deliverables:**
- Complete customer app
- Deployed on Vercel

---

### Ratings & Admin Panel
**Goal:** Rating system and admin dashboard

- [ ] Implement rating APIs
- [ ] Rating submission UI (customer)
- [ ] Display ratings on vendor/partner profiles
- [ ] Create admin dashboard UI
- [ ] User management (view, activate, deactivate)
- [ ] Order monitoring page
- [ ] Delivery monitoring with live map
- [ ] Analytics dashboard (charts)
- [ ] Platform settings page (pricing config)
- [ ] Admin authentication

**Deliverables:**
- Rating system working
- Admin panel complete

---

## Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=6436

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hyperlocal?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_minimum_32_characters_long
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Mapbox
MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6InNvbWV0b2tlbiJ9.example

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Pricing Configuration
BASE_FARE=20
PER_KM_RATE=10
PLATFORM_COMMISSION=0.20
```

### Frontend (.env)
```env
# API URLs
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Mapbox
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6InNvbWV0b2tlbiJ9.example
```

---

## Resources & Documentation

### Official Docs
- [Socket.io](https://socket.io/docs/)
- [Mapbox](https://docs.mapbox.com/)

### Tutorials
- Real-time apps with Socket.io
- Mapbox integration guide
- MongoDB geospatial queries

---

## Conclusion

This documentation provides a complete structure of **Hyper Local Delivery Dispatcher**.

**Next Steps:**
1. Setup development environment
2. Create MongoDB Atlas account
3. Get Mapbox API key