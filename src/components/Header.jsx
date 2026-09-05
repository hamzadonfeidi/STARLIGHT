import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="header animate-fade-up">
        <div className="header-left">
          <Link to="/" className="header-logo font-display glass-pill">
            STARLIGHT
          </Link>
        </div>

        <div className="header-right">
          <span className="locale font-condensed glass-pill header-locale header-locale--hide-mobile">[ TND ]</span>
          
          {user ? (
            <button type="button" onClick={logout} className="glass-pill font-condensed header-locale header-locale--auth">
              LOGOUT
            </button>
          ) : (
            <Link to="/login" className="menu-toggle glass-pill font-condensed">
              SIGN IN
            </Link>
          )}

          <button
            className="menu-toggle glass-pill font-condensed"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span>MENU</span>
            <span className="menu-toggle-icon">{menuOpen ? '×' : '+'}</span>
          </button>
        </div>
      </header>

      {/* Full-screen menu overlay */}
      <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="menu-overlay-card glass-pill" onClick={(e) => e.stopPropagation()}>
          <button className="menu-overlay-close font-condensed" onClick={() => setMenuOpen(false)}>×</button>
          <nav className="menu-overlay-nav">
            <button className="menu-link font-display" onClick={() => handleNav('/')}>SHOP</button>
            <button className="menu-link font-display" onClick={() => handleNav('/contact')}>CONTACT</button>
            <button className="menu-link font-display" onClick={() => handleNav('/policies')}>POLICIES</button>
            {isAdmin && (
              <button className="menu-link font-display" onClick={() => handleNav('/admin')} style={{ color: '#ff9999' }}>
                ADMIN
              </button>
            )}
            <a
              className="menu-link font-display"
              href="https://www.instagram.com/starlight.tns/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
            >IG</a>
          </nav>
          <div className="menu-overlay-footer font-condensed" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user && (
              <div style={{ fontSize: '9px', opacity: 0.4, letterSpacing: '0.1em' }}>
                SIGNED IN AS: {user.email.toUpperCase()}
              </div>
            )}
            <div>
              © {new Date().getFullYear()} STARLIGHT. ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
