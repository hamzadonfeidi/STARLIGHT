import { useState, useEffect } from 'react';

const ContactModal = ({ onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact: Message from ${formData.name}`);
    const body = encodeURIComponent(
`Name: ${formData.name}
Email: ${formData.email}

Message:
${formData.message}`
    );
    window.location.href = `mailto:hamzadonfeidi@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-pill" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close font-condensed" onClick={onClose}>✕</button>

        {sent ? (
          <div className="modal-sent">
            <p className="modal-sent-icon">✦</p>
            <h2 className="font-display modal-title">MESSAGE SENT</h2>
            <p className="modal-subtitle font-condensed">YOUR EMAIL CLIENT HAS BEEN OPENED. WE WILL GET BACK TO YOU SOON.</p>
          </div>
        ) : (
          <>
            <h2 className="font-display modal-title">CONTACT</h2>
            <p className="modal-subtitle font-condensed">GET IN TOUCH. WE RESPOND WITHIN 24H.</p>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text" name="name" placeholder="FULL NAME"
                  required onChange={handleChange}
                  className="form-input font-condensed"
                />
              </div>
              <div className="form-group">
                <input
                  type="email" name="email" placeholder="EMAIL ADDRESS"
                  required onChange={handleChange}
                  className="form-input font-condensed"
                />
              </div>
              <div className="form-group">
                <textarea
                  name="message" placeholder="YOUR MESSAGE"
                  required onChange={handleChange}
                  className="form-input form-textarea font-condensed"
                  rows={5}
                />
              </div>
              <button type="submit" className="modal-submit font-display">
                SEND MESSAGE
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
