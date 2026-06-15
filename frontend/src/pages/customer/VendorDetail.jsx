import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiTimeLine, RiMapPinLine, RiShoppingCartLine, RiAddLine, RiSubtractLine } from 'react-icons/ri';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import useCartStore from '../../store/useCartStore';
import toast from 'react-hot-toast';
import * as S from '../../styles/common';

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  const { items, addItem, updateQty, removeItem, vendor: cartVendor } = useCartStore();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [vRes, pRes] = await Promise.all([
          api.get(`/vendors/${id}`),
          api.get(`/vendors/${id}/menu`)
        ]);
        setVendor(vRes.data.vendor);
        const prods = pRes.data.products || [];
        setProducts(prods);
        const cats = ['All', ...new Set(prods.map((p) => p.category).filter(Boolean))];
        setCategories(cats);
      } catch {
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const filtered = activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory);
  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const getQty = (productId) => items.find((i) => i.productId === productId)?.quantity || 0;

  const handleAdd = (product) => {
    if (cartVendor && cartVendor._id !== id) {
      toast((t) => (
        <div>
          <p className="font-semibold mb-2">Replace cart?</p>
          <p className="text-sm text-[#888888] mb-3">Your cart has items from another store.</p>
          <div className="flex gap-2">
            <button onClick={() => { addItem(product, vendor); toast.dismiss(t.id); }}
              className={S.btnPrimary} style={{ fontSize: '13px', padding: '6px 14px' }}>Replace</button>
            <button onClick={() => toast.dismiss(t.id)}
              className={S.btnSecondary} style={{ fontSize: '13px', padding: '6px 14px' }}>Keep</button>
          </div>
        </div>
      ), { duration: 6000 });
      return;
    }
    addItem(product, vendor);
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center"><Spinner large /></main>
    </div>
  );

  if (!vendor) return null;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-32 md:pb-0">
        {/* Header image */}
        <div className="relative h-[200px] md:h-[260px] bg-[#1a1a1a] overflow-hidden">
          {vendor.image
            ? <img src={vendor.image} alt={vendor.businessName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[#2a2a2a] text-[80px]">🏪</div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
          <button onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#0f0f0f]/70 backdrop-blur-sm flex items-center justify-center text-[#f0f0f0] text-[20px]">
            <RiArrowLeftLine />
          </button>
        </div>

        <div className="p-4 md:p-6 max-w-[900px] mx-auto">
          {/* Vendor info */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <h1 className={S.h2}>{vendor.businessName}</h1>
              {vendor.description && <p className="text-[#888888] text-[14px] mt-1">{vendor.description}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="capitalize text-[13px] text-[#888888]">{vendor.category}</span>
                {vendor.location?.address && (
                  <span className="flex items-center gap-1 text-[13px] text-[#888888]">
                    <RiMapPinLine className="text-[#ff6b00]" /> {vendor.location.address}
                  </span>
                )}
                {vendor.openingTime && (
                  <span className="flex items-center gap-1 text-[13px] text-[#888888]">
                    <RiTimeLine /> {vendor.openingTime}–{vendor.closingTime}
                  </span>
                )}
              </div>
            </div>
            <span className={vendor.isOpen ? S.vendorCardOpen : S.vendorCardClosed} style={{ fontSize: '13px', padding: '4px 12px' }}>
              {vendor.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          {/* Category tabs */}
          {categories.length > 1 && (
            <div className={`${S.tabBar} mb-4`}>
              {categories.map((c) => (
                <button key={c} onClick={() => setActiveCategory(c)}
                  className={activeCategory === c ? S.tabActive : S.tab}>
                  {c}
                  {activeCategory === c && <span className={S.tabIndicator} />}
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          {filtered.length === 0 ? (
            <div className={S.emptyState}>
              <p className={S.emptyTitle}>No items in this category</p>
            </div>
          ) : (
            <div>
              {filtered.map((product) => {
                const qty = getQty(product._id);
                return (
                  <div key={product._id} className={S.productCard}>
                    <div className={S.productInfo}>
                      <p className={S.productName}>{product.name}</p>
                      {product.description && <p className={S.productDesc}>{product.description}</p>}
                      <p className={S.productPrice}>₹{product.price}</p>
                      {product.preparationTime && (
                        <p className="text-[12px] text-[#555555] mt-1 flex items-center gap-1">
                          <RiTimeLine /> {product.preparationTime} min prep
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {product.image
                        ? <img src={product.image} alt={product.name} className={S.productImg} />
                        : <div className={S.productImgEmpty}>🍽️</div>
                      }
                      {!product.isAvailable ? (
                        <span className="text-[12px] text-[#ff3b30] font-medium">Unavailable</span>
                      ) : qty === 0 ? (
                        <button onClick={() => handleAdd(product)} className={S.addToCartBtn}>+ Add</button>
                      ) : (
                        <div className={S.qtyControl}>
                          <button onClick={() => qty === 1 ? removeItem(product._id) : updateQty(product._id, qty - 1)}
                            className={S.qtyBtn}><RiSubtractLine /></button>
                          <span className={S.qtyValue}>{qty}</span>
                          <button onClick={() => handleAdd(product)} className={S.qtyBtn}><RiAddLine /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating cart bar */}
        {cartCount > 0 && cartVendor?._id === id && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 w-full max-w-[500px]">
            <button onClick={() => navigate('/cart')}
              className={`${S.btnPrimaryLg} shadow-2xl`} style={{ borderRadius: '16px' }}>
              <RiShoppingCartLine className="text-[18px]" />
              <span className="flex-1 text-left">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span>₹{cartTotal}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}