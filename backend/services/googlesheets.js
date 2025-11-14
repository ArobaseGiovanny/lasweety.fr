function mapOrderToRow(order) {
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();

  const dateStr = createdAt.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Mode de livraison
  let deliveryLabel = order.deliveryMode === "pickup" ? "Point relais" : "Domicile";
  let deliveryDetails = "";
  let pickupId = ""; // ← *** Nouvelle colonne ***

  if (order.deliveryMode === "pickup" && order.pickupPoint) {
    const pp = order.pickupPoint;

    deliveryDetails = [
      pp.name,
      pp.address,
      `${pp.zip || ""} ${pp.city || ""}`.trim(),
      pp.carrier ? `(${pp.carrier})` : "",
    ]
      .filter(Boolean)
      .join(" - ");

    pickupId = pp.id || ""; // ← On met l’ID ici
  } else {
    // Domicile → fallback shipping puis billing
    const hasShipping =
      order.shippingAddress && Object.keys(order.shippingAddress).length > 0;
    const a = hasShipping ? order.shippingAddress : (order.billingAddress || {});

    deliveryDetails = [
      a.line1,
      a.line2,
      `${a.postal_code || ""} ${a.city || ""}`.trim(),
      a.country,
    ]
      .filter(Boolean)
      .join(" - ");
  }

  // Produits
  const productsSummary = (order.products || [])
    .map(
      (p) => `${p.name || p.id} x${p.quantity} @ ${Number(p.price || 0).toFixed(2)} €`
    )
    .join(" | ");

  // Infos colis
  const parcel = order.parcel || {};
  const parcelInfo = parcel.weightKg
    ? `${parcel.weightKg} kg – ${parcel.lengthCm || "?"}x${parcel.widthCm || "?"}x${parcel.heightCm || "?"} cm (${parcel.packageType || "?"})`
    : "";

  const status = order.status || "paid";

  return [
    dateStr,                       //  - Date/heure
    order.orderNumber || "",       //  - N° commande
    status,                        //  - Statut
    order.customerName || "",      //  - Nom client
    order.customerEmail || "",     //  - Email client
    order.customerPhone || "",     //  - Téléphone
    deliveryLabel,                 //  - Mode livraison
    deliveryDetails,               //  - Adresse / relais
    pickupId,                      //  - *** ID point relais ***
    Number(order.total || 0),      //  - Total TTC
    productsSummary,               //  - Liste produits
  ];
}
