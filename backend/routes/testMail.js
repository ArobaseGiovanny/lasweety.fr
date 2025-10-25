import express from "express";
import { sendMail } from "../services/mailer.js";

const router = express.Router();

router.get("/test-mail", async (req, res) => {
  try {
    await sendMail({
      to: "ton.email@exemple.com", // 👈 remplace par ton vrai mail
      subject: "Test Sweetyx ✅",
      html: "<p>Le système d’email fonctionne via Brevo 🚀</p>",
    });

    console.log("✅ Email de test envoyé !");
    res.json({ success: true, message: "Email envoyé avec succès" });
  } catch (err) {
    console.error("❌ Erreur d'envoi :", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
