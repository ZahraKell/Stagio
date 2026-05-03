import { useState } from "react";
import { Clock, Calendar } from "lucide-react";

const ARTICLES = [
    {
        id: 1,
        title: "Comment réussir son premier entretien en informatique",
        category: "Conseils carrière",
        excerpt: "Les entretiens techniques peuvent être stressants. Nous décryptons les patterns les plus courants et comment s'y préparer efficacement pour les entreprises algériennes.",
        author: "Amine B.",
        initials: "AB",
        date: "12 Oct 2025",
        readTime: "5 min",
        bg: "linear-gradient(135deg, #1a1a2e, #0f3460)",
    },
    {
        id: 2,
        title: "Dans les coulisses de Yassir : la super-app d'Afrique",
        category: "Focus entreprise",
        excerpt: "Un regard exclusif sur la culture d'ingénierie et les opportunités de stage chez l'une des startups algériennes à la croissance la plus rapide.",
        author: "Sarah M.",
        initials: "SM",
        date: "08 Oct 2025",
        readTime: "8 min",
        bg: "linear-gradient(135deg, #5C1F2E, #B8893E)",
    },
    {
        id: 3,
        title: "De stagiaire à développeur Full-Stack : le parcours de Karim",
        category: "Témoignage",
        excerpt: "Comment un stage de 3 mois chez Ooredoo s'est transformé en CDI, et ce que vous pouvez apprendre de son expérience.",
        author: "Équipe éditoriale",
        initials: "EE",
        date: "05 Oct 2025",
        readTime: "4 min",
        bg: "linear-gradient(135deg, #2A4A2A, #4A7A4A)",
    },
    {
        id: 4,
        title: "Top 5 des compétences tech émergentes sur le marché algérien",
        category: "Marché",
        excerpt: "Data Science, Cloud Computing et Cybersécurité connaissent une croissance massive. Voici ce que les employeurs recherchent cette année.",
        author: "Lyes R.",
        initials: "LR",
        date: "28 Sep 2025",
        readTime: "6 min",
        bg: "linear-gradient(135deg, #2A1F4E, #5C3A7A)",
    },
    {
        id: 5,
        title: "Construire le CV parfait pour les postes tech",
        category: "Conseils carrière",
        excerpt: "Votre CV est votre première impression. Apprenez à mettre en valeur vos projets universitaires et vos dépôts GitHub de manière efficace.",
        author: "Amine B.",
        initials: "AB",
        date: "22 Sep 2025",
        readTime: "7 min",
        bg: "linear-gradient(135deg, #4E1A1A, #8B3A3A)",
    },
    {
        id: 6,
        title: "Naviguer dans les stages à distance : bonnes pratiques",
        category: "Conseils carrière",
        excerpt: "Avec de plus en plus d'entreprises proposant des postes hybrides et distants, apprendre à communiquer de manière asynchrone est plus important que jamais.",
        author: "Farid K.",
        initials: "FK",
        date: "15 Sep 2025",
        readTime: "5 min",
        bg: "linear-gradient(135deg, #3A3A1A, #6B6B2A)",
    },
];

const CATEGORIES = ["Tous", "Conseils carrière", "Focus entreprise", "Témoignage", "Marché"];

export default function BlogPage() {
    const [active, setActive] = useState("Tous");

    const filtered = active === "Tous"
        ? ARTICLES
        : ARTICLES.filter((a) => a.category === active);

    return (
        <>
            <div className="page-dark-hero">
                <div className="page-dark-hero-overlay" />
                <div className="page-dark-hero-content">
                    <span className="page-dark-hero-badge">Blog & Ressources</span>
                    <h1>Conseils & Carrière</h1>
                    <p>Découvrez des conseils pour décrocher votre stage, lisez des témoignages et restez informé sur le marché algérien de l'emploi.</p>
                </div>
            </div>

            <div className="blog-section">
                <div className="blog-filters">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className={`blog-filter-btn ${active === cat ? "active" : ""}`}
                            onClick={() => setActive(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="blog-grid">
                    {filtered.map((article) => (
                        <article key={article.id} className="blog-card">
                            <div className="blog-card-cover">
                                <div
                                    className="blog-card-cover-inner"
                                    style={{ background: article.bg }}
                                />
                                <span className="blog-cat-tag">{article.category}</span>
                            </div>
                            <div className="blog-card-body">
                                <h3>{article.title}</h3>
                                <p>{article.excerpt}</p>
                                <div className="blog-card-meta">
                                    <div className="blog-author">
                                        <div className="blog-author-avatar">{article.initials}</div>
                                        <span className="blog-author-name">{article.author}</span>
                                    </div>
                                    <div className="blog-meta-right">
                                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Calendar size={10} /> {article.date}
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Clock size={10} /> {article.readTime}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="blog-load-more">
                    <button className="cta-primary" style={{ background: "#2A1F14" }}>
                        Charger plus d'articles
                    </button>
                </div>
            </div>
        </>
    );
}
