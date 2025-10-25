import express from "express";
import Order from "../models/order.js"

const router = express.Router();

// ⚡ Middleware simple de pseudo-auth admin (à améliorer en prod)
const adminAuth = (req, res, next) => {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  next();
};

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalide." });
  }

  res.json({ token: process.env.ADMIN_TOKEN });
});

/**
 * ➝ Récupérer toutes les commandes
 */
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ➝ Modifier le statut d’une commande
 */
router.patch("/orders/:id", adminAuth, async (req, res) => {
    console.log("PATCH reçu:", req.params.id, req.body);
  try {
    const { status } = req.body;
    if (!["pending", "processing", "delivered"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Commande introuvable" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
