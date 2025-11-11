import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Order from "../models/order.js";
import products from "../data/product.js";
import Product from "../models/product.js";
import { sendMail } from "../services/mailer.js";
import { orderConfirmationTemplate } from "../services/orderConfirmation.js";
import { PACKAGING, selectPackaging } from "../config/shipping.js";
import { generateInvoicePdfBuffer } from "../services/invoicePdf.js";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = process.env.FRONTEND_URL;

/** Normalise l'objet point relais (sécurité) */
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

/**
 * Crée une session Stripe Checkout.
 * Body: { cart:[{id,quantity}], deliveryMode:"home"|"pickup", pickupPoint?:{...} }
 */
router.post("/create-session", async (req, res) => {
  console.log("── [CS] /create-session called");
  try {
    const { cart, deliveryMode, pickupPoint } = req.body || {};
    console.log("[CS] body.deliveryMode:", deliveryMode);
    console.log("[CS] body.pickupPoint:", pickupPoint);
    console.log("[CS] body.cart:", cart);

    const totalQty = Array.isArray(cart)
      ? cart.reduce((sum, it) => sum + Math.max(1, Number(it.quantity) || 1), 0)
      : 0;
    console.log("[CS] totalQty:", totalQty);

    if (totalQty > 4) {
      console.warn("[CS] reject: more than 4 items");
      return res.status(400).json({ error: "Quantité maximale: 4 articles par commande" });
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      console.warn("[CS] reject: empty cart");
      return res.status(400).json({ error: "Panier vide" });
    }
    if (!["home", "pickup"].includes(deliveryMode)) {
      console.warn("[CS] reject: invalid deliveryMode:", deliveryMode);
      return res.status(400).json({ error: "Mode de livraison invalide" });
    }
    if (deliveryMode === "pickup" && !pickupPoint) {
      console.warn("[CS] reject: pickup without pickupPoint");
      return res.status(400).json({ error: "Point relais manquant" });
    }

    const safePickup = deliveryMode === "pickup" ? sanitizePickupPoint(pickupPoint) : null;

    const line_items = [];
    const validatedCart = [];

    for (const item of cart) {
      const p = products[item.id];
      if (!p) {
        console.warn("[CS] reject: invalid product id:", item.id);
        return res.status(400).json({ error: `Produit invalide: ${item.id}` });
      }
      const quantity = Math.max(1, Number(item.quantity) || 1);

      const dbProd = await Product.findOne({ id: item.id }).lean();
      console.log("[CS] stock check:", { id: item.id, wanted: quantity, stock: dbProd?.stock });
      if (!dbProd || dbProd.stock < quantity) {
        console.warn("[CS] reject: not enough stock for", p.name);
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

    console.log("[CS] validatedCart:", validatedCart);

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
    console.log("[CS] shippingOptions:", shippingOptions);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
      customer_creation: "always",
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      shipping_address_collection:
        deliveryMode === "home" ? { allowed_countries: ["FR", "BE"] } : undefined,
      shipping_options: shippingOptions,
      metadata: {
        cart: JSON.stringify(validatedCart.map(({ id, quantity }) => ({ id, quantity }))),
        deliveryMode,
        pickupPoint: safePickup ? JSON.stringify(safePickup) : "",
      },
    });

    console.log("[CS] session.id:", session.id);
    console.log("[CS] session.url:", session.url);

    return res.json({ url: session.url });
  } catch (error) {
    console.error("❌ [CS] error:", error?.message);
    return res.status(500).json({ error: "Erreur lors de la création de session" });
  }
});

