import "./productOverlay.scss";
import { useState, useRef, useEffect } from "react";
import { IoCloseCircleSharp } from "react-icons/io5";
import { useCart } from "../../context/CartContext";

function ProductOverlay({ isOpen, onClose, product, onChangeColor }) {
  const [startY, setStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);

  // ====== SPECS MODAL STATE ======
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const specsDialogRef = useRef(null);
  const specsFirstFocusRef = useRef(null);
  const openSpecs = () => setIsSpecsOpen(true);
  const closeSpecs = () => setIsSpecsOpen(false);

  // Disable body scroll when specs modal is open
  useEffect(() => {
    if (isSpecsOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // focus first element in modal
      setTimeout(() => {
        specsFirstFocusRef.current?.focus();
      }, 0);
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isSpecsOpen]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isSpecsOpen) {
        e.stopPropagation();
        closeSpecs();
      }
    };
    window.addEventListener("keydown", onKey, { passive: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [isSpecsOpen]);

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };
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

  const increaseQuantity = () => setQuantity((q) => q + 1);
  const decreaseQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

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
    const stripeItem = {
      price_data: {
        currency: "eur",
        product_data: { name: product.name },
        unit_amount: Math.round(product.price * 100),
      },
      quantity,
    };
    console.log(item, stripeItem);
    addToCart(product, quantity);
    onClose();
  };

  // ====== CARROUSEL ======
  const images = product?.images ?? [];
  const [current, setCurrent] = useState(0);
  const trackRef = useRef(null);

  const goTo = (idx) => {
    if (!images.length) return;
    const wrapped = (idx + images.length) % images.length;
    setCurrent(wrapped);
  };
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // swipe horizontal (limité à la zone images)
  const swipe = useRef({ x: 0, y: 0, dragging: false });
  const onImgTouchStart = (e) => {
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY, dragging: true };
  };
  const onImgTouchMove = (e) => {
    if (!swipe.current.dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - swipe.current.x;
    const dy = t.clientY - swipe.current.y;
    // si le geste est plus horizontal que vertical on empêche le scroll
    if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
  };
  const onImgTouchEnd = (e) => {
    if (!swipe.current.dragging) return;
    const changed = e.changedTouches[0];
    const dx = changed.clientX - swipe.current.x;
    const threshold = 40; // px
    if (dx <= -threshold) next();
    if (dx >= threshold) prev();
    swipe.current.dragging = false;
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  // Close specs when clicking backdrop
  const onSpecsBackdropClick = (e) => {
    if (e.target === specsDialogRef.current) {
      closeSpecs();
    }
  };

  return (
    <section
      className={`productOverlay ${product ? product.color : ""} ${isOpen ? "isOpen" : ""}`}
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
          {/* ====== CARROUSEL ====== */}
          <div
            className="productOverlay__carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label={`Images de ${product.name}`}
            onKeyDown={onKeyDown}
            tabIndex={0}
          >
            <div
              className="productOverlay__carousel-viewport"
              onTouchStart={onImgTouchStart}
              onTouchMove={onImgTouchMove}
              onTouchEnd={onImgTouchEnd}
            >
              <div
                ref={trackRef}
                className="productOverlay__carousel-track"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="productOverlay__carousel-slide"
                    aria-hidden={current !== i}
                  >
                    <img src={img.src} alt={img.alt || `${product.name} image ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  className="productOverlay__carousel-arrow productOverlay__carousel-arrow--prev"
                  onClick={prev}
                  aria-label="Image précédente"
                >
                  ‹
                </button>
                <button
                  className="productOverlay__carousel-arrow productOverlay__carousel-arrow--next"
                  onClick={next}
                  aria-label="Image suivante"
                >
                  ›
                </button>

                <div className="productOverlay__carousel-dots" role="tablist" aria-label="Sélecteur d'image">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`productOverlay__carousel-dot ${i === current ? "isActive" : ""}`}
                      onClick={() => goTo(i)}
                      role="tab"
                      aria-selected={i === current}
                      aria-label={`Aller à l'image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {/* ====== FIN CARROUSEL ====== */}

          <div className="productOverlay__description">
                        {/* ====== LINK TO SPECS MODAL ====== */}
            {product?.specs?.length > 0 && (
              <button
                type="button"
                className="productOverlay__specs-link"
                onClick={openSpecs}
                aria-haspopup="dialog"
                aria-controls="product-specs-dialog"
              >
                Voir les caractéristiques
              </button>
            )}
            <h2>{product.name}</h2>
            <p>{product.description}</p>
          </div>

          <div className="productOverlay__colors">
            <p>Choisir une autre couleur</p>
            <div className="productOverlay__box-color">
              <span className="productOverlay__box-color--orange" onClick={() => onChangeColor("orange")} />
              <span className="productOverlay__box-color--bleu" onClick={() => onChangeColor("bleu")} />
              <span className="productOverlay__box-color--rose" onClick={() => onChangeColor("rose")} />
              <span className="productOverlay__box-color--marron" onClick={() => onChangeColor("marron")} />
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
                <span className="productOverlay__quantity-value">{quantity}</span>
                <button
                  className="productOverlay__quantity-btn productOverlay__quantity-btn--plus"
                  aria-label="Augmenter la quantité"
                  onClick={increaseQuantity}
                >
                  +
                </button>
              </div>
              <data className="productOverlay__price" value={totalPrice.toFixed(2)}>
                {totalPrice.toFixed(2)} €
              </data>
            </div>

            <div className="productOverlay__add-to-cart">
              <button onClick={handleAddToCart}>Ajouter au panier</button>
              <p>Livraison offerte.</p>
            </div>
          </div>

          {/* ====== SPECS MODAL ====== */}
          {isSpecsOpen && (
            <div
              className="productOverlay__specs-backdrop"
              role="presentation"
              ref={specsDialogRef}
              onMouseDown={onSpecsBackdropClick}
              onTouchStart={onSpecsBackdropClick}
            >
              <div
                className="productOverlay__specs-modal"
                role="dialog"
                id="product-specs-dialog"
                aria-modal="true"
                aria-labelledby="product-specs-title"
                aria-describedby="product-specs-description"
                tabIndex={-1}
              >
                <header className="productOverlay__specs-header">
                  <h3 id="product-specs-title" className="productOverlay__specs-title">
                    Caractéristiques — {product.name}
                  </h3>
                  <button
                    ref={specsFirstFocusRef}
                    type="button"
                    className="productOverlay__specs-close"
                    aria-label="Fermer la fenêtre des caractéristiques"
                    onClick={closeSpecs}
                  >
                    <IoCloseCircleSharp aria-hidden="true" />
                  </button>
                </header>

                <div id="product-specs-description" className="productOverlay__specs-content">
                  <dl className="productOverlay__specs-list">
                    {product.specs.map((s, i) => (
                      <div key={`${s.label}-${i}`} className="productOverlay__specs-row">
                        <dt className="productOverlay__specs-label">{s.label}</dt>
                        <dd className="productOverlay__specs-value">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          )}
          {/* ====== FIN SPECS MODAL ====== */}
        </>
      ) : (
        <div style={{ flex: 1 }} />
      )}
    </section>
  );
}

export default ProductOverlay;
