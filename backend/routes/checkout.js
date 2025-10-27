import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Order from "../models/order.js";
import products from "../data/product.js";
import Product from "../models/product.js";
import { sendMail } from "../services/mailer.js";
import { orderConfirmationTemplate } from "../services/orderConfirmation.js";

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

      // 🟢 Vérifie le stock actuel en base AVANT de créer la session Stripe
      const dbProd = await Product.findOne({ id: item.id }).lean();
      if (!dbProd || dbProd.stock < quantity) {
        return res
          .status(400)
          .json({ error: `Stock insuffisant pour ${product.name}` });
      }

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
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    // Utiliser le corps BRUT (Buffer) converti en string
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const sessionObj = event.data.object;

      // Anti-doublons
      const exists = await Order.findOne({ stripeSessionId: sessionObj.id });
      if (exists) {
        console.warn("⚠️ Webhook ignoré : commande déjà enregistrée", sessionObj.id);
        return res.json({ received: true });
      }

      const orderNumber = `#SWEETY-${Math.floor(10000 + Math.random() * 90000)}`;

      // Reconstruire panier depuis metadata
      let rawCart = [];
      let validatedProducts = [];
      let recalculatedTotal = 0;
      try {
        rawCart = JSON.parse(sessionObj.metadata?.cart || "[]");
        validatedProducts = rawCart
          .map((item) => {
            const p = products[item.id];
            if (!p) return null;
            const qty = Math.max(1, item.quantity || 1);
            recalculatedTotal += p.price * qty;
            return { id: item.id, name: p.name, price: p.price, quantity: qty };
          })
          .filter(Boolean);
      } catch (e) {
        console.error("❌ Impossible de parser le panier :", e.message);
      }

      const stripeTotal = sessionObj.amount_total ? sessionObj.amount_total / 100 : 0;
      if (Math.abs(recalculatedTotal - stripeTotal) > 0.01) {
        console.error(`❌ Total incohérent ! Stripe: ${stripeTotal}, recalculé: ${recalculatedTotal}`);
      }

      // Décrément stock atomique
      for (const it of rawCart) {
        const upd = await Product.updateOne(
          { id: it.id, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } }
        );
        if (upd.modifiedCount !== 1) {
          console.error(`❌ Stock insuffisant post-paiement pour ${it.id}. À traiter manuellement.`);
        }
      }

      // Créer la commande
      const orderData = {
        orderNumber,
        stripeSessionId: sessionObj.id,
        products: validatedProducts,
        total: stripeTotal,
        customerEmail: sessionObj.customer_details?.email || "unknown",
        customerName: sessionObj.customer_details?.name || "unknown",
        shippingAddress: sessionObj.shipping_details?.address || {},
        billingAddress: sessionObj.customer_details?.address || {},
        status: "paid",
        emailSent: false,
        emailAttempts: 0,
        emailSentAt: null,
      };

      let created;
      try {
        created = await Order.create(orderData);
        console.log("✅ Commande enregistrée:", orderNumber, orderData.customerEmail);
      } catch (err) {
        console.error("❌ Erreur MongoDB :", err.message);
        return res.json({ received: true });
      }

      // Envoi email idempotent
      try {
        const claim = await Order.updateOne(
          { _id: created._id, emailSent: false },
          { $set: { emailSent: true, emailSentAt: new Date() }, $inc: { emailAttempts: 1 } }
        );
        if (claim.modifiedCount === 1) {
          const freshOrder = await Order.findById(created._id).lean();
          const html = orderConfirmationTemplate(freshOrder);
          await sendMail({
            to: freshOrder.customerEmail,
            subject: `Confirmation de commande ${freshOrder.orderNumber}`,
            html,
          });
          console.log("📧 Email confirmation envoyé à", freshOrder.customerEmail);
        } else {
          console.log("📧 Email déjà envoyé / déjà claimé (idempotent).");
        }
      } catch (e) {
        console.error("❌ Envoi e-mail échoué:", e.message);
        await Order.updateOne({ _id: created._id }, { $set: { emailSent: false } });
      }
    }

    // Toujours répondre 2xx rapidement à Stripe
    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook constructEvent error:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
});



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
