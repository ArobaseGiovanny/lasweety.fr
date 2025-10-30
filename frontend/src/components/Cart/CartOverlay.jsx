import "../Cart/cartOverlay.scss";
import { useCart } from "../../context/CartContext";
import products from "../../data/products";
import { IoCloseCircleSharp } from "react-icons/io5";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const SENDCLOUD_PUBLIC_KEY = import.meta.env.VITE_SENDCLOUD_PUBLIC_KEY;

// Charge le script Sendcloud si non présent (fallback si tu n'as pas mis la balise dans index.html)
function ensureSPPScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.sendcloud?.servicePoints) return resolve();
    const existing = document.querySelector('script[src*="embed.sendcloud.sc/spp"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://embed.sendcloud.sc/spp/1.0.0/api.min.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Sendcloud SPP"));
    document.head.appendChild(s);
  });
}

function CartOverlay({ isOpen, onClose }) {
  const { cart, totalPrice, removeFromCart, updateQuantity } = useCart();
  const [startY, setStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  const [showDeliveryChoice, setShowDeliveryChoice] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [deliveryMode, setDeliveryMode] = useState(null); // "home" | "pickup"
  // eslint-disable-next-line no-unused-vars
  const [pickupPoint, setPickupPoint] = useState(null);   // { id, name, address, zip, city, ... }

  // Swipe mobile
  const handleTouchStart = (e) => setStartY(e.touches[0].clientY);
  const handleTouchMove = (e) => {
    if (startY !== null) {
      const delta = e.touches[0].clientY - startY;
      if (delta > 0) setTranslateY(delta);
    }
  };
  const handleTouchEnd = () => {
    if (translateY > 80) onClose();
    setTranslateY(0);
    setStartY(null);
  };

  // Stripe checkout
  const handleCheckout = async (mode, point = null) => {
    try {
      const response = await fetch(`${API_URL}/checkout/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          deliveryMode: mode,
          pickupPoint: point, // null si domicile
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else console.error("Pas d’URL Stripe dans la réponse :", data);
    } catch (err) {
      console.error("Erreur lors du checkout :", err);
    }
  };

  const handleOrderClick = () => setShowDeliveryChoice(true);

  // Ouvre la carte Sendcloud (Service Point Picker)
  const openSendcloudPicker = async () => {
    try {
      await ensureSPPScript();
      if (!SENDCLOUD_PUBLIC_KEY) {
        alert("Clé publique Sendcloud manquante (VITE_SENDCLOUD_PUBLIC_KEY).");
        return;
      }

      // Doc officielle: nécessite apiKey, country, language; carriers peut filtrer. :contentReference[oaicite:2]{index=2}
      window.sendcloud.servicePoints.open(
        {
          apiKey: SENDCLOUD_PUBLIC_KEY,
          country: "FR",
          language: "fr-fr",
          carriers: ["chronopost"], // limite à Chronopost
          // Optionnel:
          // postalCode: "27000",
          // city: "Evreux",
        },
        // onSelect (succès)
        (point, postNumber) => {
          const p = {
            id: point?.id,
            name: point?.name,
            address: [point?.street, point?.house_number].filter(Boolean).join(" "),
            zip: point?.postal_code,
            city: point?.city,
            lat: Number(point?.latitude),
            lng: Number(point?.longitude),
            carrier: point?.carrier,
            postNumber: postNumber || null, // si présent
          };
          setPickupPoint(p);
          handleCheckout("pickup", p);
        },
        // onError
        (error) => {
          console.error("Sendcloud picker error:", error);
          alert("Impossible d’ouvrir la carte des points relais. Réessaie plus tard.");
        }
      );
    } catch (err) {
      console.error("Impossible de charger le script Sendcloud SPP :", err);
      alert("Chargement du module points relais échoué.");
    }
  };

  return (
    <>
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
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
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
            <button className="cartOverlay__checkout" onClick={handleOrderClick}>
              Passer la commande
            </button>
          </div>
        )}
      </section>

      {/* Popup centré : choix du mode de livraison */}
      {showDeliveryChoice && (
        <div
          className="deliveryModal"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="deliveryModal__content"
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "420px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: "1.25rem" }}>Choisissez votre mode de livraison</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                style={{
                  padding: "0.9rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#111",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setDeliveryMode("home");
                  setPickupPoint(null);
                  setShowDeliveryChoice(false);
                  handleCheckout("home", null);
                }}
              >
                Livraison à domicile
              </button>

              <button
                style={{
                  padding: "0.9rem",
                  borderRadius: "10px",
                  border: "1px solid #111",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
                onClick={async () => {
                  setDeliveryMode("pickup");
                  setShowDeliveryChoice(false);
                  await openSendcloudPicker();
                }}
              >
                Point relais Chronopost
              </button>
            </div>

            <button
              style={{
                marginTop: "1rem",
                border: "none",
                background: "transparent",
                color: "#666",
                cursor: "pointer",
              }}
              onClick={() => setShowDeliveryChoice(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CartOverlay;
