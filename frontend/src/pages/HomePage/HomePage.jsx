import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaYoutube, FaInstagram, FaTiktok, FaSnapchatGhost } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, EffectCards } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-cards";
import "./homePage.scss";

import iconOrange from "../../assets/icons/sweetyx-orange.png";
import iconBleu   from "../../assets/icons/sweetyx-blanc.png";
import iconRose   from "../../assets/icons/sweetyx-rose.png";
import iconMarron from "../../assets/icons/sweetyx-marron.png";

const PLUSH_IMGS = [
  { src: iconOrange, cls: "orange" },
  { src: iconBleu,   cls: "bleu" },
  { src: iconRose,   cls: "rose" },
  { src: iconMarron, cls: "marron" },
];

const MEMBERS = [
  {
    name: "La.sweety",
    label: "Principal",
    socials: [
      { icon: FaYoutube,       label: "@La.Sweety",      href: "https://www.youtube.com/@La.Sweety",           color: "#FF0000", hover: "#FF0000" },
      { icon: FaYoutube,       label: "@lasweettv",      href: "https://www.youtube.com/@lasweettv",           color: "#FF0000", hover: "#FF0000" },
      { icon: FaInstagram,     label: "@sweetyfamily.yt", href: "https://www.instagram.com/sweetyfamily.yt/", color: "#E1306C", hover: "#E1306C" },
      { icon: FaTiktok,        label: "@la.sweety",      href: "https://www.tiktok.com/@la.sweety",            color: "#010101", hover: "#010101" },
      { icon: FaSnapchatGhost, label: "sweeyfamily.yt",  href: "https://www.snapchat.com/add/sweeyfamily.yt", color: "#FFCC00", hover: "#FFCC00" },
    ],
  },
  {
    name: "Diolinda",
    label: null,
    socials: [
      { icon: FaYoutube,       label: "@Diolindaa_",  href: "https://www.youtube.com/@Diolindaa_",      color: "#FF0000", hover: "#FF0000" },
      { icon: FaInstagram,     label: "@diolinda_",   href: "https://www.instagram.com/diolinda_",      color: "#E1306C", hover: "#E1306C" },
      { icon: FaTiktok,        label: "@diolindaa_",  href: "https://www.tiktok.com/@diolindaa_",       color: "#010101", hover: "#010101" },
      { icon: FaSnapchatGhost, label: "diolindaa_d",  href: "https://www.snapchat.com/add/diolindaa_d", color: "#FFCC00", hover: "#FFCC00" },
    ],
  },
  {
    name: "Lilow",
    label: null,
    socials: [
      { icon: FaYoutube,   label: "@Lilowtresor",  href: "https://www.youtube.com/@Lilowtresor/videos", color: "#FF0000", hover: "#FF0000" },
      { icon: FaInstagram, label: "@lilow_tresor", href: "https://www.instagram.com/lilow_tresor",      color: "#E1306C", hover: "#E1306C" },
    ],
  },
];

const PERKS = [
  { icon: "🚚", label: "Livraison offerte" },
  { icon: "✅", label: "Certifiée CE · 3 ans+" },
  { icon: "🧸", label: "25 cm de douceur" },
];

