import "../Cart/cartOverlay.scss";
import { useCart } from "../../context/CartContext";
import products from "../../data/products";
import { IoCloseCircleSharp } from "react-icons/io5";
import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

function CartOverlay({ isOpen, onClose }) {
  const { cart, totalPrice, removeFromCart, updateQuantity } = useCart();
  const [startY, setStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  // ➝ Swipe mobile
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (startY !== null) {
      const delta = e.touches[0].clientY - startY;
      if (delta > 0) {
        setTranslateY(delta);
      }
    }
  };

  const handleTouchEnd = () => {
    if (translateY > 80) {
      onClose();
    }
    setTranslateY(0);
    setStartY(null);
  };

  // ➝ bouton "Passer la commande"
  const handleCheckout = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: cart.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Pas d’URL Stripe dans la réponse :", data);
      }
    } catch (error) {
      console.error("Erreur lors du checkout :", error);
    }
  };

  return (
    <section
      className={`cartOverlay ${isOpen ? "isOpen" : ""}`}
      style={{ transform: isOpen ? `translateY(${translateY}px)` : undefined }}
    >
      {/* scroll-hint mobile */}
      <div
        className="cartOverlay__scroll-hint"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span></span>
      </div>

      {/* bouton fermer desktop */}
      <div className="cartOverlay__close">
        <IoCloseCircleSharp onClick={onClose} />
      </div>

      <h2 className="cartOverlay__title">Mon Panier</h2>

      {cart.length === 0 ? (
        <p className="cartOverlay__empty-cart">Votre panier est vide.</p>
      ) : (
        <ul className="cartOverlay__list">
          {cart.map((item) => {
            const product = products[item.id];
            return (
              <li key={item.id} className="cartOverlay__item">
                <img
                  src={product.icon[0].src}
                  alt={product.images[0].alt}
                  className="cartOverlay__img"
                />

                <div className="cartOverlay__details">
                  {/* Nom à gauche + Prix total à droite */}
                  <div className="cartOverlay__header">
                    <div>
                      <h3>{product.name}</h3>
                      <p>Prix unitaire : {item.price.toFixed(2)} €</p>
                    </div>
                    <div className="cartOverlay__subtotal">
                      {(item.price * item.quantity).toFixed(2)} €
                    </div>
                  </div>

                  <div className="cartOverlay__actions">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="cartOverlay__remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {cart.length > 0 && (
        <div className="cartOverlay__footer">
          <p>Total : {totalPrice.toFixed(2)} €</p>
          <button className="cartOverlay__checkout" onClick={handleCheckout}>
            Passer la commande
          </button>
        </div>
      )}
    </section>
  );
}

export default CartOverlay;
