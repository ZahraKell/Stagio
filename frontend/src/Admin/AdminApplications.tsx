// AdminApplications.tsx
import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

interface Application {
  id: string | number;
  student_name: string;
  student_email?: string;
  offer_title: string;
  offer_location?: string;
  company_name?: string;
  offer_company?: string;
  application_date: string;
  status: "pending" | "reviewed" | "accepted" | "refused" | "validated";
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/applications/admin/all/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) {
        setApplications(data.data || []);
      } else {
        setApplications(getMockApplications());
      }
    } catch {
      setApplications(getMockApplications());
    } finally {
      setLoading(false);
    }
  };

  const getMockApplications = (): Application[] => [
    { id: "APP-042", student_name: "Mounir Samir", student_email: "mounir@esi.edu.dz", offer_title: "Mobile Dev Intern", offer_company: "Mobilis", offer_location: "Constantine", application_date: "20 Avr 2026", status: "pending" },
    { id: "APP-041", student_name: "Rahmani Yasmine", student_email: "yasmine@usthb.dz", offer_title: "Cybersecurity Intern", offer_company: "Algérie Télécom", offer_location: "Sétif", application_date: "15 Avr 2026", status: "pending" },
    { id: "APP-040", student_name: "Ahmed Benali", student_email: "ahmed@esi.edu.dz", offer_title: "Software Engineering Intern", offer_company: "Sonatrach", offer_location: "Constantine", application_date: "10 Avr 2026", status: "accepted" },
    { id: "APP-039", student_name: "Sara Meziane", student_email: "sara@usthb.dz", offer_title: "Data Analyst", offer_company: "Mobilis", offer_location: "Alger", application_date: "08 Avr 2026", status: "accepted" },
    { id: "APP-038", student_name: "Karim Lounis", student_email: "karim@ummto.edu.dz", offer_title: "Backend Dev Intern", offer_company: "Condor Electronics", offer_location: "Bordj Bou Arreridj", application_date: "05 Avr 2026", status: "reviewed" },
    { id: "APP-037", student_name: "Nadia Hamdi", student_email: "nadia@univ-alger.dz", offer_title: "UI/UX Designer", offer_company: "Ooredoo", offer_location: "Alger", application_date: "01 Avr 2026", status: "refused" },
    { id: "APP-036", student_name: "Youcef Ould", student_email: "youcef@esi.edu.dz", offer_title: "Network Engineer", offer_company: "Algérie Télécom", offer_location: "Sétif", application_date: "28 Mar 2026", status: "accepted" },
    { id: "APP-035", student_name: "Amira Saadi", student_email: "amira@univ-oran.dz", offer_title: "Frontend Developer", offer_company: "Sonatrach", offer_location: "Oran", application_date: "25 Mar 2026", status: "pending" },
    { id: "APP-034", student_name: "Kamel Djalil", student_email: "kamel@univ-bejaia.dz", offer_title: "Industrial Automation", offer_company: "Cevital", offer_location: "Béjaïa", application_date: "20 Mar 2026", status: "refused" },
    { id: "APP-033", student_name: "Lyna Kerboua", student_email: "lyna@usthb.dz", offer_title: "Data Science Intern", offer_company: "Mobilis", offer_location: "Alger", application_date: "15 Mar 2026", status: "validated" },
  ];

  const filtered = applications.filter(app => {
    const matchFilter = filter === "all" ? true : app.status === filter;
    const matchSearch = search === "" ? true :
      app.student_name.toLowerCase().includes(search.toLowerCase()) ||
      app.offer_title.toLowerCase().includes(search.toLowerCase()) ||
      (app.offer_company || "").toLowerCase().includes(search.toLowerCase()) ||
      (app.student_email || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    reviewed: applications.filter(a => a.status === "reviewed").length,
    accepted: applications.filter(a => a.status === "accepted").length,
    refused: applications.filter(a => a.status === "refused").length,
    validated: applications.filter(a => a.status === "validated").length,
  };

  const statusConfig: Record<string, { badge: string; label: string }> = {
    pending: { badge: "am-badge-pending", label: "Pending" },
    reviewed: { badge: "am-badge-review", label: "Under Review" },
    accepted: { badge: "am-badge-accepted", label: "Accepted" },
    refused: { badge: "am-badge-rejected", label: "Refused" },
    validated: { badge: "am-badge-approved", label: "Validated" },
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "reviewed", label: "Under Review", count: counts.reviewed },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "refused", label: "Refused", count: counts.refused },
    { key: "validated", label: "Validated", count: counts.validated },
  ];

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Applications</h1>
          <p className="am-page-sub">
            {counts.all} Total • Pending: {counts.pending} • Accepted: {counts.accepted} • Validated: {counts.validated}
          </p>
        </div>
      </div>

      {successMsg && <div className="am-success-msg"><span>✅</span> {successMsg}</div>}

      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by student, offer, company or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

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

      <p className="am-results-count">{filtered.length} applications found</p>

      {/* Applications Table */}
      <div className="am-card">
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Offer</th>
                <th>Company</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="am-empty-cell">
                    <div className="am-empty-state-small">
                      <span>📭</span>
                      <p>No applications found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div className="am-user-cell">
                        <div className="am-user-av">{app.student_name.charAt(0)}</div>
                        <div>
                          <strong style={{ fontSize: ".8rem" }}>{app.student_name}</strong>
                          {app.student_email && (
                            <span className="am-username">{app.student_email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: ".78rem", color: "#334155", maxWidth: 160 }}>
                      {app.offer_title}
                    </td>
                    <td style={{ fontSize: ".78rem" }}>
                      {app.offer_company || app.company_name || "—"}
                    </td>
                    <td>
                      {(app.offer_location) && (
                        <span className="am-town-badge">📍 {app.offer_location}</span>
                      )}
                    </td>
                    <td className="am-date-cell" style={{ fontSize: ".72rem", color: "#94a3b8" }}>
                      {app.application_date}
                    </td>
                    <td>
                      <span className={`am-status-badge ${statusConfig[app.status]?.badge || "am-badge-pending"}`}>
                        {statusConfig[app.status]?.label || app.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginTop: ".5rem" }}>
        {Object.entries(counts).filter(([k]) => k !== "all").map(([status, count]) => (
          <div
            key={status}
            className="am-dash-stat"
            style={{
              borderTopColor: {
                pending: "#f59e0b", reviewed: "#3b82f6", accepted: "#22c55e",
                refused: "#ef4444", validated: "#8b5cf6",
              }[status] || "#94a3b8",
              cursor: "pointer",
            }}
            onClick={() => setFilter(status)}
          >
            <div className="am-dash-stat-top">
              <span className="am-dash-stat-icon">
                {{ pending: "⏳", reviewed: "🔍", accepted: "✅", refused: "❌", validated: "🏆" }[status]}
              </span>
              <span className="am-dash-stat-value">{count}</span>
            </div>
            <div className="am-dash-stat-label" style={{ textTransform: "capitalize" }}>{status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}