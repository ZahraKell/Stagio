import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { CheckCircle, XCircle, RefreshCw, X, AlertTriangle } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */
interface AppRow {
  id: number;
  offer_title: string;
  offer_location?: string;
  offer_company_name?: string;
  student_name: string;
  student_email: string;
  status: string;
  application_date: string;
}

function unwrapApps(res: { data: unknown }): AppRow[] {
  const body = res.data as { data?: AppRow[] };
  return body?.data ?? [];
}

/* ══════════════════════════════════════════════════════════
   REJECT MODAL — mirrors company ConventionPopup style
   ══════════════════════════════════════════════════════════ */
function RejectModal({
  app,
  onClose,
  onRejected,
}: {
  app: AppRow;
  onClose: () => void;
  onRejected: () => void;
}) {
  const [reason,     setReason]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`applications/${app.id}/reject/`, { reason });
      setDone(true);
      setTimeout(() => {
        onRejected();
      }, 1600);
    } catch {
      toast.error("Rejection failed. Check application status and permissions.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="conv-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="conv-popup" style={{ maxWidth: 480 }}>

        {/* Header */}
        <div className="conv-head">
          <div className="conv-head-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <XCircle size={22} />
          </div>
          <div>
            <h3>Reject Internship Convention</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
              Application #{app.id}
            </p>
          </div>
          {!done && (
            <button className="conv-close" onClick={onClose}>
              <X size={16} />
            </button>
          )}
        </div>

        {done ? (
          /* Success state */
          <div className="conv-success">
            <div className="conv-success-icon" style={{ fontSize: 36 }}>❌</div>
            <h3>Convention Rejected</h3>
            <p>
              The student and company have been notified with the reason provided.
            </p>
          </div>
        ) : (
          <>
            <div className="conv-body">

              {/* Summary */}
              <div className="conv-summary">
                <div className="conv-summary-item">
                  <span>Student</span>
                  <strong>{app.student_name}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Email</span>
                  <strong style={{ fontSize: 12 }}>{app.student_email}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Offer</span>
                  <strong>{app.offer_title}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Company</span>
                  <strong>{app.offer_company_name || "—"}</strong>
                </div>
              </div>

              {/* Warning */}
              <div className="conv-explainer" style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                margin: "12px 0",
              }}>
                <AlertTriangle size={16} style={{ color: "#ea580c", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#7c2d12", lineHeight: 1.5 }}>
                  Rejecting will notify both the student and the company.
                  The application status will revert to <strong>pending</strong>.
                  Please provide a clear reason so the student can improve their profile.
                </p>
              </div>

              {/* Reason textarea */}
              <div style={{ marginTop: 4 }}>
                <label style={{
                  display: "block", fontSize: 13, fontWeight: 600,
                  color: "#374151", marginBottom: 6,
                }}>
                  Reason for rejection <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. The student's CV is incomplete. Please add more skills and experience before reapplying."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: reason.trim()
                      ? "1px solid #d1d5db"
                      : "1px solid #fca5a5",
                    fontSize: 13,
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  {reason.length} characters — minimum 10 recommended
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: reason.trim() && !submitting ? "pointer" : "not-allowed",
                  background: reason.trim() ? "#dc2626" : "#fca5a5",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.15s",
                }}
                disabled={!reason.trim() || submitting}
                onClick={() => void handleReject()}
              >
                <XCircle size={15} />
                {submitting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VALIDATE CONFIRM MODAL
   ══════════════════════════════════════════════════════════ */
function ValidateModal({
  app,
  onClose,
  onValidated,
}: {
  app: AppRow;
  onClose: () => void;
  onValidated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  const handleValidate = async () => {
    setSubmitting(true);
    try {
      await api.put(`applications/${app.id}/validate/`, {});
      setDone(true);
      setTimeout(onValidated, 1600);
    } catch {
      toast.error("Validation failed. Check application status and permissions.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="conv-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="conv-popup" style={{ maxWidth: 440 }}>

        <div className="conv-head">
          <div className="conv-head-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <h3>Validate Internship</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Application #{app.id}</p>
          </div>
          {!done && (
            <button className="conv-close" onClick={onClose}><X size={16} /></button>
          )}
        </div>

        {done ? (
          <div className="conv-success">
            <div className="conv-success-icon">✅</div>
            <h3>Internship Validated!</h3>
            <p>
              The student and company have been notified. The convention PDF
              will be sent automatically by email.
            </p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              <div className="conv-summary">
                <div className="conv-summary-item">
                  <span>Student</span>
                  <strong>{app.student_name}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Offer</span>
                  <strong>{app.offer_title}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Company</span>
                  <strong>{app.offer_company_name || "—"}</strong>
                </div>
              </div>

              <div className="conv-explainer" style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                gap: 10,
                marginTop: 12,
              }}>
                <CheckCircle size={16} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#14532d", lineHeight: 1.5 }}>
                  Validating will mark the internship as <strong>validated</strong>,
                  auto-add it to the student's CV, send confirmation emails, and
                  generate the final convention PDF.
                </p>
              </div>

              {/* Signature chain */}
              <div className="conv-chain" style={{ marginTop: 16 }}>
                <div className="conv-chain-step conv-chain-done">
                  <span className="conv-chain-dot">✓</span>
                  <span>Student signed</span>
                </div>
                <div className="conv-chain-line conv-chain-line-active" />
                <div className="conv-chain-step conv-chain-done">
                  <span className="conv-chain-dot">✓</span>
                  <span>Company signed</span>
                </div>
                <div className="conv-chain-line conv-chain-line-active" />
                <div className="conv-chain-step conv-chain-current">
                  <span className="conv-chain-dot conv-chain-pulse" />
                  <span>Your validation</span>
                </div>
              </div>
            </div>

            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                className="conv-btn-sign conv-btn-sign-ready"
                disabled={submitting}
                onClick={() => void handleValidate()}
              >
                <CheckCircle size={14} />
                {submitting ? "Validating…" : "✅ Confirm Validation"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
const ADMAplicationspage: React.FC = () => {
  const [rows,         setRows]         = useState<AppRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [rejectTarget, setRejectTarget] = useState<AppRow | null>(null);
  const [validateTarget, setValidateTarget] = useState<AppRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("applications/administration/scope/applications/");
      setRows(unwrapApps(res));
    } catch {
      toast.error("Could not load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const statusBadgeClass = (s: string) => {
    if (s === "accepted")  return "as-accepted";
    if (s === "validated") return "as-validated";
    if (s === "refused")   return "as-refused";
    return "as-pending";
  };

  return (
    <DashboardLayout pageTitle="Applications">

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button type="button" className="adm-action-btn approve sm" onClick={() => void load()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ padding: 24 }}>Loading…</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Offer</th>
                <th>Company</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ minWidth: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="fw-medium">{a.student_name}</div>
                    <div className="text-muted small">{a.student_email}</div>
                  </td>
                  <td>{a.offer_title}</td>
                  <td>{a.offer_company_name || "—"}</td>
                  <td>
                    <span className={`app-status-badge ${statusBadgeClass(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="text-muted">
                    {a.application_date ? String(a.application_date).slice(0, 10) : "—"}
                  </td>
                  <td>
                    {a.status === "accepted" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="adm-action-btn approve sm"
                          onClick={() => setValidateTarget(a)}
                        >
                          <CheckCircle size={13} /> Validate
                        </button>
                        <button
                          type="button"
                          className="adm-action-btn reject sm"
                          onClick={() => setRejectTarget(a)}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-muted" style={{ padding: 16 }}>
              No applications in your scope.
            </p>
          )}
        </div>
      )}

      {/* Validate confirmation modal */}
      {validateTarget && (
        <ValidateModal
          app={validateTarget}
          onClose={() => setValidateTarget(null)}
          onValidated={() => {
            setValidateTarget(null);
            toast.success("Internship validated successfully.");
            void load();
          }}
        />
      )}

      {/* Reject with reason modal */}
      {rejectTarget && (
        <RejectModal
          app={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={() => {
            setRejectTarget(null);
            toast.success("Application rejected and student notified.");
            void load();
          }}
        />
      )}

    </DashboardLayout>
  );
};

export default ADMAplicationspage;