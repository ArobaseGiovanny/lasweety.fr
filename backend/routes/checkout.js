import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Order from "../models/order.js";
import products from "../data/product.js";
import Product from "../models/product.js";
import { sendMail } from "../services/mailer.js";
import { orderConfirmationTemplate } from "../services/orderConfirmation.js";
import { PACKAGING, selectPackaging } from "../config/shipping.js";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = process.env.FRONTEND_URL;

/** Normalise l'objet point relais */
function sanitizePickupPoint(pp) {
  if (!pp) return null;
  return {
    id: pp.id ? String(pp.id) : "",
    name: pp.name ? String(pp.name) : "",
    address: pp.address ? String(pp.address) : "",
    zip: pp.zip ? String(pp.zip) : "",
    city: pp.city ? String(pp.city) : "",
    lat: typeof pp.lat === "number" ? pp.lat : Number(pp.lat || 0),
    lng: typeof pp.lng === "number" ? pp.lng : Number(pp.lng || 0),
    carrier: pp.carrier ? String(pp.carrier) : "",
    postNumber: pp.postNumber ? String(pp.postNumber) : "",
  };
}

/** Tente d'extraire un nom client fiable depuis la session Checkout */
function resolveCustomerName(sessionObj) {
  // 1) custom_fields.full_name (obligatoire)
  const cf = Array.isArray(sessionObj.custom_fields) ? sessionObj.custom_fields : [];
  const fullName = cf.find(f => f.key === "full_name")?.text?.value?.trim();
  if (fullName) return fullName;

  // 2) nom de livraison Stripe
  const shipName = sessionObj.shipping_details?.name?.trim();
  if (shipName) return shipName;

  // 3) nom client Stripe
  const custName = sessionObj.customer_details?.name?.trim();
  if (custName) return custName;

  return "unknown";
}

/**
 * Crée une session Stripe Checkout.
 * Body: { cart:[{id,quantity}], deliveryMode:"home"|"pickup", pickupPoint?:{...} }
 */
router.post("/create-session", async (req, res) => {
  try {
    const { cart, deliveryMode, pickupPoint } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    const totalQty = cart.reduce((sum, it) => sum + Math.max(1, Number(it.quantity) || 1), 0);
    if (totalQty > 4) {
      return res.status(400).json({ error: "Quantité maximale: 4 articles par commande" });
    }

    if (!["home", "pickup"].includes(deliveryMode)) {
      return res.status(400).json({ error: "Mode de livraison invalide" });
    }
    if (deliveryMode === "pickup" && !pickupPoint) {
      return res.status(400).json({ error: "Point relais manquant" });
    }

    const safePickup = deliveryMode === "pickup" ? sanitizePickupPoint(pickupPoint) : null;

    const line_items = [];
    const validatedCart = [];

    // Validation produit + stock
    for (const item of cart) {
      const p = products[item.id];
      if (!p) {
        return res.status(400).json({ error: `Produit invalide: ${item.id}` });
      }
      const quantity = Math.max(1, Number(item.quantity) || 1);

      const dbProd = await Product.findOne({ id: item.id }).lean();
      if (!dbProd || dbProd.stock < quantity) {
        return res.status(400).json({ error: `Stock insuffisant pour ${p.name}` });
      }

      line_items.push({
        price_data: {
          currency: "eur",
          unit_amount: Math.round(p.price * 100),
          product_data: { name: p.name },
        },
        quantity,
      });

      validatedCart.push({
        id: item.id,
        name: p.name,
        price: p.price,
        quantity,
      });
    }

    // Options de livraison
    const shippingOptions =
      deliveryMode === "home"
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: "eur" },
                display_name: "Livraison à domicile (gratuite)",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 3 },
                  maximum: { unit: "business_day", value: 5 },
                },
              },
            },
          ]
        : [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: "eur" },
                display_name: "Point relais Chronopost",
              },
            },
          ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,

      // Crée un customer Stripe et remplit ses détails si possible
      customer_creation: "always",
      customer_update: { name: "auto", address: "auto" },

      // Adresse de facturation demandée systématiquement (collecte le nom selon le PM)
      billing_address_collection: "required",

      // Adresse de livraison uniquement pour "home"
      shipping_address_collection: deliveryMode === "home"
        ? { allowed_countries: ["FR", "BE"] }
        : undefined,

      // Collecte du téléphone
      phone_number_collection: { enabled: true },

      // Champ "Nom complet" obligatoire (marche pour home & pickup)
      custom_fields: [
        {
          key: "full_name",
          label: { type: "custom", custom: "Nom complet" },
          type: "text",
          optional: false, // requis
        },
      ],

      shipping_options: shippingOptions,

      metadata: {
        cart: JSON.stringify(
          validatedCart.map(({ id, quantity }) => ({ id, quantity }))
        ),
        deliveryMode,
        pickupPoint: safePickup ? JSON.stringify(safePickup) : "",
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la création de session" });
  }
});

