// AdminConventions.tsx
import { useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";

interface Convention {
  id: number;
  status: string;
  student_name: string;
  student_email?: string;
  company_name: string;
  offer_title: string;
  offer_town?: string;
  start_date: string | null;
  end_date: string | null;
  student_signed_at: string | null;
  company_signed_at: string | null;
  admin_signed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminConventions() {
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConv, setSelectedConv] = useState<Convention | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchConventions();
  }, []);

  const fetchConventions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("conventions/pending-admin/");
      const body = data as { error?: boolean; data?: Convention[] };
      if (!body.error && Array.isArray(body.data)) {
        setConventions(
          body.data.map((c) => ({
            ...c,
            start_date: c.start_date ?? null,
            end_date: c.end_date ?? null,
            admin_signed_at: c.admin_signed_at ?? null,
          })),
        );
      } else {
        setConventions([]);
        toast.error("Could not load conventions.");
      }
    } catch {
      setConventions([]);
      toast.error("Could not load conventions.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (conv: Convention) => {
    setSigning(true);
    try {
      await api.post(`conventions/${conv.id}/sign/`, {});
      setConventions((prev) => prev.filter((c) => c.id !== conv.id));
      if (selectedConv?.id === conv.id) {
        setSelectedConv(null);
        setShowDetail(false);
      }
      setSuccessMsg("Convention validated successfully!");
      toast.success("Validated.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      toast.error("Validation failed.");
    } finally {
      setSigning(false);
    }
  };

  const statusConfig: Record<string, { label: string; badge: string; color: string }> = {
    VALIDATED: { label: "Validated", badge: "am-conv-complete", color: "#22c55e" },
    PENDING_ADMIN: { label: "Pending Admin", badge: "am-conv-pending", color: "#f59e0b" },
    PENDING_COMPANY: { label: "Pending Company", badge: "am-conv-active", color: "#3b82f6" },
    PENDING_STUDENT: { label: "Pending Student", badge: "am-conv-expired", color: "#8b5cf6" },
    REJECTED: { label: "Rejected", badge: "am-badge-rejected", color: "#ef4444" },
    DRAFT: { label: "Draft", badge: "am-conv-expired", color: "#94a3b8" },
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "PENDING_ADMIN", label: "Needs My Action" },
    { key: "VALIDATED", label: "Validated" },
    { key: "PENDING_COMPANY", label: "Pending Company" },
    { key: "PENDING_STUDENT", label: "Pending Student" },
  ];

  const filtered = activeTab === "all" ? conventions : conventions.filter(c => c.status === activeTab);
  const pendingAdminCount = conventions.filter(c => c.status === "PENDING_ADMIN").length;

  const fmtDate = (s: string | null) => {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return <div className="am-loading"><div className="am-spinner" /><span>Loading conventions...</span></div>;
  }

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Conventions</h1>
          <p className="am-page-sub">
            {conventions.length} Total • {pendingAdminCount} pending your validation
          </p>
        </div>
        {pendingAdminCount > 0 && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 8, padding: ".5rem 1rem", fontSize: ".78rem", fontWeight: 700, color: "#92400e" }}>
            ⚠ï¸ {pendingAdminCount} convention{pendingAdminCount > 1 ? "s" : ""} awaiting your signature
          </div>
        )}
      </div>

      {successMsg && <div className="am-success-msg"><span>✅</span> {successMsg}</div>}

      <div className="am-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`am-tab ${activeTab === tab.key ? "am-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="am-tab-count">
              {tab.key === "all" ? conventions.length : conventions.filter(c => c.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      <p className="am-results-count">{filtered.length} conventions found</p>

      <div className="am-conv-list">
        {filtered.length === 0 ? (
          <div className="am-empty">
            <span className="am-empty-icon">📄</span>
            <h3>No conventions found</h3>
            <p>Conventions will appear here once applications are accepted.</p>
          </div>
        ) : (
          filtered.map(conv => (
            <div key={conv.id} className="am-conv-card" style={{ flexWrap: "wrap", gap: ".5rem" }}>
              <div className="am-conv-card-left">
                <span className="am-conv-id">CONV-{String(conv.id).padStart(4, "0")}</span>
              </div>

              <div className="am-conv-card-body" style={{ flex: 1, minWidth: 0 }}>
                <h4>{conv.student_name} → {conv.company_name}</h4>
                <div className="am-conv-dates">
                  <span>💼 {conv.offer_title}</span>
                  {conv.offer_town && <span>📍 {conv.offer_town}</span>}
                  {conv.start_date && <span>📅 {fmtDate(conv.start_date)} – {fmtDate(conv.end_date)}</span>}
                </div>
                {/* Signature chain */}
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".375rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: ".68rem", padding: ".1rem .5rem", borderRadius: 99, background: conv.student_signed_at ? "#dcfce7" : "#f1f5f9", color: conv.student_signed_at ? "#166534" : "#94a3b8", fontWeight: 600 }}>
                    {conv.student_signed_at ? "✓" : "○"} Student
                  </span>
                  <span style={{ fontSize: ".68rem", padding: ".1rem .5rem", borderRadius: 99, background: conv.company_signed_at ? "#dcfce7" : "#f1f5f9", color: conv.company_signed_at ? "#166534" : "#94a3b8", fontWeight: 600 }}>
                    {conv.company_signed_at ? "✓" : "○"} Company
                  </span>
                  <span style={{ fontSize: ".68rem", padding: ".1rem .5rem", borderRadius: 99, background: conv.admin_signed_at ? "#dcfce7" : "#f1f5f9", color: conv.admin_signed_at ? "#166534" : "#94a3b8", fontWeight: 600 }}>
                    {conv.admin_signed_at ? "✓" : "○"} Admin
                  </span>
                </div>
              </div>

              <div className="am-conv-card-right">
                <span className={`am-conv-badge ${statusConfig[conv.status]?.badge || "am-conv-pending"}`}>
                  {statusConfig[conv.status]?.label || conv.status}
                </span>
                <button
                  className="am-btn-view"
                  onClick={() => { setSelectedConv(conv); setShowDetail(true); }}
                >
                  View
                </button>
                {conv.status === "PENDING_ADMIN" && (
                  <button
                    onClick={() => handleValidate(conv)}
                    disabled={signing}
                    style={{
                      padding: ".35rem .75rem",
                      background: "#22c55e",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: ".72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {signing ? "…" : "✓ Validate"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedConv && (
        <div className="am-modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="am-modal am-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <div>
                <h3>Convention CONV-{String(selectedConv.id).padStart(4, "0")}</h3>
                <span style={{ fontSize: ".75rem", color: "#64748b" }}>
                  <span className={`am-conv-badge ${statusConfig[selectedConv.status]?.badge || "am-conv-pending"}`}>
                    {statusConfig[selectedConv.status]?.label || selectedConv.status}
                  </span>
                </span>
              </div>
              <button onClick={() => setShowDetail(false)} className="am-close-btn">✕</button>
            </div>
            <div className="am-modal-body">
              <div className="am-detail-sections">
                <div className="am-detail-section">
                  <h4>Parties</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item"><span>Student</span><strong>{selectedConv.student_name}</strong></div>
                    <div className="am-detail-item"><span>Student Email</span><strong>{selectedConv.student_email || "—"}</strong></div>
                    <div className="am-detail-item"><span>Company</span><strong>{selectedConv.company_name}</strong></div>
                    <div className="am-detail-item"><span>Offer</span><strong>{selectedConv.offer_title}</strong></div>
                    <div className="am-detail-item"><span>Location</span><strong>{selectedConv.offer_town || "—"}</strong></div>
                  </div>
                </div>
                <div className="am-detail-section">
                  <h4>Period</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item"><span>Start Date</span><strong>{fmtDate(selectedConv.start_date)}</strong></div>
                    <div className="am-detail-item"><span>End Date</span><strong>{fmtDate(selectedConv.end_date)}</strong></div>
                    <div className="am-detail-item"><span>Created</span><strong>{fmtDate(selectedConv.created_at)}</strong></div>
                    <div className="am-detail-item"><span>Last Updated</span><strong>{fmtDate(selectedConv.updated_at)}</strong></div>
                  </div>
                </div>
                <div className="am-detail-section">
                  <h4>Signatures</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item">
                      <span>Student Signature</span>
                      <strong style={{ color: selectedConv.student_signed_at ? "#166534" : "#92400e" }}>
                        {selectedConv.student_signed_at ? `✓ Signed ${fmtDate(selectedConv.student_signed_at)}` : "⏳ Pending"}
                      </strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Company Signature</span>
                      <strong style={{ color: selectedConv.company_signed_at ? "#166534" : "#92400e" }}>
                        {selectedConv.company_signed_at ? `✓ Signed ${fmtDate(selectedConv.company_signed_at)}` : "⏳ Pending"}
                      </strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Admin Validation</span>
                      <strong style={{ color: selectedConv.admin_signed_at ? "#166534" : "#92400e" }}>
                        {selectedConv.admin_signed_at ? `✓ Validated ${fmtDate(selectedConv.admin_signed_at)}` : "⏳ Pending"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {selectedConv.status === "PENDING_ADMIN" && (
                <div className="am-detail-actions-bottom" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    onClick={() => { handleValidate(selectedConv); setShowDetail(false); }}
                    disabled={signing}
                    className="am-btn-approve"
                  >
                    ✓ Validate Convention
                  </button>
                  <button onClick={() => setShowDetail(false)} className="am-btn-cancel">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
