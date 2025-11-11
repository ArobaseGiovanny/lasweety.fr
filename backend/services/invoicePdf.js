// services/invoicePdf.js
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

const money = (v, c = "EUR") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: c }).format(Number(v || 0));

export function generateInvoicePdfBuffer(order, company = {}) {
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

    // En-tête société
    if (company.logoBuffer) {
      try { doc.image(company.logoBuffer, 40, 40, { width: 100 }); } catch {}
    }
    doc.fontSize(16).text(company.name || "Votre société", 40, company.logoBuffer ? 150 : 40);
    (company.addressLines || []).forEach((l) => doc.fontSize(10).text(l));
    if (company.siret) doc.text(`SIRET : ${company.siret}`);
    if (company.vatNumber) doc.text(`TVA : ${company.vatNumber}`);
    if (company.email) doc.text(`Contact : ${company.email}`);

    // Bloc facture
    doc.fontSize(20).text("FACTURE", { align: "right" });
    doc.fontSize(10).text(`N° : ${invoiceNumber}`, { align: "right" });
    doc.text(`Date : ${dateStr}`, { align: "right" });
    if (order.orderNumber) doc.text(`Commande : ${order.orderNumber}`, { align: "right" });

    // Client
    doc.moveDown().fontSize(12).text("Facturé à :");
    const c = order.customer || {};
    doc.fontSize(10).text(c.name || order.customerName || "");
    doc.text(c.email || order.customerEmail || "");
    if (order.billingAddress) {
      const a = order.billingAddress;
      if (a.line1) doc.text(a.line1);
      if (a.line2) doc.text(a.line2);
      doc.text(`${a.postal || a.postcode || ""} ${a.city || ""}`);
      if (a.country) doc.text(a.country);
    }

    // Tableau
    doc.moveDown().fontSize(12).text("Détail");
    const headerY = doc.y + 8;
    const col = { name: 40, qty: 320, unit: 370, vat: 440, total: 510 };

    doc.fontSize(10);
    doc.text("Article", col.name, headerY);
    doc.text("Qté", col.qty, headerY);
    doc.text("PU HT", col.unit, headerY);
    doc.text("TVA", col.vat, headerY);
    doc.text("Total TTC", col.total, headerY);
    doc.moveTo(40, headerY + 14).lineTo(555, headerY + 14).stroke();

    let y = headerY + 22;
    (order.products || order.items || []).forEach((p) => {
      const q = Number(p.quantity || 1);
      const unit = Number(p.unitPrice ?? p.price ?? 0);
      const vatRate = Number(p.vatRate ?? 20);
      const lineTtc = unit * (1 + vatRate / 100) * q;

      doc.text(p.name || p.title || "", col.name, y, { width: 260 });
      doc.text(String(q), col.qty, y);
      doc.text(money(unit, currency), col.unit, y);
      doc.text(`${vatRate}%`, col.vat, y);
      doc.text(money(lineTtc, currency), col.total, y);
      y += 18;
    });

    // Totaux
    y += 8;
    doc.moveTo(40, y).lineTo(555, y).stroke(); y += 10;
    const rightX = 400;

    const subtotal = Number(order.subtotal ?? 0);
    const discount = Number(order.discount ?? 0);
    const vat = Number(order.vat ?? 0);
    const shipping = Number(order.shipping ?? 0);
    const grandTotal = Number(order.total ?? order.grandTotal ?? subtotal - discount + vat + shipping);

    doc.text("Sous-total HT :", rightX, y);         doc.text(money(subtotal, currency), 510, y); y += 14;
    if (discount) { doc.text("Remise :", rightX, y); doc.text("- " + money(discount, currency), 510, y); y += 14; }
    doc.text("TVA :", rightX, y);                   doc.text(money(vat, currency), 510, y); y += 14;
    if (shipping) { doc.text("Frais de port :", rightX, y); doc.text(money(shipping, currency), 510, y); y += 14; }
    doc.fontSize(12).text("Total TTC :", rightX, y);
    doc.fontSize(12).text(money(grandTotal, currency), 510, y);

    doc.moveDown().moveDown();
    doc.fontSize(9).text("Merci pour votre commande !", { align: "center" });
    doc.fontSize(8).text("Facture générée automatiquement.", { align: "center" });

    doc.end();
  });
}
