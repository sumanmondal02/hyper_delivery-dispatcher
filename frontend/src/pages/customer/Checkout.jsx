import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiMapPinLine, RiAddLine, RiCheckLine, RiTimeLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import useCartStore from '../../store/useCartStore';
import useOrderStore from '../../store/useOrderStore';
import useAuthStore from '../../store/useAuthStore';
import * as S from '../../styles/common';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, vendor, clearCart, setDistance } = useCartStore();

  // Use selectors for computed values (Zustand v5 compatible)
  const itemsTotal  = useCartStore((s) => s.getItemsTotal());
  const deliveryFee = useCartStore((s) => s.getDeliveryFee());
  const totalAmount = useCartStore((s) => s.getTotalAmount());

  const { placeOrder } = useOrderStore();

  const [addresses, setAddresses]         = useState([]);
  const [selectedAddr, setSelectedAddr]   = useState(null);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [instructions, setInstructions]   = useState('');
  const [placing, setPlacing]             = useState(false);
  const [loadingAddr, setLoadingAddr]     = useState(true);

  // New address form state
  const [newAddr, setNewAddr]   = useState({ fullAddress: '', landmark: '', city: '', pincode: '', label: 'Home' });
  const [addingAddr, setAddingAddr] = useState(false);
  const [gettingLoc, setGettingLoc] = useState(false);
  const [newCoords, setNewCoords]   = useState(null);

  useEffect(() => {
    if (!items.length) { navigate('/cart'); return; }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/address');
      const addrs = res.data.addresses || [];
      setAddresses(addrs);
      if (addrs.length > 0) setSelectedAddr(addrs[0]._id);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoadingAddr(false);
    }
  };

  const getCurrentLocation = () => {
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNewCoords([coords.longitude, coords.latitude]);
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

  const handleAddAddress = async () => {
    if (!newAddr.fullAddress.trim()) { toast.error('Enter your full address'); return; }
    if (!newCoords) { toast.error('Capture your location first'); return; }
    if (addresses.length >= 5) { toast.error('Maximum 5 addresses allowed'); return; }

    setAddingAddr(true);
    try {
      const res = await api.post('/address', {
        fullAddress: newAddr.fullAddress,
        landmark:    newAddr.landmark,
        city:        newAddr.city,
        pincode:     newAddr.pincode,
        label:       newAddr.label,
        location: { coordinates: newCoords },
      });
      const added = res.data.address;
      setAddresses((prev) => [added, ...prev]);
      setSelectedAddr(added._id);
      setShowAddForm(false);
      setNewAddr({ fullAddress: '', landmark: '', city: '', pincode: '', label: 'Home' });
      setNewCoords(null);
      toast.success('Address added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally {
      setAddingAddr(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) { toast.error('Select a delivery address'); return; }
    if (!items.length)  { navigate('/cart'); return; }

    setPlacing(true);
    try {
      const payload = {
        vendorId:           vendor._id,
        items:              items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddressId:  selectedAddr,
        specialInstructions: instructions.trim(),
      };

      const res = await placeOrder(payload);
      if (res.success) {
        clearCart();
        toast.success(`Order placed! ID: ${res.order.orderId}`);
        // Update distance in cart store for future reference
        if (res.order.distance) setDistance(res.order.distance);
        navigate(`/track/${res.order.orderId}`);
      } else {
        toast.error(res.error || 'Failed to place order');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setPlacing(false);
    }
  };

  if (!items.length) return null;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-32 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <button onClick={() => navigate('/cart')} className={S.backBtn}><RiArrowLeftLine /></button>
          <h1 className={S.topBarTitle}>Checkout</h1>
        </div>

        <div className="p-4 md:p-6 max-w-[900px] mx-auto">
          <div className="md:grid md:grid-cols-[1fr_360px] md:gap-6">

            {/* Left column */}
            <div className="space-y-4">

              {/* Delivery address */}
              <div className={S.cardPaddedLg}>
                <div className={S.flexBetween + ' mb-4'}>
                  <h2 className={S.h3}>Delivery address</h2>
                  {addresses.length < 5 && (
                    <button onClick={() => setShowAddForm(!showAddForm)}
                      className={S.btnGhost + ' text-[13px]'}>
                      <RiAddLine /> Add new
                    </button>
                  )}
                </div>

                {loadingAddr ? (
                  <Spinner />
                ) : (
                  <>
                    {/* Add address form */}
                    {showAddForm && (
                      <div className="mb-4 p-4 rounded-xl border border-[#2e2e2e] bg-[#2a2a2a]/40 space-y-3">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {['Home', 'Office', 'Other'].map((l) => (
                            <button key={l} onClick={() => setNewAddr((p) => ({ ...p, label: l }))}
                              className={`py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                                newAddr.label === l
                                  ? 'border-[#ff6b00] bg-[#ff6b00]/10 text-[#ff6b00]'
                                  : 'border-[#2e2e2e] text-[#888888]'
                              }`}>{l}</button>
                          ))}
                        </div>
                        <input
                          placeholder="Full address *"
                          value={newAddr.fullAddress}
                          onChange={(e) => setNewAddr((p) => ({ ...p, fullAddress: e.target.value }))}
                          className={S.input}
                        />
                        <input
                          placeholder="Landmark (optional)"
                          value={newAddr.landmark}
                          onChange={(e) => setNewAddr((p) => ({ ...p, landmark: e.target.value }))}
                          className={S.input}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            placeholder="City"
                            value={newAddr.city}
                            onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
                            className={S.input}
                          />
                          <input
                            placeholder="Pincode"
                            maxLength={6}
                            value={newAddr.pincode}
                            onChange={(e) => setNewAddr((p) => ({ ...p, pincode: e.target.value }))}
                            className={S.input}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={getCurrentLocation} disabled={gettingLoc}
                            className={`${S.btnSecondary} flex-1 text-[13px]`}>
                            {gettingLoc ? <span className={S.spinner} /> : <RiMapPinLine />}
                            {newCoords ? 'Location captured ✓' : 'Use my location'}
                          </button>
                          <button onClick={handleAddAddress} disabled={addingAddr || !newCoords}
                            className={`${S.btnPrimary} flex-1 text-[13px]`}>
                            {addingAddr ? <span className={S.spinner} /> : 'Save address'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Address list */}
                    {addresses.length === 0 && !showAddForm ? (
                      <div className={S.emptyState} style={{ paddingTop: '24px', paddingBottom: '24px' }}>
                        <RiMapPinLine className="text-[32px] text-[#2a2a2a] mb-2" />
                        <p className={S.emptyTitle} style={{ fontSize: '16px' }}>No saved addresses</p>
                        <p className={S.emptySubtitle} style={{ fontSize: '13px' }}>Add one above to continue</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((addr) => (
                          <div key={addr._id}
                            onClick={() => setSelectedAddr(addr._id)}
                            className={selectedAddr === addr._id ? S.addressCardSel : S.addressCard}>
                            <div className={S.flexBetween}>
                              <span className={S.addressLabel}>{addr.label || 'Home'}</span>
                              {selectedAddr === addr._id && (
                                <span className="w-5 h-5 rounded-full bg-[#ff6b00] flex items-center justify-center">
                                  <RiCheckLine className="text-white text-[12px]" />
                                </span>
                              )}
                            </div>
                            <p className={S.addressText}>{addr.fullAddress}</p>
                            {addr.landmark && <p className={S.addressMeta}>Near: {addr.landmark}</p>}
                            {(addr.city || addr.pincode) && (
                              <p className={S.addressMeta}>{[addr.city, addr.pincode].filter(Boolean).join(' – ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Special instructions */}
              <div className={S.cardPaddedLg}>
                <h2 className={S.h3 + ' mb-3'}>Special instructions</h2>
                <textarea
                  placeholder="Any notes for the vendor? (optional, max 100 chars)"
                  maxLength={100}
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className={S.textarea}
                />
                <p className={S.fieldHint}>{instructions.length}/100</p>
              </div>

              {/* Order items summary */}
              <div className={S.cardPaddedLg}>
                <h2 className={S.h3 + ' mb-3'}>Order from {vendor?.businessName}</h2>
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between py-2 border-b border-[#2e2e2e] last:border-0">
                    <span className="text-[14px] text-[#f0f0f0]">{item.name} × {item.quantity}</span>
                    <span className="text-[14px] font-semibold text-[#f0f0f0]">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — price summary */}
            <div>
              <div className={S.cartSummary}>
                <h3 className={S.cardTitle}>Bill details</h3>
                <div className="mt-4 space-y-0">
                  <div className={S.priceRow}>
                    <span className={S.priceRowLabel}>Items total</span>
                    <span className={S.priceRowValue}>₹{itemsTotal}</span>
                  </div>
                  <div className={S.priceRow}>
                    <span className={S.priceRowLabel}>Delivery fee</span>
                    <span className={S.priceRowValue}>₹{deliveryFee}</span>
                  </div>
                  <div className={S.priceTotalRow}>
                    <span className={S.priceTotalLabel}>Total</span>
                    <span className={S.priceTotalValue}>₹{totalAmount}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-[#2a2a2a] flex items-center gap-2 text-[13px] text-[#888888]">
                  <span className="text-[16px]">💳</span>
                  <span>Cash on Delivery</span>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-[#2a2a2a] flex items-center gap-2 text-[13px] text-[#888888]">
                  <RiTimeLine className="text-[#ff6b00] flex-shrink-0" />
                  <span>Estimated delivery in 30–45 min</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || !selectedAddr || loadingAddr}
                  className={`${S.btnPrimaryLg} mt-4`}>
                  {placing ? <span className={S.spinner} /> : `Place order · ₹${totalAmount}`}
                </button>

                {!selectedAddr && !loadingAddr && (
                  <p className="text-[12px] text-[#ff3b30] text-center mt-2">Add a delivery address to continue</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}