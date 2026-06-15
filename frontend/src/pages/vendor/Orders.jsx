import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  RiRefreshLine, RiTimeLine, RiPhoneLine,
  RiCheckLine, RiArrowRightLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { SkeletonCard } from '../../components/Spinner';
import { getSocket, joinVendorRoom } from '../../socket/socket';
import useAuthStore from '../../store/useAuthStore';
import * as S from '../../styles/common';

dayjs.extend(relativeTime);

// Vendor can push: placed→accepted, accepted→preparing, preparing→ready
const NEXT_STATUS = { placed: 'accepted', accepted: 'preparing', preparing: 'ready' };
const NEXT_LABEL  = { placed: 'Accept', accepted: 'Start Preparing', preparing: 'Mark Ready' };

const STATUS_TABS = [
  { key: '',          label: 'All' },
  { key: 'placed',    label: 'New' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready',     label: 'Ready' },
  { key: 'in_transit',label: 'Picked Up' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function VendorOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [updating, setUpdating]   = useState({}); // { [orderId]: true }
  const [vendorId, setVendorId]   = useState(null);

  // Fetch vendor profile to get vendor._id for socket room
  useEffect(() => {
    api.get('/vendors/me/profile')
      .then((r) => {
        const vid = r.data.vendor?._id;
        setVendorId(vid);
        if (vid) joinVendorRoom(vid); // join vendor_<vendorId> socket room
      })
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async (status = activeTab) => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const res = await api.get('/vendors/orders', { params });
      setOrders(res.data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchOrders(activeTab); }, [activeTab]);

  // Real-time: new orders + cancellations
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('new_order', (order) => {
      toast.success(`New order: ${order.orderId}`);
      // Prepend to list if we're on 'All' or 'New' tab
      setOrders((prev) => {
        if (activeTab === '' || activeTab === 'placed') {
          return [{ ...order, orderStatus: 'placed' }, ...prev];
        }
        return prev;
      });
    });

    socket.on('order_cancelled', ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) => o.orderId === orderId ? { ...o, orderStatus: 'cancelled' } : o)
      );
      toast.error(`Order ${orderId} was cancelled`);
    });

    return () => {
      socket.off('new_order');
      socket.off('order_cancelled');
    };
  }, [activeTab]);

  const handleStatusUpdate = async (order) => {
    const nextStatus = NEXT_STATUS[order.orderStatus];
    if (!nextStatus) return;

    setUpdating((p) => ({ ...p, [order._id]: true }));
    try {
      const res = await api.put(`/vendors/orders/${order._id}/status`, { status: nextStatus });
      const updated = res.data.order;
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, orderStatus: updated.orderStatus } : o));
      toast.success(`Order ${nextStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating((p) => ({ ...p, [order._id]: false }));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Orders</h1>
          <button onClick={() => fetchOrders(activeTab)} className={S.btnIcon} title="Refresh">
            <RiRefreshLine />
          </button>
        </div>

        {/* Status tabs */}
        <div className={S.tabBar}>
          {STATUS_TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={activeTab === t.key ? S.tabActive : S.tab}>
              {t.label}
              {activeTab === t.key && <span className={S.tabIndicator} />}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 max-w-[900px] mx-auto">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : orders.length === 0 ? (
            <div className={S.emptyState} style={{ marginTop: '60px' }}>
              <p className={S.emptyTitle}>No orders</p>
              <p className={S.emptySubtitle}>
                {activeTab ? `No ${activeTab} orders right now` : 'New orders will appear here in real-time'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderItem
                  key={order._id}
                  order={order}
                  updating={!!updating[order._id]}
                  onUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function OrderItem({ order, updating, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const nextStatus = NEXT_STATUS[order.orderStatus];
  const nextLabel  = NEXT_LABEL[order.orderStatus];

  return (
    <div className={S.cardPadded}>
      {/* Header */}
      <div className={S.flexBetween + ' mb-3'}>
        <div>
          <span className={S.orderCardId}>{order.orderId}</span>
          <p className="text-[12px] text-[#888888] mt-0.5">{dayjs(order.createdAt).fromNow()}</p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* Customer */}
      <div className={S.flexBetween + ' mb-3'}>
        <div>
          <p className="text-[14px] font-semibold text-[#f0f0f0]">
            {order.customerId?.name || 'Customer'}
          </p>
          {order.customerId?.phone && (
            <a href={`tel:${order.customerId.phone}`}
              className="flex items-center gap-1 text-[12px] text-[#888888] hover:text-[#ff6b00] mt-0.5">
              <RiPhoneLine /> {order.customerId.phone}
            </a>
          )}
        </div>
        <p className="font-bold text-[16px] text-[#ff6b00]">₹{order.totalAmount}</p>
      </div>

      {/* Items summary */}
      <p className="text-[13px] text-[#888888] mb-2 truncate">
        {order.items?.slice(0,3).map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
        {order.items?.length > 3 && ` +${order.items.length - 3} more`}
      </p>

      {/* Expand toggle */}
      <button onClick={() => setExpanded(!expanded)}
        className="text-[12px] text-[#ff6b00] font-medium mb-3">
        {expanded ? 'Hide details' : 'View details'} <RiArrowRightLine className={`inline transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#2e2e2e] pt-3 mb-3">
          <div className="space-y-1.5 mb-3">
            {order.items?.map((item, i) => (
              <div key={i} className={S.flexBetween}>
                <span className="text-[13px] text-[#f0f0f0]">{item.name} ×{item.quantity}</span>
                <span className="text-[13px] font-semibold text-[#f0f0f0]">₹{item.subtotal}</span>
              </div>
            ))}
            <div className={`${S.flexBetween} pt-2 border-t border-[#2e2e2e]`}>
              <span className="text-[12px] text-[#888888]">Items total</span>
              <span className="text-[13px] font-semibold text-[#f0f0f0]">₹{order.itemsTotal}</span>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="p-3 rounded-xl bg-[#2a2a2a] mb-3">
              <p className="text-[11px] text-[#888888] mb-1 uppercase tracking-wide">Deliver to</p>
              <p className="text-[13px] text-[#f0f0f0]">{order.deliveryAddress.fullAddress}</p>
              {order.deliveryAddress.landmark && (
                <p className="text-[12px] text-[#555555]">Near: {order.deliveryAddress.landmark}</p>
              )}
            </div>
          )}

          {order.specialInstructions && (
            <div className="p-3 rounded-xl bg-[#ffb300]/10 border border-[#ffb300]/20 mb-3">
              <p className="text-[11px] text-[#ffb300] mb-1 uppercase tracking-wide">Special instructions</p>
              <p className="text-[13px] text-[#f0f0f0]">{order.specialInstructions}</p>
            </div>
          )}

          <div className="flex items-center gap-3 text-[12px] text-[#888888]">
            <span className="flex items-center gap-1"><RiTimeLine /> {order.estimatedDeliveryTime} min</span>
            <span>{order.distance} km</span>
            <span>Delivery: ₹{order.deliveryFee}</span>
          </div>
        </div>
      )}

      {/* Action button */}
      {nextStatus && (
        <button
          onClick={() => onUpdate(order)}
          disabled={updating}
          className={`${S.btnPrimary} w-full text-[14px]`}>
          {updating
            ? <span className={S.spinner} />
            : <><RiCheckLine /> {nextLabel}</>
          }
        </button>
      )}
    </div>
  );
}