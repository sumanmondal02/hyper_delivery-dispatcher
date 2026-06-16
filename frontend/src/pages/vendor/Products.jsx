import { useEffect, useState, useRef } from 'react';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiImageAddLine,
  RiCloseLine, RiCheckLine, RiToggleLine, RiForbidLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner, SkeletonCard } from '../../components/Spinner';
import { ConfirmModal } from '../../components/Modal';
import * as S from '../../styles/common';

const EMPTY_FORM = {
  name: '', description: '', price: '', category: '', preparationTime: '15', isAvailable: true,
};

export default function VendorProducts() {
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [activeCategory, setCategory] = useState('All');
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendor/products');
      const prods = res.data.products || [];
      setProducts(prods);
      const cats = ['All', ...new Set(prods.map((p) => p.category).filter(Boolean))];
      setCategories(cats);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name:            product.name,
      description:     product.description || '',
      price:           String(product.price),
      category:        product.category || '',
      preparationTime: String(product.preparationTime || 15),
      isAvailable:     product.isAvailable,
    });
    setImageFile(null);
    setImagePreview(product.image || null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png'].includes(file.type)) { toast.error('Only JPG/PNG allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim())  { toast.error('Product name required'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 1) {
      toast.error('Enter valid price (min ₹1)'); return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',            form.name.trim());
      fd.append('description',     form.description.trim());
      fd.append('price',           form.price);
      fd.append('category',        form.category.trim() || 'General');
      fd.append('preparationTime', form.preparationTime || '15');
      if (!editingId) {
        // isAvailable only needed on update; defaults true on create
      } else {
        fd.append('isAvailable', String(form.isAvailable));
      }
      if (imageFile) fd.append('image', imageFile);

      let res;
      if (editingId) {
        res = await api.put(`/vendor/products/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updated = res.data.product;
        setProducts((prev) => prev.map((p) => p._id === editingId ? updated : p));
        toast.success('Product updated');
      } else {
        res = await api.post('/vendor/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts((prev) => [...prev, res.data.product]);
        toast.success('Product added');
      }
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      const fd = new FormData();
      fd.append('isAvailable', String(!product.isAvailable));
      const res = await api.put(`/vendor/products/${product._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProducts((prev) => prev.map((p) => p._id === product._id ? res.data.product : p));
      toast.success(res.data.product.isAvailable ? 'Marked available' : 'Marked unavailable');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/vendor/products/${deleteTarget}`);
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget));
      toast.success('Product deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const displayed = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Products</h1>
          <button onClick={openAdd} className={S.btnPrimary + ' text-[13px]'}>
            <RiAddLine /> Add item
          </button>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className={S.chipRow + ' px-4 py-3 border-b border-[#2e2e2e]'}>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={activeCategory === c ? S.chipActive : S.chip}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 md:p-6 max-w-[900px] mx-auto">
          {/* Add/Edit Form */}
          {showForm && (
            <div className={`${S.cardPaddedLg} mb-5`}>
              <div className={S.flexBetween + ' mb-5'}>
                <h2 className={S.h3}>{editingId ? 'Edit product' : 'Add product'}</h2>
                <button onClick={closeForm} className={S.btnIcon}><RiCloseLine /></button>
              </div>

              {/* Image upload */}
              <div className="flex items-center gap-4 mb-5">
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
                <div className="flex-1">
                  <p className="text-[13px] text-[#888888] mb-1">Product photo (optional)</p>
                  <button onClick={() => fileRef.current?.click()}
                    className={`${S.btnSecondary} text-[13px]`}>
                    <RiImageAddLine /> {imagePreview ? 'Change photo' : 'Upload photo'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden"
                    onChange={handleImageChange} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className={S.formGroup}>
                  <label className={S.label}>Name *</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Product name" maxLength={50} className={S.input} />
                </div>
                <div className={S.formGroup}>
                  <label className={S.label}>Category</label>
                  <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. Burgers, Beverages" className={S.input} />
                </div>
                <div className={S.formGroup}>
                  <label className={S.label}>Price (₹) *</label>
                  <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    type="number" min="1" placeholder="0" className={S.input} />
                </div>
                <div className={S.formGroup}>
                  <label className={S.label}>Prep time (min)</label>
                  <input value={form.preparationTime} onChange={(e) => setForm((p) => ({ ...p, preparationTime: e.target.value }))}
                    type="number" min="1" placeholder="15" className={S.input} />
                </div>
              </div>

              <div className={S.formGroup}>
                <label className={S.label}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short description (optional)" rows={2} maxLength={200} className={S.textarea} />
                <p className={S.fieldHint}>{form.description.length}/200</p>
              </div>

              {editingId && (
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
                    className={`${S.toggleTrack} ${form.isAvailable ? S.toggleTrackOn : S.toggleTrackOff} w-12 h-6 rounded-full relative`}>
                    <span className={`${S.toggleThumb} ${form.isAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-[14px] text-[#f0f0f0]">
                    {form.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={closeForm} className={`${S.btnSecondary} flex-1`}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className={`${S.btnPrimary} flex-1`}>
                  {saving ? <span className={S.spinner} /> : <><RiCheckLine /> {editingId ? 'Save changes' : 'Add product'}</>}
                </button>
              </div>
            </div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : displayed.length === 0 ? (
            <div className={S.emptyState} style={{ marginTop: '60px' }}>
              <p className={S.emptyTitle}>No products yet</p>
              <p className={S.emptySubtitle}>Add your first menu item to start receiving orders</p>
              <button onClick={openAdd} className={`${S.btnPrimary} mt-4`}><RiAddLine /> Add first item</button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map((product) => (
                <div key={product._id}
                  className={`${S.cardPadded} flex items-center gap-4 ${!product.isAvailable ? 'opacity-60' : ''}`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#2a2a2a] flex items-center justify-center text-[#555555] text-[24px] flex-shrink-0">No Image</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={S.flexBetween}>
                      <p className="font-semibold text-[15px] text-[#f0f0f0] truncate">{product.name}</p>
                      <p className="font-bold text-[15px] text-[#ff6b00] ml-2 flex-shrink-0">₹{product.price}</p>
                    </div>
                    {product.description && (
                      <p className="text-[12px] text-[#888888] mt-0.5 truncate">{product.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {product.category && (
                        <span className={S.badgeGray + ' text-[11px]'}>{product.category}</span>
                      )}
                      <span className="text-[11px] text-[#555555]">{product.preparationTime} min</span>
                      <span className={product.isAvailable ? S.badgeGreen + ' text-[11px]' : S.badgeRed + ' text-[11px]'}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => openEdit(product)} className={S.btnIconSm} title="Edit">
                      <RiEditLine />
                    </button>
                    <button onClick={() => handleToggleAvailability(product)} className={S.btnIconSm}
                      title={product.isAvailable ? 'Mark unavailable' : 'Mark available'}>
                      {product.isAvailable ? <RiForbidLine /> : <RiToggleLine />}
                    </button>
                    <button onClick={() => setDeleteTarget(product._id)}
                      className={`${S.btnIconSm} hover:text-[#ff3b30]`} title="Delete">
                      <RiDeleteBinLine />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete product?"
          message="This product will be permanently removed from your menu."
          danger
          loading={deleting}
        />
      </main>
    </div>
  );
}