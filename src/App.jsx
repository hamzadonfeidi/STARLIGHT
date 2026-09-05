import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { seedProducts } from './seed';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Policies from './pages/Policies';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import InteractiveBackground from './components/InteractiveBackground';
import './App.css';
import './responsive.css';

function App() {
  const [productBgColors, setProductBgColors] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    const defaultGradient = 'linear-gradient(135deg, #CA2851 0%, #FFB173 55%, #FFE3B3 100%)';

    if (productBgColors && productBgColors.length >= 3) {
      const [a, b, c] = productBgColors;
      root.style.setProperty('--bg-gradient', `linear-gradient(135deg, ${a} 0%, ${b} 55%, ${c} 100%)`);
    } else {
      root.style.setProperty('--bg-gradient', defaultGradient);
    }
  }, [productBgColors]);

  // Trigger Firestore automatic database seeding on boot
  useEffect(() => {
    if (window.location.hostname === '127.0.0.1') {
      const localhostUrl = new URL(window.location.href);
      localhostUrl.hostname = 'localhost';
      window.location.replace(localhostUrl.toString());
      return;
    }

    seedProducts();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <InteractiveBackground productColors={productBgColors} />

        {/* Apply product-specific gradient to root CSS variable so the whole page responds */}
        {/* This effect updates `--bg-gradient` in CSS when `productBgColors` changes. */}
        

        <Header />
        <div className="content-wrapper">
          <main>
            <Routes>
              <Route path="/" element={<HomePage setProductBgColors={setProductBgColors} />} />
              <Route path="/product/:id" element={<ProductDetail setProductBgColors={setProductBgColors} />} />
              <Route path="/checkout" element={<Checkout setProductBgColors={setProductBgColors} />} />
              <Route path="/success" element={<Success />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
