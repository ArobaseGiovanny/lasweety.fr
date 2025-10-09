import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import products from "../data/product.js";
import Product from "../models/product.js";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = process.env.FRONTEND_URL;

/**
 * ➝ Création d'une session Stripe
 */
router.post("/create-session", async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    const line_items = [];
    const validatedCart = [];

    for (const item of cart) {
      const product = products[item.id];
      if (!product) {
        return res.status(400).json({ error: `Produit invalide: ${item.id}` });
      }

      const quantity = Math.max(1, item.quantity || 1);

      line_items.push({
        price_data: {
          currency: "eur",
          unit_amount: Math.round(product.price * 100),
          product_data: { name: product.name },
        },
        quantity,
      });

      validatedCart.push({
        id: item.id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
      customer_creation: "always",
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["FR", "BE"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "eur" },
            display_name: "Livraison standard (gratuite)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      metadata: {
        // ⚡ On ne garde que les IDs et quantités (pas les prix)
        cart: JSON.stringify(
          validatedCart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          }))
        ),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Erreur Stripe:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ➝ Webhook Stripe (paiement réussi)
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // ⚡ Anti-doublons
      const exists = await Order.findOne({ stripeSessionId: session.id });
      if (exists) {
        console.warn("⚠️ Webhook ignoré : commande déjà enregistrée", session.id);
        return res.json({ received: true });
      }

      const orderNumber = `#SWEETY-${Math.floor(10000 + Math.random() * 90000)}`;

      let validatedProducts = [];
      let recalculatedTotal = 0;
      let rawCart = []; // ✅ défini ici pour être utilisé partout

      try {
        rawCart = JSON.parse(session.metadata.cart || "[]");

        validatedProducts = rawCart
          .map((item) => {
            const product = products[item.id];
            if (!product) return null;

            const quantity = Math.max(1, item.quantity || 1);
            recalculatedTotal += product.price * quantity;

            return {
              id: item.id,
              name: product.name,
              price: product.price,
              quantity,
            };
          })
          .filter(Boolean);
      } catch (e) {
        console.error("❌ Impossible de parser le panier :", e.message);
      }

      // ⚡ Vérification du total
      const stripeTotal = session.amount_total ? session.amount_total / 100 : 0;
      if (Math.abs(recalculatedTotal - stripeTotal) > 0.01) {
        console.error(
          `❌ Total incohérent ! Stripe: ${stripeTotal}, recalculé: ${recalculatedTotal}`
        );
      }

      const orderData = {
        orderNumber,
        products: validatedProducts,
        total: stripeTotal,
        customerEmail: session.customer_details?.email || "unknown",
        customerName: session.customer_details?.name || "unknown",
        shippingAddress: session.shipping_details?.address || {},
        billingAddress: session.customer_details?.address || {},
        status: "pending",
        stripeSessionId: session.id,
      };

      // ✅ décrémentation du stock
      for (const item of rawCart) {
        const product = await Product.findOne({ id: item.id });
        if (product) {
          if (product.stock < item.quantity) {
            console.warn(`⚠️ Pas assez de stock pour ${product.name}`);
            continue; // ou throw new Error pour bloquer la commande
          }

          product.stock -= item.quantity;
          await product.save();
        }
      }

      try {
        await Order.create(orderData);
        console.log("✅ Commande enregistrée:", orderNumber, orderData.customerEmail);
      } catch (err) {
        console.error("❌ Erreur MongoDB :", err.message);
      }
    }

    res.json({ received: true });
  }
);


/**
 * ➝ Récupération d'une commande via sessionId
 */
router.get("/order/:sessionId", async (req, res) => {
  try {
    const order = await Order.findOne({
      stripeSessionId: req.params.sessionId,
    });
    if (!order) return res.status(404).json({ error: "Commande introuvable" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
