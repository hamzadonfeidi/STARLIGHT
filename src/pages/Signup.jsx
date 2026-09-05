import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('PASSWORDS DO NOT MATCH.');
    }

    if (password.length < 6) {
      return setError('PASSWORD MUST BE AT LEAST 6 CHARACTERS.');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('EMAIL IS ALREADY REGISTERED.');
      } else {
        setError('FAILED TO CREATE ACCOUNT. PLEASE TRY AGAIN.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page checkout-page--centered animate-fade-up">
      <div className="order-success-wrapper glass-pill auth-card">
        
        <div className="success-header">
          <span className="success-icon" style={{ animation: 'none', fontSize: '2.5rem' }}>✦</span>
          <h1 className="success-title font-display" style={{ fontSize: '2.2rem' }}>SIGN UP</h1>
          <p className="success-subtitle font-condensed" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>
            CREATE A NEW STARLIGHT PROFILE
          </p>
        </div>

        {error && (
          <div className="form-error font-condensed" style={{ 
            background: 'rgba(255, 0, 0, 0.15)', 
            border: '1px solid rgba(255, 0, 0, 0.3)', 
            padding: '12px', 
            borderRadius: '10px', 
            fontSize: '11px', 
            width: '100%',
            textAlign: 'center',
            color: '#ff9999',
            letterSpacing: '0.05em'
          }}>
            {error}
          </div>
        )}

        <form className="checkout-form" onSubmit={handleSubmit} style={{ width: '100%', gap: '16px' }}>
          <div className="form-group">
            <input 
              type="email" 
              placeholder="EMAIL ADDRESS" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="form-input font-condensed" 
              style={{ padding: '12px 0' }}
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="PASSWORD" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="form-input font-condensed" 
              style={{ padding: '12px 0' }}
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="CONFIRM PASSWORD" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="form-input font-condensed" 
              style={{ padding: '12px 0' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="checkout-submit font-display" 
            style={{ marginTop: '16px', padding: '16px' }}
          >
            {loading ? 'CREATING PROFILE...' : 'SIGN UP'}
          </button>
        </form>

        <p className="font-condensed" style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '0.05em', marginTop: '8px' }}>
          ALREADY HAVE AN ACCOUNT? <Link to="/login" style={{ color: '#fff', textDecoration: 'underline', fontWeight: '500' }}>SIGN IN</Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;
