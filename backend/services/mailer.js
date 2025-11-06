// services/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

let transporter;
let modeLabel = "live";

async function ensureTransporter() {
  if (transporter) return transporter;

  const mode = (process.env.MAILER_MODE || "live").toLowerCase();

  if (mode === "test") {
    // Mode test (aucun envoi réel) : utile en dev/local
    const acc = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: acc.user, pass: acc.pass },
    });
    modeLabel = "ethereal";
  } else {
    // Mode live (Brevo)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    modeLabel = "brevo";
  }

  return transporter;
}

export async function sendMail({ to, subject, html, text, replyTo }) {
  const t = await ensureTransporter();

  const from = process.env.FROM_EMAIL || "La Sweety <no-reply@lasweety.com>";
  const reply = replyTo || process.env.REPLY_TO_EMAIL || undefined;

  // Fallback texte si non fourni (utile pour délivrabilité)
  const plain =
    text ||
    html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const info = await t.sendMail({ from, to, subject, html, text: plain, replyTo: reply });

  // En mode test, on logge le lien d’aperçu
  if (modeLabel === "ethereal") {
    console.log("Ethereal preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}
