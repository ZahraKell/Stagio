// AdminCompanies.tsx
import { useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";

interface Company {
  userId: number;
  companyPk: number | null;
  id: number;
  company_name: string;
  company_sector: string;
  company_website: string;
  town: string;
  description: string;
  logo: string | null;
  status: "approved" | "pending" | "rejected" | "suspended";
  email: string;
  pnum: string;
  offers_count: number;
  conventions_count: number;
  rating: number;
  submitted_date: string;
  is_approved: boolean;
  is_rejected: boolean;
  rejection_reason?: string;
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [rejectModal, setRejectModal] = useState<{
    show: boolean;
    companyPk: number | null;
  }>({ show: false, companyPk: null });
  const [rejectReason, setRejectReason] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes] = await Promise.all([
        api.get("admin/users/", { params: { role: "company" } }),
        api.get("admin/companies/pending/"),
      ]);
      const usersBody = usersRes.data as {
        error?: boolean;
        data?: Array<Record<string, unknown>>;
      };
      const pendingBody = pendingRes.data as {
        data?: Array<{
          id: number;
          user_id: number;
          submitted_at?: string;
          company_sector?: string;
          town?: string;
        }>;
      };
      if (usersBody.error || !Array.isArray(usersBody.data)) {
        setCompanies([]);
        toast.error("Could not load companies.");
        return;
      }
      const pendingList = pendingBody.data || [];
      const pendingByUserId = new Map(pendingList.map((c) => [c.user_id, c]));
      const mapped: Company[] = usersBody.data.map(
        (u: Record<string, unknown>) => {
          const uid = u.id as number;
          const pend = pendingByUserId.get(uid);
          const isPending = Boolean(pend);
          const active = Boolean(u.is_active);
          return {
            userId: uid,
            companyPk: pend ? pend.id : null,
            id: uid,
            company_name: (u.full_name as string) || (u.username as string),
            company_sector: (pend?.company_sector as string) || "—",
            company_website: "—",
            town: (pend?.town as string) || (u.town as string) || "—",
            description: "",
            logo: null,
            status: !active
              ? "suspended"
              : isPending
                ? "pending"
                : ("approved" as Company["status"]),
            email: u.email as string,
            pnum: (u.pnum as string) || "—",
            offers_count: Number((u.offers_count as number) ?? 0),
            conventions_count: Number((u.conventions_count as number) ?? 0),
            rating: 0,
            submitted_date: pend?.submitted_at?.split("T")[0] || "—",
            is_approved: active && !isPending,
            is_rejected: false,
          };
        },
      );
      setCompanies(mapped);
    } catch {
      setCompanies([]);
      toast.error("Could not load companies.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyPk: number | null) => {
    if (companyPk == null) {
      toast.error("No company record to approve.");
      return;
    }
    try {
      await api.post(`admin/companies/${companyPk}/approve/`, {});
      setCompanies((prev) =>
        prev.map((c) =>
          c.companyPk === companyPk
            ? {
                ...c,
                status: "approved" as const,
                is_approved: true,
                is_rejected: false,
              }
            : c,
        ),
      );
      setSuccessMsg("Company approved successfully!");
      toast.success("Approved.");
    } catch {
      toast.error("Approve failed.");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const confirmReject = async () => {
    if (!rejectModal.companyPk || !rejectReason.trim()) return;
    try {
      await api.post(`admin/companies/${rejectModal.companyPk}/reject/`, {
        reason: rejectReason,
      });
      setCompanies((prev) =>
        prev.map((c) =>
          c.companyPk === rejectModal.companyPk
            ? {
                ...c,
                status: "rejected" as const,
                is_rejected: true,
                rejection_reason: rejectReason,
              }
            : c,
        ),
      );
      setSuccessMsg("Company rejected.");
      toast.success("Rejected.");
    } catch {
      toast.error("Reject failed.");
    }
    setRejectModal({ show: false, companyPk: null });
    setRejectReason("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleToggleActive = async (userId: number, currentStatus: string) => {
    const activate = currentStatus === "suspended";
    try {
      await api.patch(`admin/users/${userId}/update/`, { is_active: activate });
      setCompanies((prev) =>
        prev.map((c) =>
          c.userId === userId
            ? {
                ...c,
                status: activate
                  ? ("approved" as const)
                  : ("suspended" as const),
              }
            : c,
        ),
      );
      setSuccessMsg(activate ? "Company reactivated." : "Company suspended.");
      toast.success(activate ? "Reactivated." : "Suspended.");
    } catch {
      toast.error("Update failed.");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const allSectors = [...new Set(companies.map((c) => c.company_sector))];

  const filtered = companies.filter((c) => {
    const matchFilter = filter === "all" ? true : c.status === filter;
    const matchSearch =
      search === ""
        ? true
        : c.company_name.toLowerCase().includes(search.toLowerCase()) ||
          c.company_sector.toLowerCase().includes(search.toLowerCase()) ||
          c.town.toLowerCase().includes(search.toLowerCase());
    const matchSector =
      sectorFilter === "" ? true : c.company_sector === sectorFilter;
    return matchFilter && matchSearch && matchSector;
  });

  const counts = {
    all: companies.length,
    approved: companies.filter((c) => c.status === "approved").length,
    pending: companies.filter((c) => c.status === "pending").length,
    rejected: companies.filter((c) => c.status === "rejected").length,
    suspended: companies.filter((c) => c.status === "suspended").length,
  };

  const statusConfig: Record<
    string,
    { badge: string; label: string; color: string }
  > = {
    approved: {
      badge: "am-badge-approved",
      label: "Approved",
      color: "#22c55e",
    },
    pending: { badge: "am-badge-pending", label: "Pending", color: "#f59e0b" },
    rejected: {
      badge: "am-badge-rejected",
      label: "Rejected",
      color: "#ef4444",
    },
    suspended: {
      badge: "am-badge-suspended",
      label: "Suspended",
      color: "#6b7280",
    },
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "suspended", label: "Suspended", count: counts.suspended },
  ];

  if (loading)
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading companies...</span>
      </div>
    );

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Companies</h1>
          <p className="am-page-sub">
            {counts.all} Total • Approved: {counts.approved} • Pending:{" "}
            {counts.pending} • Suspended: {counts.suspended}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="am-success-msg">
          <span>✅</span> {successMsg}
        </div>
      )}

      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by name, sector, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="am-filter"
        >
          <option value="">All Sectors</option>
          {allSectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="am-tabs">
        {tabs.map((tab) => (
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

      <p className="am-results-count">{filtered.length} companies found</p>

      <div className="am-companies-grid">
        {filtered.map((company) => (
          <div
            key={company.userId}
            className={`am-company-card ${company.status === "pending" ? "am-company-pending" : ""}`}
          >
            <div
              className="am-company-stripe"
              style={{
                background: statusConfig[company.status]?.color || "#94a3b8",
              }}
            />

            <div className="am-company-card-top">
              <div className="am-company-logo">
                {company.company_name.charAt(0)}
              </div>
              <div className="am-company-info">
                <h4>{company.company_name}</h4>
                <span className="am-company-sector">
                  {company.company_sector}
                </span>
                <span className="am-company-town">📍 {company.town}</span>
              </div>
              <span
                className={`am-company-status-badge ${statusConfig[company.status]?.badge}`}
              >
                {statusConfig[company.status]?.label}
              </span>
            </div>

            <div className="am-company-card-body">
              {company.description && (
                <p className="am-company-desc">
                  {company.description.slice(0, 110)}...
                </p>
              )}
              <div className="am-company-stats">
                <div className="am-company-stat">
                  <span className="am-stat-icon-small">📋</span>
                  <span>{company.offers_count} offers</span>
                </div>
                <div className="am-company-stat">
                  <span className="am-stat-icon-small">📄</span>
                  <span>{company.conventions_count} conventions</span>
                </div>
              </div>
              <div className="am-company-contact">
                <span>📧 {company.email}</span>
                <span>📞 {company.pnum}</span>
              </div>
              {company.submitted_date && company.submitted_date !== "—" && (
                <div className="am-company-date">
                  Submitted: {company.submitted_date}
                </div>
              )}
            </div>

            <div className="am-company-card-footer">
              <button
                onClick={() => {
                  setSelectedCompany(company);
                  setShowDetailModal(true);
                }}
                className="am-btn-view-detail"
              >
                👁 View Details
              </button>

              {company.status === "pending" && (
                <div className="am-pending-actions">
                  <button
                    onClick={() => handleApprove(company.companyPk)}
                    className="am-btn-approve-sm"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() =>
                      setRejectModal({
                        show: true,
                        companyPk: company.companyPk,
                      })
                    }
                    className="am-btn-reject-sm"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
              {company.status === "approved" && (
                <button
                  onClick={() =>
                    handleToggleActive(company.userId, company.status)
                  }
                  className="am-btn-suspend-sm"
                >
                  ⏸ Suspend
                </button>
              )}
              {company.status === "suspended" && (
                <button
                  onClick={() =>
                    handleToggleActive(company.userId, company.status)
                  }
                  className="am-btn-reactivate-sm"
                >
                  ▶ Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div
          className="am-modal-overlay"
          onClick={() => setRejectModal({ show: false, companyPk: null })}
        >
          <div className="am-modal" onClick={(e) => e.stopPropagation()}>
            <div className="am-modal-head">
              <h3>Reject Company</h3>
              <button
                onClick={() => setRejectModal({ show: false, companyPk: null })}
                className="am-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="am-modal-body">
              <div className="am-form-group">
                <label>
                  Reason for rejection{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a clear reason..."
                  rows={4}
                  className="am-textarea"
                />
              </div>
              <div className="am-form-actions">
                <button
                  onClick={() =>
                    setRejectModal({ show: false, companyPk: null })
                  }
                  className="am-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className="am-btn-submit-danger"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCompany && (
        <div
          className="am-modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="am-modal am-modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="am-modal-head">
              <div className="am-modal-company-header">
                <div className="am-company-logo-lg">
                  {selectedCompany.company_name.charAt(0)}
                </div>
                <div>
                  <h3>{selectedCompany.company_name}</h3>
                  <span>
                    {selectedCompany.company_sector} • {selectedCompany.town}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="am-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="am-modal-body">
              <div className="am-detail-sections">
                {selectedCompany.description && (
                  <div className="am-detail-section">
                    <h4>About</h4>
                    <p>{selectedCompany.description}</p>
                  </div>
                )}
                <div className="am-detail-section">
                  <h4>Contact Information</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item">
                      <span>Email</span>
                      <strong>{selectedCompany.email}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Phone</span>
                      <strong>{selectedCompany.pnum}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Website</span>
                      <strong>{selectedCompany.company_website}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Location</span>
                      <strong>{selectedCompany.town}</strong>
                    </div>
                  </div>
                </div>
                <div className="am-detail-section">
                  <h4>Platform Activity</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item">
                      <span>Offers Posted</span>
                      <strong>{selectedCompany.offers_count}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Conventions</span>
                      <strong>{selectedCompany.conventions_count}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Status</span>
                      <span
                        className={`am-company-status-badge ${statusConfig[selectedCompany.status]?.badge}`}
                      >
                        {statusConfig[selectedCompany.status]?.label}
                      </span>
                    </div>
                    <div className="am-detail-item">
                      <span>Submitted</span>
                      <strong>{selectedCompany.submitted_date}</strong>
                    </div>
                  </div>
                </div>
                {selectedCompany.rejection_reason && (
                  <div className="am-detail-section">
                    <h4>Rejection Reason</h4>
                    <p
                      style={{
                        background: "#fff5f5",
                        padding: ".75rem",
                        borderRadius: 8,
                        fontSize: ".8rem",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                      }}
                    >
                      {selectedCompany.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {selectedCompany.status === "pending" && (
                <div className="am-detail-actions-bottom">
                  <button
                    onClick={() => {
                      handleApprove(selectedCompany.companyPk);
                      setShowDetailModal(false);
                    }}
                    className="am-btn-approve"
                  >
                    ✓ Approve Company
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setRejectModal({
                        show: true,
                        companyPk: selectedCompany.companyPk,
                      });
                    }}
                    className="am-btn-reject"
                  >
                    ✕ Reject Company
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
