
import "./adminDashboard.scss"
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;


function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

// Charger toutes les commandes
const fetchOrders = async () => {
  try {
    const token = localStorage.getItem("adminToken"); // récupère le vrai token
    const res = await fetch(`${API_URL}/admin/orders`, {
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
    });
    const data = await res.json();
    setOrders(data);
  } catch (err) {
    console.error("❌ Erreur fetch orders:", err);
  } finally {
    setLoading(false);
  }
};

// Changer le statut d’une commande
const updateStatus = async (id, newStatus) => {
  try {
    const token = localStorage.getItem("adminToken"); // idem ici
    const res = await fetch(`${API_URL}/admin/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour du statut");
    const updatedOrder = await res.json();

    setOrders((prev) =>
      prev.map((order) => (order._id === id ? updatedOrder : order))
    );
  } catch (err) {
    console.error("❌ Update status:", err);
  }
};


  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <p>Chargement des commandes...</p>;

  return (
    <div className="adminDashboard">
      <h1>📦 Tableau de bord - Commandes</h1>
      <table>
        <thead>
          <tr>
            <th>N° Commande</th>
            <th>Client</th>
            <th>Email</th>
            <th>Produits</th>
            <th>Total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.orderNumber}</td>
              <td>{order.customerName}</td>
              <td>{order.customerEmail}</td>
              <td>
                <ul>
                  {order.products.map((p, i) => (
                    <li key={i}>
                      {p.name} x{p.quantity}
                    </li>
                  ))}
                </ul>
              </td>
              <td>{order.total.toFixed(2)} €</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                >
                  <option value="pending">🕒 En attente</option>
                  <option value="processing">🚚 En cours de livraison</option>
                  <option value="delivered">✅ Livré</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
