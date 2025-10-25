import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import adminRoutes from "./routes/admin.js";
import checkoutRoutes from "./routes/checkout.js";
import testMailRouter from "./routes/testMail.js";

dotenv.config();

const app = express();

/** ---------- CORS uniquement pour /api (pas pour le webhook) ---------- */
const allowedOrigins = ["https://lasweety.com", "https://www.lasweety.com"];

const corsOptions = {
  origin(origin, cb) {
    // autoriser aussi les requêtes serveur-à-serveur sans header Origin
    if (!origin) return cb(null, true);
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

app.use("/api", cors(corsOptions));

/** ---------- Webhook Stripe (raw body) ---------- */
app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));

/** ---------- JSON parser pour le reste ---------- */
app.use(express.json());

/** ---------- Routes ---------- */
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api", testMailRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

/** ---------- Mongo ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur backend sur port ${PORT}`));
