import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import adminRoutes from "./routes/admin.js";
import checkoutRoutes from "./routes/checkout.js";
import testMailRouter from "./routes/testMail.js";


dotenv.config();

const app = express();
app.use(cors());

// ⚡ Middleware JSON sauf webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/api/checkout/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api", testMailRouter);



// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur backend sur port ${PORT}`));