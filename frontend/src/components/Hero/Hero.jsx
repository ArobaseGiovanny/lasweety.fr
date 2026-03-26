import { useRef, useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import "./hero.scss";
import sweetyxMarron from "../../assets/icons/sweetyx-marron.png";
import sweetyxBleu   from "../../assets/icons/sweetyx-blanc.png";
import sweetyxRose   from "../../assets/icons/sweetyx-rose.png";
import { IoIosArrowDown } from "react-icons/io";
import "../../scripts/adaptWidth";

const PLUSHES = [
  { src: sweetyxBleu,   alt: "Ourson bleu",   id: 102 },
  { src: sweetyxRose,   alt: "Ourson rose",   id: 103 },
  { src: sweetyxMarron, alt: "Ourson marron", id: 104 },
];

// dist = -1 (gauche), 0 (centre), +1 (droite)
const POSITIONS = {
  "-1": { x: "-36vw", scale: 0.72, rotate: -14, zIndex: 1 },
   "0": { x:   "0vw", scale: 1.00, rotate:   0, zIndex: 3 },
   "1": { x:  "36vw", scale: 0.72, rotate:  14, zIndex: 1 },
};

function getDist(plushIdx, active) {
  let d = plushIdx - active;
  if (d >  1) d -= 3;
  if (d < -1) d += 3;
  return d;
}

function Hero({ onPelucheClick }) {
  const scrollRef  = useRef(null);
  const touchStart = useRef(null);
  const [activeIdx, setActiveIdx] = useState(1);

  const prevDistsRef = useRef(
    Object.fromEntries(PLUSHES.map((p, i) => [p.id, getDist(i, 1)]))
  );

  useEffect(() => {
    PLUSHES.forEach((p, i) => {
      prevDistsRef.current[p.id] = getDist(i, activeIdx);
    });
  }, [activeIdx]);

  const prev = () => setActiveIdx(i => (i + 2) % 3);
  const next = () => setActiveIdx(i => (i + 1) % 3);

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if      (delta >  50) prev();
    else if (delta < -50) next();
    touchStart.current = null;
  };

  return (
    <main className="hero" ref={scrollRef}>
      <div className="hero__text">
        <span className="hero__text-title">Sweetyx</span>
        <span className="hero__text-sub">Choisis ta couleur</span>
        <IoIosArrowDown />
      </div>

      {/* ── Mobile : fan animé ──────────────────────────────────────────── */}
      <div className="hero__fan" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="hero__glow" />
        {PLUSHES.map((p, i) => {
          const dist     = getDist(i, activeIdx);
          const prevDist = prevDistsRef.current[p.id] ?? dist;
          const isJump   = Math.abs(dist - prevDist) >= 2;
          const pos      = POSITIONS[String(dist)];
          const isCenter = dist === 0;
          const prevPos  = POSITIONS[String(prevDist)];

          return (
            <Motion.div
              key={p.id}
              className="hero__fan-plush"
              animate={isJump ? {
                x:      [prevPos.x,      "0vw", pos.x],
                scale:  [prevPos.scale,  0.42,  pos.scale],
                rotate: [prevPos.rotate, 0,     pos.rotate],
                zIndex: 0,
              } : {
                x: pos.x, scale: pos.scale, rotate: pos.rotate, zIndex: pos.zIndex,
              }}
              transition={isJump
                ? { duration: 0.42, times: [0, 0.5, 1], ease: "easeInOut" }
                : { type: "spring", stiffness: 280, damping: 28 }
              }
              onClick={isCenter ? () => onPelucheClick(p.id) : dist < 0 ? prev : next}
              style={{ cursor: "pointer" }}
            >
              <img src={p.src} alt={p.alt} />
            </Motion.div>
          );
        })}
      </div>

      {/* ── Desktop : row classique ─────────────────────────────────────── */}
      <div className="hero__images">
        {PLUSHES.map(p => (
          <div key={p.id} className="hero__item" onClick={() => onPelucheClick(p.id)}>
            <div className="hero__glow" />
            <img src={p.src} alt={p.alt} />
          </div>
        ))}
      </div>

      {/* ── Vague arc-en-ciel ────────────────────────────────────────────── */}
      <div className="hero__wave" aria-hidden="true">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Gradient 2× la largeur → on anime x1/x2 pour cycler comme Sweetyx */}
            <linearGradient id="waveRainbow" gradientUnits="userSpaceOnUse" x1="0" x2="2400" y1="0" y2="0">
              <animate attributeName="x1" from="0"    to="-1200" dur="4s" repeatCount="indefinite"/>
              <animate attributeName="x2" from="2400" to="1200"  dur="4s" repeatCount="indefinite"/>
              <stop offset="0%"     stopColor="#ff0000"/>
              <stop offset="7.14%"  stopColor="#ff7700"/>
              <stop offset="14.29%" stopColor="#ffee00"/>
              <stop offset="21.43%" stopColor="#00cc44"/>
              <stop offset="28.57%" stopColor="#0088ff"/>
              <stop offset="35.71%" stopColor="#8800ff"/>
              <stop offset="42.86%" stopColor="#ff00cc"/>
              <stop offset="50%"    stopColor="#ff0000"/>
              <stop offset="57.14%" stopColor="#ff7700"/>
              <stop offset="64.29%" stopColor="#ffee00"/>
              <stop offset="71.43%" stopColor="#00cc44"/>
              <stop offset="78.57%" stopColor="#0088ff"/>
              <stop offset="85.71%" stopColor="#8800ff"/>
              <stop offset="92.86%" stopColor="#ff00cc"/>
              <stop offset="100%"   stopColor="#ff0000"/>
            </linearGradient>
          </defs>
          <path fill="url(#waveRainbow)" opacity="0.95">
            <animate attributeName="d" dur="4s" repeatCount="indefinite"
              values="M0,35 C150,10 350,60 600,35 C850,10 1050,60 1200,35 L1200,100 L0,100 Z;M0,55 C150,80 350,25 600,55 C850,80 1050,25 1200,55 L1200,100 L0,100 Z;M0,35 C150,10 350,60 600,35 C850,10 1050,60 1200,35 L1200,100 L0,100 Z"/>
          </path>
          <path fill="url(#waveRainbow)" opacity="0.5">
            <animate attributeName="d" dur="3s" repeatCount="indefinite"
              values="M0,60 C200,35 400,75 600,60 C800,45 1000,75 1200,60 L1200,100 L0,100 Z;M0,40 C200,65 400,25 600,40 C800,65 1000,30 1200,40 L1200,100 L0,100 Z;M0,60 C200,35 400,75 600,60 C800,45 1000,75 1200,60 L1200,100 L0,100 Z"/>
          </path>
        </svg>
      </div>
    </main>
  );
}

export default Hero;
