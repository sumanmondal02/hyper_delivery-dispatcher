import { useNavigate, useLocation } from 'react-router-dom';
import {
  RiMotorbikeLine, RiHome5Line, RiShoppingCartLine, RiOrderPlayLine,
  RiBellLine, RiUserLine, RiStoreLine, RiBarChartLine, RiSettings4Line,
  RiMapPinLine, RiWalletLine, RiHistoryLine, RiDashboardLine, RiGroupLine,
  RiLogoutBoxLine,
} from 'react-icons/ri';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useNotifStore from '../store/useNotifStore';
import * as S from '../styles/common';

const NAV_MAP = {
  customer: [
    { path: '/home',          icon: <RiHome5Line />,         label: 'Home' },
    { path: '/cart',          icon: <RiShoppingCartLine />,  label: 'Cart',  badge: 'cart' },
    { path: '/orders',        icon: <RiOrderPlayLine />,     label: 'Orders' },
    { path: '/notifications', icon: <RiBellLine />,          label: 'Alerts', badge: 'notif' },
    { path: '/profile',       icon: <RiUserLine />,          label: 'Profile' },
  ],
  vendor: [
    { path: '/vendor/orders',    icon: <RiStoreLine />,      label: 'Orders' },
    { path: '/vendor/products',  icon: <RiHome5Line />,      label: 'Products' },
    { path: '/vendor/analytics', icon: <RiBarChartLine />,   label: 'Stats' },
    { path: '/vendor/settings',  icon: <RiSettings4Line />,  label: 'Settings' },
  ],
  partner: [
    { path: '/partner/available', icon: <RiMapPinLine />,    label: 'Orders' },
    { path: '/partner/delivery',  icon: <RiMotorbikeLine />, label: 'Active' },
    { path: '/partner/earnings',  icon: <RiWalletLine />,    label: 'Earnings' },
    { path: '/partner/history',   icon: <RiHistoryLine />,   label: 'History' },
  ],
  admin: [
    { path: '/admin/dashboard', icon: <RiDashboardLine />,  label: 'Dashboard' },
    { path: '/admin/users',     icon: <RiGroupLine />,      label: 'Users' },
    { path: '/admin/orders',    icon: <RiOrderPlayLine />,  label: 'Orders' },
    { path: '/admin/settings',  icon: <RiSettings4Line />,  label: 'Settings' },
  ],
};

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();
  const { itemCount }    = useCartStore();
  const { unreadCount }  = useNotifStore();

  if (!user) return null;

  const navItems = NAV_MAP[user.role] || [];
  const isActive = (path) => location.pathname === path;

  const getBadge = (badge) => {
    if (badge === 'cart')  return itemCount > 0 ? itemCount : null;
    if (badge === 'notif') return unreadCount > 0 ? unreadCount : null;
    return null;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className={S.sidebar}>
        <div className={S.sidebarInner}>
          <div className={S.sidebarLogo}>
            <RiMotorbikeLine className="text-[#ff6b00] text-[24px]" />
            <span className={S.sidebarLogoText}>Hyper - Dispatch. Track. Deliver.</span>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const badge = getBadge(item.badge);
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className={isActive(item.path) ? S.navItemActive : S.navItem}>
                  <span className={S.navIcon}>{item.icon}</span>
                  {item.label}
                  {badge && <span className={S.navBadgeInline}>{badge > 99 ? '99+' : badge}</span>}
                </button>
              );
            })}
          </nav>

          <div className={S.sidebarDivider} />

          <div className={S.sidebarUser}>
            <div className={S.avatarFallback()}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={S.sidebarUserName}>{user.name}</p>
              <p className={S.sidebarUserRole}>{user.role}</p>
            </div>
            <button onClick={handleLogout} className={S.btnIcon} title="Logout">
              <RiLogoutBoxLine />
            </button>
          </div>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className={S.bottomNav}>
        {navItems.map((item) => {
          const badge = getBadge(item.badge);
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={isActive(item.path) ? S.bottomNavActive : S.bottomNavItem}>
              <span className="text-[22px] relative">
                {item.icon}
                {badge && (
                  <span className={S.navBadge}>{badge > 9 ? '9+' : badge}</span>
                )}
              </span>
              <span className={S.bottomNavLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}