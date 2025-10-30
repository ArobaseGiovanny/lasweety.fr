// routes/chronopost.js
import express from "express";
import soap from "soap";

const router = express.Router();

// GET /api/chronopost/points?zip=75001&city=Paris
// (ou) /api/chronopost/points?lat=48.8566&lng=2.3522
router.get("/points", async (req, res) => {
  const { zip, city, country = "FR", lat, lng } = req.query;

  const WSDL = "https://ws.chronopost.fr/pointretrait-cxf/PointRelaisServiceWS?wsdl";

  // Prépare les args (par code postal/ville OU par géoloc)
  const common = {
    accountNumber: process.env.CHRONO_ACCOUNT,
    password: process.env.CHRONO_PASSWORD,
    countryCode: country,
    shippingDate: new Date().toISOString().slice(0, 10),
    weight: 1,
    maxPointChronopost: 20,
    maxDistanceSearch: 10,
    requestID: `REQ-${Date.now()}`
  };

  // Choix de la méthode et des paramètres
  let methodName = "recherchePointChronopostInter";
  let args = { ...common, zipCode: zip || "", city: city || "" };

  // Si lat/lng fournis, on passe en recherche par géoloc
  if (lat && lng) {
    methodName = "recherchePointChronopostParCoord";
    args = { ...common, coordGeoLatitude: String(lat), coordGeoLongitude: String(lng) };
  } else if (!zip && !city) {
    return res.status(400).json({ error: "Fournir zip/city ou lat/lng" });
  }

  try {
    const client = await soap.createClientAsync(WSDL);
    const [result] = await client[`${methodName}Async`](args);
    const list = result?.return?.listePointRelais?.liste || [];

    const points = list.map((p) => ({
      id: p.identifiant,
      name: p.nom,
      address: [p.adresse1, p.adresse2].filter(Boolean).join(" "),
      zip: p.codePostal,
      city: p.localite,
      lat: Number(p.coordGeolocalisation?.latitude) || null,
      lng: Number(p.coordGeolocalisation?.longitude) || null,
      schedule: p.informations?.horairesOuverture || []
    }));

    res.json({ points });
  } catch (e) {
    console.error("Chronopost SOAP error:", e?.message || e);
    res.status(500).json({ error: "CHRONOPOINTS_FAILED" });
  }
});

export default router;
