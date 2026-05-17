import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import studentImg from "./assets/student.jpg";
import companyImg from "./assets/company.jpg";
import block1Img from "./assets/post.png";

import logo1 from "./assets/air.png";
import logo2 from "./assets/algerietelecom.png";
import logo3 from "./assets/biofarm.png";
import logo4 from "./assets/oredo.png";
import logo5 from "./assets/sonatrach.png";
import logo6 from "./assets/in.png";

const PARTNERS: [string, string, string][] = [
  [logo1, "Air Algérie", "https://www.airalgerie.dz"],
  [logo2, "Algérie Télécom", "https://www.algerietelecom.dz"],
  [logo3, "Biofarm", "https://www.biofarm.dz"],
  [logo4, "Ooredoo", "https://www.ooredoo.dz"],
  [logo5, "Sonatrach", "https://www.sonatrach.dz"],
  [logo6, "Investissement", "https://www.andi.dz"],
];

const graduatedStudents = [
  {
    name: "Sarah Ahmed",
    role: "Full Stack Developer",
    company: "Microsoft",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "Thanks to Stag.io, I landed an internship at Microsoft that turned into a full-time offer. The platform opened doors I never thought possible.",
  },
  {
    name: "Karim Benali",
    role: "Data Scientist",
    company: "Google",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    quote:
      "The personalised offers and direct messaging with recruiters transformed my job search. Today I'm a Data Scientist at Google.",
  },
  {
    name: "Leila Mansouri",
    role: "Product Manager",
    company: "Amazon",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "Stag.io helped me find a product management internship that perfectly matched my ambitions. An unforgettable experience.",
  },
  {
    name: "Mehdi Kaci",
    role: "Strategy Consultant",
    company: "Deloitte",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    quote:
      "The networking events organised on the platform let me meet key professionals. I highly recommend it.",
  },
];

// ---------- Split Hero ----------
function SplitHero() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const flex = (id: string) =>
    hovered === id ? 1.4 : hovered !== null ? 0.7 : 1;

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
            Find internships that match your skills, connect with leading
            companies, <br />
            and take the next step in your career with confidence.
          </p>
          <button
            className="hs-panel-btn"
            onClick={() => navigate("/offers")}
          >
            Explore opportunities →
          </button>
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
          <div className="hs-panel-big-title">Company</div>
          <p className="hs-panel-desc">
            Publish your internship offers, reach qualified students, <br />
            and manage applications efficiently from one platform.
          </p>
          <button
            className="hs-panel-btn"
            onClick={() => navigate("/login?role=entreprise")}
          >
            Post an internship →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Scroll Color Section ----------
