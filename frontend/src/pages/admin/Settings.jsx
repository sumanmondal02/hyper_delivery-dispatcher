import { useEffect, useState } from 'react';
import { RiSettings4Line, RiCheckLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import * as S from '../../styles/common';

export default function AdminSettings() {
  const [form, setForm]     = useState({ baseFare: '', perKmRate: '', commissionRate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]  = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => {
        const s = r.data.settings || {};
        setForm({
          baseFare:       String(s.baseFare       ?? 20),
          perKmRate:      String(s.perKmRate      ?? 10),
          commissionRate: String(s.commissionRate ?? 0.20),
        });
      })
      .catch(() => {
        // defaults if endpoint not implemented yet
        setForm({ baseFare: '20', perKmRate: '10', commissionRate: '0.20' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const baseFare       = parseFloat(form.baseFare);
    const perKmRate      = parseFloat(form.perKmRate);
    const commissionRate = parseFloat(form.commissionRate);

    if (isNaN(baseFare) || baseFare < 0)       { toast.error('Invalid base fare'); return; }
    if (isNaN(perKmRate) || perKmRate < 0)      { toast.error('Invalid per km rate'); return; }
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      toast.error('Commission must be between 0 and 1 (e.g. 0.20 = 20%)'); return;
    }

    setSaving(true);
    try {
      await api.put('/admin/settings', { baseFare, perKmRate, commissionRate });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
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
          <h1 className={S.topBarTitle}>Platform Settings</h1>
        </div>

        <div className="p-4 md:p-6 max-w-[560px] mx-auto">
          <div className={S.cardPaddedLg}>
            <h2 className={`${S.h3} mb-1 flex items-center gap-2`}>
              <RiSettings4Line className="text-[#ff6b00]" /> Pricing Config
            </h2>
            <p className="text-[13px] text-[#888888] mb-6">
              Changes apply to all new orders. Existing orders are unaffected.
            </p>

            <div className={S.formGroup}>
              <label className={S.label}>Base Fare (₹)</label>
              <input
                type="number" min="0" step="1"
                value={form.baseFare}
                onChange={(e) => setForm((p) => ({ ...p, baseFare: e.target.value }))}
                className={S.input}
              />
              <p className={S.fieldHint}>Flat fee added to every order regardless of distance</p>
            </div>

            <div className={S.formGroup}>
              <label className={S.label}>Per KM Rate (₹)</label>
              <input
                type="number" min="0" step="0.5"
                value={form.perKmRate}
                onChange={(e) => setForm((p) => ({ ...p, perKmRate: e.target.value }))}
                className={S.input}
              />
              <p className={S.fieldHint}>Rupees charged per kilometre of delivery distance</p>
            </div>

            <div className={S.formGroup}>
              <label className={S.label}>Platform Commission (0–1)</label>
              <input
                type="number" min="0" max="1" step="0.01"
                value={form.commissionRate}
                onChange={(e) => setForm((p) => ({ ...p, commissionRate: e.target.value }))}
                className={S.input}
              />
              <p className={S.fieldHint}>e.g. 0.20 = 20% platform fee, partner keeps 80%</p>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-[#2a2a2a] mb-5">
              <p className="text-[12px] text-[#888888] uppercase tracking-wide mb-2">Preview</p>
              {[1, 3, 5, 10].map((km) => {
                const fee = Math.round(
                  Math.max(20, Math.min(200,
                    parseFloat(form.baseFare || 20) + km * parseFloat(form.perKmRate || 10)
                  ))
                );
                const partnerEarnings = Math.round(fee * (1 - parseFloat(form.commissionRate || 0.20)));
                return (
                  <div key={km} className={S.flexBetween + ' py-1'}>
                    <span className="text-[13px] text-[#888888]">{km} km</span>
                    <span className="text-[13px] text-[#f0f0f0]">
                      Fee: <strong>₹{fee}</strong> · Partner: <strong className="text-[#00c853]">₹{partnerEarnings}</strong>
                    </span>
                  </div>
                );
              })}
            </div>

            <button onClick={handleSave} disabled={saving} className={S.btnPrimaryLg}>
              {saving ? <span className={S.spinner} /> : <><RiCheckLine /> Save settings</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}