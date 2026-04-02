import "../Cart/cartOverlay.scss";
import { useCart } from "../../context/CartContext";
import products from "../../data/products";
import { IoCloseCircleSharp } from "react-icons/io5";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

function totalQty(list) {
  return Array.isArray(list)
    ? list.reduce((s, it) => s + Math.max(1, Number(it.quantity) || 1), 0)
    : 0;
}

function CartOverlay({ isOpen, onClose }) {
  const {
    cart,
    totalPrice,
    removeFromCart,
    updateQuantity,   // ⚠️ retourne true/false avec le nouveau CartContext
    CART_MAX_ITEMS,   // plafond global (4)
  } = useCart();

  const [startY, setStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  const [showDeliveryChoice, setShowDeliveryChoice] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [deliveryMode, setDeliveryMode] = useState(null); // "home" | "pickup"
  // eslint-disable-next-line no-unused-vars
  const [pickupPoint, setPickupPoint] = useState(null);   // { id, name, address, zip, city, ... }

  // pop-up code postal
  const [showPostalModal, setShowPostalModal] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [postalError, setPostalError] = useState("");

  // UI error banner
  const [uiError, setUiError] = useState("");

  // 🔄 Effet: montre/retire l'avertissement automatiquement si > MAX
  useEffect(() => {
    const qty = totalQty(cart);
    if (qty > CART_MAX_ITEMS) {
      setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`);
    } else if (uiError) {
      setUiError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // helper de mise à jour protégée (utilise le booléen retourné par updateQuantity)
  function setQuantitySafe(id, newQty) {
    const ok = updateQuantity(id, newQty);
    if (!ok) {
      setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`);
    }
  }

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

  // Stripe checkout (avec gestion d'erreurs UI)
  const handleCheckout = async (mode, point = null) => {
    try {
      // garde-fou local avant appel backend
      const qty = totalQty(cart);
      if (qty > CART_MAX_ITEMS) {
        setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`);
        return;
      }

      const response = await fetch(`${API_URL}/checkout/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          deliveryMode: mode,
          pickupPoint: point, // null si domicile
        }),
      });

      if (!response.ok) {
        let msg = "Une erreur est survenue.";
        try {
          const data = await response.json();
          msg = data?.error || msg;
        } catch {msg}
        setUiError(msg);
        return;
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setUiError("Pas d’URL de paiement reçue. Réessaie dans quelques instants.");
      }
    } catch (err) {
      console.error("Erreur lors du checkout :", err);
      setUiError("Connexion au serveur impossible. Vérifie ta connexion et réessaie.");
    }
  };

  const handleOrderClick = () => {
    const qty = totalQty(cart);
    if (qty === 0) return;
    if (qty > CART_MAX_ITEMS) {
      setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`);
      return;
    }
    setShowDeliveryChoice(true);
  };

  // Ouvre la carte Sendcloud (Service Point Picker) avec options
  const openSendcloudPicker = async ({ postalCode, coords } = {}) => {
    try {
      await ensureSPPScript();
      if (!SENDCLOUD_PUBLIC_KEY) {
        setUiError("Clé publique Sendcloud manquante (VITE_SENDCLOUD_PUBLIC_KEY).");
        return;
      }

      const baseOptions = {
        apiKey: SENDCLOUD_PUBLIC_KEY,
        country: "FR",
        language: "fr-fr",
        carriers: ["mondial_relay"],
      };

      const opts = { ...baseOptions };
      if (postalCode) opts.postalCode = String(postalCode).trim();
      if (coords?.latitude && coords?.longitude) {
        opts.latitude = Number(coords.latitude);
        opts.longitude = Number(coords.longitude);
      }

      window.sendcloud.servicePoints.open(
        opts,
        // onSelect
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
            postNumber: postNumber || null,
          };
          setPickupPoint(p);
          handleCheckout("pickup", p);
        },
        // onError
        () => {
          setUiError("Impossible d’ouvrir la carte des points relais. Réessaie plus tard.");
        }
      );
    } catch {
      setUiError("Chargement du module points relais échoué.");
    }
  };

  const isValidPostal = (cp) => /^[0-9]{5}$/.test((cp || "").trim());

  const continueWithPostal = async () => {
    if (!isValidPostal(postalCode)) {
      setPostalError("Entre un code postal valide (5 chiffres).");
      return;
    }
    setPostalError("");
    setShowPostalModal(false);
    await openSendcloudPicker({ postalCode });
  };

  return (
    <>
      {isOpen && createPortal(
        <div className="cartOverlay__backdrop" onClick={onClose} />,
        document.body
      )}
      <section
        className={`cartOverlay ${isOpen ? "isOpen" : ""}`}
        style={{ transform: (isOpen && translateY > 0) ? `translateY(${translateY}px)` : undefined }}
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

        <h2 className="cartOverlay__title">Panier</h2>

        {/* Bannière d'erreur UI */}
        {uiError && (
          <div className="cartOverlay__error-cart-length">
            <span style={{ fontSize: 14 }}>{uiError}</span>
          </div>
        )}

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
                        {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <div className="cartOverlay__actions">
                      <button onClick={() => setQuantitySafe(item.id, Math.max(1, item.quantity - 1))}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => setQuantitySafe(item.id, item.quantity + 1)}>
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
            <p>{totalPrice.toFixed(2)}</p>
            <button
              className="cartOverlay__checkout"
              onClick={handleOrderClick}
              disabled={totalQty(cart) > CART_MAX_ITEMS}
              style={totalQty(cart) > CART_MAX_ITEMS ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              Passer la commande
            </button>
          </div>
        )}
      </section>

      {/* Popup centré : choix du mode de livraison */}
      {showDeliveryChoice && (
        <div className="deliveryModal">
          <div className="deliveryModal__content">
            <h3>Mode de livraison</h3>
            <div className="deliveryModal__options">
              <button
                className="deliveryModal__btn deliveryModal__btn--primary"
                onClick={() => {
                  setDeliveryMode("home");
                  setPickupPoint(null);
                  setShowDeliveryChoice(false);
                  handleCheckout("home", null);
                }}
              >
                🏠 Livraison à domicile
              </button>
              <button
                className="deliveryModal__btn"
                onClick={() => {
                  setDeliveryMode("pickup");
                  setShowDeliveryChoice(false);
                  setShowPostalModal(true);
                }}
              >
                📦 Point relais Mondial Relay
              </button>
            </div>
            <button className="deliveryModal__cancel" onClick={() => setShowDeliveryChoice(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Popup "Code postal" avant d'ouvrir la carte */}
      {showPostalModal && (
        <div className="postalModal">
          <div className="postalModal__content">
            <h3>Point relais</h3>
            <p>Entre ton code postal pour afficher les points relais près de chez toi</p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              placeholder="Ex. 75001"
              value={postalCode}
              className={`postalModal__input${postalError ? " postalModal__input--error" : ""}`}
              onChange={(e) => {
                setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5));
                setPostalError("");
              }}
            />
            {postalError && <p className="postalModal__error">{postalError}</p>}
            <button className="postalModal__submit" onClick={continueWithPostal}>
              Continuer
            </button>
            <button className="postalModal__cancel" onClick={() => setShowPostalModal(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CartOverlay;
