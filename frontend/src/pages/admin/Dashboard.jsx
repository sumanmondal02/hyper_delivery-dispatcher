import { useEffect, useState } from 'react';
import {
  RiOrderPlayLine, RiMoneyRupeeCircleLine, RiGroupLine,
  RiMotorbikeLine, RiStoreLine, RiRefreshLine, RiMapPinLine,
} from 'react-icons/ri';
import { GoogleMap, Marker } from '@react-google-maps/api';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner, SkeletonCard } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { getSocket, joinAdminRoom } from '../../socket/socket';
import * as S from '../../styles/common';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
];

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [partnerLocations, setPartnerLocations] = useState({}); // { partnerId: [lng, lat] }
  const [loading, setLoading]   = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, oRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics'),
        api.get('/admin/orders?limit=5'),
      ]);
      setStats(sRes.data.stats);
      setAnalytics(aRes.data.analytics);
      setRecentOrders(oRes.data.orders?.slice(0, 5) || []);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    joinAdminRoom();

    const socket = getSocket();
    if (socket) {
      socket.on('delivery_update', ({ partnerId, location }) => {
        if (location?.coordinates) {
          setPartnerLocations((prev) => ({ ...prev, [partnerId]: location.coordinates }));
        }
      });
    }
    return () => { getSocket()?.off('delivery_update'); };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Dashboard</h1>
          <button onClick={fetchAll} className={S.btnIcon}><RiRefreshLine /></button>
        </div>

        <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
          {loading ? (
            <div className={`${S.statGrid} mb-6`}>{[1,2,3,4].map((i) => <SkeletonCard key={i} />)}</div>
          ) : stats && (
            <>
              {/* Stats grid */}
              <div className={`${S.statGrid} mb-6`}>
                <StatCard icon={<RiOrderPlayLine />} color="orange" num={stats.totalOrders ?? 0} label="Total Orders" />
                <StatCard icon={<RiMoneyRupeeCircleLine />} color="green" num={`₹${stats.totalRevenue ?? 0}`} label="Revenue" />
                <StatCard icon={<RiGroupLine />} color="blue" num={stats.totalCustomers ?? 0} label="Customers" />
                <StatCard icon={<RiMotorbikeLine />} color="amber" num={stats.totalPartners ?? 0} label="Partners" />
                <StatCard icon={<RiStoreLine />} color="purple" num={stats.totalVendors ?? 0} label="Vendors" />
                <StatCard icon={<RiMotorbikeLine />} color="orange" num={stats.activeDeliveries ?? 0} label="Active Now" />
              </div>

              {/* Live map */}
              {Object.keys(partnerLocations).length > 0 && (
                <div className="mb-6">
                  <h2 className={`${S.sectionTitle} mb-3 flex items-center gap-2`}>
                    <RiMapPinLine className="text-[#ff6b00]" /> Live Deliveries
                  </h2>
                  <div className={`${S.mapContainer} h-[300px]`}>
                    <GoogleMap
                      zoom={12}
                      center={{ lat: 17.385, lng: 78.486 }}
                      mapContainerClassName="w-full h-full"
                      options={{ disableDefaultUI: true, zoomControl: true, styles: DARK_MAP_STYLE }}>
                      {Object.entries(partnerLocations).map(([id, coords]) => (
                        <Marker key={id}
                          position={{ lat: coords[1], lng: coords[0] }}
                          icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                        />
                      ))}
                    </GoogleMap>
                  </div>
                </div>
              )}

              {/* Recent orders */}
              {recentOrders.length > 0 && (
                <div className={S.cardPaddedLg}>
                  <div className={`${S.flexBetween} mb-4`}>
                    <h2 className={S.cardTitle}>Recent Orders</h2>
                    <a href="/admin/orders" className={S.sectionLink}>View all</a>
                  </div>
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div key={order._id} className={`${S.flexBetween} py-2.5 border-b border-[#2e2e2e] last:border-0`}>
                        <div>
                          <p className={S.orderCardId}>{order.orderId}</p>
                          <p className="text-[12px] text-[#888888] mt-0.5">
                            {order.customerId?.name || 'Customer'} → {order.vendorId?.businessName || 'Vendor'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-[15px] text-[#f0f0f0]">₹{order.totalAmount}</p>
                          <StatusBadge status={order.orderStatus} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const COLOR_MAP = {
  orange: 'bg-[#ff6b00]/15 text-[#ff6b00]',
  green:  'bg-[#00c853]/15 text-[#00c853]',
  blue:   'bg-[#2979ff]/15 text-[#2979ff]',
  amber:  'bg-[#ffb300]/15 text-[#ffb300]',
  purple: 'bg-[#aa00ff]/15 text-[#aa00ff]',
};

function StatCard({ icon, color, num, label }) {
  return (
    <div className={S.statCard}>
      <div className={`${S.statIcon} ${COLOR_MAP[color] || COLOR_MAP.orange}`}>{icon}</div>
      <p className={S.statNum}>{num}</p>
      <p className={S.statLabel}>{label}</p>
    </div>
  );
}