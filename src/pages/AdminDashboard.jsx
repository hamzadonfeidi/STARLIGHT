import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { mockProducts } from '../seed';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success'
    ? 'rgba(0, 200, 100, 0.12)' : type === 'error'
    ? 'rgba(255, 50, 50, 0.12)' : 'rgba(255, 255, 255, 0.08)';

  const border = type === 'success'
    ? '1px solid rgba(0, 200, 100, 0.3)' : type === 'error'
    ? '1px solid rgba(255, 50, 50, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)';

  const color = type === 'success'
    ? '#80e0a0' : type === 'error' ? '#ff9090' : '#fff';

  return (
    <div
      className="glass-pill font-condensed"
      style={{
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 100000, background: bg, border, color,
        padding: '14px 28px', borderRadius: '100px', fontSize: '12px',
        letterSpacing: '0.1em', whiteSpace: 'nowrap',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {message}
    </div>
  );
};

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 20000 }}>
    <div className="modal-card glass-pill" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '40px 32px', textAlign: 'center' }}>
      <span style={{ fontSize: '2.5rem', opacity: 0.6, display: 'block', marginBottom: '8px' }}>⚠</span>
      <p className="font-condensed" style={{ fontSize: '13px', letterSpacing: '0.05em', lineHeight: '1.7', margin: '0 0 28px', opacity: 0.85 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={onCancel} className="success-btn secondary-btn font-condensed" style={{ width: 'auto', padding: '10px 24px', fontSize: '11px', borderRadius: '100px' }}>
          CANCEL
        </button>
        <button onClick={onConfirm} className="success-btn primary-btn font-condensed" style={{ width: 'auto', padding: '10px 24px', fontSize: '11px', borderRadius: '100px', borderColor: 'rgba(255, 50, 50, 0.4)', color: '#ff9090' }}>
          CONFIRM DELETE
        </button>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading, isDemoMode } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [detailImageUrl, setDetailImageUrl] = useState('');
  const [hoverBg, setHoverBg] = useState('bg-item-1');
  const [selectedSizes, setSelectedSizes] = useState(['S', 'M', 'L', 'XL']);

  const availableSizes = ['S', 'M', 'L', 'XL'];
  const hoverBgOptions = [
    { label: 'Blue Gradient (Standard)', value: 'bg-item-1' },
    { label: 'Deep Lilac / Purple', value: 'bg-item-2' },
    { label: 'Neutral Frosted Glass', value: 'bg-default' }
  ];

  const showToast = (message, type = 'info') => setToast({ message, type, key: Date.now() });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!isFirebaseConfigured) {
        const localData = localStorage.getItem('starlight_products');
        const parsed = localData ? JSON.parse(localData) : mockProducts;
        setProducts(parsed);
        return;
      }

      const querySnapshot = await getDocs(collection(db, 'products'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(items);
    } catch (err) {
      console.error("Error fetching products: ", err);
      showToast('FAILED TO LOAD PRODUCTS. CHECK FIRESTORE CONNECTION.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProducts();
    }
  }, [authLoading, isAdmin, fetchProducts]);

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    setDetailImageUrl('');
    setHoverBg('bg-item-1');
    setSelectedSizes(['S', 'M', 'L', 'XL']);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name || '');
    setPrice(product.price ?? '');
    setDescription(product.description || '');
    setImageUrl(product.imageUrl || '');
    setDetailImageUrl(product.detailImageUrl || '');
    setHoverBg(product.hoverBg || 'bg-item-1');
    setSelectedSizes(product.sizes || ['S', 'M', 'L', 'XL']);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const numericPrice = Number(price);
    if (!price || isNaN(numericPrice) || numericPrice <= 0) {
      showToast('PLEASE ENTER A VALID PRICE.', 'error');
      return;
    }

    setSubmitting(true);

    const productPayload = {
      name,
      price: numericPrice,
      description,
      imageUrl,
      detailImageUrl,
      hoverBg,
      sizes: selectedSizes,
      updatedAt: new Date().toISOString()
    };

    try {
      if (!isFirebaseConfigured) {
        const localData = localStorage.getItem('starlight_products');
        let currentProducts = localData ? JSON.parse(localData) : [...mockProducts];

        if (editingProduct) {
          currentProducts = currentProducts.map(p => 
            p.id === editingProduct.id ? { ...p, ...productPayload } : p
          );
        } else {
          currentProducts.push({
            ...productPayload,
            id: `product-${Date.now()}`,
            createdAt: new Date().toISOString()
          });
        }
        
        localStorage.setItem('starlight_products', JSON.stringify(currentProducts));
        setIsModalOpen(false);
        showToast(editingProduct ? 'PRODUCT UPDATED SUCCESSFULLY.' : 'PRODUCT CREATED SUCCESSFULLY.', 'success');
        await fetchProducts();
        return;
      }

      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productPayload);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productPayload,
          createdAt: new Date().toISOString()
        });
      }

      setIsModalOpen(false);
      showToast(editingProduct ? 'PRODUCT UPDATED SUCCESSFULLY.' : 'PRODUCT CREATED SUCCESSFULLY.', 'success');
      await fetchProducts();
    } catch (err) {
      console.error("Error saving product: ", err);
      showToast('FAILED TO SAVE PRODUCT. ENSURE FIRESTORE RULES PERMIT MUTATIONS.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      if (!isFirebaseConfigured) {
        const localData = localStorage.getItem('starlight_products');
        let currentProducts = localData ? JSON.parse(localData) : [...mockProducts];
        currentProducts = currentProducts.filter(p => p.id !== deletingId);
        localStorage.setItem('starlight_products', JSON.stringify(currentProducts));
        setDeletingId(null);
        showToast('PRODUCT DELETED SUCCESSFULLY.', 'success');
        await fetchProducts();
        return;
      }

      await deleteDoc(doc(db, 'products', deletingId));
      setDeletingId(null);
      showToast('PRODUCT DELETED SUCCESSFULLY.', 'success');
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product: ", err);
      showToast('FAILED TO DELETE PRODUCT.', 'error');
      setDeletingId(null);
    }
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  if (!authLoading && !isAdmin) {
    return (
      <div className="checkout-page animate-fade-up" style={{ minHeight: '85vh', alignItems: 'center' }}>
        <div className="order-success-wrapper glass-pill" style={{ maxWidth: '550px', padding: '64px 32px', textAlign: 'center' }}>
          <span className="success-icon" style={{ fontSize: '3rem', color: '#ff9999' }}>✦</span>
          <h1 className="success-title font-display" style={{ fontSize: '2.5rem' }}>ACCESS DENIED</h1>
          <p className="success-subtitle font-condensed" style={{ fontSize: '12px', letterSpacing: '0.15em', marginTop: '12px' }}>
            THIS ROUTE IS STRICTLY RESTRICTED TO THE ADMINISTRATOR OF THE STARLIGHT EXPERIENCE.
          </p>
          <Link to="/" className="success-home-link font-display" style={{ marginTop: '24px' }}>
            RETURN TO SHOP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page animate-fade-up" style={{ minHeight: '90vh' }}>
      <div className="checkout-container checkout-container--admin">
        
        {/* Environment Alert Banner */}
        {isDemoMode && (
          <div className="glass-pill" style={{ 
            background: 'rgba(255, 165, 0, 0.08)', 
            border: '1px solid rgba(255, 165, 0, 0.2)', 
            padding: '16px 24px', 
            borderRadius: '12px',
            fontSize: '11px',
            lineHeight: '1.6',
            color: '#ffd080',
            letterSpacing: '0.08em',
            width: '100%',
            textAlign: 'center'
          }}>
            ⚠️ PREVIEW MODE: FIREBASE KEYS ARE NOT DETECTED. DATA PERSISTS IN BROWSER LOCALSTORAGE.
          </div>
        )}

        {/* Admin Header */}
        <div className="admin-header-row">
          <div>
            <Link to="/" className="pd-back font-condensed">← BACK TO STORE</Link>
            <h1 className="checkout-title font-display" style={{ margin: '8px 0 0 0' }}>ADMIN PORTAL</h1>
            <p className="checkout-subtitle font-condensed" style={{ margin: '4px 0 0 0', opacity: 0.5 }}>
              MANAGE PRODUCTS AND EDIT CATALOG IN REAL TIME
            </p>
          </div>
          <button onClick={handleOpenAddModal} className="checkout-submit font-display admin-add-btn" disabled={submitting}>
            ADD NEW PRODUCT +
          </button>
        </div>

        {loading ? (
          <div className="font-condensed" style={{ textAlign: 'center', padding: '64px', opacity: 0.5, letterSpacing: '0.2em' }}>
            LOADING PRODUCT CATALOG...
          </div>
        ) : products.length === 0 ? (
          <div className="glass-pill" style={{ textAlign: 'center', padding: '64px 32px', borderRadius: '16px', width: '100%' }}>
            <p className="font-condensed" style={{ opacity: 0.5, letterSpacing: '0.15em', margin: 0 }}>
              NO PRODUCTS DETECTED IN THE CATALOG.
            </p>
            <button onClick={handleOpenAddModal} className="success-btn primary-btn font-condensed" style={{ width: 'auto', padding: '12px 24px', marginTop: '20px' }}>
              CREATE INITIAL PRODUCT
            </button>
          </div>
        ) : (
          <div className="glass-pill admin-table-wrap" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <th className="font-condensed" style={{ padding: '16px 24px', fontSize: '11px', opacity: 0.4, letterSpacing: '0.2em' }}>PREVIEW</th>
                  <th className="font-condensed" style={{ padding: '16px 24px', fontSize: '11px', opacity: 0.4, letterSpacing: '0.2em' }}>NAME</th>
                  <th className="font-condensed" style={{ padding: '16px 24px', fontSize: '11px', opacity: 0.4, letterSpacing: '0.2em' }}>PRICE</th>
                  <th className="font-condensed" style={{ padding: '16px 24px', fontSize: '11px', opacity: 0.4, letterSpacing: '0.2em' }}>SIZES</th>
                  <th className="font-condensed" style={{ padding: '16px 24px', fontSize: '11px', opacity: 0.4, letterSpacing: '0.2em' }}>HOVER THEME</th>
                  <th className="font-condensed" style={{ padding: '16px 24px', fontSize: '11px', opacity: 0.4, letterSpacing: '0.2em', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="admin-table-row">
                    <td style={{ padding: '16px 24px' }}>
                      <img 
                        src={prod.imageUrl || "/striped_pants.png"} 
                        alt={prod.name} 
                        style={{ width: '50px', height: '60px', objectFit: 'contain', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </td>
                    <td className="font-display" style={{ padding: '16px 24px', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{prod.name?.toUpperCase()}</td>
                    <td className="font-condensed" style={{ padding: '16px 24px', fontSize: '14px' }}>{prod.price} TND</td>
                    <td className="font-condensed" style={{ padding: '16px 24px', fontSize: '12px', opacity: 0.8 }}>
                      {prod.sizes?.length ? prod.sizes.join(', ') : 'NONE'}
                    </td>
                    <td className="font-condensed" style={{ padding: '16px 24px', fontSize: '12px', opacity: 0.6 }}>
                      {hoverBgOptions.find(opt => opt.value === prod.hoverBg)?.label || prod.hoverBg || 'DEFAULT'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditModal(prod)}
                          className="success-btn secondary-btn font-condensed"
                          style={{ width: 'auto', padding: '6px 14px', fontSize: '11px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                          EDIT
                        </button>
                        <button 
                          onClick={() => setDeletingId(prod.id)}
                          className="success-btn secondary-btn font-condensed"
                          style={{ width: 'auto', padding: '6px 14px', fontSize: '11px', borderRadius: '100px', border: '1px solid rgba(255, 0, 0, 0.2)', color: '#ff9999' }}
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => { if (!submitting) setIsModalOpen(false); }} style={{ zIndex: 10000 }}>
            <div className="modal-card glass-pill admin-modal-card animate-fade-up" onClick={(e) => e.stopPropagation()}>
              
              <div className="admin-modal-header">
                <h2 className="font-display">
                  {editingProduct ? 'EDIT PRODUCT' : 'ADD PRODUCT'}
                </h2>
                <button 
                  onClick={() => { if (!submitting) setIsModalOpen(false); }}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}
                  disabled={submitting}
                >✕</button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <span className="font-condensed" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em', marginBottom: '4px' }}>PRODUCT NAME</span>
                  <input 
                    type="text" required
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. STRIPED LOUNGE PANTS"
                    className="form-input font-condensed" disabled={submitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <span className="font-condensed" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em', marginBottom: '4px' }}>PRICE (TND)</span>
                    <input 
                      type="number" step="0.01" min="0" required
                      value={price} onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 85"
                      className="form-input font-condensed" disabled={submitting}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <span className="font-condensed" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em', marginBottom: '4px' }}>HOVER THEME (BACKGROUND GRID)</span>
                    <select 
                      value={hoverBg} onChange={(e) => setHoverBg(e.target.value)}
                      className="form-input font-condensed" disabled={submitting}
                      style={{ background: '#0a0a0a', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '16px 0', fontSize: '13px' }}
                    >
                      {hoverBgOptions.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ background: '#000', color: '#fff' }}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <span className="font-condensed" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em', marginBottom: '4px' }}>PRODUCT DESCRIPTION</span>
                  <textarea 
                    required
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Premium lightweight cotton construction..."
                    className="form-input font-condensed" rows={4}
                    style={{ resize: 'none' }} disabled={submitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <span className="font-condensed" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em', marginBottom: '4px' }}>FRONT IMAGE PATH / URL</span>
                    <input 
                      type="text" required
                      value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="e.g. /striped_pants.png"
                      className="form-input font-condensed" disabled={submitting}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <span className="font-condensed" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em', marginBottom: '4px' }}>DETAIL IMAGE PATH / URL</span>
                    <input 
                      type="text"
                      value={detailImageUrl} onChange={(e) => setDetailImageUrl(e.target.value)}
                      placeholder="e.g. /striped_pants_detail_1.png"
                      className="form-input font-condensed" disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <span className="font-condensed" style={{ fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em', marginBottom: '8px' }}>AVAILABLE SIZES</span>
                  <div className="admin-size-options">
                    {availableSizes.map(size => (
                      <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }} className="font-condensed">
                        <input 
                          type="checkbox" checked={selectedSizes.includes(size)}
                          onChange={() => handleSizeToggle(size)}
                          style={{ accentColor: '#fff', cursor: 'pointer' }} disabled={submitting}
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="checkout-submit font-display" style={{ marginTop: '12px', padding: '16px' }} disabled={submitting}>
                  {submitting ? 'SAVING...' : (editingProduct ? 'SAVE CHANGES' : 'CREATE PRODUCT')}
                </button>
              </form>

            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <ConfirmDialog
            message="ARE YOU SURE YOU WANT TO DELETE THIS PRODUCT? THIS ACTION CANNOT BE UNDONE."
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingId(null)}
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
