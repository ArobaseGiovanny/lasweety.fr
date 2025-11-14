import PDFDocument from "pdfkit";
import dayjs from "dayjs";

// € insécable + 2 décimales
const money = (v, c = "EUR") => {
  const s = new Intl.NumberFormat("fr-FR", { style: "currency", currency: c }).format(Number(v || 0));
  return s.replace(" €", "\u00A0€"); // espace insécable
};

/**
 * @param {Object} order
 *   - products: [{ name, quantity, price, vatRate? }] // price TTC
 *   - subtotal?, vat?, shipping?, discount?, total?
 *   - currency?
 * @param {Object} company
 * @param {Object} opts
 *   - pricesAreTTC: boolean (default: true)
 *   - defaultVatRate: number (default: 20)
 */
export function generateInvoicePdfBuffer(order, company = {}, opts = {}) {
  const pricesAreTTC = opts.pricesAreTTC ?? true;
  const defaultVatRate = Number(opts.defaultVatRate ?? 20);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = order.currency || "EUR";
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const dateStr = dayjs(createdAt).format("DD/MM/YYYY");
    const invoiceNumber = order.invoiceNumber || order.orderNumber || order.id || "N/A";

    // --------- CALCULS ---------- //
    const items = (order.products || order.items || []).map(p => {
      const q = Number(p.quantity || 1);
      const vatRate = Number(p.vatRate ?? defaultVatRate);
      const unitBase = Number(p.unitPrice ?? p.price ?? 0); // on suppose TTC par défaut
      let unitHT, unitTTC, vatPerUnit;

      if (pricesAreTTC) {
        unitTTC = unitBase;
        unitHT = unitTTC / (1 + vatRate / 100);
      } else {
        unitHT = unitBase;
        unitTTC = unitHT * (1 + vatRate / 100);
      }
      vatPerUnit = unitTTC - unitHT;

      return {
        name: p.name || p.title || "",
        q,
        vatRate,
        unitHT,
        unitTTC,
        lineHT: unitHT * q,
        lineVAT: vatPerUnit * q,
        lineTTC: unitTTC * q,
      };
    });

    // Totaux (fallback si non fournis dans order)
    const calcSubtotal = items.reduce((s, it) => s + it.lineHT, 0);
    const calcVAT      = items.reduce((s, it) => s + it.lineVAT, 0);
    const shipping     = Number(order.shipping ?? 0);
    const discount     = Number(order.discount ?? 0);

    const subtotal = Number(order.subtotal ?? calcSubtotal); // TOTAL HT
    const vat      = Number(order.vat      ?? calcVAT);      // TVA
    const grandTotal =
      Number(order.total ?? order.grandTotal ??
        (subtotal - discount + vat + shipping));            // TOTAL TTC

    // --------- EN-TÊTE ---------- //
    if (company.logoBuffer) {
      try { doc.image(company.logoBuffer, 40, 40, { width: 100 }); } catch {}
    }
    doc.fontSize(16).text(company.name || "Votre société", 40, company.logoBuffer ? 150 : 40);
    (company.addressLines || []).forEach((l) => doc.fontSize(10).text(l));
    if (company.siret)     doc.text(`SIRET : ${company.siret}`);
    if (company.vatNumber) doc.text(`TVA : ${company.vatNumber}`);
    if (company.email)     doc.text(`Contact : ${company.email}`);

    doc.rect(350, 40, 205, 70).fill("#111").fillColor("#fff");
    doc.fontSize(18).text("FACTURE", 360, 50, { width: 190, align: "right" });
    doc.fontSize(10).text(`N° : ${invoiceNumber}`, 360, 75, { width: 190, align: "right" });
    doc.text(`Date : ${dateStr}`, { align: "right" });
    doc.fillColor("#000");
    if (order.orderNumber) doc.text(`Commande : ${order.orderNumber}`, { align: "right" });

    // --------- CLIENT ---------- //
    doc.moveDown().fontSize(12).text("Facturé à :");
    const c = order.customer || {};
    doc.fontSize(10).text(c.name || order.customerName || "");
    doc.text(c.email || order.customerEmail || "");
    const a = order.billingAddress || {};
    if (a.line1) doc.text(a.line1);
    if (a.line2) doc.text(a.line2);
    doc.text(`${a.postal || a.postcode || ""} ${a.city || ""}`);
    if (a.country) doc.text(a.country);

    // --------- TABLEAU ---------- //
    doc.moveDown().moveDown();
    doc.fontSize(12).text("Détail de la commande");

    const headerY = doc.y + 8;
    const col = {
      name: 40,
      qty: 300,
      priceHT: 350,
      vat: 430,
      totalTTC: 510,
    };

    doc.fontSize(10);
    doc.text("Article", col.name, headerY);
    doc.text("Qté", col.qty, headerY, { width: 40, align: "center" });
    doc.text("Prix HT", col.priceHT, headerY, { width: 70, align: "right" });
    doc.text("TVA", col.vat, headerY, { width: 60, align: "right" });
    doc.text("Prix TTC", col.totalTTC, headerY, { width: 80, align: "right" });

    doc.moveTo(40, headerY + 14).lineTo(555, headerY + 14).strokeColor("#ccc").stroke();
    doc.strokeColor("#000");

    let y = headerY + 22;
    items.forEach(it => {
      doc.text(it.name, col.name, y, { width: 250 });
      doc.text(String(it.q), col.qty, y, { width: 40, align: "center" });

      // PRIX HT (ligne)
      doc.text(
        money(it.lineHT, currency),
        col.priceHT,
        y,
        { width: 70, align: "right", lineBreak: false }
      );

      // TVA (montant)
      doc.text(
        money(it.lineVAT, currency),
        col.vat,
        y,
        { width: 60, align: "right", lineBreak: false }
      );

      // PRIX TTC (ligne)
      doc.text(
        money(it.lineTTC, currency),
        col.totalTTC,
        y,
        { width: 80, align: "right", lineBreak: false }
      );

      y += 18;
    });

    // --------- TOTAUX ---------- //
    y += 6;
    doc.moveTo(40, y).lineTo(555, y).strokeColor("#eee").stroke();
    y += 12;

    const boxX = 335, boxW = 220, lineH = 16;
    doc.roundedRect(boxX, y, boxW, 4 * lineH + 18, 8).fill("#fafafa").stroke("#eaeaea");
    doc.fillColor("#000");

    let ty = y + 10;
    const label = (t) =>
      doc.fontSize(10).text(t, boxX + 10, ty, { width: 130, align: "left", lineBreak: false });
    const value = (v, bold = false) => {
      if (bold) doc.font("Helvetica-Bold");
      doc.text(v, boxX + 140, ty, { width: boxW - 150, align: "right", lineBreak: false });
      if (bold) doc.font("Helvetica");
    };

    // → PRIX HT / TVA / PRIX TTC dans le bloc totaux
    label("Total HT :"); value(money(subtotal, currency)); ty += lineH;
    if (discount) { label("Remise :"); value("- " + money(discount, currency)); ty += lineH; }
    label("TVA :"); value(money(vat, currency)); ty += lineH;
    if (shipping) { label("Frais de port :"); value(money(shipping, currency)); ty += lineH; }
    doc.moveTo(boxX + 10, ty + 6).lineTo(boxX + boxW - 10, ty + 6).strokeColor("#e0e0e0").stroke();
    ty += 10;
    label("Total TTC :"); value(money(grandTotal, currency), true);

    // --------- PIED ---------- //
    doc.moveDown().moveDown();
    doc.fontSize(9).fillColor("#555").text("Merci pour votre commande !", { align: "center" });
    doc.fontSize(8).text("Facture générée automatiquement.", { align: "center" });

    doc.end();
  });
}
