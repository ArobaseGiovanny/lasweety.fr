import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../../../context/CartContext";
import "./successPage.scss";
const API_URL = import.meta.env.VITE_API_URL;

function SuccessPage() {
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    clearCart();

    if (!sessionId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${API_URL}/checkout/order/${sessionId}`
        );
        if (!res.ok) throw new Error("Erreur lors de la récupération de la commande");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("❌", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId, clearCart]);

  if (loading) return <p className="successPage__loading">Chargement de votre commande...</p>;

  if (!order) return <p className="successPage__error">Commande introuvable.</p>;

  return (
    <div className="successPage">
      <div className="successPage__card">
        <h1 className="successPage__title">Paiement réussi 🎉</h1>
        <p className="successPage__thanks">Merci pour votre commande <strong>{order.customerName}</strong> !</p>
        <p className="successPage__orderNumber">
          Numéro de commande : <span>{order.orderNumber}</span>
        </p>

        <div className="successPage__summary">
          <h3>Résumé de la commande</h3>
          <ul>
            {order.products.map((item, i) => (
              <li key={i}>
                <span>{item.name} x {item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)} €</span>
              </li>
            ))}
          </ul>
          <p className="successPage__total">
            Total : <strong>{order.total.toFixed(2)} €</strong>
          </p>
        </div>

        <p className="successPage__email">
          Un email de confirmation a été envoyé à <strong>{order.customerEmail}</strong>
        </p>

        <Link to="/" className="successPage__button">
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

export default SuccessPage;
