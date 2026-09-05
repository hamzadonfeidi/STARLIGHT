import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { isFirebaseConfigured } from '../firebase';

const Success = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        if (orderId.startsWith('demo_') || !isFirebaseConfigured) {
          // Fetch from localStorage for mock orders
          const existing = JSON.parse(localStorage.getItem('starlight_mock_orders') || '[]');
          const mockOrder = existing.find(o => o.id === orderId);
          if (mockOrder) {
            setOrder(mockOrder);
          } else {
            setError('Order not found');
          }
        } else {
          // Fetch from Cloud Firestore
          const db = getFirestore();
          const orderRef = doc(db, 'orders', orderId);
          const orderSnap = await getDoc(orderRef);

          if (orderSnap.exists()) {
            setOrder(orderSnap.data());
          } else {
            setError('Order not found');
          }
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Error loading order summary');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  return (
    <div className="checkout-page animate-fade-up">
      <div className="checkout-container checkout-container--centered">
        <div className="order-success-wrapper glass-pill animate-fade-up">
          
          <span className="success-icon animate-pulse" style={{ color: '#ffffff', fontSize: '3.5rem', textShadow: '0 0 15px rgba(255, 255, 255, 0.4)' }}>✦</span>
          
          <h1 className="success-title font-display" style={{ marginTop: '16px', letterSpacing: '0.15em' }}>ORDER RECEIVED</h1>
          
          <p className="success-subtitle font-condensed" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', letterSpacing: '0.05em', maxWidth: '600px', margin: '16px auto' }}>
            THANK YOU FOR YOUR ORDER. YOUR INFORMATION HAS BEEN SAVED AND OUR TEAM WILL CONTACT YOU TO CONFIRM DELIVERY.
            PAYMENT WILL BE COLLECTED ON DELIVERY.
          </p>

          {loading ? (
            <div className="success-loading font-condensed" style={{ margin: '32px 0', opacity: 0.7 }}>
              RETRIEVING ORDER SUMMARY...
            </div>
          ) : error ? (
            <div className="success-error font-condensed" style={{ margin: '32px 0', color: '#ff6b6b' }}>
              {error.toUpperCase()}
            </div>
          ) : order ? (
            <div className="success-receipt-box">
              <h3 className="font-display" style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', marginBottom: '16px', letterSpacing: '0.1em' }}>
                ORDER & DELIVERY DETAILS
              </h3>
              
              <div className="receipt-grid">
                <div>
                  <h4 className="font-condensed" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '6px' }}>ORDER ID</h4>
                  <p className="font-condensed" style={{ fontSize: '0.9rem', color: '#ffffff' }}>{orderId}</p>
                  
                  <h4 className="font-condensed" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '16px', marginBottom: '6px' }}>SHIPPING TO</h4>
                  <p className="font-condensed" style={{ fontSize: '0.9rem', color: '#ffffff', lineHeight: '1.4' }}>
                    {order.buyerInfo?.name?.toUpperCase()}<br />
                    {order.buyerInfo?.phone?.toUpperCase()}<br />
                    {order.buyerInfo?.address?.toUpperCase()}<br />
                    {order.buyerInfo?.city?.toUpperCase()}, {order.buyerInfo?.zip?.toUpperCase()}<br />
                    {order.buyerInfo?.country?.toUpperCase()}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-condensed" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '6px' }}>ITEMS PURCHASED</h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="receipt-item-row" style={{ marginBottom: '12px' }}>
                      <div>
                        <p className="font-condensed" style={{ fontSize: '0.9rem', color: '#ffffff', margin: 0 }}>
                          {item.name.toUpperCase()}
                        </p>
                        <span className="font-condensed" style={{ fontSize: '0.75rem', opacity: 0.6 }}>SIZE: {item.size}</span>
                      </div>
                      <span className="font-condensed" style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                        {item.price} TND
                      </span>
                    </div>
                  ))}
                  
                  <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-condensed" style={{ fontSize: '0.9rem', opacity: 0.6 }}>PAY ON DELIVERY</span>
                    <span className="font-display" style={{ fontSize: '1rem', color: '#ffffff' }}>{order.total} TND</span>
                  </div>
                  {order.buyerInfo?.notes && (
                    <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '12px', marginTop: '12px' }}>
                      <h4 className="font-condensed" style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '6px' }}>DELIVERY NOTES</h4>
                      <p className="font-condensed" style={{ fontSize: '0.9rem', color: '#ffffff', lineHeight: '1.4', margin: 0 }}>
                        {order.buyerInfo.notes.toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="success-no-details font-condensed" style={{ margin: '32px 0', opacity: 0.6 }}>
              ORDER GENERATED SUCCESSFULLY. YOUR CONFIRMATION HAS BEEN LOGGED.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <Link 
              to="/" 
              className="success-home-link font-display" 
              style={{ width: 'auto', minWidth: '240px', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              RETURN TO GALLERY
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Success;
