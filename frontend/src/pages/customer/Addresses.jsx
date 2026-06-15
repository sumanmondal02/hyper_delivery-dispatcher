import { useEffect, useState } from 'react';
import { RiMapPinLine, RiAddLine, RiEditLine, RiDeleteBinLine, RiCloseLine, RiCheckLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import { ConfirmModal } from '../../components/Modal';
import * as S from '../../styles/common';

const LABELS = ['Home', 'Office', 'Other'];
const EMPTY_FORM = { fullAddress: '', landmark: '', city: '', pincode: '', label: 'Home' };

export default function Addresses() {
  const [addresses, setAddresses]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [coords, setCoords]             = useState(null);
  const [gettingLoc, setGettingLoc]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/address');
      setAddresses(res.data.addresses || []);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCoords(null);
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      fullAddress: addr.fullAddress,
      landmark:    addr.landmark || '',
      city:        addr.city     || '',
      pincode:     addr.pincode  || '',
      label:       addr.label    || 'Home',
    });
    // Keep existing coords; user can re-capture if they want
    setCoords(addr.location?.coordinates || null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCoords(null);
  };

  const captureLocation = () => {
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords([c.longitude, c.latitude]);
        setGettingLoc(false);
        toast.success('Location captured');
      },
      () => {
        toast.error('Location access denied');
        setGettingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!form.fullAddress.trim()) { toast.error('Full address is required'); return; }
    if (!editingId && !coords)    { toast.error('Capture your location'); return; }

    setSaving(true);
    try {
      if (editingId) {
        // PUT — only send what's changed; coords optional on edit
        const body = {
          fullAddress: form.fullAddress,
          landmark:    form.landmark,
          city:        form.city,
          pincode:     form.pincode,
          label:       form.label,
        };
        if (coords) body.location = { coordinates: coords };

        const res = await api.put(`/address/${editingId}`, body);
        setAddresses((prev) => prev.map((a) => a._id === editingId ? res.data.address : a));
        toast.success('Address updated');
      } else {
        // POST — coords required
        const res = await api.post('/address', {
          ...form,
          location: { coordinates: coords },
        });
        setAddresses((prev) => [res.data.address, ...prev]);
        toast.success('Address added');
      }
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/address/${deleteTarget}`);
      setAddresses((prev) => prev.filter((a) => a._id !== deleteTarget));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Saved Addresses</h1>
          {addresses.length < 5 && (
            <button onClick={openAdd} className={S.btnPrimary + ' text-[13px]'}>
              <RiAddLine /> Add address
            </button>
          )}
        </div>

        <div className="p-4 md:p-6 max-w-[700px] mx-auto">
          {/* Add / edit form */}
          {showForm && (
            <div className={`${S.cardPaddedLg} mb-5`}>
              <div className={S.flexBetween + ' mb-4'}>
                <h2 className={S.h3}>{editingId ? 'Edit address' : 'New address'}</h2>
                <button onClick={closeForm} className={S.btnIcon}><RiCloseLine /></button>
              </div>

              {/* Label selector */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {LABELS.map((l) => (
                  <button key={l} onClick={() => setForm((p) => ({ ...p, label: l }))}
                    className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                      form.label === l
                        ? 'border-[#ff6b00] bg-[#ff6b00]/10 text-[#ff6b00]'
                        : 'border-[#2e2e2e] text-[#888888] hover:border-[#444444]'
                    }`}>{l}</button>
                ))}
              </div>

              <div className={S.formGroup}>
                <label className={S.label}>Full Address *</label>
                <textarea
                  rows={2}
                  placeholder="House/flat no, street, area..."
                  value={form.fullAddress}
                  onChange={(e) => setForm((p) => ({ ...p, fullAddress: e.target.value }))}
                  className={S.textarea}
                />
              </div>

              <div className={S.formGroup}>
                <label className={S.label}>Landmark</label>
                <input
                  placeholder="Near school, beside park..."
                  value={form.landmark}
                  onChange={(e) => setForm((p) => ({ ...p, landmark: e.target.value }))}
                  className={S.input}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={S.formGroup}>
                  <label className={S.label}>City</label>
                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    className={S.input}
                  />
                </div>
                <div className={S.formGroup}>
                  <label className={S.label}>Pincode</label>
                  <input
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                    className={S.input}
                  />
                </div>
              </div>

              {/* Location */}
              <button onClick={captureLocation} disabled={gettingLoc}
                className={`${S.btnSecondary} w-full mb-4 text-[14px]`}>
                {gettingLoc ? <span className={S.spinner} /> : <RiMapPinLine />}
                {coords
                  ? <span className="flex items-center gap-1 text-[#00c853]"><RiCheckLine /> Location set</span>
                  : editingId ? 'Re-capture location (optional)' : 'Use my current location *'
                }
              </button>

              <div className="flex gap-3">
                <button onClick={closeForm} className={`${S.btnSecondary} flex-1`}>Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className={`${S.btnPrimary} flex-1`}>
                  {saving ? <span className={S.spinner} /> : editingId ? 'Save changes' : 'Add address'}
                </button>
              </div>
            </div>
          )}

          {/* Address list */}
          {loading ? (
            <Spinner large />
          ) : addresses.length === 0 && !showForm ? (
            <div className={S.emptyState} style={{ marginTop: '60px' }}>
              <RiMapPinLine className={S.emptyIcon} />
              <p className={S.emptyTitle}>No saved addresses</p>
              <p className={S.emptySubtitle}>Add your home, office, or any address you order to frequently</p>
              <button onClick={openAdd} className={`${S.btnPrimary} mt-4`}>
                <RiAddLine /> Add first address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr._id} className={S.addressCard}>
                  <div className={S.flexBetween + ' mb-2'}>
                    <span className={S.addressLabel}>{addr.label || 'Home'}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(addr)} className={S.btnIconSm} title="Edit">
                        <RiEditLine />
                      </button>
                      <button onClick={() => setDeleteTarget(addr._id)}
                        className={`${S.btnIconSm} hover:text-[#ff3b30]`} title="Delete">
                        <RiDeleteBinLine />
                      </button>
                    </div>
                  </div>
                  <p className={S.addressText}>{addr.fullAddress}</p>
                  {addr.landmark && (
                    <p className={S.addressMeta}>Near: {addr.landmark}</p>
                  )}
                  {(addr.city || addr.pincode) && (
                    <p className={S.addressMeta}>{[addr.city, addr.pincode].filter(Boolean).join(' – ')}</p>
                  )}
                </div>
              ))}

              {addresses.length === 5 && (
                <p className="text-[12px] text-[#888888] text-center py-2">
                  Maximum 5 addresses reached. Delete one to add another.
                </p>
              )}
            </div>
          )}
        </div>

        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete address?"
          message="This address will be permanently removed."
          danger
          loading={deleting}
        />
      </main>
    </div>
  );
}