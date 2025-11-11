import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PeluchesPage from "./pages/PeluchesPage/PeluchesPage";
import SuccessPage from "./pages/Checkout/SuccessPage/SuccessPage";
import CancelPage from "./pages/Checkout/CancelPage/CancelPage";
import Navbar from "./components/Navbar/Navbar";
import CartOverlay from "./components/Cart/CartOverlay";
import { useState } from "react";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AdminLogin from "./pages/LoginAdmin/AdminLogin";
import About from "./pages/About/about"

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    !!localStorage.getItem("adminToken")
  );

  return (
    <Router basename="/">
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <Routes>
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/" element={<PeluchesPage />} />
        <Route path="/peluches" element={<PeluchesPage />} />
        <Route path="/about" element={<About />} />

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
    </Router>
  );
}

export default App;
