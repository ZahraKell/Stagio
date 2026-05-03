import { MapPin, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const COMPANIES = [
    { id: 1, name: "Sonatrach", sector: "Énergie", wilaya: "Alger", offers: 15, initials: "SN", color: "#C8965E" },
    { id: 2, name: "Mobilis", sector: "Télécommunications", wilaya: "Alger", offers: 8, initials: "MB", color: "#2A4A2A" },
    { id: 3, name: "Condor Electronics", sector: "Électronique", wilaya: "Bordj Bou Arreridj", offers: 12, initials: "CE", color: "#1a1a2e" },
    { id: 4, name: "Ooredoo Algérie", sector: "Télécommunications", wilaya: "Alger", offers: 6, initials: "OR", color: "#5C1F2E" },
    { id: 5, name: "Algérie Télécom", sector: "Télécommunications", wilaya: "Alger", offers: 22, initials: "AT", color: "#0f3460" },
    { id: 6, name: "ENIEM", sector: "Industrie", wilaya: "Tizi Ouzou", offers: 4, initials: "EN", color: "#4A4A4A" },
    { id: 7, name: "Yassir", sector: "Technologie", wilaya: "Alger", offers: 18, initials: "YS", color: "#3A1A5E" },
    { id: 8, name: "Djezzy", sector: "Télécommunications", wilaya: "Alger", offers: 9, initials: "DJ", color: "#7A1A1A" },
    { id: 9, name: "Air Algérie", sector: "Aviation", wilaya: "Alger", offers: 5, initials: "AA", color: "#1A3A5E" },
    { id: 10, name: "BNA Bank", sector: "Finance", wilaya: "Alger", offers: 14, initials: "BN", color: "#1A4A3A" },
    { id: 11, name: "Cevital", sector: "Agroalimentaire", wilaya: "Béjaïa", offers: 20, initials: "CV", color: "#B8893E" },
    { id: 12, name: "Biopharm", sector: "Pharmaceutique", wilaya: "Alger", offers: 7, initials: "BP", color: "#1A4A4A" },
];

export default function CompaniesPage() {
    return (
        <>
            <div className="page-dark-hero">
                <div className="page-dark-hero-overlay" />
                <div className="page-dark-hero-content">
                    <span className="page-dark-hero-badge">Nos partenaires</span>
                    <h1>Les entreprises qui recrutent</h1>
                    <p>Découvrez les meilleures entreprises et administrations qui font confiance à Stag.io pour trouver leurs futurs stagiaires.</p>
                </div>
            </div>

            <div className="companies-section">
                <div className="companies-stats-row">
                    {[
                        { num: "120+", label: "Entreprises partenaires" },
                        { num: "450+", label: "Offres actives" },
                        { num: "18", label: "Wilayas couvertes" },
                    ].map((s, i) => (
                        <div key={i} className="companies-stat-card">
                            <div className="companies-stat-number">{s.num}</div>
                            <div className="companies-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="companies-grid">
                    {COMPANIES.map((company) => (
                        <div key={company.id} className="company-card-v2">
                            <div
                                className="company-logo-v2"
                                style={{ background: company.color }}
                            >
                                {company.initials}
                            </div>
                            <h3>{company.name}</h3>
                            <span className="company-sector-tag">{company.sector}</span>
                            <div className="company-card-info">
                                <span>
                                    <MapPin size={14} style={{ color: "#B8893E", flexShrink: 0 }} />
                                    {company.wilaya}
                                </span>
                                <span>
                                    <Briefcase size={14} style={{ color: "#5C1F2E", flexShrink: 0 }} />
                                    <strong>{company.offers}</strong>&nbsp;offres actives
                                </span>
                            </div>
                            <button className="company-view-btn">Voir les offres</button>
                        </div>
                    ))}
                </div>

                <div className="companies-cta-strip">
                    <h2>Vous êtes une entreprise ?</h2>
                    <p>Rejoignez notre réseau et accédez aux étudiants les plus motivés d'Algérie.</p>
                    <Link to="/contact">
                        <button className="cta-primary" style={{ background: "#F5C518", color: "#000" }}>
                            Rejoindre le réseau
                        </button>
                    </Link>
                </div>
            </div>
        </>
    );
}