/**
 * Webhook Stripe (paiement réussi).
 * (express.raw monté dans server.js)
 */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  console.log("── [WH] /webhook called",
    "| sigPresent:", !!sig,
    "| secretSet:", !!secret,
    "| content-type:", req.headers["content-type"],
    "| isBuffer:", Buffer.isBuffer(req.body),
    "| len:", req.body?.length
  );

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);
    console.log("[WH] constructEvent OK:", event.type);

    if (event.type === "checkout.session.completed") {
      const sessionObj = event.data.object;
      console.log("[WH] session.id:", sessionObj.id);
      console.log("[WH] metadata.deliveryMode:", sessionObj.metadata?.deliveryMode);

      const customerPhone = sessionObj.customer_details?.phone || null;

      // Idempotence
      const exists = await Order.findOne({ stripeSessionId: sessionObj.id });
      console.log("[WH] already exists:", !!exists);
      if (exists) {
        return res.json({ received: true });
      }

      const orderNumber = `#SWEETY-${Math.floor(10000 + Math.random() * 90000)}`;
      console.log("[WH] orderNumber:", orderNumber);

      // Reconstruire le panier
      let rawCart = [];
      let validatedProducts = [];
      let recalculatedTotal = 0;

      try {
        rawCart = JSON.parse(sessionObj.metadata?.cart || "[]");
        console.log("[WH] rawCart:", rawCart);

        validatedProducts = rawCart
          .map((item) => {
            const p = products[item.id];
            if (!p) return null;
            const qty = Math.max(1, Number(item.quantity) || 1);
            recalculatedTotal += p.price * qty;
            return { id: item.id, name: p.name, price: p.price, quantity: qty };
          })
          .filter(Boolean);
        console.log("[WH] validatedProducts:", validatedProducts);
        console.log("[WH] recalculatedTotal:", recalculatedTotal);
      } catch (e) {
        console.error("[WH] cart parse error:", e?.message);
      }

      // Packaging/poids
      const totalQty = validatedProducts.reduce((sum, it) => sum + it.quantity, 0);
      const pkg = selectPackaging(totalQty);
      const packageType = totalQty <= PACKAGING.SMALL.maxItems ? "SMALL" : "LARGE";

      let itemsWeightKg = 0;
      for (const it of validatedProducts) {
        const p = products[it.id];
        const unitWeight = Number(p?.weightKg || 0);
        itemsWeightKg += unitWeight * it.quantity;
      }
      const totalWeightKg = Number((itemsWeightKg + pkg.tareKg).toFixed(3));
      const parcel = {
        weightKg: totalWeightKg,
        lengthCm: pkg.lengthCm,
        widthCm: pkg.widthCm,
        heightCm: pkg.heightCm,
        packageType,
      };
      console.log("[WH] parcel:", parcel);

      const stripeTotal = sessionObj.amount_total ? sessionObj.amount_total / 100 : 0;
      if (Math.abs(recalculatedTotal - stripeTotal) > 0.01) {
        console.warn("[WH] total mismatch | stripe:", stripeTotal, "| recalculated:", recalculatedTotal);
      }

      // Décrément stock
      for (const it of rawCart) {
        const upd = await Product.updateOne(
          { id: it.id, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } }
        );
        console.log("[WH] stock dec:", it.id, "qty:", it.quantity, "modified:", upd.modifiedCount);
      }

      // Mode de livraison + point relais
      const deliveryMode =
        sessionObj.metadata?.deliveryMode === "pickup" ? "pickup" : "home";
      let pickupPoint = null;
      if (deliveryMode === "pickup" && sessionObj.metadata?.pickupPoint) {
        try {
          pickupPoint = sanitizePickupPoint(JSON.parse(sessionObj.metadata.pickupPoint));
        } catch (e) {
          console.error("[WH] pickupPoint parse error:", e?.message);
          pickupPoint = null;
        }
      }
      console.log("[WH] deliveryMode:", deliveryMode, "| pickupPoint:", pickupPoint);

      // Créer la commande
      const orderData = {
        orderNumber,
        stripeSessionId: sessionObj.id,
        stripePaymentIntentId: sessionObj.payment_intent || null,
        stripeCustomerId: sessionObj.customer || null,

        products: validatedProducts,
        total: stripeTotal,

        customerEmail: sessionObj.customer_details?.email || "unknown",
        customerName: sessionObj.customer_details?.name || "unknown",
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

      console.log("[WH] orderData:", {
        orderNumber: orderData.orderNumber,
        sessionId: orderData.stripeSessionId,
        email: orderData.customerEmail,
        total: orderData.total,
        deliveryMode: orderData.deliveryMode,
        parcel: orderData.parcel,
      });

      let created;
      try {
        created = await Order.create(orderData);
        console.log("[WH] order created id:", created?._id?.toString());
      } catch (e) {
        console.error("❌ [WH] Order.create error:", e?.message);
        return res.json({ received: true });
      }

      const year = new Date().getFullYear();
      const invoiceNumber = `${year}-${created._id}`;
      await Order.updateOne({ _id: created._id }, { $set: { invoiceNumber } });

      // Email (idempotent)
      try {
        const claim = await Order.updateOne(
          { _id: created._id, emailSent: false },
          { $set: { emailSent: true, emailSentAt: new Date() }, $inc: { emailAttempts: 1 } }
        );
        console.log("[WH] email claim modifiedCount:", claim.modifiedCount);

        if (claim.modifiedCount === 1) {
          const freshOrder = await Order.findById(created._id).lean();
          const html = orderConfirmationTemplate(freshOrder);
          // --- (1) Assure un numéro de facture ---
          const year = new Date().getFullYear();
          const invoiceNumber =
            freshOrder.invoiceNumber ||
            freshOrder.orderNumber ||
            `${year}-${freshOrder._id}`;

          // --- (2) Génère le PDF en mémoire ---
          const pdfBuffer = await generateInvoicePdfBuffer(freshOrder, {
            name: process.env.COMPANY_NAME || "La Sweety",
            addressLines: [
              process.env.COMPANY_ADDRESS_LINE1,
              process.env.COMPANY_ADDRESS_LINE2,
              `${process.env.COMPANY_POSTAL_CODE || ""} ${process.env.COMPANY_CITY || ""} ${process.env.COMPANY_COUNTRY || "FR"}`
            ].filter(Boolean),
            siret: process.env.COMPANY_SIRET,
            vatNumber: process.env.COMPANY_VAT_NUMBER,
            email: process.env.SUPPORT_EMAIL,
          });

                    // --- Sauvegarde locale de la facture ---
          const invoicesDir = "/var/www/lasweety/backend/storage/invoices";
          const yearDir = path.join(invoicesDir, String(new Date().getFullYear()));
          fs.mkdirSync(yearDir, { recursive: true });

          const fileName = `FACTURE-${invoiceNumber}.pdf`;
          const filePath = path.join(yearDir, fileName);

          // écrit le PDF sur disque
          fs.writeFileSync(filePath, pdfBuffer);

          await Order.updateOne(
            { _id: created._id },
            { $set: { invoiceFile: `storage/invoices/${new Date().getFullYear()}/${fileName}` } }
          );

          // --- (3) Envoie l'email avec la facture en PJ ---
          await sendMail({
            to: freshOrder.customerEmail,
            subject: `Confirmation de commande ${freshOrder.orderNumber} – Facture en pièce jointe`,
            html,
            attachments: [
              {
                filename: `FACTURE-${invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });
          console.log("[WH] confirmation email sent to:", freshOrder.customerEmail);
        } else {
          console.log("[WH] email already sent / claimed");
        }
      } catch (e) {
        console.error("❌ [WH] sendMail error:", e?.message);
        await Order.updateOne({ _id: created._id }, { $set: { emailSent: false } });
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ [WH] constructEvent error:", err?.message, "| type:", err?.type, "| raw:", err?.raw?.message);
    return res.status(400).send("Webhook error");
  }
});

/** Récupère une commande via sessionId Stripe */
router.get("/order/:sessionId", async (req, res) => {
  const sid = req.params.sessionId;
  console.log("[GET] /order/:sessionId", sid);
  try {
    const order = await Order.findOne({ stripeSessionId: sid });
    console.log("[GET] found?:", !!order);
    if (!order) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    return res.json(order);
  } catch (err) {
    console.error("❌ [GET] order error:", err?.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
