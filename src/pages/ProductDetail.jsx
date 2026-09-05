import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockProducts } from '../seed';
import { extractDominantColors } from '../utils/extractDominantColors';

const ProductDetail = ({ setProductBgColors }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        if (!isFirebaseConfigured) {
          // Demo Mode: Fetch from localStorage
          const localData = localStorage.getItem('starlight_products');
          const parsed = localData ? JSON.parse(localData) : mockProducts;
          // Support searching by both Firestore generated ID and the standard 'striped-pants' key
          const found = parsed.find(p => p.id === id) || parsed.find(p => p.id === 'striped-pants') || parsed[0];
          setProduct(found);
          setLoading(false);
          return;
        }

        // Live Mode: Fetch from Cloud Firestore
        const productRef = doc(db, 'products', id);
        const docSnap = await getDoc(productRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Product not found in Firestore ID:", id);
        }
      } catch (err) {
        console.error("Error loading product details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product?.imageUrl) {
      setProductBgColors(null);
      return undefined;
    }

    let cancelled = false;
    extractDominantColors(product.imageUrl).then((colors) => {
      if (!cancelled) setProductBgColors(colors);
    });

    return () => {
      cancelled = true;
      setProductBgColors(null);
    };
  }, [product, setProductBgColors]);

  // Build gallery images array (support variants and additional images)
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const imgs = [];
    // Preferred order: variant image, main image, detailImageUrl, extra images
    if (product.variants && product.variants.length) {
      const mainVariant = product.variants.find(v => v.default) || product.variants[0];
      if (mainVariant?.imageUrl) imgs.push(mainVariant.imageUrl);
    }
    if (product.imageUrl) imgs.push(product.imageUrl);
    if (product.detailImageUrl) imgs.push(product.detailImageUrl);
    if (product.images && Array.isArray(product.images)) imgs.push(...product.images);
    // dedupe and filter
    return [...new Set(imgs.filter(Boolean))];
  }, [product]);

  useEffect(() => {
    if (!product) return;
    // avoid calling setState synchronously inside an effect
    const t = setTimeout(() => {
      if (product?.variants && product.variants.length) setSelectedVariant(product.variants[0]);
    }, 0);
    return () => clearTimeout(t);
  }, [product]);

  const handleVariantChange = (variantId) => {
    const v = product.variants.find(v => v.id === variantId);
    if (v) {
      setSelectedVariant(v);
      if (v.imageUrl) {
        const idx = galleryImages.indexOf(v.imageUrl);
        if (idx >= 0) {
          const element = document.getElementById(`pd-image-${idx}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }
    navigate('/checkout', { state: { product, size: selectedSize } });
  };

  if (loading) {
    return (
      <div className="product-detail-page product-detail-page--centered">
        <p className="font-condensed animate-pulse" style={{ opacity: 0.5, letterSpacing: '0.2em' }}>
          LOADING DETAILS...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page product-detail-page--centered">
        <div className="pd-not-found">
          <h2 className="font-display" style={{ fontSize: '2rem' }}>PRODUCT NOT FOUND</h2>
          <p className="font-condensed" style={{ opacity: 0.5, marginTop: '8px' }}>THE REQUESTED CATALOG ITEM IS UNAVAILABLE.</p>
          <Link to="/" className="pd-back font-condensed" style={{ marginTop: '24px', display: 'inline-block' }}>← RETURN TO GALLERY</Link>
        </div>
      </div>
    );
  }

  const sizes = product.sizes || ['S', 'M', 'L', 'XL'];

  return (
    <div className="product-detail-page">
      <div className="pd-left">
        <div className="pd-images-stack">
          {galleryImages.map((img, idx) => (
            <div key={img + idx} id={`pd-image-${idx}`} className="pd-image-wrapper">
              <img src={img} alt={`${product.name} - image ${idx + 1}`} className="pd-stacked-image" />
            </div>
          ))}
        </div>
      </div>

      <div className="pd-right">
        <div className="pd-info-sticky animate-fade-up">
          <Link to="/" className="pd-back font-condensed">← BACK TO GALLERY</Link>
          <h1 className="pd-title font-display">{product.name.toUpperCase()}</h1>
          <p className="pd-price font-condensed">{selectedVariant ? selectedVariant.price || product.price : product.price} TND</p>

          <div className="pd-description">
            <p>{product.description}</p>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="pd-variants">
              <label className="font-condensed">Variant</label>
              <select
                className="pd-variant-select"
                value={selectedVariant?.id || product.variants[0].id}
                onChange={(e) => handleVariantChange(e.target.value)}
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pd-sizing">
            <span className="font-condensed pd-size-label">SIZE</span>
            <div className="pd-size-grid">
              {sizes.map((s) => (
                <button 
                  key={s} 
                  className={`pd-size-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pd-actions">
            <button className="pd-add-to-cart font-display" onClick={handleAddToCart}>
              {selectedSize ? `ADD TO CART - ${selectedSize}` : 'SELECT SIZE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
