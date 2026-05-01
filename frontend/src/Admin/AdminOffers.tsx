// AdminOffers.tsx — Manage all internship offers across all companies
import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

interface Offer {
  id: number;
  title: string;
  company_name: string;
  company_sector: string;
  town: string;
  duration: string;
  internship_type: string;
  is_paid: boolean;
  salary: string | null;
  tech_stack: string | null;
  field: string | null;
  status: string;
  date_posted: string;
  deadline: string | null;
  description: string;
}

const TYPE_LABELS: Record<string, string> = {
  INTERNSHIP: "Stage professionnel",
  ALTERNANCE: "Alternance",
  FINAL_YEAR: "PFE",
};

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/offers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : getMockOffers());
    } catch {
      setOffers(getMockOffers());
    } finally {
      setLoading(false);
    }
  };

  const getMockOffers = (): Offer[] => [
    { id: 1, title: "Développeur Django Backend", company_name: "Sonatrach", company_sector: "Énergie", town: "Alger", duration: "3 mois", internship_type: "INTERNSHIP", is_paid: false, salary: null, tech_stack: "Python, Django, REST API", field: "Informatique", status: "open", date_posted: "2026-04-01", deadline: "2026-05-15", description: "Développement d'APIs REST." },
    { id: 2, title: "Data Analyst & Visualisation", company_name: "Mobilis", company_sector: "Télécommunications", town: "Alger", duration: "6 mois", internship_type: "FINAL_YEAR", is_paid: true, salary: "15000 DA/mois", tech_stack: "Python, Pandas, Power BI", field: "Data Science", status: "open", date_posted: "2026-04-05", deadline: "2026-05-20", description: "Analyse des données clients." },
    { id: 3, title: "Développeur React Frontend", company_name: "Condor Electronics", company_sector: "Électronique", town: "Bordj Bou Arreridj", duration: "4 mois", internship_type: "INTERNSHIP", is_paid: true, salary: "12000 DA/mois", tech_stack: "React, TypeScript, CSS", field: "Informatique", status: "open", date_posted: "2026-04-10", deadline: "2026-05-30", description: "Développement frontend." },
    { id: 4, title: "Cybersecurity Analyst", company_name: "Algérie Télécom", company_sector: "Télécommunications", town: "Sétif", duration: "5 mois", internship_type: "ALTERNANCE", is_paid: false, salary: null, tech_stack: "Wireshark, Metasploit, Linux", field: "Sécurité", status: "open", date_posted: "2026-04-08", deadline: "2026-06-01", description: "Sécurité réseau." },
    { id: 5, title: "Designer UI/UX Mobile", company_name: "Ooredoo", company_sector: "Télécommunications", town: "Alger", duration: "3 mois", internship_type: "INTERNSHIP", is_paid: false, salary: null, tech_stack: "Figma, Adobe XD", field: "Design", status: "closed", date_posted: "2026-03-15", deadline: null, description: "Design mobile." },
    { id: 6, title: "DevOps Engineer Intern", company_name: "Cevital", company_sector: "Agroalimentaire", town: "Béjaïa", duration: "4 mois", internship_type: "FINAL_YEAR", is_paid: true, salary: "18000 DA/mois", tech_stack: "Docker, Kubernetes, CI/CD", field: "Informatique", status: "filled", date_posted: "2026-03-20", deadline: "2026-04-30", description: "Infrastructure DevOps." },
    { id: 7, title: "Machine Learning Engineer", company_name: "Sonatrach", company_sector: "Énergie", town: "Alger", duration: "6 mois", internship_type: "FINAL_YEAR", is_paid: true, salary: "20000 DA/mois", tech_stack: "Python, TensorFlow, PyTorch", field: "Data Science", status: "open", date_posted: "2026-04-12", deadline: "2026-05-25", description: "IA appliquée." },
    { id: 8, title: "Network Engineer Intern", company_name: "Mobilis", company_sector: "Télécommunications", town: "Constantine", duration: "3 mois", internship_type: "INTERNSHIP", is_paid: false, salary: null, tech_stack: "CCNA, Cisco, Linux", field: "Réseaux", status: "open", date_posted: "2026-04-15", deadline: "2026-06-15", description: "Administration réseau." },
  ];

  const filtered = offers.filter(o => {
    const matchStatus = filter === "all" ? true : o.status === filter;
    const matchType = typeFilter === "" ? true : o.internship_type === typeFilter;
    const matchSearch = search === "" ? true :
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.company_name.toLowerCase().includes(search.toLowerCase()) ||
      o.town.toLowerCase().includes(search.toLowerCase()) ||
      (o.tech_stack || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const counts = {
    all: offers.length,
    open: offers.filter(o => o.status === "open").length,
    closed: offers.filter(o => o.status === "closed").length,
    filled: offers.filter(o => o.status === "filled").length,
  };

  const statusConfig: Record<string, { label: string; badge: string; color: string }> = {
    open: { label: "Open", badge: "am-badge-approved", color: "#22c55e" },
    closed: { label: "Closed", badge: "am-badge-rejected", color: "#ef4444" },
    filled: { label: "Filled", badge: "am-badge-review", color: "#8b5cf6" },
  };

  const closeOffer = (id: number) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: "closed" } : o));
    setSuccessMsg("Offer closed successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const reopenOffer = (id: number) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: "open" } : o));
    setSuccessMsg("Offer reopened.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "closed", label: "Closed", count: counts.closed },
    { key: "filled", label: "Filled", count: counts.filled },
  ];

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading offers...</span>
      </div>
    );
  }

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Internship Offers</h1>
          <p className="am-page-sub">
            {offers.length} Total • Open: {counts.open} • Closed: {counts.closed} • Filled: {counts.filled}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="am-success-msg"><span>✅</span> {successMsg}</div>
      )}

      {/* Filters */}
      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by title, company, city, tech..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="am-filter">
          <option value="">All Types</option>
          <option value="INTERNSHIP">Stage professionnel</option>
          <option value="FINAL_YEAR">PFE</option>
          <option value="ALTERNANCE">Alternance</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="am-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`am-tab ${filter === tab.key ? "am-tab-active" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="am-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <p className="am-results-count">{filtered.length} offers found</p>

      {/* Offers Table */}
      <div className="am-card">
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Company</th>
                <th>Type</th>
                <th>Location</th>
                <th>Paid</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="am-empty-cell">
                    <div className="am-empty-state-small">
                      <span>📋</span>
                      <p>No offers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(offer => (
                  <tr key={offer.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: ".82rem", color: "#0f172a", display: "block" }}>{offer.title}</strong>
                        <span style={{ fontSize: ".7rem", color: "#94a3b8" }}>{offer.field || "General"}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: ".78rem" }}>{offer.company_name}</strong>
                        <span style={{ display: "block", fontSize: ".7rem", color: "#64748b" }}>{offer.company_sector}</span>
                      </div>
                    </td>
                    <td>
                      <span className="am-role-badge am-role-administration" style={{ fontSize: ".65rem" }}>
                        {TYPE_LABELS[offer.internship_type] || offer.internship_type}
                      </span>
                    </td>
                    <td>
                      <span className="am-town-badge">📍 {offer.town}</span>
                    </td>
                    <td>
                      {offer.is_paid ? (
                        <span style={{ color: "#22c55e", fontWeight: 600, fontSize: ".75rem" }}>
                          💰 {offer.salary || "Paid"}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: ".75rem" }}>Unpaid</span>
                      )}
                    </td>
                    <td style={{ fontSize: ".73rem", color: offer.deadline ? "#b45309" : "#94a3b8" }}>
                      {offer.deadline || "—"}
                    </td>
                    <td>
                      <span
                        className={`am-status-badge ${statusConfig[offer.status]?.badge || "am-badge-pending"}`}
                        style={{ fontSize: ".65rem" }}
                      >
                        {statusConfig[offer.status]?.label || offer.status}
                      </span>
                    </td>
                    <td>
                      <div className="am-action-btns">
                        <button
                          className="am-btn-view"
                          onClick={() => { setSelectedOffer(offer); setShowDetail(true); }}
                        >
                          👁 View
                        </button>
                        {offer.status === "open" && (
                          <button
                            className="am-btn-toggle am-btn-deactivate"
                            onClick={() => closeOffer(offer.id)}
                            title="Close offer"
                          >
                            ⏸
                          </button>
                        )}
                        {offer.status === "closed" && (
                          <button
                            className="am-btn-toggle am-btn-activate"
                            onClick={() => reopenOffer(offer.id)}
                            title="Reopen offer"
                          >
                            ▶
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedOffer && (
        <div className="am-modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="am-modal am-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <div>
                <h3>{selectedOffer.title}</h3>
                <span style={{ fontSize: ".75rem", color: "#64748b" }}>
                  {selectedOffer.company_name} • {selectedOffer.town}
                </span>
              </div>
              <button onClick={() => setShowDetail(false)} className="am-close-btn">✕</button>
            </div>
            <div className="am-modal-body">
              <div className="am-detail-sections">
                <div className="am-detail-section">
                  <h4>Offer Details</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item"><span>Company</span><strong>{selectedOffer.company_name}</strong></div>
                    <div className="am-detail-item"><span>Sector</span><strong>{selectedOffer.company_sector}</strong></div>
                    <div className="am-detail-item"><span>Type</span><strong>{TYPE_LABELS[selectedOffer.internship_type]}</strong></div>
                    <div className="am-detail-item"><span>Duration</span><strong>{selectedOffer.duration || "N/A"}</strong></div>
                    <div className="am-detail-item"><span>Location</span><strong>{selectedOffer.town}</strong></div>
                    <div className="am-detail-item"><span>Compensation</span><strong>{selectedOffer.is_paid ? selectedOffer.salary || "Paid" : "Unpaid"}</strong></div>
                    <div className="am-detail-item"><span>Field</span><strong>{selectedOffer.field || "N/A"}</strong></div>
                    <div className="am-detail-item"><span>Deadline</span><strong>{selectedOffer.deadline || "No deadline"}</strong></div>
                    <div className="am-detail-item"><span>Status</span>
                      <span className={`am-status-badge ${selectedOffer.status === "open" ? "am-status-active" : "am-status-inactive"}`}>
                        {selectedOffer.status}
                      </span>
                    </div>
                    <div className="am-detail-item"><span>Posted</span><strong>{selectedOffer.date_posted}</strong></div>
                  </div>
                </div>
                {selectedOffer.tech_stack && (
                  <div className="am-detail-section">
                    <h4>Tech Stack</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: ".375rem", marginTop: ".5rem" }}>
                      {selectedOffer.tech_stack.split(",").map(t => (
                        <span key={t} style={{ background: "#eff6ff", color: "#3b82f6", padding: ".2rem .6rem", borderRadius: 6, fontSize: ".72rem", fontWeight: 600 }}>
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="am-detail-section">
                  <h4>Description</h4>
                  <p style={{ fontSize: ".8rem", color: "#334155", lineHeight: 1.6, marginTop: ".5rem" }}>
                    {selectedOffer.description}
                  </p>
                </div>
              </div>
              <div className="am-form-actions" style={{ paddingTop: "1rem", borderTop: "1px solid #f1f5f9", marginTop: "1rem" }}>
                {selectedOffer.status === "open" && (
                  <button onClick={() => { closeOffer(selectedOffer.id); setShowDetail(false); }} className="am-btn-submit-danger">
                    Close Offer
                  </button>
                )}
                {selectedOffer.status === "closed" && (
                  <button onClick={() => { reopenOffer(selectedOffer.id); setShowDetail(false); }} className="am-btn-submit" style={{ background: "#22c55e" }}>
                    Reopen Offer
                  </button>
                )}
                <button onClick={() => setShowDetail(false)} className="am-btn-cancel">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}