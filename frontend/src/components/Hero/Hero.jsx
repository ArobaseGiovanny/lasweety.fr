import { useRef, useEffect } from "react";
import "./hero.scss";
import sweetyxOrange from "../../images/sweetyx-orange.png";
import sweetyxMarron from "../../images/sweetyx-marron.png";
import sweetyxBleu from "../../images/sweetyx-bleu.png";
import sweetyxRose from "../../images/sweetyx-rose.png";
import tableBois from "../../images/table.jpg";
import { IoIosArrowDown } from "react-icons/io";
import "../../scripts/adaptWidth";


function Hero() {

  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();             
        el.scrollLeft += e.deltaY * 2;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <main className="hero" ref={scrollRef}>
        <div className="hero__text">
            <span className="hero__text-choose">Choisis ta peluche</span>
            <span className="hero__text-choose">Sweetyx</span>
            <IoIosArrowDown />
        </div>
      <div className="hero__images">
        <img src={sweetyxOrange} alt="Ourson de couleur orange" />
        <img src={sweetyxMarron} alt="Ourson de couleur marron" />
        <img src={sweetyxBleu} alt="Ourson de couleur bleu" />
        <img src={sweetyxRose} alt="Ourson de couleur rose" />
      </div>
      <img src={tableBois} alt="Table en bois" className="hero__table" />
    </main>
  );
}

export default Hero;
