import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  CheckCircle, XCircle, RefreshCw, X, AlertTriangle,
  ArrowRight, FileText, Clock, CheckSquare, XSquare, User,
  GraduationCap, Briefcase, Globe, Mail, Star,
  Code2, Languages, BookOpen, ChevronRight,
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
  full_name: string;
  email: string;
  phone?: string;
  institution?: string;
  grade?: string;
  field?: string;
  speciality?: string;
  cv_score?: number;
  description?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  skills?: { id?: number; name: string; level?: string }[];
  educations?: { id?: number; school: string; degree?: string; field?: string; start_year?: number; end_year?: number }[];
  experiences?: { id?: number; job_title: string; company: string; location?: string; start_date?: string; end_date?: string; description?: string }[];
  languages?: { id?: number; language: string; level?: string }[];
}

function unwrapApps(res: { data: unknown }): AppRow[] {
  const body = res.data as { data?: AppRow[] };
  return body?.data ?? [];
}

/* ══════════════════════════════════════════════════════════
   CV PREVIEW MODAL — fetches full student profile
   ══════════════════════════════════════════════════════════ */
function CVModal({ app, onClose }: { app: AppRow; onClose: () => void }) {
  const [cv, setCV] = useState<StudentCV | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // First try to get the full student digital CV
        // The student_id comes from the app row; fetch via students endpoint
        let fullCV: StudentCV = {
          full_name: app.student_name,
          email: app.student_email,
          cv_score: app.cv_score,
        };

        // Try fetching the student's full profile via their digital CV
        // Endpoint: GET /api/users/students/{student_id}/cv/  or  /api/users/cv/{student_id}/
        // We try multiple possible endpoints
        if (app.student_id) {
          try {
            const cvRes = await api.get(`users/students/${app.student_id}/cv/`);
            const d = (cvRes.data as { data?: unknown })?.data ?? cvRes.data;
            fullCV = { ...fullCV, ...(d as Partial<StudentCV>) };
          } catch {
            // try alternate endpoint
            try {
              const cvRes2 = await api.get(`users/digital-cv/${app.student_id}/`);
              const d2 = (cvRes2.data as { data?: unknown })?.data ?? cvRes2.data;
              fullCV = { ...fullCV, ...(d2 as Partial<StudentCV>) };
            } catch {
              // fallback: use application detail which has some student info
              const appRes = await api.get(`applications/${app.id}/`);
              const d3 = (appRes.data as { data?: unknown })?.data ?? appRes.data;
              fullCV = { ...fullCV, ...(d3 as Partial<StudentCV>) };
            }
          }
        } else {
          // No student_id, fetch from application detail
          const appRes = await api.get(`applications/${app.id}/`);
          const d = (appRes.data as { data?: unknown })?.data ?? appRes.data;
          fullCV = { ...fullCV, ...(d as Partial<StudentCV>) };
        }

        setCV(fullCV);
      } catch {
        setCV({
          full_name: app.student_name,
          email: app.student_email,
          cv_score: app.cv_score,
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [app]);

  const score = cv?.cv_score ?? app.cv_score ?? 0;
  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 70 ? "Profil complet et solide" : score >= 40 ? "Profil à compléter" : "Profil incomplet";

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 640,
          maxHeight: "88vh", display: "flex", flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* ── Modal Header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0,
          }}>
            {app.student_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{app.student_name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{app.student_email}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
              padding: "8px 12px", cursor: "pointer", display: "flex",
              alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <X size={15} /> Fermer
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
              <div className="mi-spinner" style={{ margin: "0 auto 14px" }} />
              <p style={{ margin: 0 }}>Chargement du profil étudiant…</p>
            </div>
          ) : (
            <>
              {/* CV Score */}
              <div style={{
                background: `linear-gradient(135deg, ${scoreColor}12 0%, ${scoreColor}06 100%)`,
                border: `2px solid ${scoreColor}40`,
                borderRadius: 16, padding: "18px 22px", marginBottom: 24,
                display: "flex", alignItems: "center", gap: 18,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}cc)`,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 22, flexShrink: 0,
                  boxShadow: `0 4px 14px ${scoreColor}40`,
                }}>
                  {score}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 2 }}>Score CV</div>
                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>{scoreLabel}</div>
                  <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      width: `${score}%`, height: "100%",
                      background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}cc)`,
                      borderRadius: 4, transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      size={16}
                      fill={i <= Math.round(score / 20) ? scoreColor : "transparent"}
                      stroke={scoreColor}
                      style={{ display: "inline" }}
                    />
                  ))}
                </div>
              </div>

              {/* Personal Info */}
              <SectionTitle icon={<User size={14} />} label="Informations personnelles" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { icon: <Mail size={13} />,          label: "Email",          value: cv?.email },
                  { icon: <GraduationCap size={13} />, label: "Établissement",  value: cv?.institution },
                  { icon: <BookOpen size={13} />,      label: "Niveau",         value: cv?.grade },
                  { icon: <Briefcase size={13} />,     label: "Filière",        value: cv?.field },
                  { icon: <ChevronRight size={13} />,  label: "Spécialité",     value: cv?.speciality },
                ].filter(i => i.value).map((item, idx) => (
                  <InfoCard key={idx} icon={item.icon} label={item.label} value={item.value!} />
                ))}
              </div>

              {/* Links */}
              {(cv?.github || cv?.linkedin || cv?.portfolio) && (
                <>
                  <SectionTitle icon={<Globe size={14} />} label="Liens" />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {cv?.github && <LinkPill href={cv.github} label="GitHub" />}
                    {cv?.linkedin && <LinkPill href={cv.linkedin} label="LinkedIn" />}
                    {cv?.portfolio && <LinkPill href={cv.portfolio} label="Portfolio" />}
                  </div>
                </>
              )}

              {/* Description */}
              {cv?.description && (
                <>
                  <SectionTitle icon={<FileText size={14} />} label="À propos" />
                  <div style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12,
                    padding: "14px 16px", fontSize: 13, color: "#475569",
                    lineHeight: 1.7, marginBottom: 20,
                  }}>
                    {cv.description}
                  </div>
                </>
              )}

              {/* Skills */}
              {cv?.skills && cv.skills.length > 0 && (
                <>
                  <SectionTitle icon={<Code2 size={14} />} label="Compétences" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    {cv.skills.map((s, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                      }}>
                        {s.name}{s.level ? <span style={{ opacity: 0.7, fontWeight: 400 }}> · {s.level}</span> : ""}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Education */}
              {cv?.educations && cv.educations.length > 0 && (
                <>
                  <SectionTitle icon={<GraduationCap size={14} />} label="Formation" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {cv.educations.map((e, i) => (
                      <TimelineCard
                        key={i}
                        title={e.school}
                        subtitle={e.degree ? `${e.degree}${e.field ? ` — ${e.field}` : ""}` : e.field}
                        period={e.start_year ? `${e.start_year}${e.end_year ? ` — ${e.end_year}` : " — Présent"}` : undefined}
                        color="#6366f1"
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Experience */}
              {cv?.experiences && cv.experiences.length > 0 && (
                <>
                  <SectionTitle icon={<Briefcase size={14} />} label="Expériences" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {cv.experiences.map((e, i) => (
                      <TimelineCard
                        key={i}
                        title={e.job_title}
                        subtitle={`${e.company}${e.location ? ` · ${e.location}` : ""}`}
                        period={e.start_date ? `${e.start_date}${e.end_date ? ` — ${e.end_date}` : " — Présent"}` : undefined}
                        description={e.description}
                        color="#f59e0b"
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Languages */}
              {cv?.languages && cv.languages.length > 0 && (
                <>
                  <SectionTitle icon={<Languages size={14} />} label="Langues" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {cv.languages.map((l, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
                      }}>
                        {l.language}{l.level ? <span style={{ opacity: 0.7, fontWeight: 400 }}> · {l.level}</span> : ""}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Fallback if no detailed data */}
              {!cv?.description && !cv?.skills?.length && !cv?.educations?.length && !cv?.experiences?.length && (
                <div style={{
                  textAlign: "center", color: "#94a3b8", padding: "32px 0", fontSize: 13,
                  background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0",
                }}>
                  <User size={36} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    Les détails complets du CV ne sont pas disponibles pour cet étudiant.<br />
                    Le score de <strong style={{ color: scoreColor }}>{score}/100</strong> est calculé depuis les données du profil.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small sub-components for the CV modal ── */
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
      color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 10,
    }}>
      {icon} {label}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #f1f5f9", borderRadius: 10,
      padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <span style={{ color: "#3b82f6", flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 600, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href} target="_blank" rel="noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: "#fff", border: "1px solid #e2e8f0", color: "#3b82f6",
        textDecoration: "none", transition: "all 0.15s",
      }}
    >
      <Globe size={13} /> {label}
    </a>
  );
}

function TimelineCard({
  title, subtitle, period, description, color,
}: {
  title: string; subtitle?: string; period?: string; description?: string; color: string;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12,
      padding: "12px 16px", borderLeft: `3px solid ${color}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{subtitle}</div>}
      {period && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{period}</div>}
      {description && (
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.6 }}>{description}</div>
      )}
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
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="conv-popup"
        style={{ maxWidth: 480, width: "100%", position: "relative" }}
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
                  Rejecting will notify both the student and the company. Please provide a clear reason.
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
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="conv-popup"
        style={{ maxWidth: 440, width: "100%", position: "relative" }}
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
  if (s === "refused" || s === "rejected") return "as-refused";
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
      <div style={{ width: 52, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
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
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
              <div className="mi-spinner" style={{ margin: "0 auto 14px" }} />
              <p style={{ margin: 0, fontSize: 13 }}>Loading applications…</p>
            </div>
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
                    <th style={{ minWidth: 240 }}>Actions</th>
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
                        <div className="adm-actions" style={{ flexWrap: "wrap", gap: 6 }}>
                          {/* View CV — always available */}
                          <button
                            type="button"
                            className="adm-action-btn sm"
                            style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", gap: 5 }}
                            onClick={() => setCVTarget(a)}
                          >
                            <User size={13} /> Voir CV
                          </button>

                          {/* Validate & Reject — only when accepted */}
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
                <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                  <FileText size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>No applications in your scope.</p>
                </div>
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