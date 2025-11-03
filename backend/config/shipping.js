// Gabarits colis 
export const PACKAGING = {
  SMALL: { lengthCm: 30, widthCm: 25, heightCm: 15, tareKg: 0.12, maxItems: 2 },
  LARGE: { lengthCm: 40, widthCm: 30, heightCm: 20, tareKg: 0.20, maxItems: 4 },
};

// Sélectionne un gabarit en fonction de la quantité d'articles
export function selectPackaging(totalQty) {
  return totalQty <= PACKAGING.SMALL.maxItems ? PACKAGING.SMALL : PACKAGING.LARGE;
}
