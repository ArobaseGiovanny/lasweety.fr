import "./productOverlay.scss";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoCloseCircleSharp } from "react-icons/io5";
import { useCart } from "../../context/CartContext";

function totalQty(list) {
  return Array.isArray(list)
    ? list.reduce((s, it) => s + Math.max(1, Number(it.quantity) || 1), 0)
    : 0;
}

function ProductOverlay({ isOpen, onClose, product, onChangeColor }) {
  const {
    addToCart,    // ⚠️ doit renvoyer true/false (voir CartContext fourni)
    cart,
    CART_MAX_ITEMS, // plafonné à 4
  } = useCart();

  const [startY, setStartY] = useState(null);
  const [translateY, setTranslateY] = useState(0);

  const [quantity, setQuantity] = useState(1);
  const [uiError, setUiError] = useState("");

  // ===== SPECS MODAL =====
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const specsDialogRef = useRef(null);
  const specsFirstFocusRef = useRef(null);
  const openSpecs = () => setIsSpecsOpen(true);
  const closeSpecs = () => setIsSpecsOpen(false);

  // ===== LIGHTBOX =====
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxViewportRef = useRef(null);
  const openLightbox = (idx = 0) => { setLightboxIndex(idx); setIsLightboxOpen(true); };
  const closeLightbox = () => setIsLightboxOpen(false);

  // Lock body scroll quand un overlay est ouvert
  useEffect(() => {
    if (isSpecsOpen || isLightboxOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [isSpecsOpen, isLightboxOpen]);

  // Positionner la lightbox au bon slide à l’ouverture
  useEffect(() => {
    if (isLightboxOpen && lightboxViewportRef.current) {
      const vp = lightboxViewportRef.current;
      const x = lightboxIndex * vp.clientWidth;
      vp.scrollTo({ left: x, top: 0, behavior: "instant" });
      if (vp.scrollLeft !== x) vp.scrollLeft = x;
      vp.focus();
    }
  }, [isLightboxOpen, lightboxIndex]);

  // Échap / flèches
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (isLightboxOpen) { e.stopPropagation(); closeLightbox(); }
        else if (isSpecsOpen) { e.stopPropagation(); closeSpecs(); }
      }
      if (isLightboxOpen && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        const vp = lightboxViewportRef.current;
        if (!vp) return;
        const total = images.length;
        const nextIdx = e.key === "ArrowRight"
          ? (lightboxIndex + 1) % total
          : (lightboxIndex - 1 + total) % total;
        setLightboxIndex(nextIdx);
        requestAnimationFrame(() => {
          vp.scrollTo({ left: nextIdx * vp.clientWidth, behavior: "smooth" });
        });
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [isSpecsOpen, isLightboxOpen, lightboxIndex]); // eslint-disable-line

  const onLightboxScroll = () => {
    const vp = lightboxViewportRef.current;
    if (!vp) return;
    setLightboxIndex(Math.round(vp.scrollLeft / vp.clientWidth));
  };

  // Swipe vertical pour fermer l’overlay produit
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

  // ===== QUOTAS PANIER =====
  const cartQty = totalQty(cart);
  const remaining = Math.max(0, CART_MAX_ITEMS - cartQty); // combien on peut encore ajouter

  // Efface l'erreur si on repasse sous la limite
  useEffect(() => {
    if (cartQty <= CART_MAX_ITEMS && uiError) setUiError("");
  }, [cartQty, CART_MAX_ITEMS, uiError]);

  const increaseQuantity = () => {
    // on n'autorise pas de quantité locale > remaining
    if (remaining <= 0) {
      setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`);
      return;
    }
    setQuantity((q) => {
      const next = q + 1;
      if (next > remaining) {
        setUiError(`Il reste ${remaining} article${remaining > 1 ? "s" : ""} possible${remaining > 1 ? "s" : ""}.`);
        return remaining;
      }
      return next;
    });
  };

  const decreaseQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const totalPrice = product ? product.price * quantity : 0;

  const handleAddToCart = () => {
    if (!product) return;

    if (remaining <= 0) {
      setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`);
      return;
    }

    // on limite la quantité ajoutée à ce qui reste possible
    const toAdd = Math.min(quantity, remaining);

    const ok = addToCart(product, toAdd); // CartContext refusera si ça dépasse
    if (!ok) {
      setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`);
      return;
    }

    // Si la quantité demandée > possible, informer l'utilisateur
    if (quantity > toAdd) {
      setUiError(`Ajout limité à ${toAdd} (maximum ${CART_MAX_ITEMS} articles par commande).`);
    } else {
      setUiError("");
    }

    onClose();
  };

  // ===== CARROUSEL =====
  const images = product?.images ?? [];
  const [current, setCurrent] = useState(0);
  const trackRef = useRef(null);

  const goTo = (idx) => { if (!images.length) return; setCurrent((idx + images.length) % images.length); };
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

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
    if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
  };
  const onImgTouchEnd = (e) => {
    if (!swipe.current.dragging) return;
    const changed = e.changedTouches[0];
    const dx = changed.clientX - swipe.current.x;
    const threshold = 40;
    if (dx <= -threshold) next();
    if (dx >= threshold) prev();
    swipe.current.dragging = false;
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  const onSpecsBackdropClick = (e) => {
    if (e.target === specsDialogRef.current) closeSpecs();
  };

  const onLightboxBackdrop = (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  };

  return (
    <section
      className={`productOverlay ${product ? product.color : ""} ${isOpen ? "isOpen" : ""}`}
      style={{ transform: isOpen ? `translateY(${translateY}px)` : undefined }}
    >
      {/* swipe hint */}
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

      {/* bannière erreur panier */}
      {uiError && (
        <div className="productOverlay__error" role="alert">
          {uiError}
        </div>
      )}

      {product ? (
        <>
          {/* ===== CARROUSEL ===== */}
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
                  <div key={i} className="productOverlay__carousel-slide" aria-hidden={current !== i}>
                    <button
                      type="button"
                      className="productOverlay__imgBtn"
                      onClick={() => openLightbox(i)}
                      aria-label={`Agrandir l'image ${i + 1}`}
                    >
                      <img src={img.src} alt={img.alt || `${product.name} image ${i + 1}`} loading="lazy" />
                    </button>
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
          {/* ===== FIN CARROUSEL ===== */}

          <div className="productOverlay__description">
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
                  disabled={remaining <= 0 || quantity >= remaining}
                >
                  +
                </button>
              </div>
              <data className="productOverlay__price" value={totalPrice.toFixed(2)}>
                {totalPrice.toFixed(2)} €
              </data>
              {remaining <= 2 && (
                <p className="productOverlay__remaining">
                  {remaining > 0
                    ? `Il reste ${remaining} article${remaining > 1 ? "s" : ""} possible${remaining > 1 ? "s" : ""}.`
                    : `Limite du panier atteinte (${CART_MAX_ITEMS}).`}
                </p>
              )}
            </div>

            <div className="productOverlay__add-to-cart">
              <button onClick={handleAddToCart} disabled={remaining <= 0}>
                Ajouter au panier
              </button>
              <p>Livraison offerte.</p>
            </div>
          </div>

          {/* ===== SPECS MODAL ===== */}
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
          {/* ===== FIN SPECS MODAL ===== */}

          {/* ===== LIGHTBOX en PORTAL ===== */}
          {isLightboxOpen &&
            createPortal(
              (
                <div
                  className="lightbox"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Galerie — ${product.name}`}
                  onMouseDown={onLightboxBackdrop}
                  onTouchStart={onLightboxBackdrop}
                >
                  <button
                    type="button"
                    className="lightbox__close"
                    aria-label="Fermer la galerie"
                    onClick={closeLightbox}
                  >
                    <IoCloseCircleSharp aria-hidden="true" />
                  </button>

                  <div
                    ref={lightboxViewportRef}
                    className="lightbox__viewport"
                    tabIndex={-1}
                    onScroll={onLightboxScroll}
                  >
                    <div className="lightbox__track">
                      {images.map((img, i) => (
                        <figure key={i} className="lightbox__slide" aria-hidden={lightboxIndex !== i}>
                          <img
                            className="lightbox__img"
                            src={img.src}
                            alt={img.alt || `${product.name} image ${i + 1} agrandie`}
                            draggable={false}
                          />
                          {img.alt && <figcaption className="lightbox__caption">{img.alt}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="lightbox__arrow lightbox__arrow--prev"
                        aria-label="Image précédente"
                        onClick={() => {
                          const vp = lightboxViewportRef.current;
                          if (!vp) return;
                          const total = images.length;
                          const idx = ((lightboxIndex - 1) % total + total) % total;
                          setLightboxIndex(idx);
                          vp.scrollTo({ left: idx * vp.clientWidth, behavior: "smooth" });
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="lightbox__arrow lightbox__arrow--next"
                        aria-label="Image suivante"
                        onClick={() => {
                          const vp = lightboxViewportRef.current;
                          if (!vp) return;
                          const total = images.length;
                          const idx = ((lightboxIndex + 1) % total + total) % total;
                          setLightboxIndex(idx);
                          vp.scrollTo({ left: idx * vp.clientWidth, behavior: "smooth" });
                        }}
                      >
                        ›
                      </button>

                      <div className="lightbox__dots" role="tablist" aria-label="Sélecteur d'image">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            className={`lightbox__dot ${i === lightboxIndex ? "isActive" : ""}`}
                            role="tab"
                            aria-selected={i === lightboxIndex}
                            aria-label={`Aller à l'image ${i + 1}`}
                            onClick={() => {
                              const vp = lightboxViewportRef.current;
                              if (!vp) return;
                              setLightboxIndex(i);
                              vp.scrollTo({ left: i * vp.clientWidth, behavior: "smooth" });
                            }}
                          />
                        ))}
                      </div>

                      <div className="lightbox__counter" aria-live="polite">
                        {lightboxIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
              ),
              document.body
            )
          }
          {/* ===== FIN LIGHTBOX ===== */}
        </>
      ) : (
        <div style={{ flex: 1 }} />
      )}
    </section>
  );
}

export default ProductOverlay;
