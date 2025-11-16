// backend/routes/products.js
import express from "express";
import Product from "../models/product";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().lean();
    // tu peux ne renvoyer que ce qui t'intéresse
    const cleaned = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
    }));
    res.json(cleaned);
  } catch (e) {
    console.error("GET /products error:", e.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
