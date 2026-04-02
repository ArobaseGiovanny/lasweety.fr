import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import PeluchesPage from "./pages/PeluchesPage/PeluchesPage";
import SuccessPage from "./pages/Checkout/SuccessPage/SuccessPage";
import CancelPage from "./pages/Checkout/CancelPage/CancelPage";
import Navbar from "./components/Navbar/Navbar";
import CartOverlay from "./components/Cart/CartOverlay";
import { useState, useEffect } from "react";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AdminLogin from "./pages/LoginAdmin/AdminLogin";
import About from "./pages/About/about";
import ContactPage from "./pages/ContactPage/ContactPage";
import products from "./data/products";
import { TransitionProvider } from "./context/TransitionContext";

const ALL_PRODUCT_IMAGES = Object.values(products).flatMap(p => p.images.map(img => img.src));

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Preload toutes les images produit en arrière-plan dès que le navigateur est idle
  useEffect(() => {
    const load = () => {
      ALL_PRODUCT_IMAGES.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, []);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    !!localStorage.getItem("adminToken")
  );
  const location = useLocation();
  const showCart = location.pathname !== "/";

  return (
    <TransitionProvider>
      <Navbar onCartClick={() => setIsCartOpen(true)} showCart={showCart} />
      {showCart && <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}

      <Routes>
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/peluches" element={<PeluchesPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Login Admin */}
        <Route
          path="/admin/login"
          element={<AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />}
        />

        {/* Dashboard Admin */}
        <Route
          path="/admin"
          element={
            isAdminAuthenticated ? <AdminDashboard /> : <Navigate to="/admin/login" />
          }
        />
      </Routes>
    </TransitionProvider>
  );
}

function App() {
  return (
    <Router basename="/">
      <AppContent />
    </Router>
  );
}

export default App;
