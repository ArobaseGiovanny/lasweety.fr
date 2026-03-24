// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import adminRoutes from "./routes/admin.js";
import checkoutRoutes from "./routes/checkout.js";
import chronopostRouter from "./routes/chronopost.js";
import productsDetailsRouter from "./routes/productsDetails.js";
import youtubeRouter from "./routes/youtube.js";

// Charge le bon .env selon APP_ENV (défaut: test)
const appEnv = process.env.APP_ENV || "test";
const envFile = appEnv === "live" ? ".env.live" : ".env";
dotenv.config({ path: envFile, override: true });
console.log(`[ENV] Chargé: ${envFile} (APP_ENV=${appEnv})`);

const app = express();

// Stripe webhook: RAW body
app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));
app.use("/api/checkout/webhook", (req, _res, next) => {
  try {
    console.log("[WH] raw middleware hit",
      "| ct:", req.headers["content-type"],
      "| buf:", Buffer.isBuffer(req.body),
      "| len:", req.body ? req.body.length : 0,
      "| sigPresent:", !!req.headers["stripe-signature"]
    );
  } catch (e) { console.error("[WH] raw middleware log error:", e.message); }
  next();
});

// JSON normal pour le reste
app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.startsWith("/api/checkout/webhook")) return next();
  return express.json()(req, res, next);
});

/* ─────────────────────────────────────────────────────────
 * CORS
 * ───────────────────────────────────────────────────────── */
const isLive = appEnv === "live";
const whitelist = isLive
  ? ["https://lasweety.com", "https://www.lasweety.com"]
  : ["http://localhost:5173", "http://127.0.0.1:5173", "https://lasweety.com", "https://www.lasweety.com"];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // ex: webhook Stripe, health checks
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
 * Routes
 * ───────────────────────────────────────────────────────── */
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/chronopost", chronopostRouter);
app.use("/api/products", productsDetailsRouter);
app.use("/api/youtube", youtubeRouter);


// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err && (err.stack || err.message || err));
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

// Mongo
const mongoUriShown =
  (process.env.MONGO_URI || "").replace(/(mongodb(\+srv)?:\/\/)([^:]+):([^@]+)@/i, "$1***:***@");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err.message));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur backend sur port ${PORT}`));
