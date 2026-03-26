import "./navbar.scss";
import { RiMenu5Line } from "react-icons/ri";
import { IoBagOutline } from "react-icons/io5";
import { useState, useRef, useEffect } from "react";
import logo from "../../assets/icons/logo.png";
import { useCart } from "../../context/CartContext";
import { usePageTransition } from "../../context/TransitionContext";

function Navbar({ onCartClick, showCart = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const { navigateTo } = usePageTransition();

  const go = (path) => { setIsOpen(false); navigateTo(path); };

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
      <button className="navbar__logo-link" onClick={() => go("/")}>
        <img className="navbar__logo" src={logo} alt="Logo Lasweety" />
      </button>

      <div className="navbar__actions">
        {showCart && (
          <>
            <IoBagOutline className="navbar__icon-cart" onClick={onCartClick} />
            {cartCount > 0 && (
              <span className="navbar__cart-badge">{cartCount}</span>
            )}
          </>
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
            <button onClick={() => go("/")}>Accueil</button>
          </li>
          <li>
            <button onClick={() => go("/peluches")}>Nos peluches</button>
          </li>
          <li>
            <button
              className="navbar__menu-cart"
              onClick={() => { setIsOpen(false); onCartClick(); }}
            >
              Panier
            </button>
          </li>
          <li>
            <button onClick={() => go("/contact")}>Suivez-nous</button>
          </li>
          <li>
            <button onClick={() => go("/about")}>Mentions légales</button>
          </li>
        </ul>

      </div>
    </nav>
  );
}

export default Navbar;
