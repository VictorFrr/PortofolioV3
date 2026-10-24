import { useState } from "react";
import films from "../data/films.json";
import "./Cinema.css";

const T = {
  fr: { title: "Cinéma", sub: "Mes films notés 4★ et plus", all: "Tous", link: "Mon Letterboxd", films: "films" },
  en: { title: "Cinema", sub: "Films I rated 4★ or higher", all: "All", link: "My Letterboxd", films: "films" },
};

const stars = (n) => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");

export default function Cinema({ lang = "fr" }) {
  const t = T[lang] ?? T.fr;
  const [min, setMin] = useState(4);
  const shown = films.filter((f) => f.rating >= min);

  return (
    <section id="cinema" className="cinema">
      <header className="cinema__head">
        <div>
          <h2>{t.title}</h2>
          <p>{t.sub} · {shown.length} {t.films}</p>
        </div>
        <div className="cinema__filters" role="group" aria-label="Filtre par note">
          {[4, 4.5, 5].map((v) => (
            <button key={v} className={min === v ? "is-on" : ""} onClick={() => setMin(v)}>
              {v === 4 ? t.all : stars(v)}
            </button>
          ))}
        </div>
      </header>

      <ul className="cinema__grid">
        {shown.map((f) => (
          <li key={f.slug}>
            <a href={f.uri} target="_blank" rel="noopener noreferrer" className="poster">
              <span className="poster__fallback">{f.title}</span>
              <img
                src={`/posters/${f.slug}.jpg`}
                alt={`${f.title} (${f.year})`}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <span className="poster__info">
                <strong>{f.title}</strong>
                <em>{f.year} · {stars(f.rating)}</em>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <a className="cinema__link" href="https://letterboxd.com/victor_34/" target="_blank" rel="noopener noreferrer">
        {t.link}
      </a>
    </section>
  );
}
