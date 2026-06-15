import { useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiDeleteBinLine, RiAddLine, RiSubtractLine, RiStoreLine } from 'react-icons/ri';
import Navbar from '../../components/Navbar';
import useCartStore from '../../store/useCartStore';
import * as S from '../../styles/common';

export default function Cart() {
  const navigate = useNavigate();
  const { items, vendor, updateQty, removeItem, clearCart, itemsTotal, deliveryFee, totalAmount, distanceKm } = useCartStore();

  if (items.length === 0) return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}>
          <button onClick={() => navigate(-1)} className={S.backBtn}><RiArrowLeftLine /></button>
          <h1 className={S.topBarTitle}>Cart</h1>
        </div>
        <div className={S.emptyState} style={{ marginTop: '80px' }}>
          <div className={S.emptyIcon}>🛒</div>
          <p className={S.emptyTitle}>Your cart is empty</p>
          <p className={S.emptySubtitle}>Browse nearby stores and add items to get started</p>
          <button onClick={() => navigate('/home')} className={`${S.btnPrimary} mt-4`}>Browse stores</button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-32 md:pb-0">
        <div className={S.topBar}>
          <button onClick={() => navigate(-1)} className={S.backBtn}><RiArrowLeftLine /></button>
          <h1 className={S.topBarTitle}>Cart</h1>
          <button onClick={clearCart} className="text-[#ff3b30] text-[13px] font-semibold hover:underline">Clear</button>
        </div>

        <div className="p-4 md:p-6 max-w-[900px] mx-auto">
          <div className="md:grid md:grid-cols-[1fr_360px] md:gap-6">
            {/* Items */}
            <div>
              {/* Vendor */}
              {vendor && (
                <div className={`${S.cardPadded} flex items-center gap-3 mb-4`}>
                  <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 flex items-center justify-center text-[#ff6b00] text-[20px]">
                    <RiStoreLine />
                  </div>
                  <div>
                    <p className="font-semibold text-[15px] text-[#f0f0f0]">{vendor.businessName}</p>
                    <p className="text-[12px] text-[#888888] capitalize">{vendor.category}</p>
                  </div>
                  <button onClick={() => navigate(`/vendor/${vendor._id}`)}
                    className="ml-auto text-[13px] text-[#ff6b00] font-semibold hover:underline">Add more</button>
                </div>
              )}

              <div className={S.cardPadded}>
                {items.map((item) => (
                  <div key={item.productId} className={S.cartItem}>
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                    <div className={S.cartItemName}>
                      <p className="font-medium text-[14px] text-[#f0f0f0]">{item.name}</p>
                      <p className="text-[13px] text-[#888888]">₹{item.price} each</p>
                    </div>
                    <div className={S.qtyControl}>
                      <button onClick={() => item.quantity === 1 ? removeItem(item.productId) : updateQty(item.productId, item.quantity - 1)}
                        className={S.qtyBtn}><RiSubtractLine /></button>
                      <span className={S.qtyValue}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className={S.qtyBtn}><RiAddLine /></button>
                    </div>
                    <p className={S.cartItemPrice}>₹{item.price * item.quantity}</p>
                    <button onClick={() => removeItem(item.productId)}
                      className="text-[#555555] hover:text-[#ff3b30] transition-colors ml-1">
                      <RiDeleteBinLine />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className={S.cartSummary}>
                <h3 className={S.cardTitle}>Order Summary</h3>
                <div className="mt-4">
                  <div className={S.cartSummaryRow}>
                    <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span>₹{itemsTotal}</span>
                  </div>
                  <div className={S.cartSummaryRow}>
                    <span>Delivery fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  {distanceKm > 0 && (
                    <div className={S.cartSummaryRow}>
                      <span>Distance</span>
                      <span>{distanceKm.toFixed(1)} km</span>
                    </div>
                  )}
                  <div className={S.cartSummaryDiv} />
                  <div className={S.cartSummaryTotal}>
                    <span>Total</span>
                    <span className="text-[#ff6b00]">₹{totalAmount}</span>
                  </div>
                  <div className="mt-2 p-3 rounded-xl bg-[#2a2a2a] text-[12px] text-[#888888]">
                    💳 Cash on Delivery
                  </div>
                </div>
                <button onClick={() => navigate('/checkout')} className={`${S.btnPrimaryLg} mt-4`}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}