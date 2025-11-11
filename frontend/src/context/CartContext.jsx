// src/context/CartContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const CART_MAX_ITEMS = 4;

const CartContext = createContext();

function totalQty(list) {
  return Array.isArray(list)
    ? list.reduce((s, it) => s + Math.max(1, Number(it.quantity) || 1), 0)
    : 0;
}

export function CartProvider({ children }) {
  // ➝ Initialisation : si localStorage contient un panier, on l'utilise
  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch {
      return [];
    }
  });

  // ➝ Sauvegarde automatique dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ➝ Helper: total si on change une ligne à newQty
  const nextTotalIfChange = (productId, newQty) => {
    const safeNew = Math.max(1, Number(newQty) || 1);
    return cart.reduce((sum, it) => {
      const q = it.id === productId ? safeNew : it.quantity;
      return sum + Math.max(1, Number(q) || 1);
    }, 0);
  };

  // ➝ Ajouter au panier (respecte le plafond). Retourne true/false.
  const addToCart = (product, quantity = 1) => {
    const safeQty = Math.max(1, Number(quantity) || 1);

    // calcule le total futur
    const existing = cart.find((it) => it.id === product.id);
    const futureTotal = existing
      ? totalQty(cart) - existing.quantity + (existing.quantity + safeQty)
      : totalQty(cart) + safeQty;

    if (futureTotal > CART_MAX_ITEMS) return false;

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + safeQty,
        };
        return updated;
      }
      return [
        ...prev,
        { id: product.id, name: product.name, quantity: safeQty, price: product.price },
      ];
    });
    return true;
  };

  // ➝ Vider le panier
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // ➝ Supprimer un produit
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // ➝ Changer la quantité (respecte le plafond). Retourne true/false.
  const updateQuantity = (productId, newQuantity) => {
    const nextTotal = nextTotalIfChange(productId, newQuantity);
    if (nextTotal > CART_MAX_ITEMS) return false;

    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, Number(newQuantity) || 1) }
          : item
      )
    );
    return true;
  };

  // ➝ Prix total
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalPrice,
        clearCart,
        CART_MAX_ITEMS,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
