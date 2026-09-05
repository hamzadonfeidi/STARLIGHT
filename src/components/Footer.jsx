// No React import needed in React 19+

const Footer = () => {
  return (
    <footer className="footer font-condensed">
      <div className="footer-copyright">
        © {new Date().getFullYear()} STARLIGHT. ALL RIGHTS RESERVED.
      </div>
      <div className="footer-links">
        <a href="#" className="footer-link">SHOP</a>
        <a href="#" className="footer-link">CONTACT</a>
        <a href="#" className="footer-link">POLICIES</a>
        <a href="#" className="footer-link">IG</a>
      </div>
    </footer>
  );
};

export default Footer;
