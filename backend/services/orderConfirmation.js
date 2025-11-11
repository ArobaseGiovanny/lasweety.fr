// services/orderConfirmation.js

const fmtPrice = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const joinNonEmpty = (arr, sep = ", ") => arr.filter(Boolean).join(sep);

// --- Helpers de normalisation --- //
const normalizeAddress = (raw = {}) => {
  // essaie plusieurs chemins/notations possibles
  const a =
    raw?.address ||
    raw?.shippingAddress ||
    raw?.shipping ||
    raw?.deliveryAddress ||
    raw?.billingAddress || // fallback sur billing
    raw ||
    {};

  const line1 =
    a.line1 || a.address_line1 || a.address1 || a.street1 || a.street || a.address;
  const line2 = a.line2 || a.address_line2 || a.address2 || a.street2 || a.complement;
  const city = a.city || a.locality || a.town || a.ville;
  const postal =
    a.postal_code || a.postcode || a.postalCode || a.zip || a.cp || a.codePostal;
  const country = a.country || a.country_code || a.countryCode || a.pays;

  return { line1, line2, city, postal, country };
};

const normalizePickup = (raw = {}) => {
  const p =
    raw?.pickupPoint ||
    raw?.pickup ||
    raw?.relay ||
    raw ||
    {};

  const name = p.name || p.label || p.title;
  const address =
    p.address ||
    joinNonEmpty([p.line1 || p.address_line1, p.line2 || p.address_line2]);
  const city = p.city || p.locality || p.town;
  const zip = p.zip || p.postal_code || p.postcode || p.postalCode;

  return { name, address, city, zip };
};
/* --- fin helpers --- */

/**
 * Template d'email de confirmation de commande
 * @param {Object} order - Document Order en BDD
 * @param {Object} [opts] - Options (facultatif)
 * @returns {string} HTML
 */
