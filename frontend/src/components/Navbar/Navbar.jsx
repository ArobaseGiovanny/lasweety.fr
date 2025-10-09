import "./navbar.scss";
import { RiMenu5Line } from "react-icons/ri";
import { IoBagOutline } from "react-icons/io5";
import { useState, useRef, useEffect } from "react";
import logo from "../../assets/icons/logo.png";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function Navbar({ onCartClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo-link">
        <img className="navbar__logo" src={logo} alt="Logo Lasweety" />
      </Link>

      <div className="navbar__actions">
        <IoBagOutline className="navbar__icon-cart" onClick={onCartClick} />
        {cartCount > 0 && (
          <span className="navbar__cart-badge">{cartCount}</span>
        )}
        <RiMenu5Line
          className="navbar__icon-menu"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      <div
        ref={menuRef}
        className={`navbar__menu ${isOpen ? "navbar__menu--open" : ""}`}
      >
        <ul>
          <li>
            <Link to="/">Accueil</Link>
          </li>
          <li>
            <button
              className="navbar__menu-cart"
              onClick={() => {
                setIsOpen(false); // 👈 fermer le menu
                onCartClick(); // 👈 ouvrir le panier
              }}
            >
              Panier
            </button>
          </li>
          <li>
            <Link to="/contact">Suivez-nous</Link>
          </li>
          <li>
            <Link to="/a-propos">Mentions légales</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
