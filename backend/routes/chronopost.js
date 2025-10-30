// routes/chronopost.js
import express from "express";
// (si Node < 18): import fetch from "node-fetch";

const router = express.Router();

// GET /api/chronopost/points?zip=75001&city=Paris
router.get("/points", async (req, res) => {
  const { zip = "", city = "", country = "FR" } = req.query;
  if (!zip && !city) {
    return res.status(400).json({ error: "Fournir zip ou city" });
  }

  // Compose un champ "address" robuste : "27000 Evreux"
  const address = `${String(zip).trim()} ${String(city).trim()}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")   // enlève accents
    .replace(/\s+/g, " ")
    .trim();

  // Rayon de recherche en mètres (ajuste si besoin : 3000-10000)
  const params = new URLSearchParams({
    country,
    address: address || String(zip) || String(city),
    radius: "8000",
  });

  try {
    const url = `https://servicepoints.sendcloud.sc/api/v2/service-points?${params.toString()}`;

    // ⚠️ Cet endpoint est public d’après la doc — pas d’Authorization ici.
    const resp = await fetch(url);

    if (!resp.ok) {
      const text = await resp.text();
      console.error("ServicePoints error:", resp.status, text);
      return res.status(502).json({ error: "SENDCLOUD_FAILED", status: resp.status });
    }

    const data = await resp.json();
    // On filtre côté code pour ne garder que Chronopost (si présent)
    const raw = Array.isArray(data) ? data : (data?.service_points || data?.points || []);
    const points = raw
      .filter(p => (p.carrier || "").toLowerCase().includes("chrono")) // garde chronopost
      .map(p => ({
        id: p.id,
        name: p.name,
        address: [p.street, p.house_number].filter(Boolean).join(" "),
        zip: p.postal_code,
        city: p.city,
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        carrier: p.carrier,
      }));

    // Si rien côté Chronopost, renvoie tout (au cas où le codage carrier diffère)
    const finalPoints = points.length ? points : raw.map(p => ({
      id: p.id,
      name: p.name,
      address: [p.street, p.house_number].filter(Boolean).join(" "),
      zip: p.postal_code,
      city: p.city,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      carrier: p.carrier,
    }));

    return res.json({ points: finalPoints });
  } catch (e) {
    console.error("ServicePoints request failed:", e?.message || e);
    return res.status(500).json({ error: "SENDCLOUD_ERROR" });
  }
});

export default router;
