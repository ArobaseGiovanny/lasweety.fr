import "./navbar.scss";
import { HiMenu } from "react-icons/hi";
import { MdShoppingCart } from "react-icons/md";
import { useState, useRef, useEffect } from "react";
import logo from "../../assets/icons/logo.png";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

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
        <MdShoppingCart className="navbar__icon-cart" />
        <HiMenu
          className="navbar__icon-menu"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      <div
        ref={menuRef}
        className={`navbar__menu ${isOpen ? "navbar__menu--open" : ""}`}
      >
        <ul>
          <li><Link to="/">Accueil</Link></li>
          <li><Link to="/panier">Panier</Link></li>
          <li><Link to="/contact">Suivez-nous</Link></li>
          <li><Link to="/a-propos">Mentions légales</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
