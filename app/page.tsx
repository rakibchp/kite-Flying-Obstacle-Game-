import KiteGame from "./kite-game";

const highlights = [
  { number: "01", label: "Catch the wind", detail: "Move with the breeze" },
  { number: "02", label: "Dodge the flock", detail: "Keep your string safe" },
  { number: "03", label: "Rule the rooftop", detail: "Stay up, score big" },
];

export default function Home() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="Ghuddi home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 42 46" fill="none">
              <path d="M21 2 38 18 21 34 4 18 21 2Z" fill="#F36D4E" />
              <path d="m21 2 17 16H21V2Z" fill="#FFC94A" />
              <path d="M21 34v9l-5-4 5-5Z" fill="#34A99A" />
              <path d="M21 34v9l5-4-5-5Z" fill="#4785CE" />
              <path d="m4 18 17 16V18H4Z" fill="#F6AA48" />
              <path d="m38 18-17 16V18h17Z" fill="#E95E57" />
              <path d="M21 34c-6 5 5 5 0 10" stroke="#33443E" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="brand-copy">
            <span className="brand-name">ghuddi</span>
            <span className="brand-caption">A little rooftop adventure</span>
          </span>
        </a>

        <nav className="header-nav" aria-label="Main navigation">
          <a href="#how-to-play">How to play</a>
          <span className="festival-tag">
            <span aria-hidden="true">✦</span> SHAKRAIN SPECIAL
          </span>
        </nav>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow"><span /> A DHAKA ROOFTOP CLASSIC</p>
          <h1 id="page-title">
            Find your <span>wind.</span>
            <br />
            Own the <span>sky.</span>
          </h1>
          <p className="intro-description">
            The rooftops are buzzing and the kites are up. How long can you
            keep your ghuddi flying?
          </p>
        </div>
        <div className="intro-stamp" aria-label="Made for festival days">
          <span className="stamp-spark" aria-hidden="true">✳</span>
          <span>MADE FOR</span>
          <strong>FESTIVAL<br />DAYS</strong>
          <span className="stamp-bengali" lang="bn">ঘুড়ি উড়াও!</span>
        </div>
      </section>

      <KiteGame />

      <section className="how-to-play" id="how-to-play" aria-labelledby="how-title">
        <div className="how-heading">
          <p className="eyebrow">YOUR ROOFTOP, YOUR RULES</p>
          <h2 id="how-title">A little <span>wind.</span> A lot of fun.</h2>
        </div>
        <div className="highlight-list">
          {highlights.map((item) => (
            <article className="highlight" key={item.number}>
              <span className="highlight-number">{item.number}</span>
              <div>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </div>
              <span className="highlight-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>Made with a little bit of <span aria-label="love">♥</span> in Dhaka</span>
        <span className="footer-note">Careful out there — the crows are sneaky.</span>
      </footer>
    </main>
  );
}
