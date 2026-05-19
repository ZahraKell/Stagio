import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  CheckCircle, XCircle, RefreshCw, X, AlertTriangle,
  ArrowRight, FileText, Clock, CheckSquare, XSquare, User,
  GraduationCap, Briefcase, Globe, Phone, Mail, Star,
  Code2, Languages, BookOpen,
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
  student_id?: number;
  status: string;
  application_date: string;
  cv_score?: number;
}

interface StudentCV {
  // profile
  full_name: string;
  email: string;
  phone?: string;
  institution?: string;
  grade?: string;
  field?: string;
  speciality?: string;
  cv_score?: number;
  // digital cv
  description?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  skills?: { name: string; level?: string }[];
  educations?: { school: string; degree?: string; field?: string; start_year?: number; end_year?: number }[];
  experiences?: { job_title: string; company: string; location?: string; start_date?: string; end_date?: string; description?: string }[];
  languages?: { language: string; level?: string }[];
}

function unwrapApps(res: { data: unknown }): AppRow[] {
  const body = res.data as { data?: AppRow[] };
  return body?.data ?? [];
}

/* ══════════════════════════════════════════════════════════
   CV PREVIEW MODAL
   ══════════════════════════════════════════════════════════ */
function CVModal({ app, onClose }: { app: AppRow; onClose: () => void }) {
  const [cv, setCV] = useState<StudentCV | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Try fetching student detail via application detail
        const res = await api.get(`applications/${app.id}/`);
        const d = (res.data as { data?: unknown })?.data ?? res.data;
        // Build a partial CV from what we have
        const partial: StudentCV = {
          full_name:   (d as AppRow).student_name || app.student_name,
          email:       (d as AppRow).student_email || app.student_email,
          cv_score:    app.cv_score,
          institution: (d as { institution?: string }).institution,
          grade:       (d as { grade?: string }).grade,
          field:       (d as { field?: string }).field,
          speciality:  (d as { speciality?: string }).speciality,
        };
        setCV(partial);
      } catch {
        // fallback: build from app row
        setCV({
          full_name: app.student_name,
          email:     app.student_email,
          cv_score:  app.cv_score,
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [app]);

  const score = cv?.cv_score ?? app.cv_score ?? 0;
  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="conv-overlay"
      style={{ zIndex: 1100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="conv-popup"
        style={{
          maxWidth: 600,
          maxHeight: "85vh",
          overflowY: "auto",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="conv-head">
          <div className="conv-head-icon" style={{ background: "#eff6ff", color: "#2563eb", fontSize: 22 }}>
            <User size={22} />
          </div>
          <div>
            <h3>{app.student_name}</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{app.student_email}</p>
          </div>
          <button className="conv-close" onClick={onClose}><X size={16} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
            <div className="mi-spinner" style={{ margin: "0 auto 12px" }} />
            Chargement du CV…
          </div>
        ) : (
          <div className="conv-body" style={{ padding: "0 20px 20px" }}>

            {/* CV Score */}
            <div style={{
              background: "#f8fafc", border: `2px solid ${scoreColor}`,
              borderRadius: 12, padding: "16px 20px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: scoreColor, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}>
                {score}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>Score CV</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  {score >= 70 ? "Profil complet et solide" : score >= 40 ? "Profil à compléter" : "Profil incomplet"}
                </div>
                {/* Score bar */}
                <div style={{ width: 200, height: 6, background: "#e2e8f0", borderRadius: 3, marginTop: 6 }}>
                  <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            </div>

            {/* Basic info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
                Informations personnelles
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { icon: <Mail size={14} />,         label: "Email",       value: cv?.email },
                  { icon: <GraduationCap size={14} />, label: "Établissement", value: cv?.institution },
                  { icon: <BookOpen size={14} />,      label: "Niveau",      value: cv?.grade },
                  { icon: <Briefcase size={14} />,     label: "Spécialité",  value: cv?.speciality || cv?.field },
                ].filter(i => i.value).map((item, idx) => (
                  <div key={idx} style={{
                    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                    padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8,
                  }}>
                    <span style={{ color: "#3b82f6", flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, marginTop: 1 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {cv?.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
                  À propos
                </div>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                  {cv.description}
                </div>
              </div>
            )}

            {/* Links */}
            {(cv?.github || cv?.linkedin || cv?.portfolio) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
                  Liens
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {cv?.github && (
                    <a href={cv.github} target="_blank" rel="noreferrer" style={{
                      padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                      fontSize: 13, color: "#3b82f6", display: "flex", alignItems: "center", gap: 6,
                      textDecoration: "none", background: "#fff",
                    }}>
                      <Globe size={13} /> GitHub
                    </a>
                  )}
                  {cv?.linkedin && (
                    <a href={cv.linkedin} target="_blank" rel="noreferrer" style={{
                      padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                      fontSize: 13, color: "#3b82f6", display: "flex", alignItems: "center", gap: 6,
                      textDecoration: "none", background: "#fff",
                    }}>
                      <Globe size={13} /> LinkedIn
                    </a>
                  )}
                  {cv?.portfolio && (
                    <a href={cv.portfolio} target="_blank" rel="noreferrer" style={{
                      padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                      fontSize: 13, color: "#3b82f6", display: "flex", alignItems: "center", gap: 6,
                      textDecoration: "none", background: "#fff",
                    }}>
                      <Globe size={13} /> Portfolio
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {cv?.skills && cv.skills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
                  <Code2 size={12} style={{ display: "inline", marginRight: 4 }} />Compétences
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cv.skills.map((s, i) => (
                    <span key={i} style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                    }}>
                      {s.name}{s.level ? ` · ${s.level}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cv?.educations && cv.educations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
                  <GraduationCap size={12} style={{ display: "inline", marginRight: 4 }} />Formation
                </div>
                {cv.educations.map((e, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{e.school}</div>
                    {e.degree && <div style={{ fontSize: 12, color: "#64748b" }}>{e.degree}{e.field ? ` — ${e.field}` : ""}</div>}
                    {(e.start_year || e.end_year) && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {e.start_year} {e.end_year ? `— ${e.end_year}` : "— Présent"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {cv?.experiences && cv.experiences.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
                  <Briefcase size={12} style={{ display: "inline", marginRight: 4 }} />Expériences
                </div>
                {cv.experiences.map((e, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{e.job_title}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{e.company}{e.location ? ` · ${e.location}` : ""}</div>
                    {(e.start_date || e.end_date) && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {e.start_date} {e.end_date ? `— ${e.end_date}` : "— Présent"}
                      </div>
                    )}
                    {e.description && <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{e.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Languages */}
            {cv?.languages && cv.languages.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8, letterSpacing: 1 }}>
                  <Languages size={12} style={{ display: "inline", marginRight: 4 }} />Langues
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cv.languages.map((l, i) => (
                    <span key={i} style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
                    }}>
                      {l.language}{l.level ? ` · ${l.level}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback if very little data */}
            {!cv?.description && !cv?.skills?.length && !cv?.educations?.length && !cv?.experiences?.length && (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0", fontSize: 13 }}>
                <User size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
                Les détails complets du CV ne sont pas disponibles via cette vue.<br />
                Le score affiché est calculé depuis les données du profil.
              </div>
            )}
          </div>
        )}

        <div className="conv-footer">
          <button className="conv-btn-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REJECT MODAL
   ══════════════════════════════════════════════════════════ */
function RejectModal({ app, onClose, onRejected }: { app: AppRow; onClose: () => void; onRejected: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) { toast.error("Please provide a reason for rejection."); return; }
    setSubmitting(true);
    try {
      await api.put(`applications/${app.id}/reject/`, { reason });
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
      style={{ zIndex: 1050 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="conv-popup"
        style={{
          maxWidth: 480,
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="conv-head">
          <div className="conv-head-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <XCircle size={22} />
          </div>
          <div>
            <h3>Reject Application</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Application #{app.id}</p>
          </div>
          {!done && <button className="conv-close" onClick={onClose}><X size={16} /></button>}
        </div>

        {done ? (
          <div className="conv-success">
            <div className="conv-success-icon" style={{ fontSize: 36 }}>❌</div>
            <h3>Application Rejected</h3>
            <p>The student and company have been notified with the reason provided.</p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              <div className="conv-summary">
                <div className="conv-summary-item"><span>Student</span><strong>{app.student_name}</strong></div>
                <div className="conv-summary-item"><span>Email</span><strong style={{ fontSize: 12 }}>{app.student_email}</strong></div>
                <div className="conv-summary-item"><span>Offer</span><strong>{app.offer_title}</strong></div>
                <div className="conv-summary-item"><span>Company</span><strong>{app.offer_company_name || "—"}</strong></div>
              </div>

              <div style={{
                background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10,
                padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", margin: "12px 0",
              }}>
                <AlertTriangle size={16} style={{ color: "#ea580c", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#7c2d12", lineHeight: 1.5 }}>
                  Rejecting will notify both the student and the company.
                  The application status will revert to <strong>pending</strong>.
                  Please provide a clear reason.
                </p>
              </div>

              <div style={{ marginTop: 4 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Reason for rejection <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. The student's CV is incomplete. Please add more skills and experience before reapplying."
                  rows={4}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box",
                    border: reason.trim() ? "1px solid #d1d5db" : "1px solid #fca5a5",
                    fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit",
                  }}
                />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{reason.length} characters</div>
              </div>
            </div>

            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14,
                  cursor: reason.trim() && !submitting ? "pointer" : "not-allowed",
                  background: reason.trim() ? "#dc2626" : "#fca5a5", color: "#fff",
                  display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s",
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
function ValidateModal({ app, onClose, onValidated }: { app: AppRow; onClose: () => void; onValidated: () => void }) {
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
      style={{ zIndex: 1050 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="conv-popup"
        style={{
          maxWidth: 440,
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="conv-head">
          <div className="conv-head-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <h3>Validate Internship</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Application #{app.id}</p>
          </div>
          {!done && <button className="conv-close" onClick={onClose}><X size={16} /></button>}
        </div>

        {done ? (
          <div className="conv-success">
            <div className="conv-success-icon">✅</div>
            <h3>Internship Validated!</h3>
            <p>The student and company have been notified. The convention PDF will be sent automatically.</p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              <div className="conv-summary">
                <div className="conv-summary-item"><span>Student</span><strong>{app.student_name}</strong></div>
                <div className="conv-summary-item"><span>Offer</span><strong>{app.offer_title}</strong></div>
                <div className="conv-summary-item"><span>Company</span><strong>{app.offer_company_name || "—"}</strong></div>
              </div>

              <div style={{
                background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
                padding: "12px 14px", display: "flex", gap: 10, marginTop: 12,
              }}>
                <CheckCircle size={16} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#14532d", lineHeight: 1.5 }}>
                  Validating marks the internship as <strong>validated</strong>,
                  auto-adds it to the student's CV, sends confirmation emails, and generates the final convention PDF.
                </p>
              </div>

              <div className="conv-chain" style={{ marginTop: 16 }}>
                <div className="conv-chain-step conv-chain-done">
                  <span className="conv-chain-dot">✓</span><span>Student signed</span>
                </div>
                <div className="conv-chain-line conv-chain-line-active" />
                <div className="conv-chain-step conv-chain-done">
                  <span className="conv-chain-dot">✓</span><span>Company signed</span>
                </div>
                <div className="conv-chain-line conv-chain-line-active" />
                <div className="conv-chain-step conv-chain-current">
                  <span className="conv-chain-dot conv-chain-pulse" /><span>Your validation</span>
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
   HELPERS
   ══════════════════════════════════════════════════════════ */
const statusBadgeClass = (s: string) => {
  if (s === "accepted")  return "as-accepted";
  if (s === "validated") return "as-validated";
  if (s === "refused")   return "as-refused";
  if (s === "rejected")  return "as-rejected";
  return "as-pending";
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function countByStatus(rows: AppRow[], s: string) {
  return rows.filter(r => r.status === s).length;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}%</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
const ADMApplicationsPage: React.FC = () => {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<AppRow | null>(null);
  const [validateTarget, setValidateTarget] = useState<AppRow | null>(null);
  const [cvTarget, setCVTarget] = useState<AppRow | null>(null);

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

        {/* HERO */}
        <div className="page-hero adm-applications-hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>Applications</h1>
            <p>Review and validate internship applications within your scope.</p>
          </div>
        </div>

        {/* STATS STRIP */}
        {!loading && (
          <div className="adm-app-stats">
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon total"><FileText size={18} /></div>
              <div>
                <div className="adm-app-stat-label">Total</div>
                <div className="adm-app-stat-val">{rows.length}</div>
              </div>
            </div>
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon accepted"><CheckSquare size={18} /></div>
              <div>
                <div className="adm-app-stat-label">Accepted</div>
                <div className="adm-app-stat-val">{countByStatus(rows, "accepted")}</div>
              </div>
            </div>
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon pending"><Clock size={18} /></div>
              <div>
                <div className="adm-app-stat-label">Pending</div>
                <div className="adm-app-stat-val">{countByStatus(rows, "pending")}</div>
              </div>
            </div>
            <div className="adm-app-stat">
              <div className="adm-app-stat-icon rejected"><XSquare size={18} /></div>
              <div>
                <div className="adm-app-stat-label">Rejected</div>
                <div className="adm-app-stat-val">{countByStatus(rows, "refused") + countByStatus(rows, "rejected")}</div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CARD */}
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
              <button type="button" className="adm-action-btn approve sm" onClick={() => void load()}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ padding: "28px 20px", color: "var(--sc-muted)", fontSize: 13 }}>Loading…</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Offer</th>
                    <th>Company</th>
                    <th>CV Score</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ minWidth: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="adm-student-cell">
                          <div className="adm-student-avatar">{initials(a.student_name)}</div>
                          <div>
                            <div className="fw-medium">{a.student_name}</div>
                            <div className="adm-cell-sub">{a.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{a.offer_title}</td>
                      <td className="fw-medium">{a.offer_company_name || "—"}</td>
                      <td>
                        {a.cv_score !== undefined
                          ? <ScoreBar score={a.cv_score} />
                          : <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td>
                        <span className={`app-status-badge ${statusBadgeClass(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="text-muted">
                        {a.application_date ? String(a.application_date).slice(0, 10) : "—"}
                      </td>
                      <td>
                        <div className="adm-actions" style={{ flexWrap: "wrap" }}>
                          {/* View CV — always available */}
                          <button
                            type="button"
                            className="adm-action-btn sm"
                            style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                            onClick={() => setCVTarget(a)}
                          >
                            <User size={13} /> CV
                          </button>

                          {/* Validate & Reject — only when accepted */}
                          {a.status === "accepted" && (
                            <>
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

        {/* MODALS */}
        {cvTarget && (
          <CVModal app={cvTarget} onClose={() => setCVTarget(null)} />
        )}

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