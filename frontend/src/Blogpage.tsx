import { useState } from "react";
import { Clock, Calendar } from "lucide-react";

const ARTICLES = [
    {
        id: 1,
        title: "How to ace your first IT job interview",
        category: "Career advice",
        excerpt: "Technical interviews can be stressful. We break down the most common patterns and how to prepare for them effectively for Algerian companies.",
        author: "Amine B.",
        initials: "AB",
        date: "12 Oct 2025",
        readTime: "5 min",
        bg: "linear-gradient(135deg, #1a1a2e, #0f3460)",
    },
    {
        id: 2,
        title: "Behind the scenes at Yassir: Africa's super-app",
        category: "Company spotlight",
        excerpt: "An exclusive look at the engineering culture and internship opportunities at one of Algeria's fastest-growing startups.",
        author: "Sarah M.",
        initials: "SM",
        date: "08 Oct 2025",
        readTime: "8 min",
        bg: "linear-gradient(135deg, #5C1F2E, #B8893E)",
    },
    {
        id: 3,
        title: "From intern to Full-Stack developer: Karim's journey",
        category: "Success story",
        excerpt: "How a 3-month internship at Ooredoo turned into a permanent job, and what you can learn from his experience.",
        author: "Editorial team",
        initials: "ET",
        date: "05 Oct 2025",
        readTime: "4 min",
        bg: "linear-gradient(135deg, #2A4A2A, #4A7A4A)",
    },
    {
        id: 4,
        title: "Top 5 emerging tech skills in the Algerian market",
        category: "Market",
        excerpt: "Data Science, Cloud Computing and Cybersecurity are growing massively. Here's what employers are looking for this year.",
        author: "Lyes R.",
        initials: "LR",
        date: "28 Sep 2025",
        readTime: "6 min",
        bg: "linear-gradient(135deg, #2A1F4E, #5C3A7A)",
    },
    {
        id: 5,
        title: "Building the perfect CV for tech roles",
        category: "Career advice",
        excerpt: "Your CV is your first impression. Learn how to showcase your university projects and GitHub repositories effectively.",
        author: "Amine B.",
        initials: "AB",
        date: "22 Sep 2025",
        readTime: "7 min",
        bg: "linear-gradient(135deg, #4E1A1A, #8B3A3A)",
    },
    {
        id: 6,
        title: "Navigating remote internships: best practices",
        category: "Career advice",
        excerpt: "With more and more companies offering hybrid and remote positions, learning to communicate asynchronously is more important than ever.",
        author: "Farid K.",
        initials: "FK",
        date: "15 Sep 2025",
        readTime: "5 min",
        bg: "linear-gradient(135deg, #3A3A1A, #6B6B2A)",
    },
];

const CATEGORIES = ["All", "Career advice", "Company spotlight", "Success story", "Market"];

export default function BlogPage() {
    const [active, setActive] = useState("All");

    const filtered = active === "All"
        ? ARTICLES
        : ARTICLES.filter((a) => a.category === active);

    return (
        <>
            <div className="page-dark-hero">
                <div className="page-dark-hero-overlay" />
                <div className="page-dark-hero-content">
                    <span className="page-dark-hero-badge">Blog & Resources</span>
                    <h1>Advice & Career</h1>
                    <p>Discover tips for landing your internship, read success stories and stay informed about the Algerian job market.</p>
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
                        Load more articles
                    </button>
                </div>
            </div>
        </>
    );
}