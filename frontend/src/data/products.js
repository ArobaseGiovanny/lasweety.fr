import iconPelucheBleu from "../assets/icons/sweetyx-blanc.png";
import iconPelucheRose from "../assets/icons/sweetyx-rose.png";
import iconPelucheMarron from "../assets/icons/sweetyx-marron.png";

import pelucheBleuImg1 from "../assets/peluches/blue/img-1.png"
import pelucheBleuImg2 from "../assets/peluches/blue/img-2.png"
import pelucheBleuImg3 from "../assets/peluches/blue/img-3.png"
import pelucheBleuImg4 from "../assets/peluches/blue/img-4.png"
import pelucheBleuDio from "../assets/peluches/blue/dio.png"
import pelucheBleuLolo from "../assets/peluches/blue/lolo.png"
import pelucheBleuDada from "../assets/peluches/blue/dada.png"

import pelucheMarronImg1 from "../assets/peluches/brown/img-1.png"
import pelucheMarronImg2 from "../assets/peluches/brown/img-2.png"
import pelucheMarronImg3 from "../assets/peluches/brown/img-3.png"
import pelucheMarronImg4 from "../assets/peluches/brown/img-4.png"
import pelucheMarronDio from "../assets/peluches/brown/dio.png"
import pelucheMarronLolo from "../assets/peluches/brown/lolo.png"
import pelucheMarronDada from "../assets/peluches/brown/dada.png"

import pelucheRoseImg1 from "../assets/peluches/pink/img-1.png"
import pelucheRoseImg2 from "../assets/peluches/pink/img-2.png"
import pelucheRoseImg3 from "../assets/peluches/pink/img-3.png"
import pelucheRoseDio from "../assets/peluches/pink/dio.png"
import pelucheRoseLolo from "../assets/peluches/pink/lolo.png"
import pelucheRoseDada from "../assets/peluches/pink/dada.png"

const products = {
  102: {
    id: 102,
    name: "Sweetyx Bleu",
    color: "bleu",
    price: 34.99,
    description: "Un ourson bleu qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheBleu}],
    images: [
      { src: pelucheBleuImg1, alt: "Peluche Sweetyx de couleur bleu vue de l'avant" },
      { src: pelucheBleuImg2, alt: "Peluche Sweetyx de couleur bleu vue de l'arrière" },
      { src: pelucheBleuImg3, alt: "Peluche Sweetyx de couleur bleu vue de l'arrière en zoom" },
      { src: pelucheBleuImg4, alt: "Peluche Sweetyx de couleur bleu vue de l'avant sur le logo" },
      { src: pelucheBleuDada, alt: "Peluche Sweetyx de couleur bleu dans les mains de Laurinda" },
      { src: pelucheBleuDio, alt: "Peluche Sweetyx de couleur bleu dans les mains de Diolinda" },
      { src: pelucheBleuLolo, alt: "Peluche Sweetyx de couleur bleu dans les mains de Lilow" },
    ],
    specs: [
      { label: "Type", value: "Jouet – Peluche" },
      { label: "Couleur", value: "Bleu" },
      { label: "Matière principale", value: "Polyester" },
      { label: "Dimensions", value: "25 cm de hauteur" },
      { label: "Âge", value: "3 ans et +" },
      { label: "Conformité", value: "Marquage CE – EN71, EN71-1, EN71-2" },
      { label: "Disponibilité", value: "En stock" },
      { label: "Livraison", value: "2–5 jours ouvrés via Chronopost" },
      { label: "Droit de rétractation", value: "14 jours après réception (voir conditions)" },
      { label: "Vendeur", value: "La Sweety" },
    ]
  },
  103: {
    id: 103,
    name: "Sweetyx Rose",
    color: "rose",
    price: 34.99,
    description: "Un ourson rose qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheRose}],
    images: [
      { src: pelucheRoseImg1, alt: "Peluche Sweetyx de couleur Rose vue de l'avant" },
      { src: pelucheRoseImg2, alt: "Peluche Sweetyx de couleur Rose vue de l'arrière en zoom" },
      { src: pelucheRoseImg3, alt: "Peluche Sweetyx de couleur Rose vue de l'avant sur le logo" },
      { src: pelucheRoseDada, alt: "Peluche Sweetyx de couleur Rose dans les mains de Laurinda" },
      { src: pelucheRoseDio, alt: "Peluche Sweetyx de couleur Rose dans les mains de Diolinda" },
      { src: pelucheRoseLolo, alt: "Peluche Sweetyx de couleur Rose dans les mains de Lilow" },
    ],
    specs: [
      { label: "Type", value: "Jouet – Peluche" },
      { label: "Couleur", value: "Rose" },
      { label: "Matière principale", value: "Polyester" },
      { label: "Dimensions", value: "25 cm de hauteur" },
      { label: "Âge", value: "3 ans et +" },
      { label: "Conformité", value: "Marquage CE – EN71, EN71-1, EN71-2" },
      { label: "Disponibilité", value: "En stock" },
      { label: "Livraison", value: "2–5 jours ouvrés via Chronopost" },
      { label: "Droit de rétractation", value: "14 jours après réception (voir conditions)" },
      { label: "Vendeur", value: "La Sweety" },
    ]
  },
  104: {
    id: 104,
    name: "Sweetyx Marron",
    color: "marron",
    price: 34.99,
    description: "Un ourson marron qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheMarron}],
    images: [
      { src: pelucheMarronImg1, alt: "Peluche Sweetyx de couleur marron vue de l'avant" },
      { src: pelucheMarronImg2, alt: "Peluche Sweetyx de couleur marron vue de l'arrière" },
      { src: pelucheMarronImg3, alt: "Peluche Sweetyx de couleur marron vue de l'arrière en zoom" },
      { src: pelucheMarronImg4, alt: "Peluche Sweetyx de couleur marron vue de l'avant sur le logo" },
      { src: pelucheMarronDada, alt: "Peluche Sweetyx de couleur marron dans les mains de Laurinda" },
      { src: pelucheMarronDio, alt: "Peluche Sweetyx de couleur marron dans les mains de Diolinda" },
      { src: pelucheMarronLolo, alt: "Peluche Sweetyx de couleur marron dans les mains de Lilow" },
    ],
    specs: [
      { label: "Type", value: "Jouet – Peluche" },
      { label: "Couleur", value: "Marron" },
      { label: "Matière principale", value: "Polyester" },
      { label: "Dimensions", value: "25 cm de hauteur" },
      { label: "Âge", value: "3 ans et +" },
      { label: "Conformité", value: "Marquage CE – EN71, EN71-1, EN71-2" },
      { label: "Disponibilité", value: "En stock" },
      { label: "Livraison", value: "2–5 jours ouvrés via Chronopost" },
      { label: "Droit de rétractation", value: "14 jours après réception (voir conditions)" },
      { label: "Vendeur", value: "La Sweety" },
    ]
  },
};

export default products;
