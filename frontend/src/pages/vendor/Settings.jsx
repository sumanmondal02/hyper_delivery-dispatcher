import { useEffect, useState, useRef } from 'react';
import { RiTimeLine, RiStoreLine, RiCheckLine, RiImageAddLine, RiLogoutBoxLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import * as S from '../../styles/common';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function VendorSettings() {
  const [vendor, setVendor]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toggling, setToggling] = useState(false);
  const [form, setForm]         = useState({ openingTime: '09:00', closingTime: '22:00' });
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ CORRECT: GET /api/vendors/me/profile
    api.get('/vendors/me/profile')
      .then((r) => {
        const v = r.data.vendor;
        setVendor(v);
        setForm({ openingTime: v.openingTime || '09:00', closingTime: v.closingTime || '22:00' });
        setImagePreview(v.image || null);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Only JPG/PNG'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('openingTime', form.openingTime);
      fd.append('closingTime', form.closingTime);
      if (imageFile) fd.append('image', imageFile);
      // ✅ FIXED: PUT /api/vendors/me/settings (was /vendor/settings → 404)
      const res = await api.put('/vendors/me/settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVendor(res.data.vendor);
      setImageFile(null);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOpen = async () => {
    setToggling(true);
    try {
      const fd = new FormData();
      fd.append('isOpen', String(!vendor.isOpen));
      // ✅ FIXED: PUT /api/vendors/me/settings
      const res = await api.put('/vendors/me/settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVendor(res.data.vendor);
      toast.success(res.data.vendor.isOpen ? 'Store is now open' : 'Store is now closed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center"><Spinner large /></main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Settings</h1>
        </div>

        <div className="p-4 md:p-6 max-w-[600px] mx-auto space-y-4">
          {/* Store open/close toggle */}
          <div className={S.toggleWrap}>
            <div>
              <p className={S.toggleLabel}>Store Status</p>
              <p className={S.toggleSub}>{vendor?.isOpen ? 'Currently accepting orders' : 'Not accepting orders'}</p>
            </div>
            <button
              onClick={handleToggleOpen}
              disabled={toggling}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${vendor?.isOpen ? 'bg-[#00c853]' : 'bg-[#2a2a2a] border border-[#2e2e2e]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${vendor?.isOpen ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Logout */}
          <div className={S.cardPaddedLg}>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 border border-red-500/20
                      text-red-400 rounded-xl py-3 flex items-center cursor-pointer
                      justify-center gap-2 hover:bg-red-500/20 transition-colors">
            <RiLogoutBoxLine />
            Logout
          </button>
        </div>

          {/* Store image */}
          <div className={S.cardPaddedLg}>
            <h2 className={`${S.h3} mb-4`}>Store Image</h2>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-[#2e2e2e] hover:border-[#ff6b00]/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-[#2a2a2a] flex-shrink-0 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <RiImageAddLine className="text-[24px] text-[#555555]" />
                    <span className="text-[11px] text-[#555555] mt-1">Add photo</span>
                  </>
                )}
              </div>
              <div>
                <p className="text-[13px] text-[#888888] mb-2">Your store logo or photo</p>
                <button onClick={() => fileRef.current?.click()} className={`${S.btnSecondary} text-[13px]`}>
                  <RiImageAddLine /> {imagePreview ? 'Change' : 'Upload'}
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className={S.cardPaddedLg}>
            <h2 className={`${S.h3} mb-4 flex items-center gap-2`}><RiTimeLine className="text-[#ff6b00]" /> Opening Hours</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={S.formGroup} style={{ marginBottom: 0 }}>
                <label className={S.label}>Opens at</label>
                <input type="time" value={form.openingTime}
                  onChange={(e) => setForm((p) => ({ ...p, openingTime: e.target.value }))}
                  className={S.input} />
              </div>
              <div className={S.formGroup} style={{ marginBottom: 0 }}>
                <label className={S.label}>Closes at</label>
                <input type="time" value={form.closingTime}
                  onChange={(e) => setForm((p) => ({ ...p, closingTime: e.target.value }))}
                  className={S.input} />
              </div>
            </div>
            <button onClick={handleSaveHours} disabled={saving} className={S.btnPrimary}>
              {saving ? <span className={S.spinner} /> : <><RiCheckLine /> Save settings</>}
            </button>
          </div>

          {/* Store info read-only */}
          {vendor && (
            <div className={S.cardPaddedLg}>
              <h2 className={`${S.h3} mb-4 flex items-center gap-2`}><RiStoreLine className="text-[#ff6b00]" /> Store Info</h2>
              <div className="space-y-3">
                <InfoRow label="Business name" value={vendor.businessName} />
                <InfoRow label="Category"      value={vendor.category} />
                <InfoRow label="Address"       value={vendor.address} />
                {vendor.city    && <InfoRow label="City"    value={vendor.city} />}
                {vendor.pincode && <InfoRow label="Pincode" value={vendor.pincode} />}
                <InfoRow label="Total orders"  value={vendor.totalOrders ?? 0} />
              </div>
              <p className="text-[12px] text-[#555555] mt-4">To update business name or address, contact support: <a href="mailto:deloitte.jobs.hr@gmail.com" className="text-[#ff6b00]">deloitte.jobs.hr@gmail.com</a></p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className={S.flexBetween + ' py-2 border-b border-[#2e2e2e] last:border-0'}>
      <span className="text-[13px] text-[#888888]">{label}</span>
      <span className="text-[14px] font-medium text-[#f0f0f0] capitalize">{String(value)}</span>
    </div>
  );
}