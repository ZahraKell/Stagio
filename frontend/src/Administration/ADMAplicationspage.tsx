import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  CheckCircle, XCircle, RefreshCw, X, AlertTriangle,
  ArrowRight, FileText, Clock, CheckSquare, XSquare, Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
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
  student_id: number;
  cv_score?: number;
  status: string;
  application_date: string;
}

function unwrapApps(res: { data: unknown }): AppRow[] {
  const body = res.data as { data?: AppRow[] };
  return (body?.data ?? []).map((row) => ({
    ...row,
    student_id: row.student_id ?? 0,
    cv_score: row.cv_score ?? 0,
  }));
}

/* ══════════════════════════════════════════════════════════
   CV MODAL
   ══════════════════════════════════════════════════════════ */
interface CvSkill { id: number; name: string; level: string }
interface CvData {
  cv_score?: number;
  description?: string;
  skills?: CvSkill[];
  educations?: { id: number; degree: string; institution: string; start_year: number; end_year: number | null; is_current: boolean }[];
  experiences?: { id: number; job_title: string; company: string; description: string }[];
}

function CVModal({ app, onClose }: { app: AppRow; onClose: () => void }) {
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app.student_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`users/students/${app.student_id}/cv/`)
      .then((res) => {
        const body = res.data as { error?: boolean; data?: CvData };
        setCvData(!body.error && body.data ? body.data : null);
      })
      .catch(() => setCvData(null))
      .finally(() => setLoading(false));
  }, [app.student_id]);

  return (
    <div
      className="conv-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="conv-popup" style={{ maxWidth: 560 }}>
        <div className="conv-head">
          <div className="conv-head-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Eye size={22} />
          </div>
          <div>
            <h3>CV — {app.student_name}</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{app.student_email}</p>
          </div>
          <button type="button" className="conv-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="conv-body">
          {loading ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>Chargement du CV…</p>
          ) : !cvData ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Cet étudiant n&apos;a pas encore de CV numérique.
            </p>
          ) : (
            <>
              <div className="conv-summary">
                <div className="conv-summary-item">
                  <span>Score CV</span>
                  <strong>{cvData.cv_score ?? app.cv_score ?? 0}%</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Offre</span>
                  <strong>{app.offer_title}</strong>
                </div>
              </div>
              {cvData.description && (
                <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>{cvData.description}</p>
              )}
              {cvData.skills && cvData.skills.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cvData.skills.map((sk) => (
                    <span
                      key={sk.id}
                      style={{
                        fontSize: 12,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: "#f1f5f9",
                      }}
                    >
                      {sk.name}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="conv-footer">
          <button type="button" className="conv-btn-cancel" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REJECT MODAL
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
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setSubmitting(true);
    try {
      if (app.status === "accepted") {
        await api.put(`applications/${app.id}/reject/`, { reason });
      } else {
        await api.put(`applications/${app.id}/administration-review/`, {
          action: "refuse",
          reason,
        });
      }
      setDone(true);
      setTimeout(() => { onRejected(); }, 1600);
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
        <div className="conv-head">
          <div className="conv-head-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <XCircle size={22} />
          </div>
          <div>
            <h3>Refuser la candidature</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Application #{app.id}</p>
          </div>
          {!done && (
            <button className="conv-close" onClick={onClose}><X size={16} /></button>
          )}
        </div>

        {done ? (
          <div className="conv-success">
            <div className="conv-success-icon" style={{ fontSize: 36 }}>❌</div>
            <h3>Candidature refusée</h3>
            <p>L'étudiant a été notifié avec le motif indiqué.</p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              <div className="conv-summary">
                <div className="conv-summary-item">
                  <span>Student</span><strong>{app.student_name}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Email</span><strong style={{ fontSize: 12 }}>{app.student_email}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Offer</span><strong>{app.offer_title}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Company</span><strong>{app.offer_company_name || "—"}</strong>
                </div>
              </div>

              <div className="conv-explainer" style={{
                background: "#fff7ed", border: "1px solid #fed7aa",
                borderRadius: 10, padding: "12px 14px",
                display: "flex", gap: 10, alignItems: "flex-start", margin: "12px 0",
              }}>
                <AlertTriangle size={16} style={{ color: "#ea580c", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#7c2d12", lineHeight: 1.5 }}>
                  Rejecting will notify both the student and the company.
                  The application status will revert to <strong>pending</strong>.
                  Please provide a clear reason so the student can improve their profile.
                </p>
              </div>

              <div style={{ marginTop: 4 }}>
                <label style={{
                  display: "block", fontSize: 13, fontWeight: 600,
                  color: "#374151", marginBottom: 6,
                }}>
                  Motif du refus <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. The student's CV is incomplete. Please add more skills and experience before reapplying."
                  rows={4}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8,
                    border: reason.trim() ? "1px solid #d1d5db" : "1px solid #fca5a5",
                    fontSize: 13, lineHeight: 1.6, resize: "vertical",
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  {reason.length} characters — minimum 10 recommended
                </div>
              </div>
            </div>

            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none",
                  fontWeight: 600, fontSize: 14,
                  cursor: reason.trim() && !submitting ? "pointer" : "not-allowed",
                  background: reason.trim() ? "#dc2626" : "#fca5a5",
                  color: "#fff", display: "flex", alignItems: "center", gap: 6,
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
   VALIDATE MODAL
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
  const [done, setDone] = useState(false);

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
                  <span>Student</span><strong>{app.student_name}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Offer</span><strong>{app.offer_title}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Company</span><strong>{app.offer_company_name || "—"}</strong>
                </div>
              </div>

              <div className="conv-explainer" style={{
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: 10, padding: "12px 14px",
                display: "flex", gap: 10, marginTop: 12,
              }}>
                <CheckCircle size={16} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#14532d", lineHeight: 1.5 }}>
                  Validating will mark the internship as <strong>validated</strong>,
                  auto-add it to the student's CV, send confirmation emails, and
                  generate the final convention PDF.
                </p>
              </div>

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
   STATUS HELPERS
   ══════════════════════════════════════════════════════════ */
const statusBadgeClass = (s: string) => {
  if (s === "accepted") return "as-accepted";
  if (s === "validated") return "as-validated";
  if (s === "refused") return "as-refused";
  if (s === "rejected") return "as-rejected";
  return "as-pending";
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function countByStatus(rows: AppRow[], s: string) {
  return rows.filter(r => r.status === s).length;
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
const ADMApplicationsPage: React.FC = () => {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<AppRow | null>(null);
  const [validateTarget, setValidateTarget] = useState<AppRow | null>(null);
  const [cvTarget, setCvTarget] = useState<AppRow | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

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

  return (
    <DashboardLayout pageTitle="Applications">
      <div className="adm-applications-page">

        {/* ── HERO ── */}
        <div className="page-hero adm-applications-hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>Applications</h1>
            <p>Review and validate internship applications within your scope.</p>
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        {!loading && (
          <div className="adm-app-stats">
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon total">
                <FileText size={18} />
              </div>
              <div>
                <div className="adm-app-stat-label">Total</div>
                <div className="adm-app-stat-val">{rows.length}</div>
              </div>
            </div>
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon accepted">
                <CheckSquare size={18} />
              </div>
              <div>
                <div className="adm-app-stat-label">Accepted</div>
                <div className="adm-app-stat-val">{countByStatus(rows, "accepted")}</div>
              </div>
            </div>
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon pending">
                <Clock size={18} />
              </div>
              <div>
                <div className="adm-app-stat-label">Pending</div>
                <div className="adm-app-stat-val">{countByStatus(rows, "pending")}</div>
              </div>
            </div>
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon rejected">
                <XSquare size={18} />
              </div>
              <div>
                <div className="adm-app-stat-label">Rejected</div>
                <div className="adm-app-stat-val">
                  {countByStatus(rows, "refused") + countByStatus(rows, "rejected")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CARD ── */}
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>All Applications</h2>
              <p>{rows.length} application{rows.length !== 1 ? "s" : ""} in your scope</p>
            </div>
            <div className="adm-actions">
              <Link to="/admin/conventions" className="adm-btn-link">
                Conventions <ArrowRight size={13} />
              </Link>
              <button
                type="button"
                className="adm-action-btn approve sm"
                onClick={() => void load()}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ padding: "28px 20px", color: "var(--sc-muted)", fontSize: 13 }}>
              Loading…
            </p>
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
                        <div className="adm-student-cell">
                          <div className="adm-student-avatar">
                            {initials(a.student_name)}
                          </div>
                          <div>
                            <div className="fw-medium">{a.student_name}</div>
                            <div className="adm-cell-sub">{a.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{a.offer_title}</td>
                      <td className="fw-medium">{a.offer_company_name || "—"}</td>
                      <td>
                        <span className={`app-status-badge ${statusBadgeClass(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="text-muted">
                        {a.application_date ? String(a.application_date).slice(0, 10) : "—"}
                      </td>
                      <td>
                        <div className="adm-actions">
                          <button
                            type="button"
                            className="adm-action-btn sm"
                            onClick={() => setCvTarget(a)}
                          >
                            <Eye size={13} /> Voir CV
                          </button>
                          {(a.status === "pending" || a.status === "reviewed") && (
                            <>
                              <button
                                type="button"
                                className="adm-action-btn approve sm"
                                disabled={approvingId === a.id}
                                onClick={() => {
                                  void (async () => {
                                    setApprovingId(a.id);
                                    try {
                                      await api.put(
                                        `applications/${a.id}/administration-review/`,
                                        { action: "approve" },
                                      );
                                      toast.success("Candidature approuvée.");
                                      await load();
                                    } catch {
                                      toast.error("Échec de l'approbation.");
                                    } finally {
                                      setApprovingId(null);
                                    }
                                  })();
                                }}
                              >
                                <CheckCircle size={13} />{" "}
                                {approvingId === a.id ? "…" : "Approuver"}
                              </button>
                              <button
                                type="button"
                                className="adm-action-btn reject sm"
                                onClick={() => setRejectTarget(a)}
                              >
                                <XCircle size={13} /> Refuser
                              </button>
                            </>
                          )}
                          {a.status === "accepted" && (
                            <>
                              <button
                                type="button"
                                className="adm-action-btn approve sm"
                                onClick={() => setValidateTarget(a)}
                              >
                                <CheckCircle size={13} /> Valider
                              </button>
                              <button
                                type="button"
                                className="adm-action-btn reject sm"
                                onClick={() => setRejectTarget(a)}
                              >
                                <XCircle size={13} /> Refuser
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 && (
                <p className="text-muted" style={{ padding: "32px 20px", textAlign: "center" }}>
                  No applications in your scope.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── MODALS ── */}
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

        {cvTarget && (
          <CVModal app={cvTarget} onClose={() => setCvTarget(null)} />
        )}

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

      </div>
    </DashboardLayout>
  );
};

export default ADMApplicationsPage;