export function orderConfirmationTemplate(order, opts = {}) {
  // Marque & liens (fallback sur .env sinon valeurs par défaut)
  const BRAND = opts.brandName || process.env.BRAND_NAME || "La Sweety";
  const SUPPORT_EMAIL = opts.supportEmail || process.env.SUPPORT_EMAIL || "contact@lasweety.com";
  const COMPANY_NAME = opts.companyName || process.env.COMPANY_NAME || BRAND;
  const COMPANY_ADDRESS_LINE1 = opts.companyAddressLine1 || process.env.COMPANY_ADDRESS_LINE1 || "";
  const COMPANY_ADDRESS_LINE2 = opts.companyAddressLine2 || process.env.COMPANY_ADDRESS_LINE2 || "";
  const COMPANY_POSTAL_CODE = opts.companyPostalCode || process.env.COMPANY_POSTAL_CODE || "";
  const COMPANY_CITY = opts.companyCity || process.env.COMPANY_CITY || "";
  const COMPANY_COUNTRY = opts.companyCountry || process.env.COMPANY_COUNTRY || "FR";
  const COMPANY_SIRET = opts.companySiret || process.env.COMPANY_SIRET || "";
  const CGV_URL = opts.cgvUrl || process.env.CGV_URL || "";
  const RETURNS_URL = opts.returnsUrl || process.env.RETURNS_URL || "";
  const SUCCESS_BASE_URL = opts.successBaseUrl || process.env.SUCCESS_BASE_URL || "";

  const orderNumber = esc(order.orderNumber || "");
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const orderDate = createdAt.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  // Client
  const customerName = esc(order.customerName || "");
  const customerEmail = esc(order.customerEmail || "");
  const customerPhone = esc(order.customerPhone || "");

  // Livraison
  const isPickup = order.deliveryMode === "pickup";

  // Normalisation adresses
  const ship = normalizeAddress(
    order.shippingAddress || order.shipping || order.deliveryAddress || order.billingAddress || {}
  );
  const pickup = normalizePickup(order.pickupPoint || order.pickup || {});

  const hasPickupInfo = isPickup && (pickup.name || pickup.address || pickup.city || pickup.zip);

  const deliveryInfo = hasPickupInfo
    ? joinNonEmpty(
        [
          pickup.name,
          pickup.address,
          joinNonEmpty([pickup.zip, pickup.city], " "),
        ].map(esc)
      )
    : joinNonEmpty(
        [
          ship.line1,
          ship.line2,
          joinNonEmpty([ship.postal, ship.city], " "),
          ship.country,
        ].map(esc)
      );

  // Colis
  const parcel = order.parcel || {};
  const parcelLine =
    parcel && (parcel.weightKg || (parcel.lengthCm && parcel.widthCm && parcel.heightCm))
      ? joinNonEmpty(
          [
            parcel.packageType ? esc(parcel.packageType) : "",
            parcel.weightKg ? `${Number(parcel.weightKg).toFixed(3)} kg` : "",
            parcel.lengthCm && parcel.widthCm && parcel.heightCm
              ? `${parcel.lengthCm}×${parcel.widthCm}×${parcel.heightCm} cm`
              : "",
          ],
          " · "
        )
      : "";

  // Produits
  const lines =
    (order.products || [])
      .map(
        (p) => `
        <tr>
          <td style="padding:10px 0;">${esc(p.name)}</td>
          <td style="text-align:center;">${p.quantity}</td>
          <td style="text-align:right;">${fmtPrice(p.price)}</td>
        </tr>`
      )
      .join("") || `
        <tr>
          <td colspan="3" style="padding:12px 0; text-align:center; color:#666;">
            Aucun article
          </td>
        </tr>`;

  // Totaux
  const total = fmtPrice(order.total || 0);
  const shippingLabel = hasPickupInfo ? "Point relais Chronopost" : "Livraison à domicile";
  const shippingCost = fmtPrice(0); // gratuit pour l’instant (modifiable)

  // CTA vers la page succès (si paramétrée)
  const orderLink =
    SUCCESS_BASE_URL && order.stripeSessionId
      ? `${SUCCESS_BASE_URL}?session_id=${encodeURIComponent(order.stripeSessionId)}`
      : "";

  // Note pickup
  const pickupNote = hasPickupInfo
    ? `<p style="margin:8px 0 0 0; color:#666;">
         Vous recevrez un e-mail/SMS du transporteur dès l’arrivée du colis au point relais.
       </p>`
    : "";
    

  return `
  <div style="background:#f6f7fb; padding:24px 12px;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06);">
      
      <!-- Header -->
      <div style="background:#111; color:#fff; padding:18px 22px;">
        <h1 style="margin:0; font-size:20px; font-weight:700; letter-spacing:0.2px;">${esc(BRAND)}</h1>
      </div>

      <!-- Contenu -->
      <div style="padding:22px;">
        <h2 style="margin:0 0 6px 0; font-size:18px;">Merci pour votre commande ${orderNumber}</h2>
        <p style="margin:0 0 14px 0; color:#555;">Passée le ${esc(orderDate)}</p>

        <p style="margin:0 0 12px 0;">Bonjour ${customerName || "!"}</p>
        <p style="margin:0 0 18px 0;">Nous avons bien reçu votre paiement. Voici votre récapitulatif :</p>

        <!-- Bloc récap produits -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th align="left" style="text-align:left; border-bottom:1px solid #eee; padding:8px 0;">Produit</th>
              <th align="center" style="text-align:center; border-bottom:1px solid #eee; padding:8px 0;">Qté</th>
              <th align="right" style="text-align:right; border-bottom:1px solid #eee; padding:8px 0;">Prix</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
          <tfoot>
            <tr>
              <td></td>
              <td style="text-align:right; padding-top:10px; color:#666;">Livraison<br/><span style="font-size:12px;">${esc(
                shippingLabel
              )}</span></td>
              <td style="text-align:right; padding-top:10px; color:#666;">${shippingCost}</td>
            </tr>
            <tr>
              <td></td>
              <td style="text-align:right; padding-top:6px; font-weight:700;">Total</td>
              <td style="text-align:right; padding-top:6px; font-weight:700;">${total}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Livraison -->
        <div style="margin-top:18px; padding:14px; background:#fafafa; border:1px solid #eee; border-radius:10px;">
          <p style="margin:0 0 6px 0;"><strong>${hasPickupInfo ? "Point relais" : "Adresse de livraison"}</strong></p>
          <p style="margin:0;">${deliveryInfo || "<em>Adresse non disponible</em>"}</p>
          ${pickupNote}
        </div>

        <!-- Infos colis -->
        ${
          parcelLine
            ? `<div style="margin-top:12px; padding:12px; background:#fafafa; border:1px solid #eee; border-radius:10px;">
                 <p style="margin:0;"><strong>Colis</strong> : ${parcelLine}</p>
               </div>`
            : ""
        }

        <!-- Infos client -->
        <div style="margin-top:12px; display:block; padding:12px; background:#fafafa; border:1px solid #eee; border-radius:10px;">
          <p style="margin:0 0 6px 0;"><strong>Coordonnées</strong></p>
          <p style="margin:0;">${customerName || "Client"}</p>
          <p style="margin:4px 0 0 0;">${customerEmail || ""}</p>
          ${customerPhone ? `<p style="margin:4px 0 0 0;">${customerPhone}</p>` : ""}
          <p style="margin:8px 0 0 0; color:#666;">N° de commande : ${orderNumber}</p>
        </div>

        <!-- CTA -->
        ${
          orderLink
            ? `<div style="text-align:center; margin-top:18px;">
                 <a href="${orderLink}"
                    style="display:inline-block; background:#111; color:#fff; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600;">
                    Voir ma commande
                 </a>
               </div>`
            : ""
        }

        <!-- Aide -->
        <p style="margin:20px 0 8px 0;">Une question ? Répondez à cet e-mail ou écrivez-nous à
          <a href="mailto:${SUPPORT_EMAIL}" style="color:#111; text-decoration:none;">${SUPPORT_EMAIL}</a>.
        </p>

        <!-- Liens utiles -->
        <p style="margin:8px 0 0 0; color:#666; font-size:13px;">
          ${
            CGV_URL
              ? `<a href="${CGV_URL}" style="color:#111; text-decoration:none;">Conditions générales de vente</a>`
              : ""
          }
          ${
            RETURNS_URL
              ? `${CGV_URL ? " · " : ""}<a href="${RETURNS_URL}" style="color:#111; text-decoration:none;">Retours & remboursements</a>`
              : ""
          }
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:16px 22px; border-top:1px solid #eee; color:#777; font-size:12px;">
        <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} ${esc(BRAND)}</p>
        <p style="margin:0;">
          ${esc(COMPANY_NAME)}
          ${
            COMPANY_SIRET
              ? ` · SIRET ${esc(COMPANY_SIRET)}`
              : ""
          }
          ${
            COMPANY_ADDRESS_LINE1 || COMPANY_CITY
              ? `<br/>${esc(joinNonEmpty([COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2]))}<br/>${esc(
                  joinNonEmpty([COMPANY_POSTAL_CODE, COMPANY_CITY], " ")
                )} ${esc(COMPANY_COUNTRY)}`
              : ""
          }
        </p>
      </div>
    </div>
  </div>
  `;
}
