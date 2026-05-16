import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const TESTIMONIALS = [
    {
        id: 1,
        name: "Ryad Mahrez",
        university: "USTHB",
        company: "Yassir",
        role: "Backend Engineering Intern",
        quote: "Stag.io made my internship search incredibly simple. I applied to 3 offers and had interviews scheduled in less than a week. This internship at Yassir completely changed my career path.",
        initials: "RM",
        color: "#1a1a2e",
    },
    {
        id: 2,
        name: "Sarah Benali",
        university: "ESI Algiers",
        company: "Ooredoo",
        role: "Data Science Intern",
        quote: "I was struggling to find relevant opportunities in Data Science. The filter system helped me find exactly what I was looking for. The interface is very well designed and easy to use.",
        initials: "SB",
        color: "#5C1F2E",
    },
    {
        id: 3,
        name: "Karim Ziani",
        university: "University of Bejaia",
        company: "Cevital",
        role: "IT Support Intern",
        quote: "What I appreciate is that companies actually respond. Stag.io verifies companies, so I knew the offers were genuine. I ended up receiving a permanent job offer after my 3-month internship.",
        initials: "KZ",
        color: "#2A4A2A",
    },
    {
        id: 4,
        name: "Lina Khelifi",
        university: "Constantine 2 University",
        company: "Sonatrach",
        role: "Software Development Intern",
        quote: "The platform inspires confidence. It doesn't feel like a boring government portal. I highly recommend completing your profile \u2014 it makes applying lightning fast.",
        initials: "LK",
        color: "#B8893E",
    },
    {
        id: 5,
        name: "Amine Toumi",
        university: "Setif 1 University",
        company: "Mobilis",
        role: "Networks Intern",
        quote: "I found a hybrid internship, which is rare in Algeria. Stag.io's filters let me search specifically for remote/hybrid positions. It saved me hours of browsing on LinkedIn.",
        initials: "AT",
        color: "#0f3460",
    },
    {
        id: 6,
        name: "Fatima Zahra",
        university: "University of Oran",
        company: "Djezzy",
        role: "UX Design Intern",
        quote: "As a designer, I appreciate good UX, and this platform has it. The application tracking feature helped me stay calm during the waiting period. A 10/10 experience.",
        initials: "FZ",
        color: "#4E2A6A",
    },
];

const STATS = [
    { num: "2,400+", label: "Students placed" },
    { num: "94%", label: "Satisfaction rate" },
    { num: "180+", label: "Partner companies" },
    { num: "48h", label: "Average response time" },
];

export default function TestimonialsPage() {
    return (
        <>
            <div className="page-dark-hero">
                <div className="page-dark-hero-overlay" />
                <div className="page-dark-hero-content">
                    <span className="page-dark-hero-badge">Testimonials</span>
                    <h1>They succeeded thanks to Stag.io</h1>
                    <p>Students like you have found their ideal internship and transformed their careers. Here are their stories.</p>
                </div>
            </div>

            <div className="testimonials-section">
                <div className="testimonials-stats-dark">
                    {STATS.map((s, i) => (
                        <div key={i} className="ts-stat-item">
                            <div className="ts-stat-num">{s.num}</div>
                            <div className="ts-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="testimonials-grid-v2">
                    {TESTIMONIALS.map((t) => (
                        <div key={t.id} className="testimonial-card-v2">
                            <div className="ts-stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill="#F5C518" color="#F5C518" />
                                ))}
                            </div>
                            <p className="ts-quote">"{t.quote}"</p>
                            <div className="ts-author">
                                <div className="ts-avatar" style={{ background: t.color }}>
                                    {t.initials}
                                </div>
                                <div>
                                    <div className="ts-name">{t.name}</div>
                                    <div className="ts-role">{t.role}</div>
                                    <div className="ts-company">@ {t.company}</div>
                                    <div className="ts-university">{t.university}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="testimonials-cta">
                    <h2>Ready to start your journey?</h2>
                    <div className="testimonials-cta-btns">
                        <Link to="/offers">
                            <button className="ts-btn-primary">Browse offers</button>
                        </Link>
                        <Link to="/contact">
                            <button className="ts-btn-outline">Contact us</button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}