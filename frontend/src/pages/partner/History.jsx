import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RiHistoryLine, RiMapPinLine, RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { SkeletonCard } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import * as S from '../../styles/common';

dayjs.extend(relativeTime);

export default function PartnerHistory() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/partner/history?page=${p}&limit=10`);
      setDeliveries(res.data.deliveries || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
    } catch {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>History</h1>
        </div>

        <div className="p-4 md:p-6 max-w-[700px] mx-auto">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
          ) : deliveries.length === 0 ? (
            <div className={S.emptyState} style={{ marginTop: '60px' }}>
              <RiHistoryLine className="text-[48px] text-[#2a2a2a] mb-4" />
              <p className={S.emptyTitle}>No deliveries yet</p>
              <p className={S.emptySubtitle}>Your completed deliveries will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-5">
                {deliveries.map((d) => {
                  const order = d.orderId;
                  return (
                    <div key={d._id} className={S.cardPadded}>
                      <div className={S.flexBetween + ' mb-2'}>
                        <span className={S.orderCardId}>
                          {typeof order === 'object' ? order.orderId : '—'}
                        </span>
                        <StatusBadge status={d.status} />
                      </div>

                      {typeof order === 'object' && (
                        <>
                          <div className="flex items-start gap-2 mb-1">
                            <RiMapPinLine className="text-[#ff6b00] flex-shrink-0 mt-0.5 text-[14px]" />
                            <p className="text-[13px] text-[#888888] truncate">{order.pickupAddress?.address}</p>
                          </div>
                          <div className="flex items-start gap-2 mb-3">
                            <RiMapPinLine className="text-[#2979ff] flex-shrink-0 mt-0.5 text-[14px]" />
                            <p className="text-[13px] text-[#888888] truncate">{order.deliveryAddress?.fullAddress}</p>
                          </div>
                        </>
                      )}

                      <div className={S.flexBetween}>
                        <p className="text-[12px] text-[#555555]">{dayjs(d.createdAt).fromNow()}</p>
                        <p className="font-bold text-[15px] text-[#00c853]">+₹{d.partnerEarnings}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => fetchHistory(page - 1)}
                    disabled={page === 1}
                    className={S.btnIcon}>
                    <RiArrowLeftLine />
                  </button>
                  <span className="text-[14px] text-[#888888]">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={page === totalPages}
                    className={S.btnIcon}>
                    <RiArrowRightLine />
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