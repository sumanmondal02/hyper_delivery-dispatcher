import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  RiBellLine, RiCheckDoubleLine, RiShoppingCartLine,
  RiMotorbikeLine, RiWalletLine, RiSettings4Line,
} from 'react-icons/ri';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import useNotifStore from '../../store/useNotifStore';
import { getSocket } from '../../socket/socket';
import * as S from '../../styles/common';

dayjs.extend(relativeTime);

const TYPE_ICON = {
  order:    { icon: <RiShoppingCartLine />, cls: S.notifIconOrder },
  delivery: { icon: <RiMotorbikeLine />,    cls: S.notifIconDel },
  payment:  { icon: <RiWalletLine />,       cls: S.notifIconPay },
  system:   { icon: <RiSettings4Line />,    cls: S.notifIconSys },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, fetchNotifs, markRead, markAllRead, pushNotif } = useNotifStore();

  useEffect(() => {
    fetchNotifs();

    // Real-time push
    const socket = getSocket();
    if (socket) {
      socket.on('new_notification', (notif) => {
        pushNotif(notif);
      });
    }
    return () => {
      if (socket) socket.off('new_notification');
    };
  }, []);

  const handleClick = async (notif) => {
    if (!notif.isRead) await markRead(notif._id);
    // Navigate to order if metadata contains orderId
    if (notif.metadata?.orderId) {
      navigate(`/track/${notif.metadata.orderId}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-[12px] font-bold text-white bg-[#ff6b00] px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1 text-[13px] text-[#ff6b00] font-semibold hover:underline">
              <RiCheckDoubleLine /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center pt-20"><Spinner large /></div>
        ) : notifications.length === 0 ? (
          <div className={S.emptyState} style={{ marginTop: '80px' }}>
            <RiBellLine className={S.emptyIcon} />
            <p className={S.emptyTitle}>No notifications</p>
            <p className={S.emptySubtitle}>Order updates and alerts will appear here</p>
          </div>
        ) : (
          <div className="max-w-[700px] mx-auto">
            {notifications.map((notif) => {
              const typeInfo = TYPE_ICON[notif.type] || TYPE_ICON.system;
              return (
                <div
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  className={notif.isRead ? S.notifItem : S.notifItemUnread}>
                  <div className={`${S.notifIcon} ${typeInfo.cls}`}>
                    {typeInfo.icon}
                  </div>
                  <div className={S.notifContent}>
                    <p className={S.notifTitle}>{notif.title}</p>
                    <p className={S.notifMsg}>{notif.message}</p>
                    <p className={S.notifTime}>{dayjs(notif.createdAt).fromNow()}</p>
                  </div>
                  {!notif.isRead && <span className={S.notifUnreadDot} />}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}