function HomePage() {
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [shorts, setShorts] = useState([]);
  const [shortsLoading, setShortsLoading] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const [videosVisible, setVideosVisible] = useState(false);
  const heroRef = useRef(null);
  const videosRef = useRef(null);
  const videosSwiperRef = useRef(null);
  const shortsSwiperRef = useRef(null);

  useEffect(() => {
    const heroObs = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    const videosObs = new IntersectionObserver(
      ([entry]) => setVideosVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px 150px 0px" }
    );
    if (heroRef.current) heroObs.observe(heroRef.current);
    if (videosRef.current) videosObs.observe(videosRef.current);
    return () => { heroObs.disconnect(); videosObs.disconnect(); };
  }, []);

  useEffect(() => {
    document.body.classList.add("scrollable", "white-bg");
    return () => { document.body.classList.remove("scrollable", "white-bg"); };
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/youtube/videos`)
      .then((res) => res.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setVideos([]))
      .finally(() => setVideosLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/youtube/shorts`)
      .then((res) => res.json())
      .then((data) => setShorts(Array.isArray(data) ? data : []))
      .catch(() => setShorts([]))
      .finally(() => setShortsLoading(false));
  }, []);

  const slidePrev = (ref) => {
    const s = ref.current;
    if (!s) return;
    s.isBeginning ? s.slideTo(s.slides.length - 1) : s.slidePrev();
  };

  const slideNext = (ref) => {
    const s = ref.current;
    if (!s) return;
    s.isEnd ? s.slideTo(0) : s.slideNext();
  };

  return (
    <div className="homePage">

{/* ===== HERO ===== */}
      <section className="homePage__hero" ref={heroRef}>

        {/* Colonne gauche — texte */}
        <div className="homePage__hero-left">
          <h1 className="homePage__hero-title">Sweetyx</h1>
          <p className="homePage__hero-tagline">La peluche qui fait fondre les cœurs</p>

          {/* Images empilées — mobile */}
          <Link to="/peluches" className="homePage__hero-imgs homePage__hero-imgs--mobile">
            {PLUSH_IMGS.map(({ src, cls }) => (
              <img key={cls} src={src} alt={`Peluche Sweetyx ${cls}`}
                className={`homePage__hero-img homePage__hero-img--${cls}`} />
            ))}
          </Link>

          <Link to="/peluches" className="homePage__hero-cta">
            Voir nos peluches ✨
          </Link>

          <div className="homePage__hero-perks">
            {PERKS.map(({ icon, label }) => (
              <span key={label} className="homePage__hero-perk">
                {icon} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Colonne droite — images empilées desktop */}
        <div className="homePage__hero-right">
          <Link to="/peluches" className="homePage__hero-imgs homePage__hero-imgs--desktop">
            {PLUSH_IMGS.map(({ src, cls }) => (
              <img key={cls} src={src} alt={`Peluche Sweetyx ${cls}`}
                className={`homePage__hero-img homePage__hero-img--${cls}`} />
            ))}
          </Link>
        </div>

      </section>

      <div
        className={`homePage__chevron${(!heroVisible || videosVisible) ? " homePage__chevron--hidden" : ""}`}
        onClick={() => videosRef.current?.scrollIntoView({ behavior: "smooth" })}
      >
        <FiChevronDown />
      </div>

      {/* ===== VIDÉOS ===== */}
      <section className="homePage__videos" ref={videosRef}>
        <h2 className="homePage__videos-title">Nos dernières vidéos</h2>
        <a href="https://www.youtube.com/@La.Sweety/" target="_blank" rel="noopener noreferrer" className="homePage__yt-channel">
          <FaYoutube className="homePage__yt-icon" />
          <span className="homePage__yt-name">La.sweety</span>
        </a>

        {videosLoading && <p className="homePage__videos-loading">Chargement…</p>}

        {!videosLoading && videos.length === 0 && (
          <p className="homePage__videos-empty">Aucune vidéo disponible pour le moment.</p>
        )}

        {!videosLoading && videos.length > 0 && (
          <div className="homePage__swiper-row">
            <button className="homePage__swiper-btn" onClick={() => slidePrev(videosSwiperRef)}><FiChevronLeft /></button>
            <Swiper
              onSwiper={(s) => { videosSwiperRef.current = s; }}
              modules={[Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{ 600: { slidesPerView: 2 }, 900: { slidesPerView: 3 } }}
              className="homePage__videos-swiper"
            >
              {videos.map((video) => (
                <SwiperSlide key={video.id}>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="homePage__videos-card">
                    <div className="homePage__videos-thumb">
                      <img src={video.thumbnail} alt={video.title} loading="lazy" />
                      <span className="homePage__videos-play">▶</span>
                    </div>
                    <p className="homePage__videos-card-title">{video.title}</p>
                  </a>
                </SwiperSlide>
              ))}
            </Swiper>
            <button className="homePage__swiper-btn" onClick={() => slideNext(videosSwiperRef)}><FiChevronRight /></button>
          </div>
        )}
      </section>

      {/* ===== SHORTS ===== */}
      <section className="homePage__shorts">
        <h2 className="homePage__shorts-title">Nos derniers shorts</h2>
        <a href="https://www.youtube.com/@La.Sweety/" target="_blank" rel="noopener noreferrer" className="homePage__yt-channel">
          <FaYoutube className="homePage__yt-icon" />
          <span className="homePage__yt-name">La.sweety</span>
        </a>

        {shortsLoading && <p className="homePage__videos-loading">Chargement…</p>}

        {!shortsLoading && shorts.length === 0 && (
          <p className="homePage__videos-empty">Aucun short disponible pour le moment.</p>
        )}

        {!shortsLoading && shorts.length > 0 && (
          <div className="homePage__swiper-row">
            <button className="homePage__swiper-btn" onClick={() => slidePrev(shortsSwiperRef)}><FiChevronLeft /></button>
            <Swiper
              onSwiper={(s) => { shortsSwiperRef.current = s; }}
              modules={[Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{ 480: { slidesPerView: 3 }, 900: { slidesPerView: 5 } }}
              className="homePage__shorts-swiper"
            >
              {shorts.map((short) => (
                <SwiperSlide key={short.id}>
                  <a href={short.url} target="_blank" rel="noopener noreferrer" className="homePage__shorts-card">
                    <div className="homePage__shorts-thumb">
                      <img src={short.thumbnail} alt={short.title} loading="lazy" />
                      <span className="homePage__videos-play">▶</span>
                    </div>
                    <p className="homePage__videos-card-title">{short.title}</p>
                  </a>
                </SwiperSlide>
              ))}
            </Swiper>
            <button className="homePage__swiper-btn" onClick={() => slideNext(shortsSwiperRef)}><FiChevronRight /></button>
          </div>
        )}
      </section>

      {/* ===== RÉSEAUX ===== */}
      <section className="homePage__reseaux">
        <h2 className="homePage__reseaux-title">Nos réseaux</h2>

        {/* Mobile : slider empilé */}
        <Swiper
          effect="cards"
          grabCursor={true}
          loop={true}
          modules={[EffectCards]}
          className="homePage__reseaux-swiper"
        >
          {MEMBERS.map(({ name, label, socials }) => (
            <SwiperSlide key={name} className="homePage__reseaux-card">
              <div className="homePage__reseaux-card-header">
                <span className="homePage__reseaux-card-name">{name}</span>
                {label && <span className="homePage__reseaux-card-label">{label}</span>}
              </div>
              <div className="homePage__reseaux-card-links">
                {socials.map((social) => {
                  const SocialIcon = social.icon;
                  return (
                    <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer"
                      className="homePage__reseaux-link"
                      style={{ "--brand": social.color, "--brand-bg": `${social.color}18` }}
                    >
                      <SocialIcon style={{ color: social.color }} />
                      <span>{social.label}</span>
                    </a>
                  );
                })}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Desktop : toutes les cartes côte à côte */}
        <div className="homePage__reseaux-grid">
          {MEMBERS.map(({ name, label, socials }) => (
            <div key={name} className="homePage__reseaux-card">
              <div className="homePage__reseaux-card-header">
                <span className="homePage__reseaux-card-name">{name}</span>
                {label && <span className="homePage__reseaux-card-label">{label}</span>}
              </div>
              <div className="homePage__reseaux-card-links">
                {socials.map((social) => {
                  const SocialIcon = social.icon;
                  return (
                    <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer"
                      className="homePage__reseaux-link"
                      style={{ "--brand": social.color, "--brand-bg": `${social.color}18` }}
                    >
                      <SocialIcon style={{ color: social.color }} />
                      <span>{social.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default HomePage;
