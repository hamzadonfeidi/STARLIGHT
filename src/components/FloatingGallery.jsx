import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockProducts } from '../seed';
import { extractDominantColors, prefetchDominantColors } from '../utils/extractDominantColors';
import { assetUrl } from '../utils/assetUrl';

const FloatingGallery = ({ setProductBgColors }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const hoverRequest = useRef(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!isFirebaseConfigured) {
          const localData = localStorage.getItem('starlight_products');
          const parsed = localData ? JSON.parse(localData) : mockProducts;
          setProducts(parsed);
          prefetchDominantColors(parsed.map((p) => assetUrl(p.imageUrl)));
          setLoading(false);
          return;
        }

        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
        prefetchDominantColors(items.map((p) => assetUrl(p.imageUrl)));
      } catch (err) {
        console.error('Error loading products for gallery:', err);
        setProducts(mockProducts);
        prefetchDominantColors(mockProducts.map((p) => assetUrl(p.imageUrl)));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductHover = async (imageUrl) => {
    const requestId = ++hoverRequest.current;
    try {
      const colors = await extractDominantColors(imageUrl);
      if (requestId === hoverRequest.current) {
        setProductBgColors(colors);
      }
    } catch {
      if (requestId === hoverRequest.current) {
        setProductBgColors(null);
      }
    }
  };

  const handleProductLeave = () => {
    hoverRequest.current += 1;
    setProductBgColors(null);
  };

  if (loading) {
    return (
      <section className="gallery-section">
        <div className="gallery-container gallery-container--loading">
          <p className="font-condensed animate-pulse" style={{ opacity: 0.5, letterSpacing: '0.2em' }}>
            LOADING ATMOSPHERE...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="gallery-section">
      <div className="gallery-container">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="product-card product-card-link"
            onMouseEnter={() => handleProductHover(assetUrl(product.imageUrl))}
            onMouseLeave={handleProductLeave}
            onFocus={() => handleProductHover(assetUrl(product.imageUrl))}
            onBlur={handleProductLeave}
          >
            <div className="product-image-wrapper">
              <img
                src={assetUrl(product.imageUrl)}
                alt={product.name}
                className="product-image"
                loading="lazy"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FloatingGallery;