function ScrollColorSection() {
  const navigate = useNavigate();
  const [activeBlock, setActiveBlock] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  const bgColors = [
    "#F5EBD3",
    "#eccf99",
    "#dc9365",
    "#e09898",
    "#5C1F2E",
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = blockRefs.current.findIndex(
              (ref) => ref === entry.target,
            );
            if (index !== -1) setActiveBlock(index);
          }
        });
      },
      { threshold: 0.4, rootMargin: "-10% 0px -10% 0px" },
    );
    blockRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="scroll-color-section"
      style={{ backgroundColor: bgColors[activeBlock] }}
    >
      <div className="scroll-color-container">

        {/* Block 1 */}
        <div className="color-block" ref={(el) => { blockRefs.current[0] = el; }}>
          <div className="split-layout">
            <div className="split-text">
              <h2
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontSize: "44px",
                  fontWeight: 800,
                  marginBottom: "16px",
                  lineHeight: 1.1,
                }}
              >
                Your career starts here.
              </h2>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 500,
                  color: "#2A1F14",
                  marginBottom: "16px",
                }}
              >
                Turn your studies into real professional experience.
              </p>
              <p
                style={{
                  fontSize: "17px",
                  color: "#5B4A38",
                  maxWidth: "520px",
                  marginBottom: "28px",
                  lineHeight: 1.5,
                }}
              >
                Access internships across Algeria, apply quickly and grow your
                career with leading companies and institutions.
              </p>
              <button className="cta-primary" onClick={() => navigate("/offers")}>View offers</button>
            </div>
            <div className="split-image">
              <img
                src={block1Img}
                alt=""
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  maxHeight: "420px",
                  objectFit: "cover",
                  borderRadius: "20px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>
          </div>
        </div>

        {/* Block 2 */}
        <div className="color-block" ref={(el) => { blockRefs.current[1] = el; }}>
          <h2
            style={{
              fontFamily: "'Epilogue', sans-serif",
              fontSize: "36px",
              fontWeight: 800,
              marginBottom: "16px",
            }}
          >
            A complete platform
          </h2>
          <div className="side-layout">
            <div className="side-text">
              <p>All the tools you need to succeed in your internship search.</p>
              <ul className="side-features">
                <li>Recommended offers based on your profile</li>
                <li>Direct messaging with recruiters</li>
                <li>Real-time application tracking</li>
                <li>CV builder &amp; completion score</li>
              </ul>
            </div>
            <div className="side-phone">
              <img src="src/assets/comments.png" alt="App preview" />
            </div>
          </div>
        </div>

        {/* Block 3 */}
        <div className="color-block" ref={(el) => { blockRefs.current[2] = el; }}>
          <h2
            style={{
              fontFamily: "'Epilogue', sans-serif",
              fontSize: "36px",
              fontWeight: 800,
              marginBottom: "16px",
            }}
          >
            They succeeded with Stag.io
          </h2>
          <p style={{ fontSize: "17px", color: "#555", maxWidth: "600px" }}>
            Students who turned their internship into a career opportunity.
          </p>
          <div className="testimonial-grid">
            {graduatedStudents.map((student, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-quote">"{student.quote}"</div>
                <div className="testimonial-author">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="testimonial-avatar"
                  />
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

        {/* Block 4 */}
        <div className="color-block" ref={(el) => { blockRefs.current[3] = el; }}>
          <h2
            style={{
              fontFamily: "'Epilogue', sans-serif",
              fontSize: "36px",
              fontWeight: 800,
              marginBottom: "16px",
            }}
          >
            Access the platform from anywhere
          </h2>
          <div className="side-layout" style={{ flexDirection: "row-reverse" }}>
            <div className="side-text">
              <h3>Download our app</h3>
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

        {/* Block 5 */}
        <div className="color-block" ref={(el) => { blockRefs.current[4] = el; }}>
          <h2
            style={{
              fontFamily: "'Epilogue', sans-serif",
              fontSize: "36px",
              fontWeight: 800,
              marginBottom: "16px",
              color: "#fff",
            }}
          >
            Are you a company or a university?
          </h2>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#FFFFFF",
              marginBottom: "16px",
              maxWidth: "640px",
            }}
          >
            Find the talent that will help your organisation grow.
          </p>
          <p
            style={{
              fontSize: "17px",
              color: "#F5EFE6",
              maxWidth: "640px",
              marginBottom: "28px",
            }}
          >
            Join the Stag.io community and connect with the most motivated
            students from the University of Constantine. Post your internship
            offers, manage applications from a single dashboard, and streamline
            your entire recruitment process — for free.
          </p>
          <div
            className="cta-row"
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button className="cta-primary" onClick={() => navigate("/login")}>
              Join the community
            </button>
            <a
              href="/contact"
              className="cta-link"
              style={{ color: "#F5EFE6", textDecoration: "underline" }}
            >
              Contact us
            </a>
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

      {/* Partners strip — swap PARTNERS array at the top of this file */}
      <div className="partners-strip">
        <p>They recruit through our platform</p>
        <div className="partners-logos">
          {PARTNERS.map(([src, alt, href]) => (
            <a key={alt} href={href} target="_blank" rel="noreferrer" className="partner-logo-link">
              <img src={src} alt={alt} />
            </a>
          ))}
        </div>
      </div>

      <ScrollColorSection />
    </>
  );
}