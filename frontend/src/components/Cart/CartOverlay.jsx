import "../Cart/cartOverlay.scss";
import { useCart } from "../../context/CartContext";
import products from "../../data/products";
import { IoCloseCircleSharp } from "react-icons/io5";
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

function CartOverlay({ isOpen, onClose }) {
  const { cart, totalPrice, removeFromCart, updateQuantity } = useCart();
  const [startY, setStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  // États flux commande
  const [showDeliveryChoice, setShowDeliveryChoice] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState(null); // "home" | "pickup"
  const [pickupPoint, setPickupPoint] = useState(null);   // { id, name, address, zip, city }

  // Popup 2 : sélection relais (liste)
  const [showPickupList, setShowPickupList] = useState(false);
  const [searchZip, setSearchZip] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [points, setPoints] = useState([]);
  const [errorPoints, setErrorPoints] = useState("");

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

  // Checkout Stripe
  const handleCheckout = async (mode, point = null) => {
    try {
      const response = await fetch(`${API_URL}/checkout/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          deliveryMode: mode,
          pickupPoint: point, // null si domicile
        }),
      });

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

  // Clic “Passer la commande” → ouvrir popup 1
  const handleOrderClick = () => setShowDeliveryChoice(true);

  // Charger points relais (liste)
  const fetchPoints = async () => {
    if (!searchZip && !searchCity) {
      setErrorPoints("Renseigne un code postal ou une ville.");
      return;
    }
    setErrorPoints("");
    setLoadingPoints(true);
    setPoints([]);
    try {
      const params = new URLSearchParams();
      if (searchZip) params.append("zip", searchZip);
      if (searchCity) params.append("city", searchCity);
      const res = await fetch(`${API_URL}/api/chronopost/points?${params.toString()}`);
      const json = await res.json();
      if (json?.points?.length) {
        setPoints(json.points);
      } else {
        setPoints([]);
        setErrorPoints("Aucun point relais trouvé avec ces critères.");
      }
    } catch (e) {
      setErrorPoints("Impossible de charger les points relais.");
    } finally {
      setLoadingPoints(false);
    }
  };

  // Sélection d’un relais → checkout
  const selectPickupAndCheckout = (p) => {
    setPickupPoint(p);
    setShowPickupList(false);
    handleCheckout("pickup", p);
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

      {/* Popup 1 : choix du mode de livraison */}
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
                onClick={() => {
                  setDeliveryMode("pickup");
                  setShowDeliveryChoice(false);
                  // Ouvrir le 2e popup (liste relais)
                  setShowPickupList(true);
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

      {/* Popup 2 : liste des points relais */}
      {showPickupList && (
        <div
          className="pickupModal"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            className="pickupModal__content"
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              width: "92%",
              maxWidth: "520px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Choisir un point relais</h3>
              <button
                style={{ border: "none", background: "transparent", fontSize: 16 }}
                onClick={() => setShowPickupList(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                type="text"
                placeholder="Code postal"
                value={searchZip}
                onChange={(e) => setSearchZip(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }}
              />
              <input
                type="text"
                placeholder="Ville"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }}
              />
              <button
                onClick={fetchPoints}
                style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#111", color: "#fff" }}
              >
                Rechercher
              </button>
            </div>

            {loadingPoints && <p style={{ marginTop: 12 }}>Chargement des points relais…</p>}
            {errorPoints && <p style={{ marginTop: 12, color: "crimson" }}>{errorPoints}</p>}

            <div style={{ marginTop: 12, maxHeight: 320, overflow: "auto" }}>
              {points.map((p) => (
                <div
                  key={p.id + p.address}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 14 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div>{p.address}</div>
                    <div>{p.zip} {p.city}</div>
                  </div>
                  <button
                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #111", background: "#fff", cursor: "pointer" }}
                    onClick={() => selectPickupAndCheckout(p)}
                  >
                    Choisir
                  </button>
                </div>
              ))}
              {!loadingPoints && !errorPoints && points.length === 0 && (
                <p style={{ color: "#666" }}>Aucun résultat pour l’instant. Lance une recherche.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CartOverlay;
