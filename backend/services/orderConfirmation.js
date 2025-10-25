export function orderConfirmationTemplate(order) {
  const lines = (order.products || []).map(p => `
    <tr>
      <td>${p.name}</td>
      <td style="text-align:center;">${p.quantity}</td>
      <td style="text-align:right;">${p.price.toFixed(2)} €</td>
    </tr>
  `).join("");

  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto;">
    <h2>Merci pour votre commande ${order.orderNumber}</h2>
    <p>Bonjour ${order.customerName || ""},</p>
    <p>Nous avons bien reçu votre paiement. Voici le récapitulatif :</p>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;border-bottom:1px solid #eee;padding-bottom:6px;">Produit</th>
          <th style="text-align:center;border-bottom:1px solid #eee;padding-bottom:6px;">Qté</th>
          <th style="text-align:right;border-bottom:1px solid #eee;padding-bottom:6px;">Prix</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
      <tfoot>
        <tr>
          <td></td>
          <td style="text-align:right;font-weight:700;padding-top:8px;">Total</td>
          <td style="text-align:right;font-weight:700;padding-top:8px;">${Number(order.total).toFixed(2)} €</td>
        </tr>
      </tfoot>
    </table>
    <p style="margin-top:12px;">
      Livraison à : ${order.shippingAddress?.line1 || ""}, ${order.shippingAddress?.postal_code || ""} ${order.shippingAddress?.city || ""}
    </p>
    <p>Besoin d’aide ? Répondez à cet e-mail.</p>
    <p style="color:#888;font-size:12px;">© ${new Date().getFullYear()} Sweetyx</p>
  </div>
  `;
}
