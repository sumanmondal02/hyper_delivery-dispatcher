import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { RiOrderPlayLine, RiArrowRightLine } from 'react-icons/ri';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { SkeletonCard } from '../../components/Spinner';
import useOrderStore from '../../store/useOrderStore';
import * as S from '../../styles/common';

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'placed',     label: 'Placed' },
  { key: 'preparing',  label: 'Preparing' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' },
];

export default function OrderHistory() {
  const navigate = useNavigate();
  const { orders, totalPages, currentPage, loading, fetchHistory } = useOrderStore();
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    fetchHistory(1, activeFilter);
  }, [activeFilter]);

  const handlePage = (page) => {
    fetchHistory(page, activeFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>My Orders</h1>
        </div>

        {/* Status filter tabs */}
        <div className={S.tabBar}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={activeFilter === f.key ? S.tabActive : S.tab}>
              {f.label}
              {activeFilter === f.key && <span className={S.tabIndicator} />}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 max-w-[800px] mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className={S.emptyState} style={{ marginTop: '60px' }}>
              <RiOrderPlayLine className={S.emptyIcon} />
              <p className={S.emptyTitle}>No orders yet</p>
              <p className={S.emptySubtitle}>
                {activeFilter ? `No ${activeFilter} orders found` : 'Place your first order to see it here'}
              </p>
              <button onClick={() => navigate('/home')} className={`${S.btnPrimary} mt-4`}>
                Browse stores
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard key={order._id} order={order} onClick={() => navigate(`/track/${order.orderId}`)} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => handlePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={S.btnSecondary + ' text-[13px] px-4 py-2'}>
                    Previous
                  </button>
                  <span className="text-[13px] text-[#888888]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={S.btnSecondary + ' text-[13px] px-4 py-2'}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order, onClick }) {
  const isActive = !['delivered','cancelled'].includes(order.orderStatus);
  return (
    <div className={S.orderCard} onClick={onClick}>
      <div className={S.orderCardHeader}>
        <span className={S.orderCardId}>{order.orderId}</span>
        <StatusBadge status={order.orderStatus} />
      </div>

      <div className={S.flexBetween + ' mb-2'}>
        <p className="text-[14px] font-semibold text-[#f0f0f0]">
          {order.vendorId?.businessName || 'Store'}
        </p>
        {order.vendorId?.image && (
          <img src={order.vendorId.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
        )}
      </div>

      <p className={S.orderCardItems}>
        {order.items?.slice(0,3).map((i) => `${i.name} ×${i.quantity}`).join(', ')}
        {order.items?.length > 3 && ` +${order.items.length - 3} more`}
      </p>

      <div className={S.orderCardFooter}>
        <div>
          <p className={S.orderCardTotal}>₹{order.totalAmount}</p>
          <p className="text-[11px] text-[#555555] mt-0.5">
            {dayjs(order.createdAt).format('DD MMM, hh:mm A')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="text-[12px] font-semibold text-[#ff6b00] flex items-center gap-1">
              Track <RiArrowRightLine />
            </span>
          )}
          {!isActive && (
            <span className="text-[12px] text-[#888888] flex items-center gap-1">
              View details <RiArrowRightLine />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}