import { useEffect } from "react";
import {
  FaYoutube, FaInstagram, FaTiktok, FaSnapchatGhost,
} from "react-icons/fa";
import SOCIAL_STATS from "../../data/socialStats";
import "./contactPage.scss";

const MEMBERS = [
  {
    name: "La.sweety",
    socials: [
      { icon: FaYoutube,      label: "@La.Sweety",       href: "https://www.youtube.com/@La.Sweety",            color: "#FF0000", statsKey: "lasweety_yt_main" },
      { icon: FaYoutube,      label: "@lasweettv",        href: "https://www.youtube.com/@lasweettv",            color: "#FF0000", statsKey: "lasweety_yt_second" },
      { icon: FaInstagram,    label: "@sweetyfamily.yt",  href: "https://www.instagram.com/sweetyfamily.yt/",    color: "#E1306C", statsKey: "lasweety_instagram" },
      { icon: FaTiktok,       label: "@la.sweety",        href: "https://www.tiktok.com/@la.sweety",             color: "#010101", statsKey: "lasweety_tiktok" },
      { icon: FaSnapchatGhost,label: "sweeyfamily.yt",    href: "https://www.snapchat.com/add/sweeyfamily.yt",   color: "#FFCC00", statsKey: "lasweety_snapchat" },
    ],
  },
  {
    name: "Diolinda",
    socials: [
      { icon: FaYoutube,      label: "@Diolindaa_",  href: "https://www.youtube.com/@Diolindaa_",              color: "#FF0000", statsKey: "diolinda_yt" },
      { icon: FaInstagram,    label: "@diolinda_",   href: "https://www.instagram.com/diolinda_",              color: "#E1306C", statsKey: "diolinda_instagram" },
      { icon: FaTiktok,       label: "@diolindaa_",  href: "https://www.tiktok.com/@diolindaa_",               color: "#010101", statsKey: "diolinda_tiktok" },
      { icon: FaSnapchatGhost,label: "diolindaa_d",  href: "https://www.snapchat.com/add/diolindaa_d",         color: "#FFCC00", statsKey: "diolinda_snapchat" },
    ],
  },
  {
    name: "Lilow",
    socials: [
      { icon: FaYoutube,   label: "@Lilowtresor",  href: "https://www.youtube.com/@Lilowtresor/videos", color: "#FF0000", statsKey: "lilow_yt" },
      { icon: FaInstagram, label: "@lilow_tresor", href: "https://www.instagram.com/lilow_tresor",      color: "#E1306C", statsKey: "lilow_instagram" },
    ],
  },
];

function ContactPage() {
  useEffect(() => {
    document.body.classList.add("white-bg", "scrollable");
    return () => document.body.classList.remove("white-bg", "scrollable");
  }, []);

  return (
    <div className="contactPage">
      <header className="contactPage__header">
        <h1 className="contactPage__title">Suivez-nous</h1>
        <p className="contactPage__subtitle">Retrouvez-nous sur toutes les plateformes</p>
      </header>

      <div className="contactPage__grid">
        {MEMBERS.map(({ name, socials }) => (
          <div key={name} className="contactPage__card">
            <h2 className="contactPage__card-name">{name}</h2>
            <ul className="contactPage__card-links">
              {socials.map((s) => {
                const Icon = s.icon;
                const count = SOCIAL_STATS[s.statsKey];
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contactPage__link"
                      style={{ "--brand": s.color }}
                    >
                      <span className="contactPage__link-icon">
                        <Icon style={{ color: s.color }} />
                      </span>
                      <span className="contactPage__link-label">{s.label}</span>
                      {count && (
                        <span className="contactPage__link-count">{count}</span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContactPage;
