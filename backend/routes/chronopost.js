// routes/chronopost.js
import express from "express";

// Node 18+ a déjà fetch. Si tu es en <18, décommente la ligne suivante :
// import fetch from "node-fetch";

const router = express.Router();

// GET /api/chronopost/points?zip=75001&city=Paris
router.get("/points", async (req, res) => {
  const { zip, city, country = "FR" } = req.query;

  if (!zip && !city) {
    return res.status(400).json({ error: "Fournir zip ou city" });
  }

  try {
    const params = new URLSearchParams({
      country,
      carrier: "chronopost",
    });
    if (zip) params.append("postal_code", zip);
    if (city) params.append("city", city);

    const auth = Buffer
      .from(`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`)
      .toString("base64");

    const url = `https://panel.sendcloud.sc/api/v2/service-points?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("SendCloud error:", resp.status, text);
      return res.status(502).json({ error: "SENDCLOUD_FAILED" });
    }

    const data = await resp.json();
    const points = (data?.service_points || []).map(p => ({
      id: p.id,
      name: p.name,
      address: [p.street, p.house_number].filter(Boolean).join(" "),
      zip: p.postal_code,
      city: p.city,
      lat: p.latitude,
      lng: p.longitude,
      carrier: p.carrier,
    }));

    return res.json({ points });
  } catch (e) {
    console.error("SendCloud request failed:", e?.message || e);
    return res.status(500).json({ error: "SENDCLOUD_ERROR" });
  }
});

export default router;
