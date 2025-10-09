import "./productOverlay.scss";
import { useState } from "react";
import { IoCloseCircleSharp } from "react-icons/io5";
import { useCart } from "../../context/CartContext";

function ProductOverlay({ isOpen, onClose, product, onChangeColor }) {
  const [startY, setStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  const { addToCart } = useCart();

  // ➝ quantité gérée en state
  const [quantity, setQuantity] = useState(1);

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

  const increaseQuantity = () => setQuantity((q) => q + 1);
  const decreaseQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  // ➝ calcul dynamique du prix
  const totalPrice = product ? product.price * quantity : 0;

const handleAddToCart = () => {
  if (!product) return;

  const item = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity,
    subtotal: (product.price * quantity).toFixed(2),
  };

  console.log("Article ajouté :", item);

  // Stripe format
  const stripeItem = {
    price_data: {
      currency: "eur",
      product_data: {
        name: product.name,
      },
      unit_amount: Math.round(product.price * 100), // centimes
    },
    quantity,
  };

  console.log("Version Stripe:", stripeItem);

  addToCart(product, quantity);
  onClose();
};

  return (
    <section
      className={`productOverlay ${product ? product.color : ""} ${
        isOpen ? "isOpen" : ""
      }`}
      style={{ transform: isOpen ? `translateY(${translateY}px)` : undefined }}
    >
      <div
        className="productOverlay__scroll-hint"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span></span>
      </div>

      <div className="productOverlay__close">
        <IoCloseCircleSharp onClick={onClose} />
      </div>

      {product ? (
        <>
          <div className="productOverlay__images">
            {product.images.map((img, index) => (
              <img key={index} src={img.src} alt={img.alt} loading="lazy" />
            ))}
          </div>

          <div className="productOverlay__description">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
          </div>

          <div className="productOverlay__colors">
            <p>Choisir une autre couleur</p>
            <div className="productOverlay__box-color">
              <span
                className="productOverlay__box-color--orange"
                onClick={() => onChangeColor("orange")}
              />
              <span
                className="productOverlay__box-color--bleu"
                onClick={() => onChangeColor("bleu")}
              />
              <span
                className="productOverlay__box-color--rose"
                onClick={() => onChangeColor("rose")}
              />
              <span
                className="productOverlay__box-color--marron"
                onClick={() => onChangeColor("marron")}
              />
            </div>
          </div>

          <div className="productOverlay__purchase">
            <div className="productOverlay__quantity-price">
              <div className="productOverlay__quantity">
                <button
                  className="productOverlay__quantity-btn productOverlay__quantity-btn--minus"
                  aria-label="Diminuer la quantité"
                  onClick={decreaseQuantity}
                >
                  -
                </button>
                <span className="productOverlay__quantity-value">
                  {quantity}
                </span>
                <button
                  className="productOverlay__quantity-btn productOverlay__quantity-btn--plus"
                  aria-label="Augmenter la quantité"
                  onClick={increaseQuantity}
                >
                  +
                </button>
              </div>
              <data
                className="productOverlay__price"
                value={totalPrice.toFixed(2)}
              >
                {totalPrice.toFixed(2)} €
              </data>
            </div>

            <div className="productOverlay__add-to-cart">
              <button onClick={handleAddToCart}>Ajouter au panier</button>
              <p>Livraison offerte.</p>
            </div>
          </div>
        </>
      ) : (
        // si pas de produit sélectionné
        <div style={{ flex: 1 }} />
      )}
    </section>
  );
}

export default ProductOverlay;
