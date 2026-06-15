import { useEffect, useState, useCallback } from 'react';
import { RiSearchLine, RiUserLine, RiToggleLine, RiForbidLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { SkeletonCard } from '../../components/Spinner';
import * as S from '../../styles/common';

const ROLE_TABS = ['all', 'customer', 'vendor', 'partner', 'admin'];

export default function AdminUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [role, setRole]           = useState('all');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toggling, setToggling]   = useState({});

  const fetchUsers = useCallback(async (r = role, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (r !== 'all') params.role = r;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [role, page]);

  useEffect(() => { fetchUsers(role, 1); setPage(1); }, [role]);

  const handleToggleActive = async (user) => {
    setToggling((p) => ({ ...p, [user._id]: true }));
    try {
      // admin toggle — use PUT /admin/users/:id/toggle or the activate endpoint
      await api.put(`/admin/users/${user._id}/toggle`);
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setToggling((p) => ({ ...p, [user._id]: false }));
    }
  };

  const filtered = search.trim()
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Users</h1>
        </div>

        {/* Role tabs */}
        <div className={S.tabBar}>
          {ROLE_TABS.map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={role === r ? S.tabActive : S.tab}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
              {role === r && <span className={S.tabIndicator} />}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 max-w-[1000px] mx-auto">
          {/* Search */}
          <div className={`${S.searchBar} mb-4`}>
            <RiSearchLine className={S.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={S.searchInput}
            />
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map((i) => <SkeletonCard key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className={S.emptyState}>
              <RiUserLine className={S.emptyIcon} />
              <p className={S.emptyTitle}>No users found</p>
            </div>
          ) : (
            <>
              <div className={S.tableWrap}>
                <table className={S.table}>
                  <thead>
                    <tr>
                      <th className={S.th}>User</th>
                      <th className={S.th}>Role</th>
                      <th className={S.th}>Joined</th>
                      <th className={S.th}>Status</th>
                      <th className={S.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => (
                      <tr key={user._id} className={S.tr}>
                        <td className={S.td}>
                          <div className="flex items-center gap-3">
                            <div className={S.avatarFallback()}>
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[14px] text-[#f0f0f0]">{user.name}</p>
                              <p className="text-[12px] text-[#888888]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={S.td}>
                          <span className={
                            user.role === 'admin'   ? S.badgeRed :
                            user.role === 'vendor'  ? S.badgeAmber :
                            user.role === 'partner' ? S.badgeBlue :
                            S.badgeGray
                          }>
                            {user.role}
                          </span>
                        </td>
                        <td className={S.td}>
                          <p className="text-[13px] text-[#888888]">
                            {dayjs(user.createdAt).format('DD MMM YYYY')}
                          </p>
                        </td>
                        <td className={S.td}>
                          <span className={user.isActive ? S.badgeGreen : S.badgeRed}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className={S.td}>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={toggling[user._id]}
                              className={S.btnIconSm}
                              title={user.isActive ? 'Deactivate' : 'Activate'}>
                              {toggling[user._id]
                                ? <span className="w-4 h-4 border-2 border-[#2e2e2e] border-t-[#ff6b00] rounded-full animate-spin" />
                                : user.isActive ? <RiForbidLine /> : <RiToggleLine />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button onClick={() => { const p = page - 1; setPage(p); fetchUsers(role, p); }}
                    disabled={page === 1} className={S.btnSecondary}>Prev</button>
                  <span className="text-[14px] text-[#888888]">{page} / {totalPages}</span>
                  <button onClick={() => { const p = page + 1; setPage(p); fetchUsers(role, p); }}
                    disabled={page === totalPages} className={S.btnSecondary}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}