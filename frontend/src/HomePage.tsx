import { useState, useRef, useEffect } from "react";
import studentImg from "./assets/student.jpg";
import companyImg from "./assets/company.jpg";
import block1Img from './assets/block1.png';

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
            Find internships that match your skills, connect with leading companies, <br />and take the next step in your career with confidence.</p>
          <button className="hs-panel-btn">Explore opportunities →</button>
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
          <div className="hs-panel-big-title">Company</div> {/* Capitalized */}
          <p className="hs-panel-desc">
            Publish your internship offers, reach qualified students, <br />and manage applications efficiently from one platform.
          </p>
          <button className="hs-panel-btn">Post an internship →</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Scroll Color Section (5 blocks) ----------
function ScrollColorSection() {
  const [activeBlock, setActiveBlock] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  const bgColors = [
    "#F5EBD3", // Block 1 — soft cream
    "#E8D2A8", // Block 2 — warm sand
    "#C8965E", // Block 3 — honey wood
    "#B8893E", // Block 4 — vintage gold
    "#5C1F2E", // Block 5 — deep burgundy
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

        {/* Block 1 — Fixed text and image */}
        <div className="color-block" ref={el => { blockRefs.current[0] = el; }}>
          <div className="split-layout">
            <div className="split-text">
              <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "44px", fontWeight: 800, marginBottom: "16px", lineHeight: 1.1 }}>
                Your career starts here.
              </h2>
              <p style={{ fontSize: "20px", fontWeight: 500, color: "#2A1F14", marginBottom: "16px" }}>
                Turn your studies into concrete professional experience.
              </p>
              <p style={{ fontSize: "17px", color: "#5B4A38", maxWidth: "520px", marginBottom: "28px", lineHeight: 1.5 }}>
                Access internships throughout Algeria, apply quickly and develop your career with leading companies and institutions.</p>
              <button className="cta-primary">View offers</button>
            </div>
            <div className="split-image">
              {/* Real image – replace with your own asset or CDN */}
              <img src={block1Img} alt="" style={{ width: "100%", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              />

            </div>
          </div>
        </div>

        {/* Block 2 — Notre plateforme web */}
        <div className="color-block" ref={el => { blockRefs.current[1] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
            A complete platform
          </h2>
          <div className="side-layout">
            <div className="side-text">
              <p>All the tools you need to succeed in your internship search.</p>
              <ul className="side-features">
                <li>Recommended offers based on your profile</li>
                <li>Direct messaging with recruiters</li>
                <li>Real-time application tracking</li>
                <li>Real-time application tracking</li>
              </ul>
            </div>
            <div className="side-phone">
              <img src="src/assets/comments.png" alt="App preview" />
            </div>
          </div>
        </div>

        {/* Block 3 — Graduated students */}
        <div className="color-block" ref={el => { blockRefs.current[2] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
            They succeeded with InternChips
          </h2>
          <p style={{ fontSize: "17px", color: "#555", maxWidth: "600px" }}>
            Students who turned their internship into a career opportunity.
          </p>
          <div className="testimonial-grid">
            {graduatedStudents.map((student, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-quote">"{student.quote}"</div>
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

        {/* Block 4 — Rejoignez l'aventure */}
        <div className="color-block" ref={el => { blockRefs.current[3] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
            Access the platform from anywhere
          </h2>
          <div className="side-layout" style={{ flexDirection: "row-reverse" }}>
            <div className="side-text">
              <h3>Download our application</h3>
              <p>All the features, directly on your mobile.</p>
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
              <div className="image-placeholder">
                <img src="src/assets/appmock.png" alt="Mobile app mockup" />
              </div>
            </div>
          </div>
        </div>

        {/* Block 5 — Admin / company invitation */}
        <div className="color-block" ref={el => { blockRefs.current[4] = el; }}>
          <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "36px", fontWeight: 800, marginBottom: "16px", color: "#fff" }}>
            Vous êtes une entreprise ou une administration ?
          </h2>
          <p style={{ fontSize: "20px", fontWeight: 500, color: "#FFFFFF", marginBottom: "16px", maxWidth: "640px" }}>
            Trouvez les talents qui feront grandir votre organisation.
          </p>
          <p style={{ fontSize: "17px", color: "#F5EFE6", maxWidth: "640px", marginBottom: "28px" }}>
            Rejoignez la communauté Stag.io et accédez aux étudiants les plus motivés de l'Université de Constantine.
            Publiez vos offres de stage, gérez vos candidatures depuis un seul tableau de bord, et simplifiez tout votre processus de recrutement — gratuitement.
          </p>
          <div className="cta-row" style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <button className="cta-primary">Rejoindre la communauté</button>
            <a href="/contact" className="cta-link" style={{ color: "#F5EFE6", textDecoration: "underline" }}>Nous contacter</a>
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