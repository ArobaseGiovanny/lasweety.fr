// Gabarits colis 
export const PACKAGING = {
    SMALL: {
    lengthCm: 30,   // Longueur (L)
    widthCm: 25,    // Largeur (l)
    heightCm: 8,    // Épaisseur 
    tareKg: 0.03,   // ~30 g pour une petite enveloppe plastique
    maxItems: 2,
  },
  LARGE: {
    lengthCm: 45,   // Longueur (L)
    widthCm: 35,    // Largeur (l)
    heightCm: 10,   // Épaisseur
    tareKg: 0.04,   // ~40 g pour une grande enveloppe
    maxItems: 4,
  },
};

// Sélectionne un gabarit en fonction de la quantité d'articles
export function selectPackaging(totalQty) {
  return totalQty <= PACKAGING.SMALL.maxItems ? PACKAGING.SMALL : PACKAGING.LARGE;
}
