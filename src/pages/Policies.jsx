import { Link } from 'react-router-dom';

const Policies = () => {
  return (
    <div className="policies-page animate-fade-up">
      <div className="policies-container">
        <Link to="/" className="pd-back font-condensed">← BACK TO STORE</Link>
        <h1 className="font-display policies-title">POLICIES</h1>

        <div className="policies-grid">

          <div className="policy-section glass-pill">
            <h2 className="font-condensed policy-heading">SHIPPING POLICY</h2>
            <p>All orders are processed within 2–5 business days. Delivery times vary by location. We currently ship within Tunisia. You will receive a confirmation email with tracking information once your order has been dispatched.</p>
          </div>

          <div className="policy-section glass-pill">
            <h2 className="font-condensed policy-heading">RETURNS & EXCHANGES</h2>
            <p>We accept returns within 14 days of delivery, provided the item is unworn, unwashed, and in its original packaging. To initiate a return, please contact us via the Contact page with your order details. Exchanges are subject to stock availability.</p>
          </div>

          <div className="policy-section glass-pill">
            <h2 className="font-condensed policy-heading">PRIVACY POLICY</h2>
            <p>Your personal information is collected solely for the purpose of processing and fulfilling your order. We do not sell, trade, or transfer your data to any third parties. All order information is transmitted securely and stored confidentially.</p>
          </div>

          <div className="policy-section glass-pill">
            <h2 className="font-condensed policy-heading">PAYMENT POLICY</h2>
            <p>We currently accept cash on delivery (COD) as our primary payment method. After placing your order, our team will contact you to confirm your details and arrange payment upon delivery. No online payment information is required at checkout.</p>
          </div>

          <div className="policy-section glass-pill">
            <h2 className="font-condensed policy-heading">TERMS & CONDITIONS</h2>
            <p>By placing an order on this site, you agree to our terms of service. STARLIGHT reserves the right to cancel any order in cases of suspected fraud, inaccurate information, or stock unavailability. All prices are listed in TND and are subject to change without notice.</p>
          </div>

          <div className="policy-section glass-pill">
            <h2 className="font-condensed policy-heading">CONTACT US</h2>
            <p>For any questions regarding your order or our policies, please reach out via our Contact page. We are committed to responding to all inquiries within 24 hours during business days.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Policies;
