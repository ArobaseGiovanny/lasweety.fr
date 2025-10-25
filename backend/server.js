import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import adminRoutes from "./routes/admin.js";
import checkoutRoutes from "./routes/checkout.js";
import testMailRouter from "./routes/testMail.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: ["https://lasweety.com", "https://www.lasweety.com"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/checkout/webhook") return next();
  return express.json()(req, res, next);
});

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api", testMailRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Mongo
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur backend sur port ${PORT}`));
