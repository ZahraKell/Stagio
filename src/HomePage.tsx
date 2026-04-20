import { useState, useRef, useEffect } from "react";
import studentImg from "./assets/student.jpg";
import companyImg from "./assets/company.jpg";

const CDN = "https://cdn.sanity.io/images/mz2hls6g/eu-production";
const IMG = {
  disney: `${CDN}/36fae29e83553cc41e52e0c9baf24cfbd74f20b9-172x115.svg`,
  tiktok: `${CDN}/38b6560cebcb55bad54b72f0df8a0b0848d758f2-172x115.svg`,
  db: `${CDN}/58bbbb6e0b8725633eb8ad7b246c82b07e9dde22-172x115.svg`,
  pg: `${CDN}/fa09a365c8dc9f3691e1c9d60673aa837b87a19f-172x115.svg`,
  nike: `${CDN}/62198d0a16e0d03e1d476760fc5c049a3b959128-172x115.svg`,
  ey: `${CDN}/c382c65c6cbbd3d7ca896a0df09182afb757958d-172x115.svg`,
};

const graduatedStudents = [
  {
    name: "Sarah Ahmed",
    role: "Développeuse Full Stack",
    company: "Microsoft",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    quote: "Grâce à Stag.io, j'ai décroché un stage chez Microsoft qui s'est transformé en CDI. La plateforme m'a ouvert des portes que je n'aurais jamais imaginées."
  },
  {
    name: "Karim Benali",
    role: "Data Scientist",
    company: "Google",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    quote: "Les offres personnalisées et la messagerie directe avec les recruteurs ont changé ma recherche. Aujourd'hui je suis Data Scientist chez Google."
  },
  {
    name: "Leila Mansouri",
    role: "Product Manager",
    company: "Amazon",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote: "Stag.io m'a aidée à trouver un stage en product management qui correspondait parfaitement à mes aspirations. Une expérience inoubliable."
  },
  {
    name: "Mehdi Kaci",
    role: "Consultant Stratégie",
    company: "Deloitte",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    quote: "Les événements de networking organisés sur la plateforme m'ont permis de rencontrer des professionnels clés. Je recommande vivement."
  },
];

