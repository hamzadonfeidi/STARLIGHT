import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getCanonicalGoogleAuthUrl = () => {
  if (window.location.hostname !== '127.0.0.1') return null;

  const url = new URL(window.location.href);
  url.hostname = 'localhost';
  return url.toString();
};

const getGoogleErrorMessage = (error) => {
  if (error.code === 'auth/unauthorized-domain') {
    return 'GOOGLE SIGN IN IS NOT AUTHORIZED ON THIS LOCAL ADDRESS. OPEN LOCALHOST INSTEAD OF 127.0.0.1.';
  }

  if (error.code === 'auth/operation-not-allowed') {
    return 'GOOGLE SIGN IN IS NOT ENABLED IN FIREBASE AUTHENTICATION.';
  }

  if (error.code === 'auth/account-exists-with-different-credential') {
    return 'THIS EMAIL ALREADY USES A DIFFERENT SIGN IN METHOD.';
  }

  if (error.code === 'auth/network-request-failed') {
    return 'NETWORK ERROR DURING GOOGLE SIGN IN. CHECK YOUR CONNECTION.';
  }

  return 'GOOGLE SIGN IN WAS INTERRUPTED. PLEASE TRY AGAIN.';
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect user to where they were going, or homepage
  const redirectPath = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      console.error(err);
      setError('INVALID EMAIL OR PASSWORD. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const canonicalGoogleAuthUrl = getCanonicalGoogleAuthUrl();
    if (canonicalGoogleAuthUrl) {
      window.location.assign(canonicalGoogleAuthUrl);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await loginWithGoogle();
      if (result) {
        navigate(redirectPath);
      }
    } catch (err) {
      console.error('Google sign-in failed:', err.code, err.message);
      setError(getGoogleErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page checkout-page--centered animate-fade-up">
      <div className="order-success-wrapper glass-pill auth-card">
        
        <div className="success-header">
          <span className="success-icon" style={{ animation: 'none', fontSize: '2.5rem' }}>✦</span>
          <h1 className="success-title font-display" style={{ fontSize: '2.2rem' }}>SIGN IN</h1>
          <p className="success-subtitle font-condensed" style={{ fontSize: '11px', letterSpacing: '0.2em' }}>
            ACCESS YOUR STARLIGHT PROFILE
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

          <button 
            type="submit" 
            disabled={loading} 
            className="checkout-submit font-display" 
            style={{ marginTop: '16px', padding: '16px' }}
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '8px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
          <span className="font-condensed" style={{ margin: '0 12px', fontSize: '10px', opacity: 0.4, letterSpacing: '0.15em' }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="success-btn secondary-btn font-condensed" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '100px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <p className="font-condensed" style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '0.05em' }}>
          NEW TO STARLIGHT? <Link to="/signup" style={{ color: '#fff', textDecoration: 'underline', fontWeight: '500' }}>CREATE AN ACCOUNT</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
