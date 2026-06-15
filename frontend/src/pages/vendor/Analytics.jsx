import { useEffect, useState } from 'react';
import { RiBarChartLine, RiMoneyRupeeCircleLine, RiOrderPlayLine, RiRefreshLine } from 'react-icons/ri';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import * as S from '../../styles/common';

export default function VendorAnalytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors/analytics');
      setData(res.data.analytics);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Analytics</h1>
          <button onClick={fetchAnalytics} className={S.btnIcon}><RiRefreshLine /></button>
        </div>

        <div className="p-4 md:p-6 max-w-[900px] mx-auto">
          {loading ? (
            <Spinner large />
          ) : !data ? (
            <div className={S.emptyState}>
              <RiBarChartLine className={S.emptyIcon} />
              <p className={S.emptyTitle}>No analytics yet</p>
              <p className={S.emptySubtitle}>Start receiving orders to see your stats here</p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className={`${S.statGrid} mb-6`}>
                <div className={S.statCard}>
                  <div className={`${S.statIcon} bg-[#ff6b00]/15 text-[#ff6b00]`}>
                    <RiOrderPlayLine />
                  </div>
                  <p className={S.statNum}>{data.totalOrders ?? 0}</p>
                  <p className={S.statLabel}>Total Orders</p>
                </div>
                <div className={S.statCard}>
                  <div className={`${S.statIcon} bg-[#00c853]/15 text-[#00c853]`}>
                    <RiMoneyRupeeCircleLine />
                  </div>
                  <p className={S.statNum}>₹{data.totalRevenue ?? 0}</p>
                  <p className={S.statLabel}>Total Revenue</p>
                </div>
                <div className={S.statCard}>
                  <div className={`${S.statIcon} bg-[#2979ff]/15 text-[#2979ff]`}>
                    <RiBarChartLine />
                  </div>
                  <p className={S.statNum}>₹{data.totalOrders > 0 ? Math.round((data.totalRevenue ?? 0) / data.totalOrders) : 0}</p>
                  <p className={S.statLabel}>Avg Order Value</p>
                </div>
                <div className={S.statCard}>
                  <div className={`${S.statIcon} bg-[#ffb300]/15 text-[#ffb300]`}>
                    <RiOrderPlayLine />
                  </div>
                  <p className={S.statNum}>{data.completedOrders ?? 0}</p>
                  <p className={S.statLabel}>Completed</p>
                </div>
              </div>

              {/* Popular items */}
              {data.popularItems?.length > 0 && (
                <div className={S.cardPaddedLg}>
                  <h2 className={`${S.cardTitle} mb-4`}>Top Items</h2>
                  <div className="space-y-3">
                    {data.popularItems.map((item, i) => (
                      <div key={i} className={`${S.flexBetween} py-2 border-b border-[#2e2e2e] last:border-0`}>
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-[14px] font-medium text-[#f0f0f0]">{item.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold text-[#ff6b00]">×{item.totalQuantity}</p>
                          <p className="text-[12px] text-[#888888]">₹{item.totalRevenue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent orders revenue */}
              {data.recentOrders?.length > 0 && (
                <div className={`${S.cardPaddedLg} mt-4`}>
                  <h2 className={`${S.cardTitle} mb-4`}>Recent Orders</h2>
                  <div className="space-y-2">
                    {data.recentOrders.map((order) => (
                      <div key={order._id} className={`${S.flexBetween} py-2 border-b border-[#2e2e2e] last:border-0`}>
                        <div>
                          <p className="font-mono text-[13px] font-bold text-[#ff6b00]">{order.orderId}</p>
                          <p className="text-[12px] text-[#888888] mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[15px] text-[#f0f0f0]">₹{order.totalAmount}</p>
                          <span className={S.getStatusStyle(order.orderStatus)} style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {order.orderStatus}
                          </span>
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