// ---------- Split Hero Component ----------
function SplitHero() {
  const [hovered, setHovered] = useState<string | null>(null);
  const flex = (id: string) => hovered === id ? 1.7 : hovered !== null ? 0.5 : 1;

  return (
    <div className="hs-hero-wrap">
      <div
        className="hs-panel"
        style={{
          flex: flex("student"),
          backgroundImage: `url(${studentImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
        onMouseEnter={() => setHovered("student")}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="hs-panel-overlay" />
        <div className="hs-panel-body">
          <div className="hs-panel-big-title">Student</div>
          <p className="hs-panel-desc">
            Here where you can find your dream internship, connect with top companies, and get career advice tailored just for you.
          </p>
          <button className="hs-panel-btn">click here →</button>
        </div>
      </div>
      <div className="hs-panel-divider" />
      <div
        className="hs-panel"
        style={{
          flex: flex("company"),
          backgroundImage: `url(${companyImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onMouseEnter={() => setHovered("company")}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="hs-panel-overlay" />
        <div className="hs-panel-body">
          <div className="hs-panel-big-title">company</div>
          <p className="hs-panel-desc">
            share your internship opportunities with potential candidates.
          </p>
          <button className="hs-panel-btn">create internship →</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Scroll Color Section (corrected structure) ----------
function ScrollColorSection() {
  const [activeBlock, setActiveBlock] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Your custom transition colors (keep as you want)
  const bgColors = [
    "#b168f1", // Block 1 – soft purple
    "#f58e56", // Block 2 – warm pink/cream
    "#7579ff", // Block 3 – soft blue
    "#feee74", // Block 4 – light orange/yellow
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = blockRefs.current.findIndex(ref => ref === entry.target);
            if (index !== -1) setActiveBlock(index);
          }
        });
      },
      { threshold: 0.4, rootMargin: "-10% 0px -10% 0px" }
    );
    blockRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="scroll-color-section" style={{ backgroundColor: bgColors[activeBlock] }}>
      <div className="scroll-color-container">
        <div className="color-block" ref={el => { blockRefs.current[0] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
            Ton feed, ton avenir
          </h2>
          <p style={{ fontSize: "17px", color: "#555", maxWidth: "560px" }}>
            Découvre du contenu personnalisé, des offres de stages et des conseils de recruteurs — tout en un seul endroit.
          </p>
          <div className="simple-image-container">
            <img src="path/to/your-image.jpg" alt="App preview" className="simple-image" />
          </div>
        </div>



        {/* Block 2 – Graduated students (testimonial cards) */}
        <div className="color-block" ref={el => { blockRefs.current[1] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
            Nos diplômés brillent
          </h2>
          <p style={{ fontSize: "17px", color: "#555", maxWidth: "600px" }}>
            Ils ont trouvé leur voie grâce à nous. Et vous serez le prochain.
          </p>
          <div className="testimonial-grid">
            {graduatedStudents.map((student, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-quote">“{student.quote}”</div>
                <div className="testimonial-author">
                  <img src={student.avatar} alt={student.name} className="testimonial-avatar" />
                  <div className="testimonial-info">
                    <h4>{student.name}</h4>
                    <p>{student.role}</p>
                    <div className="company-badge">{student.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Block 3 – Platform web (image placeholder) */}
        <div className="color-block" ref={el => { blockRefs.current[2] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
            Notre plateforme web
          </h2>
          <div className="side-layout">
            <div className="side-text">
              <h3>Une expérience tout-en-un</h3>
              <p>Accédez à tous les outils nécessaires pour propulser votre carrière depuis votre navigateur.</p>
              <ul className="side-features">
                <li>Offres personnalisées basées sur votre profil</li>
                <li>Messagerie directe avec les recruteurs</li>
                <li>Calendrier d'événements et webinaires exclusifs</li>
                <li>Espace CV interactif et suivi des candidatures</li>
              </ul>
            </div>
            <div className="side-phone"><img src="src/assets/comments.png" alt="" />
            </div>
          </div>
        </div>

        {/* Block 4 – Join us (image placeholder) */}
        <div className="color-block" ref={el => { blockRefs.current[3] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
            Rejoignez l'aventure
          </h2>
          <div className="side-layout" style={{ flexDirection: "row-reverse" }}>
            <div className="side-text">
              <h3>Téléchargez l'application</h3>
              <p>Retrouvez toutes les fonctionnalités de Stag.io sur mobile et ne manquez jamais une opportunité.</p>
              <div className="join-buttons">
                <a href="#" className="store-btn">
                  <div className="store-icon">📱</div>
                  <div className="store-text">
                    <small>Available on the</small>
                    <span>App Store</span>
                  </div>
                </a>
                <a href="#" className="store-btn">
                  <div className="store-icon">📲</div>
                  <div className="store-text">
                    <small>Get it on</small>
                    <span>Google Play</span>
                  </div>
                </a>
              </div>
            </div>
            <div className="side-phone">
              <div className="image-placeholder"><img src="src/assets/appmock.png" alt="" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Home Page ----------
export default function HomePage() {
  return (
    <>
      <SplitHero />
      <div className="partners-strip">
        <p>Ils recrutent via notre plateforme</p>
        <div className="partners-logos">
          {[
            [IMG.disney, "Disney"],
            [IMG.tiktok, "TikTok"],
            [IMG.db, "Deutsche Bank"],
            [IMG.pg, "P&G"],
            [IMG.nike, "Nike"],
            [IMG.ey, "EY"],
          ].map(([src, alt]) => (
            <img key={alt} src={src} alt={alt} />
          ))}
        </div>
      </div>
      <ScrollColorSection />
    </>
  );
}