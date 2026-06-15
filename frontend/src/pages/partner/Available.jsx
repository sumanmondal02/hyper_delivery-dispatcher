import { useEffect, useState, useCallback } from 'react';
import {
  RiMapPinLine, RiTimeLine, RiMoneyRupeeCircleLine,
  RiRefreshLine, RiMotorbikeLine, RiCheckLine, RiCloseLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { SkeletonCard } from '../../components/Spinner';
import { getSocket, joinPartnerRoom } from '../../socket/socket';
import useAuthStore from '../../store/useAuthStore';
import * as S from '../../styles/common';

export default function PartnerAvailable() {
  const { user } = useAuthStore();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [isAvailable, setIsAvail] = useState(user?.partnerDetails?.isAvailable ?? false);
  const [toggling, setToggling]   = useState(false);
  const [accepting, setAccepting] = useState({}); // { [orderId]: true }
  const [activeRequest, setActiveRequest] = useState(null); // incoming socket request

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner/available-orders');
      setOrders(res.data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    joinPartnerRoom(user?._id);
    fetchOrders();
  }, []);

  // Listen for real-time delivery requests
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_delivery_request', (data) => {
      setActiveRequest(data);
      toast('New delivery request!', { icon: '🛵' });
    });

    return () => { socket.off('new_delivery_request'); };
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await api.put('/partner/availability', { isAvailable: !isAvailable });
      setIsAvail(!isAvailable);
      toast.success(res.data.message);
      if (!isAvailable) fetchOrders();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async (orderId) => {
    setAccepting((p) => ({ ...p, [orderId]: true }));
    try {
      await api.put(`/partner/orders/${orderId}/accept`);
      toast.success('Order accepted! Head to pickup.');
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      setActiveRequest(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept order');
    } finally {
      setAccepting((p) => ({ ...p, [orderId]: false }));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Available Orders</h1>
          <button onClick={fetchOrders} className={S.btnIcon}><RiRefreshLine /></button>
        </div>

        <div className="p-4 md:p-6 max-w-[700px] mx-auto">
          {/* Availability toggle */}
          <div className={`${S.toggleWrap} mb-5`}>
            <div>
              <p className={S.toggleLabel}>{isAvailable ? '🟢 You\'re online' : '⚫ You\'re offline'}</p>
              <p className={S.toggleSub}>{isAvailable ? 'Receiving delivery requests' : 'Go online to start earning'}</p>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={toggling}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${isAvailable ? 'bg-[#00c853]' : 'bg-[#2a2a2a] border border-[#2e2e2e]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Incoming socket request (priority) */}
          {activeRequest && (
            <div className="mb-5 p-5 bg-[#ff6b00]/10 border-2 border-[#ff6b00]/50 rounded-2xl animate-pulse">
              <p className="font-bold text-[16px] text-[#ff6b00] mb-3">🔔 New Delivery Request!</p>
              <OrderDetails order={activeRequest} isRequest />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setActiveRequest(null)} className={`${S.btnDangerOutline} flex-1`}>
                  <RiCloseLine /> Reject
                </button>
                <button
                  onClick={() => handleAccept(activeRequest.orderDbId)}
                  disabled={accepting[activeRequest.orderDbId]}
                  className={`${S.btnGreen} flex-1`}>
                  {accepting[activeRequest.orderDbId]
                    ? <span className={S.spinner} />
                    : <><RiCheckLine /> Accept (₹{activeRequest.earnings})</>}
                </button>
              </div>
            </div>
          )}

          {/* Nearby available orders list */}
          {!isAvailable ? (
            <div className={S.emptyState}>
              <RiMotorbikeLine className="text-[48px] text-[#2a2a2a] mb-4" />
              <p className={S.emptyTitle}>Go online to see orders</p>
              <p className={S.emptySubtitle}>Toggle availability above to start receiving delivery requests</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : orders.length === 0 ? (
            <div className={S.emptyState}>
              <RiMapPinLine className="text-[48px] text-[#2a2a2a] mb-4" />
              <p className={S.emptyTitle}>No orders nearby</p>
              <p className={S.emptySubtitle}>Orders will appear here when customers place them near you</p>
              <button onClick={fetchOrders} className={`${S.btnSecondary} mt-4`}><RiRefreshLine /> Refresh</button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className={S.cardPadded}>
                  <OrderDetails order={order} />
                  <button
                    onClick={() => handleAccept(order._id)}
                    disabled={accepting[order._id]}
                    className={`${S.btnPrimary} w-full mt-4`}>
                    {accepting[order._id]
                      ? <span className={S.spinner} />
                      : <><RiCheckLine /> Accept — Earn ₹{order.earnings}</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function OrderDetails({ order, isRequest = false }) {
  const pickup  = isRequest ? order.pickupAddress  : order.pickupAddress?.address;
  const dropoff = isRequest ? order.dropAddress    : order.deliveryAddress?.fullAddress;
  const distance = order.distance;
  const duration = order.duration || order.estimatedDeliveryTime;
  const earnings = order.earnings || order.partnerEarnings;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-[#ff6b00] mt-2 flex-shrink-0" />
        <div>
          <p className="text-[11px] text-[#888888] uppercase tracking-wide">Pickup</p>
          <p className="text-[14px] text-[#f0f0f0]">{pickup || '—'}</p>
        </div>
      </div>
      <div className="ml-[3px] w-[2px] h-4 bg-[#2e2e2e]" />
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-[#2979ff] mt-2 flex-shrink-0" />
        <div>
          <p className="text-[11px] text-[#888888] uppercase tracking-wide">Dropoff</p>
          <p className="text-[14px] text-[#f0f0f0]">{dropoff || '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#2e2e2e]">
        {distance && (
          <span className="flex items-center gap-1 text-[13px] text-[#888888]">
            <RiMapPinLine className="text-[#ff6b00]" /> {distance} km
          </span>
        )}
        {duration && (
          <span className="flex items-center gap-1 text-[13px] text-[#888888]">
            <RiTimeLine /> ~{duration} min
          </span>
        )}
        {earnings && (
          <span className="flex items-center gap-1 text-[13px] font-bold text-[#00c853]">
            <RiMoneyRupeeCircleLine /> ₹{earnings}
          </span>
        )}
      </div>
    </div>
  );
}