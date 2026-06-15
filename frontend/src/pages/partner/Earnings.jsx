import { useEffect, useState } from 'react';
import { RiMoneyRupeeCircleLine, RiMotorbikeLine, RiCalendarLine, RiRefreshLine } from 'react-icons/ri';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import * as S from '../../styles/common';

export default function PartnerEarnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner/earnings');
      setEarnings(res.data.earnings);
    } catch {
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEarnings(); }, []);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Earnings</h1>
          <button onClick={fetchEarnings} className={S.btnIcon}><RiRefreshLine /></button>
        </div>

        <div className="p-4 md:p-6 max-w-[700px] mx-auto">
          {loading ? (
            <Spinner large />
          ) : !earnings ? (
            <div className={S.emptyState}>
              <RiMoneyRupeeCircleLine className="text-[48px] text-[#2a2a2a] mb-4" />
              <p className={S.emptyTitle}>No earnings yet</p>
              <p className={S.emptySubtitle}>Complete deliveries to start earning</p>
            </div>
          ) : (
            <>
              {/* Total earnings hero */}
              <div className="bg-gradient-to-br from-[#ff6b00]/20 to-[#ff6b00]/5 border border-[#ff6b00]/30 rounded-2xl p-6 mb-5 text-center">
                <RiMoneyRupeeCircleLine className="text-[40px] text-[#ff6b00] mx-auto mb-2" />
                <p className="text-[40px] font-extrabold text-[#f0f0f0]">₹{earnings.total ?? 0}</p>
                <p className="text-[#888888] text-[14px] mt-1">Total lifetime earnings</p>
              </div>

              {/* Period breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className={S.earningCard}>
                  <p className={S.earningNum}>₹{earnings.today ?? 0}</p>
                  <p className={S.earningLabel}>Today</p>
                </div>
                <div className={S.earningCard}>
                  <p className={S.earningNum}>₹{earnings.thisWeek ?? 0}</p>
                  <p className={S.earningLabel}>This Week</p>
                </div>
                <div className={S.earningCard}>
                  <p className={S.earningNum}>₹{earnings.thisMonth ?? 0}</p>
                  <p className={S.earningLabel}>This Month</p>
                </div>
              </div>

              {/* Stats */}
              <div className={`${S.grid2} mb-5`}>
                <div className={S.statCard}>
                  <div className={`${S.statIcon} bg-[#2979ff]/15 text-[#2979ff]`}><RiMotorbikeLine /></div>
                  <p className={S.statNum}>{earnings.completedDeliveries ?? 0}</p>
                  <p className={S.statLabel}>Deliveries</p>
                </div>
                <div className={S.statCard}>
                  <div className={`${S.statIcon} bg-[#00c853]/15 text-[#00c853]`}><RiCalendarLine /></div>
                  <p className={S.statNum}>₹{earnings.completedDeliveries > 0 ? Math.round((earnings.total ?? 0) / earnings.completedDeliveries) : 0}</p>
                  <p className={S.statLabel}>Avg per delivery</p>
                </div>
              </div>

              <div className={`${S.infoAlert} text-center`}>
                💡 Platform commission: 20% of delivery fee. You keep 80%.
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}