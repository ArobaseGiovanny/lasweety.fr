// services/googleSheets.js
import { google } from "googleapis";
import fs from "fs";

let sheetsClient = null;

/**
 * Initialise le client Google Sheets une seule fois.
 */
function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (!keyFile || !fs.existsSync(keyFile)) {
    console.error("[GSHEETS] Missing or invalid GOOGLE_SERVICE_ACCOUNT_KEY_FILE:", keyFile);
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

/**
 * Transforme une commande en ligne pour Google Sheets.
 * @param {Object} order
 * @returns {string[]}
 */
function mapOrderToRow(order) {
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();

  const dateStr = createdAt.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Mode de livraison / adresse
  let deliveryLabel = order.deliveryMode === "pickup" ? "Point relais" : "Domicile";
  let deliveryDetails = "";
  let pickupId = ""; // ID point relais (si applicable)

  if (order.deliveryMode === "pickup" && order.pickupPoint) {
    // Point relais
    const pp = order.pickupPoint;
    deliveryDetails = [
      pp.name,
      pp.address,
      `${pp.zip || ""} ${pp.city || ""}`.trim(),
      pp.carrier ? `(${pp.carrier})` : "",
    ]
      .filter(Boolean)
      .join(" - ");

    pickupId = pp.id || "";
  } else {
    // Livraison à domicile : on prend d'abord shippingAddress,
    // si vide on tombe sur billingAddress
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

  // Résumé produits
  const productsSummary = (order.products || [])
    .map(
      (p) =>
        `${p.name || p.id} x${p.quantity} @ ${Number(p.price || 0).toFixed(2)} €`
    )
    .join(" | ");

  const status = order.status || "paid";

  return [
    dateStr,                       // A - Date/heure
    order.orderNumber || "",       // B - N° commande
    status,                        // C - Statut
    order.customerName || "",      // D - Nom client
    order.customerEmail || "",     // E - Email client
    order.customerPhone || "",     // F - Téléphone
    deliveryLabel,                 // G - Mode de livraison
    deliveryDetails,               // H - Adresse / relais
    pickupId,                      // I - ID point relais (si pickup)
    Number(order.total || 0),      // J - Total TTC
    productsSummary,               // K - Détail produits
  ];
}

/**
 * Ajoute une commande dans le Google Sheets.
 */
export async function appendOrderToSheet(order) {
  try {
    const sheets = getSheetsClient();
    if (!sheets) {
      console.error("[GSHEETS] No sheets client, abort append.");
      return;
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const sheetName = process.env.GOOGLE_SHEETS_ORDERS_SHEET_NAME || "Commandes";

    if (!spreadsheetId) {
      console.error("[GSHEETS] Missing GOOGLE_SHEETS_SPREADSHEET_ID");
      return;
    }

    const row = mapOrderToRow(order);

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    console.log("[GSHEETS] Row appended, updatedRange:", res.data.updates?.updatedRange);
  } catch (err) {
    console.error("[GSHEETS] appendOrderToSheet error:", err.message || err);
  }
}
