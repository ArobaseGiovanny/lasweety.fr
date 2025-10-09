import pelucheOrange from "../assets/peluches/peluche-orange-1.png";
import pelucheBleu from "../assets/peluches/peluche-bleu-1.png";
import pelucheRose from "../assets/peluches/peluche-rose-1.png";
import pelucheMarron from "../assets/peluches/peluche-marron-1.png";
import iconPelucheOrange from "../assets/icons/sweetyx-orange.png";
import iconPelucheBleu from "../assets/icons/sweetyx-bleu.png";
import iconPelucheRose from "../assets/icons/sweetyx-rose.png";
import iconPelucheMarron from "../assets/icons/sweetyx-marron.png";

const products = {
  101: {
    id: 101,
    name: "Sweetyx Orange",
    color: "orange",
    price: 29.99,
    description: "Un ourson orange qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheOrange}],
    images: [
      { src: pelucheOrange, alt: "Sweetyx Orange vue 1" }
    ],
  },
  102: {
    id: 102,
    name: "Sweetyx Bleu",
    color: "bleu",
    price: 29.99,
    description: "Un ourson bleu qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheBleu}],
    images: [
      { src: pelucheBleu, alt: "Sweetyx Bleu vue 1" }
    ],
  },
  103: {
    id: 103,
    name: "Sweetyx Rose",
    color: "rose",
    price: 29.99,
    description: "Un ourson rose qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheRose}],
    images: [
      { src: pelucheRose, alt: "Sweetyx Rose vue 1" }
    ],
  },
  104: {
    id: 104,
    name: "Sweetyx Marron",
    color: "marron",
    price: 29.99,
    description: "Un ourson marron qui fait fondre les cœurs 💙",
    icon: [{src: iconPelucheMarron}],
    images: [
      { src: pelucheMarron, alt: "Sweetyx Marron vue 1" }
    ],
  },
};

export default products;
