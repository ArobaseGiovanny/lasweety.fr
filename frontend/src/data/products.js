import iconPelucheOrange from "../assets/icons/sweetyx-orange.png";
import iconPelucheBleu from "../assets/icons/sweetyx-bleu.png";
import iconPelucheRose from "../assets/icons/sweetyx-rose.png";
import iconPelucheMarron from "../assets/icons/sweetyx-marron.png";

import pelucheOrangeImg1 from "../assets/peluches/orange/img-1.png"
import pelucheOrangeImg2 from "../assets/peluches/orange/img-2.png"
import pelucheOrangeImg3 from "../assets/peluches/orange/img-3.png"
import pelucheOrangeDio from "../assets/peluches/orange/dio.png"
import pelucheOrangeLolo from "../assets/peluches/orange/lolo.png"
import pelucheOrangeDada from "../assets/peluches/orange/dada.png"

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



import pelucheVueOverall from "../assets/peluches/orange/overall-1.png"

const products = {
  101: {
    id: 101,
    name: "Sweetyx Orange",
    color: "orange",
    price: 34.99,
    description: "Un ourson orange qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheOrange}],
    images: [
      { src: pelucheOrangeImg1, alt: "Peluche Sweetyx de couleur orange vue de l'avant" },
      { src: pelucheOrangeImg2, alt: "Peluche Sweetyx de couleur orange vue de l'arrière en zoom" },
      { src: pelucheOrangeImg3, alt: "Peluche Sweetyx de couleur orange vue de l'arrière" },
      { src: pelucheOrangeDada, alt: "Peluche Sweetyx de couleur orange dans les mains de Laurinda" },
      { src: pelucheOrangeDio, alt: "Peluche Sweetyx de couleur orange dans les mains de Diolinda" },
      { src: pelucheOrangeLolo, alt: "Peluche Sweetyx de couleur orange dans les mains de Lilow" },
      { src: pelucheVueOverall, alt: "4 peluches Sweetyx de couleur orange, bleue, rose et marron" },

    ],
  },
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
      { src: pelucheVueOverall, alt: "4 peluches Sweetyx de couleur bleu, bleue, rose et marron" },
    ],
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
      { src: pelucheVueOverall, alt: "4 peluches Sweetyx de couleur orange, bleue, rose et marron" },
    ],
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
      { src: pelucheVueOverall, alt: "4 peluches Sweetyx de couleur bleu, bleue, rose et marron" },
    ],
  },
};

export default products;
