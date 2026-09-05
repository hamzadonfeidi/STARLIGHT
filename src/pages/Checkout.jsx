import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { isFirebaseConfigured } from '../firebase';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { extractDominantColors } from '../utils/extractDominantColors';

const Checkout = ({ setProductBgColors }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract passed product and size details or fallback gracefully
  const selectedSize = location.state?.size || 'M';
  const product = location.state?.product || {
    name: 'STRIPED LOUNGE PANTS',
    price: 85,
    imageUrl: '/striped_pants.png'
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    let cancelled = false;
    if (product?.imageUrl) {
      extractDominantColors(product.imageUrl).then((colors) => {
        if (!cancelled) setProductBgColors(colors);
      });
    } else {
      setProductBgColors(null);
    }

    return () => {
      cancelled = true;
      setProductBgColors(null);
    };
  }, [product.imageUrl, setProductBgColors]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getOrderText = () => {
    return `NEW ORDER DETAILS:
-------------------
Product: ${product.name}
Size: ${selectedSize}
Price: ${product.price} USD
Payment: Cash on delivery

CUSTOMER INFORMATION:
-------------------
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

SHIPPING ADDRESS:
-------------------
${formData.address}
${formData.city}, ${formData.zip}
${formData.country}

DELIVERY NOTES:
-------------------
${formData.notes || 'None'}

-------------------
The buyer will pay on delivery.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const orderData = {
      buyerInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        zip: formData.zip,
        country: formData.country,
        notes: formData.notes
      },
      items: [
        {
          name: product.name,
          price: product.price,
          size: selectedSize,
          imageUrl: product.imageUrl,
          quantity: 1
        }
      ],
      total: product.price,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pay_on_delivery',
      status: 'pending_confirmation',
      createdAt: new Date().toISOString()
    };

    // --- DEMO MODE WORKFLOW ---
    if (!isFirebaseConfigured) {
      console.log("Demo Mode Checkout active. Staging mock order...");
      const mockOrderId = 'demo_' + Math.random().toString(36).substr(2, 9);
      
      // Save order to localStorage
      const existing = JSON.parse(localStorage.getItem('starlight_mock_orders') || '[]');
      existing.push({ id: mockOrderId, ...orderData });
      localStorage.setItem('starlight_mock_orders', JSON.stringify(existing));

      const subject = encodeURIComponent(`New cash on delivery order: ${mockOrderId}`);
      const body = encodeURIComponent(`${getOrderText()}\n\nOrder ID: ${mockOrderId}`);
      window.location.href = `mailto:hamzadonfeidi@gmail.com?subject=${subject}&body=${body}`;

      setTimeout(() => {
        setLoading(false);
        navigate(`/success?order_id=${mockOrderId}`);
      }, 1500);
      return;
    }

    // --- LIVE MODE WORKFLOW (Cash on delivery + Firestore) ---
    try {
      const db = getFirestore();
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const orderId = docRef.id;

      console.log(`Order staged successfully: ${orderId}`);

      const subject = encodeURIComponent(`New cash on delivery order: ${orderId}`);
      const body = encodeURIComponent(`${getOrderText()}\n\nOrder ID: ${orderId}`);
      window.location.href = `mailto:hamzadonfeidi@gmail.com?subject=${subject}&body=${body}`;
      setTimeout(() => {
        setLoading(false);
        navigate(`/success?order_id=${orderId}`);
      }, 1500);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Could not submit your order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page animate-fade-up">
      <div className="checkout-container">

        <div className="checkout-left">
          <Link to="/" className="pd-back font-condensed">← BACK TO GALLERY</Link>
          <h1 className="checkout-title font-display">CHECKOUT</h1>
          <p className="checkout-subtitle font-condensed">
            {isFirebaseConfigured ? 'FILL YOUR INFORMATION. PAYMENT IS CASH ON DELIVERY.' : 'DEMO MODE ACTIVE. ORDER DETAILS WILL OPEN IN EMAIL.'}
          </p>

          {error && (
            <div className="checkout-error font-condensed">
              <span>{error.toUpperCase()}</span>
            </div>
          )}

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input type="text" name="name" placeholder="FULL NAME" required onChange={handleChange} className="form-input font-condensed" />
            </div>
            <div className="form-group">
              <input type="email" name="email" placeholder="EMAIL ADDRESS" required onChange={handleChange} className="form-input font-condensed" />
            </div>
            <div className="form-group">
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required onChange={handleChange} className="form-input font-condensed" />
            </div>
            <div className="form-group">
              <input type="text" name="address" placeholder="SHIPPING ADDRESS" required onChange={handleChange} className="form-input font-condensed" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <input type="text" name="city" placeholder="CITY" required onChange={handleChange} className="form-input font-condensed" />
              </div>
              <div className="form-group">
                <input type="text" name="zip" placeholder="ZIP CODE" required onChange={handleChange} className="form-input font-condensed" />
              </div>
            </div>
            <div className="form-group">
              <input type="text" name="country" placeholder="COUNTRY" required onChange={handleChange} className="form-input font-condensed" />
            </div>
            <div className="form-group">
              <textarea name="notes" placeholder="DELIVERY NOTES (OPTIONAL)" onChange={handleChange} className="form-input form-textarea font-condensed" rows={3} />
            </div>

            <button type="submit" className="checkout-submit font-display" disabled={loading}>
              {loading ? 'SUBMITTING ORDER...' : 'PLACE ORDER'}
            </button>
          </form>
        </div>

        <div className="checkout-right">
          <div className="order-summary glass-pill">
            <h3 className="summary-title font-condensed">ORDER SUMMARY</h3>
            <div className="summary-item">
              <img src={product.imageUrl} alt={product.name} className="summary-img" />
              <div className="summary-details">
                <span className="summary-name font-condensed">{product.name.toUpperCase()}</span>
                <span className="summary-size font-condensed">SIZE: {selectedSize}</span>
                <span className="summary-price font-condensed">{product.price} TND</span>
              </div>
            </div>
            <div className="summary-total">
              <span className="font-condensed">TOTAL</span>
              <span className="font-condensed">{product.price} TND</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
