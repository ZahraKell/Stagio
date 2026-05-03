// AdminOffers.tsx — Manage all internship offers across all companies
import { useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";

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

  const normalizeOffer = (row: Record<string, unknown>): Offer => {
    const deadline = row.deadline;
    const datePosted = row.date_posted;
    return {
      id: row.id as number,
      title: row.title as string,
      company_name: row.company_name as string,
      company_sector: (row.company_sector as string) || "—",
      town: row.town as string,
      duration: (row.duration as string) || "",
      internship_type: row.internship_type as string,
      is_paid: Boolean(row.is_paid),
      salary: (row.salary as string) || null,
      tech_stack: (row.tech_stack as string) || null,
      field: (row.field as string) || null,
      status: row.status as string,
      date_posted:
        typeof datePosted === "string"
          ? datePosted.slice(0, 10)
          : String(datePosted ?? ""),
      deadline:
        deadline == null || deadline === ""
          ? null
          : typeof deadline === "string"
            ? deadline.slice(0, 10)
            : String(deadline),
      description: (row.description as string) || "",
    };
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("admin/offers/");
      const rows = Array.isArray(data) ? data : [];
      setOffers(rows.map((r) => normalizeOffer(r as Record<string, unknown>)));
    } catch {
      setOffers([]);
      toast.error("Could not load offers.");
    } finally {
      setLoading(false);
    }
  };

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

  const closeOffer = async (id: number) => {
    try {
      const { data } = await api.patch(`admin/offers/${id}/status/`, { status: "closed" });
      const row = data as Record<string, unknown>;
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? normalizeOffer(row) : o)),
      );
      setSuccessMsg("Offer closed successfully.");
      toast.success("Offer closed.");
    } catch {
      toast.error("Could not close offer.");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const reopenOffer = async (id: number) => {
    try {
      const { data } = await api.patch(`admin/offers/${id}/status/`, { status: "open" });
      const row = data as Record<string, unknown>;
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? normalizeOffer(row) : o)),
      );
      setSuccessMsg("Offer reopened.");
      toast.success("Offer reopened.");
    } catch {
      toast.error("Could not reopen offer.");
    }
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
