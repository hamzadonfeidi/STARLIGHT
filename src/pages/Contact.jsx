import { useState } from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getMessageText = () => {
    return `Name: ${formData.name}
Email: ${formData.email}

Message:
${formData.message}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact: Message from ${formData.name}`);
    const body = encodeURIComponent(getMessageText());
    window.location.href = `mailto:hamzadonfeidi@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getMessageText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="contact-page animate-fade-up">
      <div className="contact-container">

        <div className="contact-left">
          <Link to="/" className="pd-back font-condensed">← BACK TO STORE</Link>
          <h1 className="font-display contact-title">CONTACT</h1>
          <p className="contact-subtitle font-condensed">GET IN TOUCH. WE RESPOND WITHIN 24H.</p>

          <div className="contact-info">
            <div className="contact-info-item">
              <span className="font-condensed contact-info-label">EMAIL</span>
              <span className="contact-info-value">hamzadonfeidi@gmail.com</span>
            </div>
            <div className="contact-info-item">
              <span className="font-condensed contact-info-label">INSTAGRAM</span>
              <a
                href="https://www.instagram.com/starlight.tns/"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-value contact-info-link"
              >@starlight.tns</a>
            </div>
            <div className="contact-info-item">
              <span className="font-condensed contact-info-label">LOCATION</span>
              <span className="contact-info-value">Tunisia</span>
            </div>
          </div>
        </div>

        <div className="contact-right">
          {sent ? (
            <div className="contact-sent glass-pill">
              <p className="contact-sent-icon">✦</p>
              <h2 className="font-display contact-sent-title">MESSAGE SENT</h2>
              <p className="font-condensed contact-sent-sub">YOUR EMAIL CLIENT HAS BEEN OPENED.<br />WE WILL GET BACK TO YOU SOON.</p>
              <div className="contact-sent-actions">
                <button 
                  type="button"
                  onClick={handleCopy} 
                  className={`success-btn primary-btn font-condensed contact-sent-btn ${copied ? 'copied' : ''}`}
                >
                  {copied ? 'COPIED!' : 'COPY MESSAGE BACKUP'}
                </button>
                <Link 
                  to="/" 
                  className="contact-back-btn font-display contact-sent-btn"
                >
                  BACK TO STORE
                </Link>
              </div>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
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
                  rows={8}
                />
              </div>
              <button type="submit" className="contact-submit font-display">
                SEND MESSAGE
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Contact;
