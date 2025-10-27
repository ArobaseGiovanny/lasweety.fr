import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import adminRoutes from "./routes/admin.js";
import checkoutRoutes from "./routes/checkout.js";
import testMailRouter from "./routes/testMail.js";

dotenv.config();

const app = express();

/* 1) Webhook Stripe : CORPS BRUT OBLIGATOIRE (avant tout le reste) */
app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));

/* 2) JSON parser pour TOUT le reste (on saute le webhook) */
app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.startsWith("/api/checkout/webhook")) {
    console.log("Webhook route hit with originalUrl:", req.originalUrl);
    return next();
  }
  return express.json()(req, res, next);
});

/* --- CORS --- */
const whitelist = ["https://lasweety.com", "https://www.lasweety.com"];
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                 // ex: health checks
    if (whitelist.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // préflight géré proprement

/* --- Routes --- */
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api", testMailRouter);

/* Health */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* Error handler global JSON (évite HTML en cas d’erreur) */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

/* --- Mongo --- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur backend sur port ${PORT}`));
