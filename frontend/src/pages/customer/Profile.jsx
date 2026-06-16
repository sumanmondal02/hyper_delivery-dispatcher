import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUserLine, RiPhoneLine, RiEditLine, RiLogoutBoxLine, RiCameraLine, RiCheckLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import useAuthStore from '../../store/useAuthStore';
import * as S from '../../styles/common';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();

  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState(user?.name || '');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef                   = useRef(null);

  const handleSave = async () => {
    if (name.trim().length < 4) { toast.error('Name must be at least 4 characters'); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { toast.error('Enter valid 10-digit phone number'); return; }

    setSaving(true);
    const res = await updateProfile({ name: name.trim(), phone });
    if (res.success) {
      toast.success('Profile updated');
      setEditing(false);
    } else {
      toast.error(res.error || 'Update failed');
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!['image/jpeg','image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      // PUT /api/auth/profile with multipart
      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update store
      await updateProfile({});
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  const initials = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Profile</h1>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-[13px] text-[#ff3b30] font-semibold hover:bg-[#ff3b30]/10 px-3 py-1.5 rounded-xl transition-colors">
            <RiLogoutBoxLine /> Logout
          </button>
        </div>

        <div className="p-4 md:p-6 max-w-[600px] mx-auto">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {user.profileImage ? (
                <img
                  // src={ user.profileImage ? `${user.profileImage}?v=${Date.now()}` : '' }
                  src={user.profileImage}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#2e2e2e]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#ff6b00]/15 flex items-center justify-center text-[#ff6b00] font-extrabold text-[36px] border-2 border-[#2e2e2e]">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#ff6b00] flex items-center justify-center text-white text-[14px] shadow-lg">
                {uploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiCameraLine />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} />
            </div>
            <p className="mt-3 font-bold text-[20px] text-[#f0f0f0]">{user.name}</p>
            <span className={`${S.badgeOrange} mt-1 capitalize`}>{user.role}</span>
          </div>

          {/* Profile details */}
          <div className={S.cardPaddedLg}>
            <div className={S.flexBetween + ' mb-5'}>
              <h2 className={S.h3}>Account details</h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} className={S.btnGhost + ' text-[13px]'}>
                  <RiEditLine /> Edit
                </button>
              ) : (
                <button onClick={() => { setEditing(false); setName(user.name); setPhone(user.phone); }}
                  className="text-[13px] text-[#888888] hover:text-[#f0f0f0]">
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={S.label}>Full Name</label>
                {editing ? (
                  <div className={S.inputWrap + ' mt-1.5'}>
                    <RiUserLine className={S.inputIcon} />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={25}
                      className={S.inputWithIcon}
                    />
                  </div>
                ) : (
                  <p className="text-[15px] text-[#f0f0f0] mt-1">{user.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className={S.label}>Phone</label>
                {editing ? (
                  <div className={S.inputWrap + ' mt-1.5'}>
                    <RiPhoneLine className={S.inputIcon} />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      type="tel"
                      className={S.inputWithIcon}
                    />
                  </div>
                ) : (
                  <p className="text-[15px] text-[#f0f0f0] mt-1">{user.phone}</p>
                )}
              </div>

              {/* Email — read-only */}
              <div>
                <label className={S.label}>Email</label>
                <p className="text-[15px] text-[#888888] mt-1">{user.email}</p>
                <p className={S.fieldHint}>Email cannot be changed</p>
              </div>

              {/* Partner-specific details */}
              {user.role === 'partner' && user.partnerDetails && (
                <>
                  <div className={S.divider} />
                  <p className={S.label}>Vehicle details</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className={S.hintText}>Vehicle type</label>
                      <p className="text-[14px] text-[#f0f0f0] capitalize mt-0.5">
                        {user.partnerDetails.vehicleType}
                      </p>
                    </div>
                    <div>
                      <label className={S.hintText}>Vehicle number</label>
                      <p className="text-[14px] text-[#f0f0f0] mt-0.5">
                        {user.partnerDetails.vehicleNumber}
                      </p>
                    </div>
                    <div>
                      <label className={S.hintText}>Total deliveries</label>
                      <p className="text-[14px] text-[#f0f0f0] mt-0.5">
                        {user.partnerDetails.completedDeliveries || 0}
                      </p>
                    </div>
                    <div>
                      <label className={S.hintText}>Total earnings</label>
                      <p className="text-[14px] text-[#ff6b00] font-semibold mt-0.5">
                        ₹{user.partnerDetails.totalEarnings || 0}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {editing && (
              <button onClick={handleSave} disabled={saving}
                className={`${S.btnPrimaryLg} mt-6`}>
                {saving ? <span className={S.spinner} /> : <><RiCheckLine /> Save changes</>}
              </button>
            )}
          </div>

          {/* Danger zone */}
          <div className={`${S.cardPaddedLg} mt-4 border-[#ff3b30]/20`}>
            <h3 className="font-semibold text-[15px] text-[#f0f0f0] mb-3">Account</h3>
            <button onClick={handleLogout}
              className={`${S.btnDangerOutline} w-full`}>
              <RiLogoutBoxLine /> Log out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}