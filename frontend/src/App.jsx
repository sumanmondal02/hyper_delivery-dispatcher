import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import { connectSocket, disconnectSocket } from './socket/socket';

// Auth pages
import Landing  from './pages/Landing';
import Login    from './pages/Login';
import Register from './pages/Register';

// Customer pages
import CustomerHome      from './pages/customer/Home';
import VendorDetail      from './pages/customer/VendorDetail';
import Cart              from './pages/customer/Cart';
import Checkout          from './pages/customer/Checkout';
import OrderTracking     from './pages/customer/OrderTracking';
import OrderHistory      from './pages/customer/OrderHistory';
import Addresses         from './pages/customer/Addresses';
import Notifications     from './pages/customer/Notifications';
import CustomerProfile   from './pages/customer/Profile';

// Vendor pages
import VendorOrders    from './pages/vendor/Orders';
import VendorProducts  from './pages/vendor/Products';
import VendorAnalytics from './pages/vendor/Analytics';
import VendorSettings  from './pages/vendor/Settings';

// Partner pages
import PartnerAvailable from './pages/partner/Available';
import PartnerDelivery  from './pages/partner/ActiveDelivery';
import PartnerEarnings  from './pages/partner/Earnings';
import PartnerHistory   from './pages/partner/History';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers     from './pages/admin/Users';
import AdminOrders    from './pages/admin/Orders';
import AdminSettings  from './pages/admin/Settings';

const MAPS_LIBRARIES = ['places', 'geometry'];

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// ─── Role redirect after login ────────────────────────────────────────────────
const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const map = { customer: '/home', vendor: '/vendor/orders', partner: '/partner/available', admin: '/admin/dashboard' };
  return <Navigate to={map[user.role] || '/login'} replace />;
};

export default function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, [user]);

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
      libraries={MAPS_LIBRARIES}
      loadingElement={<div />}
    >
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<RoleRedirect />} />

          {/* Customer */}
          <Route path="/home"          element={<ProtectedRoute roles={['customer']}><CustomerHome /></ProtectedRoute>} />
          <Route path="/vendor/:id"    element={<ProtectedRoute roles={['customer']}><VendorDetail /></ProtectedRoute>} />
          <Route path="/cart"          element={<ProtectedRoute roles={['customer']}><Cart /></ProtectedRoute>} />
          <Route path="/checkout"      element={<ProtectedRoute roles={['customer']}><Checkout /></ProtectedRoute>} />
          <Route path="/track/:orderId" element={<ProtectedRoute roles={['customer']}><OrderTracking /></ProtectedRoute>} />
          <Route path="/orders"        element={<ProtectedRoute roles={['customer']}><OrderHistory /></ProtectedRoute>} />
          <Route path="/addresses"     element={<ProtectedRoute roles={['customer']}><Addresses /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute roles={['customer']}><Notifications /></ProtectedRoute>} />
          <Route path="/profile"       element={<ProtectedRoute roles={['customer']}><CustomerProfile /></ProtectedRoute>} />

          {/* Vendor */}
          <Route path="/vendor/orders"    element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>} />
          <Route path="/vendor/products"  element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>} />
          <Route path="/vendor/analytics" element={<ProtectedRoute roles={['vendor']}><VendorAnalytics /></ProtectedRoute>} />
          <Route path="/vendor/settings"  element={<ProtectedRoute roles={['vendor']}><VendorSettings /></ProtectedRoute>} />

          {/* Partner */}
          <Route path="/partner/available" element={<ProtectedRoute roles={['partner']}><PartnerAvailable /></ProtectedRoute>} />
          <Route path="/partner/delivery"  element={<ProtectedRoute roles={['partner']}><PartnerDelivery /></ProtectedRoute>} />
          <Route path="/partner/earnings"  element={<ProtectedRoute roles={['partner']}><PartnerEarnings /></ProtectedRoute>} />
          <Route path="/partner/history"   element={<ProtectedRoute roles={['partner']}><PartnerHistory /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"     element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/orders"    element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/settings"  element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LoadScript>
  );
}