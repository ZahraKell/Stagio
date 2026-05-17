// AdminApplications.tsx
import { useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";

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
      const { data } = await api.get("applications/admin/all/");
      const body = data as { error?: boolean; data?: Application[] };
      setApplications(body.data ?? []);
    } catch {
      toast.error("Could not load applications.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

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
