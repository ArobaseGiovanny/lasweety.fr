import "../Cart/cartOverlay.scss";
import { useCart } from "../../context/CartContext";
import products from "../../data/products";

function CartOverlay() {
  const { cart, totalPrice, removeFromCart, updateQuantity } = useCart();

  // ➝ bouton "Passer la commande"
  const handleCheckout = () => {
    console.log("🛒 Panier actuel :", cart);
    console.log("💶 Total :", totalPrice.toFixed(2));

    // format Stripe-ready
    const line_items = cart.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name, // stocké dans le panier lors de l'ajout
        },
        unit_amount: Math.round(item.price * 100), // en centimes
      },
      quantity: item.quantity,
    }));

    console.log("📦 Line items (Stripe):", line_items);
  };

  return (
    <section className="cartOverlay">
      <h2>Mon Panier</h2>

      {cart.length === 0 ? (
        <p>Votre panier est vide</p>
      ) : (
        <ul className="cartOverlay__list">
          {cart.map((item) => {
            const product = products[item.id]; // récup infos produit
            return (
              <li key={item.id} className="cartOverlay__item">
                <div className="cartOverlay__info">
                  <img
                    src={product.icon[0].src}
                    alt={product.images[0].alt}
                    className="cartOverlay__img"
                    style={{ width: "40px" }}
                  />
                  <div>
                    <h3>{product.name}</h3>
                    <p>Prix unitaire : {item.price.toFixed(2)} €</p>
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

                <div className="cartOverlay__subtotal">
                  {(item.price * item.quantity).toFixed(2)} €
                </div>

                <button
                  className="cartOverlay__remove"
                  onClick={() => removeFromCart(item.id)}
                >
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="cartOverlay__footer">
        <p>Total : {totalPrice.toFixed(2)} €</p>
        <button
          className="cartOverlay__checkout"
          onClick={handleCheckout} 
        >
          Passer la commande
        </button>
      </div>
    </section>
  );
}

export default CartOverlay;
