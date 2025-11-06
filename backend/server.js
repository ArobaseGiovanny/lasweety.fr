// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import adminRoutes from "./routes/admin.js";
import checkoutRoutes from "./routes/checkout.js";
import testMailRouter from "./routes/testMail.js";
import chronopostRouter from "./routes/chronopost.js";

dotenv.config({ override: true });

/* ─────────────────────────────────────────────────────────
 * Boot logs (masqués) pour valider le chargement du .env
 * ───────────────────────────────────────────────────────── */
console.log("[BOOT] NODE_ENV:", process.env.NODE_ENV || "(not set)");
console.log("[BOOT] PORT:", process.env.PORT || "(not set)");
console.log("[BOOT] FRONTEND_URL:", process.env.FRONTEND_URL || "(not set)");
console.log(
  "[BOOT] STRIPE_SECRET_KEY:",
  (process.env.STRIPE_SECRET_KEY || "").slice(0, 10) + (process.env.STRIPE_SECRET_KEY ? "…" : "")
);
console.log(
  "[BOOT] STRIPE_WEBHOOK_SECRET:",
  (process.env.STRIPE_WEBHOOK_SECRET || "").slice(0, 10) + (process.env.STRIPE_WEBHOOK_SECRET ? "…" : "")
);

const app = express();

/* ─────────────────────────────────────────────────────────
 * 1) Webhook Stripe : body brut (RAW) AVANT tout le reste
 *    Stripe envoie "application/json" → garder en RAW
 * ───────────────────────────────────────────────────────── */
app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));

// Log minimal sur chaque hit webhook (diagnostic constructEvent)
app.use("/api/checkout/webhook", (req, _res, next) => {
  try {
    console.log(
      "[WH] raw middleware hit",
      "| ct:", req.headers["content-type"],
      "| buf:", Buffer.isBuffer(req.body),
      "| len:", req.body ? req.body.length : 0,
      "| sigPresent:", !!req.headers["stripe-signature"]
    );
  } catch (e) {
    console.error("[WH] raw middleware log error:", e.message);
  }
  next();
});

/* ─────────────────────────────────────────────────────────
 * 2) Parser JSON pour TOUT le reste (on saute le webhook)
 * ───────────────────────────────────────────────────────── */
app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.startsWith("/api/checkout/webhook")) {
    // On laisse tel quel pour Stripe (RAW)
    return next();
  }
  return express.json()(req, res, next);
});

/* ─────────────────────────────────────────────────────────
 * CORS
 * ───────────────────────────────────────────────────────── */
const whitelist = ["https://lasweety.com", "https://www.lasweety.com"];
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // ex: health checks, Stripe webhook (pas d'Origin)
    const allowed = whitelist.includes(origin);
    if (!allowed) {
      console.warn("[CORS] blocked origin:", origin);
      return cb(new Error("Not allowed by CORS"));
    }
    return cb(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token", "Accept"],
  credentials: true,
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* ─────────────────────────────────────────────────────────
 * Routes applicatives
 * ───────────────────────────────────────────────────────── */
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api", testMailRouter);
app.use("/api/chronopost", chronopostRouter);

/* ─────────────────────────────────────────────────────────
 * Health + Env-check (temporaire pour debug)
 * ───────────────────────────────────────────────────────── */
app.get("/health", (_req, res) => res.json({ ok: true }));

// ❗ Route de debug temporaire. Retire-la en prod si tu veux.
app.get("/env-check", (_req, res) => {
  res.json({
    FRONTEND_URL: process.env.FRONTEND_URL || null,
    STRIPE_SECRET_KEY: (process.env.STRIPE_SECRET_KEY || "").slice(0, 10) + "…",
    STRIPE_WEBHOOK_SECRET: (process.env.STRIPE_WEBHOOK_SECRET || "").slice(0, 10) + "…",
    MAILER_MODE: process.env.MAILER_MODE || null,
  });
});

/* ─────────────────────────────────────────────────────────
 * Error handler global JSON
 * ───────────────────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err && (err.stack || err.message || err));
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

/* ─────────────────────────────────────────────────────────
 * MongoDB
 * ───────────────────────────────────────────────────────── */
const mongoUriShown =
  (process.env.MONGO_URI || "").replace(/(mongodb(\+srv)?:\/\/)([^:]+):([^@]+)@/i, "$1***:***@");
console.log("[MONGO] connecting:", mongoUriShown || "(not set)");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err.message));

/* ─────────────────────────────────────────────────────────
 * Start
 * ───────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur backend sur port ${PORT}`));
