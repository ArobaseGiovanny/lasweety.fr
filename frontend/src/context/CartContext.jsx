// src/context/CartContext.jsx
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // ➝ Ajouter au panier
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);

      if (existingIndex !== -1) {
        // produit déjà présent → on augmente la quantité
        const updatedCart = [...prev];
        updatedCart[existingIndex].quantity += quantity;
        return updatedCart;
      }

      // sinon on l’ajoute
      return [...prev, { id: product.id, quantity, price: product.price }];
    });
  };

  // ➝ Supprimer un produit
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // ➝ Changer la quantité d’un produit
  const updateQuantity = (productId, newQuantity) => {
    setCart((prev) => {
      return prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(newQuantity, 1) } // min 1
          : item
      );
    });
  };

  // ➝ Prix total
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
