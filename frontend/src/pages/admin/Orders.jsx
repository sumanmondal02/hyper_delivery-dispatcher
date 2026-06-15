import { useEffect, useState, useCallback } from 'react';
import { RiSearchLine, RiFilterLine } from 'react-icons/ri';
import dayjs from 'dayjs';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { SkeletonCard } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import * as S from '../../styles/common';

const STATUS_TABS = ['', 'placed', 'preparing', 'in_transit', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState('');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async (s = status, p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (s) params.status = s;
      const res = await api.get('/admin/orders', { params });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchOrders(status, 1); }, [status]);

  const filtered = search.trim()
    ? orders.filter((o) =>
        o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
        o.customerId?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Orders</h1>
        </div>

        {/* Status tabs */}
        <div className={S.tabBar}>
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={status === s ? S.tabActive : S.tab}>
              {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
              {status === s && <span className={S.tabIndicator} />}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
          {/* Search */}
          <div className={`${S.searchBar} mb-4`}>
            <RiSearchLine className={S.searchIcon} />
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={S.searchInput}
            />
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map((i) => <SkeletonCard key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className={S.emptyState}>
              <RiFilterLine className={S.emptyIcon} />
              <p className={S.emptyTitle}>No orders found</p>
            </div>
          ) : (
            <>
              <div className={S.tableWrap}>
                <table className={S.table}>
                  <thead>
                    <tr>
                      <th className={S.th}>Order ID</th>
                      <th className={S.th}>Customer</th>
                      <th className={S.th}>Vendor</th>
                      <th className={S.th}>Amount</th>
                      <th className={S.th}>Status</th>
                      <th className={S.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => (
                      <tr key={order._id} className={S.tr}>
                        <td className={S.td}>
                          <span className={S.orderCardId}>{order.orderId}</span>
                        </td>
                        <td className={S.td}>
                          <p className="text-[14px] text-[#f0f0f0]">{order.customerId?.name || '—'}</p>
                          <p className="text-[12px] text-[#888888]">{order.customerId?.phone || ''}</p>
                        </td>
                        <td className={S.td}>
                          <p className="text-[14px] text-[#f0f0f0]">{order.vendorId?.businessName || '—'}</p>
                        </td>
                        <td className={S.td}>
                          <p className="font-bold text-[14px] text-[#ff6b00]">₹{order.totalAmount}</p>
                          <p className="text-[12px] text-[#888888]">{order.distance} km</p>
                        </td>
                        <td className={S.td}>
                          <StatusBadge status={order.orderStatus} />
                        </td>
                        <td className={S.td}>
                          <p className="text-[13px] text-[#888888]">
                            {dayjs(order.createdAt).format('DD MMM, HH:mm')}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button onClick={() => fetchOrders(status, page - 1)} disabled={page === 1} className={S.btnSecondary}>Prev</button>
                  <span className="text-[14px] text-[#888888]">{page} / {totalPages}</span>
                  <button onClick={() => fetchOrders(status, page + 1)} disabled={page === totalPages} className={S.btnSecondary}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}