import "./productOverlay.scss";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoCloseCircleSharp } from "react-icons/io5";
import { FiInfo } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import { useCart } from "../../context/CartContext";

function totalQty(list) {
  return Array.isArray(list)
    ? list.reduce((s, it) => s + Math.max(1, Number(it.quantity) || 1), 0)
    : 0;
}

function ProductOverlay({ isOpen, onClose, product, onChangeColor }) {
  const { addToCart, cart, CART_MAX_ITEMS } = useCart();

  const [startY, setStartY]       = useState(null);
  const [translateY, setTranslateY] = useState(0);
  const [quantity, setQuantity]   = useState(1);
  const [uiError, setUiError]     = useState("");

  // ===== SPECS MODAL =====
  const [isSpecsOpen, setIsSpecsOpen]   = useState(false);
  const specsDialogRef    = useRef(null);
  const specsFirstFocusRef = useRef(null);
  const openSpecs  = () => setIsSpecsOpen(true);
  const closeSpecs = () => setIsSpecsOpen(false);

  // ===== STOCK =====
  const [stock, setStock]             = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError]   = useState(null);

  // ===== LIGHTBOX =====
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex]   = useState(0);
  const lightboxViewportRef = useRef(null);
  const openLightbox  = (idx = 0) => { setLightboxIndex(idx); setIsLightboxOpen(true); };
  const closeLightbox = () => setIsLightboxOpen(false);


  // ===== LOAD STOCK =====
  useEffect(() => {
    if (!product || !isOpen) return;
    const controller = new AbortController();
    setStockLoading(true);
    setStockError(null);
    fetch("https://api.lasweety.com/api/products", { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(list => {
        const match = Array.isArray(list) ? list.find(p => String(p.id) === String(product.id)) : null;
        if (!match) { setStock(null); setStockError("Stock non disponible pour ce produit."); return; }
        setStock(typeof match.stock === "number" ? match.stock : null);
      })
      .catch(err => { if (err.name === "AbortError") return; setStockError("Stock indisponible pour le moment."); })
      .finally(() => setStockLoading(false));
    return () => controller.abort();
  }, [product, isOpen]);

  // Lock body scroll quand overlay interne ouvert
  useEffect(() => {
    if (isSpecsOpen || isLightboxOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [isSpecsOpen, isLightboxOpen]);

  // Lightbox scroll au bon slide
  useEffect(() => {
    if (isLightboxOpen && lightboxViewportRef.current) {
      const vp = lightboxViewportRef.current;
      const x  = lightboxIndex * vp.clientWidth;
      vp.scrollTo({ left: x, top: 0, behavior: "instant" });
      if (vp.scrollLeft !== x) vp.scrollLeft = x;
      vp.focus();
    }
  }, [isLightboxOpen, lightboxIndex]);

  // Clavier lightbox
  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") {
        if (isLightboxOpen) { e.stopPropagation(); closeLightbox(); }
        else if (isSpecsOpen) { e.stopPropagation(); closeSpecs(); }
      }
      if (isLightboxOpen && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        lightboxGoTo(e.key === "ArrowRight" ? lightboxIndex + 1 : lightboxIndex - 1);
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

  // Swipe vertical ferme overlay
  const handleTouchStart = e => setStartY(e.touches[0].clientY);
  const handleTouchMove  = e => {
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

  // Panier
  const cartQty   = totalQty(cart);
  const remaining = Math.max(0, CART_MAX_ITEMS - cartQty);

  useEffect(() => {
    if (cartQty <= CART_MAX_ITEMS && uiError) setUiError("");
  }, [cartQty, CART_MAX_ITEMS, uiError]);

  const increaseQuantity = () => {
    if (remaining <= 0) { setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`); return; }
    setQuantity(q => {
      const next = q + 1;
      if (next > remaining) { setUiError(`Il reste ${remaining} article${remaining > 1 ? "s" : ""} possible${remaining > 1 ? "s" : ""}.`); return remaining; }
      return next;
    });
  };
  const decreaseQuantity = () => setQuantity(q => q > 1 ? q - 1 : 1);
  const totalPrice = product ? product.price * quantity : 0;

  const handleAddToCart = () => {
    if (!product) return;
    if (remaining <= 0) { setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`); return; }
    const toAdd = Math.min(quantity, remaining);
    const ok = addToCart(product, toAdd);
    if (!ok) { setUiError(`Quantité maximale: ${CART_MAX_ITEMS} articles par commande.`); return; }
    if (quantity > toAdd) { setUiError(`Ajout limité à ${toAdd} (maximum ${CART_MAX_ITEMS} articles par commande).`); }
    else { setUiError(""); }
    onClose();
  };

  // Reset au changement de produit
  useEffect(() => {
    setQuantity(1);
    setUiError("");
  }, [product?.id]);

  const images = product?.images ?? [];

  const onSpecsBackdropClick = e => { if (e.target === specsDialogRef.current) closeSpecs(); };
  const onLightboxBackdrop   = e => { if (e.target === e.currentTarget) closeLightbox(); };
  const lightboxGoTo = idx => {
    const total = images.length;
    const next  = ((idx % total) + total) % total;
    setLightboxIndex(next);
    const vp = lightboxViewportRef.current;
    if (vp) vp.scrollTo({ left: next * vp.clientWidth, behavior: "smooth" });
  };

  return (
    <section
      className={`productOverlay ${product ? product.color : ""} ${isOpen ? "isOpen" : ""}`}
      style={{ transform: isOpen ? `translateY(${translateY}px)` : undefined }}
    >
      {/* Handle swipe */}
      <div
        className="productOverlay__scroll-hint"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <span />
      </div>

      <div className="productOverlay__close">
        <IoCloseCircleSharp onClick={onClose} />
      </div>

      {uiError && <div className="productOverlay__error" role="alert">{uiError}</div>}

      {product ? (
        <>
          {/* ===== SWIPER CARD STACK ===== */}
          <Swiper
            key={product.id}
            effect="cards"
            grabCursor={true}
            modules={[EffectCards]}
            className="productOverlay__swiper"
          >
            {images.map((img, i) => (
              <SwiperSlide
                key={i}
                className="productOverlay__swiper-slide"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={img.src}
                  alt={img.alt || `${product.name} image ${i + 1}`}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* ===== DESCRIPTION + INFO ===== */}
          <div className="productOverlay__description">
            <div className="productOverlay__title-row">
              <h2>{product.name}</h2>
              {product?.specs?.length > 0 && (
                <button
                  type="button"
                  className="productOverlay__info-btn"
                  onClick={openSpecs}
                  aria-label="Voir les caractéristiques"
                  aria-haspopup="dialog"
                >
                  <FiInfo />
                </button>
              )}
            </div>
            <p>{product.description}</p>
          </div>

          {/* ===== COULEURS ===== */}
          <div className="productOverlay__colors">
            <p>Choisir une autre couleur</p>
            <div className="productOverlay__box-color">
              <span className="productOverlay__box-color--bleu"   onClick={() => onChangeColor("bleu")} />
              <span className="productOverlay__box-color--rose"   onClick={() => onChangeColor("rose")} />
              <span className="productOverlay__box-color--marron" onClick={() => onChangeColor("marron")} />
            </div>
          </div>

          {/* ===== ACHAT ===== */}
          <div className="productOverlay__purchase">
            <div className="productOverlay__quantity-price">
              <div className="productOverlay__quantity">
                <button className="productOverlay__quantity-btn productOverlay__quantity-btn--minus" aria-label="Diminuer" onClick={decreaseQuantity}>−</button>
                <span className="productOverlay__quantity-value">{quantity}</span>
                <button className="productOverlay__quantity-btn productOverlay__quantity-btn--plus" aria-label="Augmenter" onClick={increaseQuantity} disabled={remaining <= 0 || quantity >= remaining}>+</button>
              </div>
              <data className="productOverlay__price" value={totalPrice.toFixed(2)}>{totalPrice.toFixed(2)}</data>
              {remaining <= 2 && (
                <p className="productOverlay__remaining">
                  {remaining > 0 ? `Vous pouvez encore ajouter ${remaining} article${remaining > 1 ? "s" : ""}` : `Limite du panier atteinte (${CART_MAX_ITEMS}).`}
                </p>
              )}
            </div>

            <div className="productOverlay__add-to-cart">
              <button onClick={handleAddToCart} disabled={remaining <= 0 || stock === 0 || stock === null || stockLoading}>
                {stock === 0 || stock === null ? "Rupture de stock" : "Ajouter au panier"}
              </button>
              <div className="productOverlay__delivery-stock">
                <p>Livraison offerte.</p>
                <div className="productOverlay__stock">
                  {stockLoading && <p>Chargement…</p>}
                  {!stockLoading && stockError && <p>{stockError}</p>}
                  {!stockLoading && !stockError && typeof stock === "number" && (
                    stock > 0
                      ? <p>{stock <= 3 ? `Plus que ${stock} exemplaire${stock > 1 ? "s" : ""} en stock` : `${stock} exemplaires en stock`}</p>
                      : <p>Rupture de stock</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===== SPECS MODAL ===== */}
          {isSpecsOpen && (
            <div className="productOverlay__specs-backdrop" role="presentation" ref={specsDialogRef} onMouseDown={onSpecsBackdropClick} onTouchStart={onSpecsBackdropClick}>
              <div className="productOverlay__specs-modal" role="dialog" id="product-specs-dialog" aria-modal="true" aria-labelledby="product-specs-title" tabIndex={-1}>
                <header className="productOverlay__specs-header">
                  <h3 id="product-specs-title" className="productOverlay__specs-title">Caractéristiques — {product.name}</h3>
                  <button ref={specsFirstFocusRef} type="button" className="productOverlay__specs-close" aria-label="Fermer" onClick={closeSpecs}>
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

          {/* ===== LIGHTBOX ===== */}
          {isLightboxOpen && createPortal((
            <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Galerie — ${product.name}`} onMouseDown={onLightboxBackdrop} onTouchStart={onLightboxBackdrop}>
              <button type="button" className="lightbox__close" aria-label="Fermer" onClick={closeLightbox}>
                <IoCloseCircleSharp aria-hidden="true" />
              </button>
              <div ref={lightboxViewportRef} className="lightbox__viewport" tabIndex={-1} onScroll={onLightboxScroll}>
                <div className="lightbox__track">
                  {images.map((img, i) => (
                    <figure key={i} className="lightbox__slide" aria-hidden={lightboxIndex !== i}>
                      <img className="lightbox__img" src={img.src} alt={img.alt || `${product.name} image ${i + 1} agrandie`} draggable={false} />
                      {img.alt && <figcaption className="lightbox__caption">{img.alt}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button type="button" className="lightbox__arrow lightbox__arrow--prev" aria-label="Précédent" onClick={() => lightboxGoTo(lightboxIndex - 1)}>‹</button>
                  <button type="button" className="lightbox__arrow lightbox__arrow--next" aria-label="Suivant"   onClick={() => lightboxGoTo(lightboxIndex + 1)}>›</button>
                  <div className="lightbox__dots" role="tablist">
                    {images.map((_, i) => (
                      <button key={i} className={`lightbox__dot ${i === lightboxIndex ? "isActive" : ""}`} role="tab" aria-selected={i === lightboxIndex} aria-label={`Image ${i + 1}`} onClick={() => lightboxGoTo(i)} />
                    ))}
                  </div>
                  <div className="lightbox__counter" aria-live="polite">{lightboxIndex + 1} / {images.length}</div>
                </>
              )}
            </div>
          ), document.body)}
        </>
      ) : (
        <div style={{ flex: 1 }} />
      )}
    </section>
  );
}

export default ProductOverlay;
