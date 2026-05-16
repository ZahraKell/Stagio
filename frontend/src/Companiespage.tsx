import { MapPin, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const COMPANIES = [
    { id: 1, name: "Sonatrach", sector: "Energy", wilaya: "Algiers", offers: 15, initials: "SN", color: "#C8965E" },
    { id: 2, name: "Mobilis", sector: "Telecommunications", wilaya: "Algiers", offers: 8, initials: "MB", color: "#2A4A2A" },
    { id: 3, name: "Condor Electronics", sector: "Electronics", wilaya: "Bordj Bou Arreridj", offers: 12, initials: "CE", color: "#1a1a2e" },
    { id: 4, name: "Ooredoo Algeria", sector: "Telecommunications", wilaya: "Algiers", offers: 6, initials: "OR", color: "#5C1F2E" },
    { id: 5, name: "Algeria Telecom", sector: "Telecommunications", wilaya: "Algiers", offers: 22, initials: "AT", color: "#0f3460" },
    { id: 6, name: "ENIEM", sector: "Industry", wilaya: "Tizi Ouzou", offers: 4, initials: "EN", color: "#4A4A4A" },
    { id: 7, name: "Yassir", sector: "Technology", wilaya: "Algiers", offers: 18, initials: "YS", color: "#3A1A5E" },
    { id: 8, name: "Djezzy", sector: "Telecommunications", wilaya: "Algiers", offers: 9, initials: "DJ", color: "#7A1A1A" },
    { id: 9, name: "Air Algeria", sector: "Aviation", wilaya: "Algiers", offers: 5, initials: "AA", color: "#1A3A5E" },
    { id: 10, name: "BNA Bank", sector: "Finance", wilaya: "Algiers", offers: 14, initials: "BN", color: "#1A4A3A" },
    { id: 11, name: "Cevital", sector: "Agri-food", wilaya: "Bejaia", offers: 20, initials: "CV", color: "#B8893E" },
    { id: 12, name: "Biopharm", sector: "Pharmaceutical", wilaya: "Algiers", offers: 7, initials: "BP", color: "#1A4A4A" },
];

export default function CompaniesPage() {
    return (
        <>
            <div className="page-dark-hero">
                <div className="page-dark-hero-overlay" />
                <div className="page-dark-hero-content">
                    <span className="page-dark-hero-badge">Our partners</span>
                    <h1>The companies that are hiring</h1>
                    <p>Discover the top companies and administrations that trust Stag.io to find their future interns.</p>
                </div>
            </div>

            <div className="companies-section">
                <div className="companies-stats-row">
                    {[
                        { num: "120+", label: "Partner companies" },
                        { num: "450+", label: "Active offers" },
                        { num: "18", label: "Wilayas covered" },
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
                                    <strong>{company.offers}</strong>&nbsp;active offers
                                </span>
                            </div>
                            <button className="company-view-btn">View offers</button>
                        </div>
                    ))}
                </div>

                <div className="companies-cta-strip">
                    <h2>Are you a company?</h2>
                    <p>Join our network and access the most motivated students in Algeria.</p>
                    <Link to="/contact">
                        <button className="cta-primary" style={{ background: "#F5C518", color: "#000" }}>
                            Join the network
                        </button>
                    </Link>
                </div>
            </div>
        </>
    );
}