/**
 * Webhook Stripe Checkout (paiement réussi).
 * Doit être monté avec express.raw({ type: "application/json" }) avant express.json().
 */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);

    if (event.type === "checkout.session.completed") {
      const sessionObj = event.data.object;

      // Idempotence
      const exists = await Order.findOne({ stripeSessionId: sessionObj.id });
      if (exists) {
        return res.json({ received: true });
      }

      const orderNumber = `#SWEETY-${Math.floor(10000 + Math.random() * 90000)}`;

      // Panier depuis metadata
      let rawCart = [];
      let validatedProducts = [];
      let recalculatedTotal = 0;

      try {
        rawCart = JSON.parse(sessionObj.metadata?.cart || "[]");
        validatedProducts = rawCart
          .map((item) => {
            const p = products[item.id];
            if (!p) return null;
            const qty = Math.max(1, Number(item.quantity) || 1);
            recalculatedTotal += p.price * qty;
            return { id: item.id, name: p.name, price: p.price, quantity: qty };
          })
          .filter(Boolean);
      } catch {
        // keep empty if parse fails
      }

      // Colis (gabarit + poids)
      const totalQty = validatedProducts.reduce((sum, it) => sum + it.quantity, 0);
      const pkg = selectPackaging(totalQty);
      const packageType = totalQty <= PACKAGING.SMALL.maxItems ? "SMALL" : "LARGE";

      let itemsWeightKg = 0;
      for (const it of validatedProducts) {
        const unitWeight = Number(products[it.id]?.weightKg || 0);
        itemsWeightKg += unitWeight * it.quantity;
      }
      const totalWeightKg = Number((itemsWeightKg + Number(pkg.tareKg || 0)).toFixed(3));

      const parcel = {
        weightKg: totalWeightKg,
        lengthCm: pkg.lengthCm,
        widthCm: pkg.widthCm,
        heightCm: pkg.heightCm,
        packageType,
      };

      const stripeTotal = sessionObj.amount_total ? sessionObj.amount_total / 100 : 0;

      // Décrément stock post-paiement
      for (const it of rawCart) {
        await Product.updateOne(
          { id: it.id, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } }
        );
      }

      // Mode livraison + point relais
      const deliveryMode =
        sessionObj.metadata?.deliveryMode === "pickup" ? "pickup" : "home";
      let pickupPoint = null;
      if (deliveryMode === "pickup" && sessionObj.metadata?.pickupPoint) {
        try {
          pickupPoint = sanitizePickupPoint(JSON.parse(sessionObj.metadata.pickupPoint));
        } catch {
          pickupPoint = null;
        }
      }

      // Nom / email / téléphone
      const customerName = resolveCustomerName(sessionObj);
      const customerEmail = sessionObj.customer_details?.email || "unknown";
      const customerPhone = sessionObj.customer_details?.phone || null;

      // Création de la commande
      const orderData = {
        orderNumber,
        stripeSessionId: sessionObj.id,
        stripePaymentIntentId: sessionObj.payment_intent || null,
        stripeCustomerId: sessionObj.customer || null,

        products: validatedProducts,
        total: stripeTotal,

        customerEmail,
        customerName,
        customerPhone,

        shippingAddress: sessionObj.shipping_details?.address || {},
        billingAddress: sessionObj.customer_details?.address || {},

        deliveryMode,
        pickupPoint,
        parcel,

        status: "paid",
        emailSent: false,
        emailAttempts: 0,
        emailSentAt: null,
      };

      let created;
      try {
        created = await Order.create(orderData);
      } catch {
        return res.json({ received: true });
      }

      // Envoi e-mail (idempotent)
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
        }
      } catch {
        await Order.updateOne({ _id: created._id }, { $set: { emailSent: false } });
      }
    }

    return res.json({ received: true });
  } catch {
    return res.status(400).send("Webhook error");
  }
});

/** Récupère une commande par sessionId Stripe (page de succès) */
router.get("/order/:sessionId", async (req, res) => {
  try {
    const order = await Order.findOne({
      stripeSessionId: req.params.sessionId,
    });
    if (!order) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    return res.json(order);
  } catch {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
