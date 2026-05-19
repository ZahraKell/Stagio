import React, { useState, useMemo, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Eye, Clock, CheckCircle2, XCircle,
  AlertCircle, Building2, MapPin, Calendar, ChevronRight, X,
  Briefcase, Upload, FileCheck, Award, PenLine,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */
type AppStatus = "pending" | "review" | "accepted" | "rejected" | "validated";

interface Application {
  id: number;
  title: string;
  company: string;
  logo: string;
  wilaya: string;
  appliedDate: string;
  status: AppStatus;
  stage_state: string;
  attestation_issued: boolean;
  report_submitted: boolean;
  report_validated: boolean;
}

interface ConventionRow {
  id: number;
  status: string;
  application_id: number;
  student_signed: boolean;
  company_signed: boolean;
  admin_validated: boolean;
  offer_title?: string;
  company_name?: string;
  report_submitted: boolean;
  report_validated: boolean;
  attestation_issued: boolean;
}

type ApiMyApplicationRow = {
  id: number;
  offer: number;
  offer_title?: string | null;
  offer_location?: string | null;
  offer_company_name?: string | null;
  status?: string;
  application_date?: string | null;
  stage_state?: string | null;
  attestation_issued_at?: string | null;
  report_submitted_at?: string | null;
  report_validated_at?: string | null;
};

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[1][0] ?? ""}`.toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function mapBackendStatus(backend: string): AppStatus {
  if (backend === "reviewed") return "review";
  if (backend === "refused") return "rejected";
  if (backend === "accepted") return "accepted";
  if (backend === "validated") return "validated";
  return "pending";
}

function mapRow(row: ApiMyApplicationRow): Application {
  const company = row.offer_company_name || "Company";
  const appliedIso = row.application_date ?? new Date().toISOString();
  return {
    id: row.id,
    title: row.offer_title || `Offer #${row.offer}`,
    company,
    logo: initials(company),
    wilaya: row.offer_location || "—",
    appliedDate: formatDate(appliedIso),
    status: mapBackendStatus(row.status ?? "pending"),
    stage_state: row.stage_state ?? "",
    attestation_issued: !!row.attestation_issued_at,
    report_submitted: !!row.report_submitted_at,
    report_validated: !!row.report_validated_at,
  };
}

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG
   ══════════════════════════════════════════════════════════ */
const statusConfig: Record<AppStatus, {
  label: string; badgeClass: string; icon: React.ReactNode; color: string;
}> = {
  pending:   { label: "Pending",   badgeClass: "sc-badge-pending",   icon: <Clock size={14} />,        color: "var(--sc-warn)" },
  review:    { label: "In Review", badgeClass: "sc-badge-review",    icon: <AlertCircle size={14} />,   color: "var(--sc-purple)" },
  accepted:  { label: "Accepted",  badgeClass: "sc-badge-accepted",  icon: <CheckCircle2 size={14} />,  color: "var(--sc-green)" },
  validated: { label: "Validated", badgeClass: "sc-badge-validated", icon: <CheckCircle2 size={14} />,  color: "var(--sc-blue)" },
  rejected:  { label: "Rejected",  badgeClass: "sc-badge-rejected",  icon: <XCircle size={14} />,       color: "var(--sc-red)" },
};

const tabs: { key: AppStatus | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "review",    label: "In Review" },
  { key: "accepted",  label: "Accepted" },
  { key: "validated", label: "Validated" },
  { key: "rejected",  label: "Rejected" },
];

/* ── build timeline from real state ── */
function buildTimeline(app: Application, conv: ConventionRow | undefined) {
  const conventionFullySigned = !!conv && conv.student_signed && conv.company_signed && conv.admin_validated;
  return [
    { label: "Application submitted",  date: app.appliedDate, done: true },
    { label: "Under review",           date: "—", done: app.status === "review" || app.status === "accepted" || app.status === "validated" },
    { label: app.status === "rejected" ? "Not selected" : "Accepted", date: "—", done: app.status === "accepted" || app.status === "validated" || app.status === "rejected" },
    { label: "Convention signed",      date: "—", done: conventionFullySigned },
    { label: "Report submitted",       date: "—", done: app.report_submitted },
    { label: "Report validated",       date: "—", done: app.report_validated },
    { label: "Attestation issued",     date: "—", done: app.attestation_issued },
  ];
}

/* ══════════════════════════════════════════════════════════
   CONVENTION SIGN POPUP  (student)
   ══════════════════════════════════════════════════════════ */
function ConventionPopup({ conventionId, offerTitle, companyName, onClose, onSigned }: {
  conventionId: number; offerTitle: string; companyName: string;
  onClose: () => void; onSigned: () => void;
}) {
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSign = async () => {
    if (!agreed) return;
    setSigning(true); setError("");
    try {
      await api.post(`conventions/${conventionId}/sign/`, {});
      setDone(true);
      setTimeout(onSigned, 1800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Erreur lors de la signature.");
      setSigning(false);
    }
  };

  return (
    <div className="conv-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="conv-popup">
        <div className="conv-head">
          <div className="conv-head-icon">📋</div>
          <div><h3>Convention de Stage</h3><p>CONV-{String(conventionId).padStart(4, "0")}</p></div>
          {!done && <button className="conv-close" onClick={onClose}>✕</button>}
        </div>
        {done ? (
          <div className="conv-success">
            <div className="conv-success-icon">✅</div>
            <h3>Convention signée !</h3>
            <p>Votre signature a été enregistrée. L'entreprise recevra une notification pour signer à son tour.</p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              <div className="conv-summary">
                <div className="conv-summary-item"><span>Entreprise</span><strong>{companyName}</strong></div>
                <div className="conv-summary-item"><span>Poste</span><strong>{offerTitle}</strong></div>
                <div className="conv-summary-item"><span>Réf.</span><strong>CONV-{String(conventionId).padStart(4, "0")}</strong></div>
              </div>
              <div className="conv-explainer">
                <div className="conv-explainer-icon">ℹ️</div>
                <p>En signant cette convention, vous confirmez votre accord pour effectuer le stage <strong>« {offerTitle} »</strong> chez <strong>{companyName}</strong>.</p>
              </div>
              <div className="conv-chain">
                <div className="conv-chain-step conv-chain-current">
                  <span className="conv-chain-dot conv-chain-pulse" /><span>Votre signature</span>
                </div>
                <div className="conv-chain-line" />
                <div className="conv-chain-step conv-chain-waiting">
                  <span className="conv-chain-dot conv-chain-empty" /><span>Signature entreprise</span>
                </div>
                <div className="conv-chain-line" />
                <div className="conv-chain-step conv-chain-waiting">
                  <span className="conv-chain-dot conv-chain-empty" /><span>Validation admin</span>
                </div>
              </div>
              <label className="conv-agree">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span className="conv-check-box" />
                <span>Je certifie avoir lu la convention et j'accepte ses termes.</span>
              </label>
              {error && <div className="conv-error">{error}</div>}
            </div>
            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>Plus tard</button>
              <button
                className={`conv-btn-sign ${agreed ? "conv-btn-sign-ready" : ""}`}
                disabled={!agreed || signing}
                onClick={() => void handleSign()}
              >
                {signing ? "Signature en cours…" : agreed ? "✍️  Je signe la convention" : "Cochez la case pour signer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONVENTION PREVIEW  (inline iframe popup — centered)
   ══════════════════════════════════════════════════════════ */
function ConventionPreviewPopup({ conventionId, onClose }: { conventionId: number; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string;
    api.get(`conventions/${conventionId}/download/`, { responseType: "blob" })
      .then(res => {
        const blob = new Blob([res.data], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => toast.error("Impossible de charger la convention."))
      .finally(() => setLoading(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [conventionId]);

  return (
    <div
      className="conv-overlay"
      style={{ alignItems: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="conv-popup" style={{ maxWidth: 720, borderRadius: 16, maxHeight: "88vh" }}>
        <div className="conv-head" style={{ paddingBottom: 12 }}>
          <div className="conv-head-icon">📄</div>
          <div><h3>Convention de Stage</h3><p>CONV-{String(conventionId).padStart(4, "0")}</p></div>
          <button className="conv-close" onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "var(--sc-muted)", gap: 10 }}>
              <div className="mi-spinner" /> Chargement du PDF…
            </div>
          ) : pdfUrl ? (
            <>
              <iframe src={pdfUrl} width="100%" height="460" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }} title="Convention PDF" />
              <a href={pdfUrl} download={`convention_${conventionId}.pdf`} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, color: "var(--sc-blue)", textDecoration: "underline" }}>
                <Download size={14} /> Télécharger le PDF
              </a>
            </>
          ) : (
            <p style={{ color: "var(--sc-red)", textAlign: "center", padding: 40 }}>Erreur de chargement du PDF.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT UPLOAD SECTION  (inside modal)
   ══════════════════════════════════════════════════════════ */
function ReportSection({ appId, onRefresh }: { appId: number; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("report_file", file);
      await api.post(`applications/${appId}/submit-report/`, form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Rapport soumis avec succès !");
      onRefresh();
    } catch {
      toast.error("Échec de l'envoi du rapport.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input type="file" accept=".pdf,.doc,.docx" ref={fileRef} style={{ display: "none" }} onChange={handleUpload} />
      <button
        className="sc-btn-primary off-apply-full"
        style={{ background: "#8b5cf6", gap: 8 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <Upload size={15} /> {uploading ? "Envoi en cours…" : "Soumettre le rapport de stage"}
      </button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PHYSICAL CONVENTION UPLOAD  (student uploads scanned PDF)
   ══════════════════════════════════════════════════════════ */
function PhysicalConventionUpload({ appId, onRefresh }: { appId: number; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("convention_file", file);
      await api.post(`applications/${appId}/upload-convention/`, form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Convention téléversée avec succès !");
      onRefresh();
    } catch {
      toast.error("Échec du téléversement de la convention.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input type="file" accept=".pdf" ref={fileRef} style={{ display: "none" }} onChange={handleUpload} />
      <button
        className="sc-btn-primary off-apply-full"
        style={{ background: "#0ea5e9", gap: 8 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <Upload size={15} /> {uploading ? "Téléversement…" : "Téléverser convention signée (PDF)"}
      </button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   ATTESTATION DOWNLOAD BUTTON
   ══════════════════════════════════════════════════════════ */
function AttestationDownload({ appId }: { appId: number }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.get(`applications/${appId}/attestation/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attestation_${appId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de télécharger l'attestation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="sc-btn-primary off-apply-full"
      style={{ background: "#22c55e", gap: 8 }}
      onClick={handleDownload}
      disabled={loading}
    >
      <Award size={15} /> {loading ? "Téléchargement…" : "🏅 Télécharger l'attestation de stage"}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   WORKFLOW STAGE LOGIC
   ══════════════════════════════════════════════════════════ */
/*
  Stages in order:
  1. pending / review / rejected  → "pending"       → [View]
  2. accepted, no conv yet        → "pending"       → [View]
  3. accepted, student not signed → "sign_convention" → [Sign Convention] [View]
  4. student signed, awaiting co+admin sigs → "awaiting_signatures" → [Awaiting…] [View]
  5. convention fully validated, no report  → "upload_report" → [View Convention] [Upload Report from device] [Upload Report]
  6. report submitted, pending validation   → "report_pending" → [View Convention] [Report under review…]
  7. report validated, no attestation       → "report_validated" → [View Convention] [Attestation pending…]
  8. attestation issued                     → "completed" → [View Convention] [Download Attestation]
*/
type ButtonSet =
  | "pending"
  | "sign_convention"
  | "awaiting_signatures"
  | "upload_report"
  | "report_pending"
  | "report_validated"
  | "completed";

function getButtonSet(app: Application, conv: ConventionRow | undefined): ButtonSet {
  if (
    app.status === "pending" ||
    app.status === "review" ||
    app.status === "rejected"
  ) return "pending";

  if (app.status === "accepted" || app.status === "validated") {
    if (!conv) return "pending"; // convention not yet generated

    const conventionFullySigned =
      conv.student_signed && conv.company_signed && conv.admin_validated;

    // Convention signing stages
    if (!conv.student_signed) return "sign_convention";
    if (!conventionFullySigned) return "awaiting_signatures";

    // Post-convention stages
    if (!app.report_submitted) return "upload_report";
    if (!app.report_validated) return "report_pending";
    if (app.attestation_issued) return "completed";
    return "report_validated";
  }

  return "pending";
}

/* ══════════════════════════════════════════════════════════
   CONVENTION DOWNLOAD HELPER
   ══════════════════════════════════════════════════════════ */
async function downloadConvention(convId: number) {
  const response = await api.get(`conventions/${convId}/download/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `convention_${convId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [conventions, setConventions] = useState<ConventionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppStatus | "all">("all");
  const [modal, setModal] = useState<Application | null>(null);
  const [signTarget, setSignTarget] = useState<{ app: Application; conv: ConventionRow } | null>(null);
  const [previewConvId, setPreviewConvId] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ error?: boolean; data?: ApiMyApplicationRow[] }>("applications/my-applications/");
      const rows = res.data?.error ? [] : (res.data?.data ?? []);
      setApplications(rows.map(mapRow));
    } catch {
      toast.error("Impossible de charger les candidatures.");
    }
    try {
      const cRes = await api.get<{ error?: boolean; data?: ConventionRow[] }>("conventions/mine/");
      setConventions(cRes.data?.error ? [] : (cRes.data?.data ?? []));
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => { void loadAll(); }, []);

  const filtered = useMemo(
    () => activeTab === "all" ? applications : applications.filter(a => a.status === activeTab),
    [activeTab, applications],
  );

  const counts = useMemo(() => ({
    all:       applications.length,
    pending:   applications.filter(a => a.status === "pending").length,
    review:    applications.filter(a => a.status === "review").length,
    accepted:  applications.filter(a => a.status === "accepted").length,
    validated: applications.filter(a => a.status === "validated").length,
    rejected:  applications.filter(a => a.status === "rejected").length,
  }), [applications]);

  const handleSigned = async () => {
    setSignTarget(null);
    await loadAll();
    toast.success("Convention signée !");
  };

  const modalConv = modal ? conventions.find(c => c.application_id === modal.id) : undefined;

  /* ── Row action buttons ── */
  const renderRowActions = (app: Application) => {
    const conv = conventions.find(c => c.application_id === app.id);
    const set  = getButtonSet(app, conv);

    return (
      <div className="app-row-actions">

        {/* STAGE 1-2: pending / review / rejected / no conv yet */}
        {set === "pending" && (
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={14} /> View <ChevronRight size={13} />
          </button>
        )}

        {/* STAGE 3: needs student signature */}
        {set === "sign_convention" && conv && (
          <>
            <button
              className="sc-btn-download"
              style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
              onClick={() => setSignTarget({ app, conv })}
            >
              <PenLine size={13} /> Sign Convention
            </button>
            <button className="app-view-btn" onClick={() => setModal(app)}>
              <Eye size={14} /> View <ChevronRight size={13} />
            </button>
          </>
        )}

        {/* STAGE 4: awaiting company / admin signatures */}
        {set === "awaiting_signatures" && (
          <>
            <span style={{ fontSize: 12, color: "var(--sc-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={13} /> Awaiting signatures…
            </span>
            <button className="app-view-btn" onClick={() => setModal(app)}>
              <Eye size={14} /> View <ChevronRight size={13} />
            </button>
          </>
        )}

        {/* STAGE 5: upload report */}
        {set === "upload_report" && conv && (
          <>
            <button
              className="sc-btn-download"
              style={{ background: "#f3e8ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}
              onClick={() => setModal(app)}
            >
              <Upload size={13} /> Upload Report
            </button>
            <button className="app-view-btn" onClick={() => setPreviewConvId(conv.id)}>
              <Eye size={14} /> Convention <ChevronRight size={13} />
            </button>
          </>
        )}

        {/* STAGE 6: report under review */}
        {set === "report_pending" && conv && (
          <>
            <span style={{ fontSize: 12, color: "#d97706", display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={13} /> Report under review…
            </span>
            <button className="app-view-btn" onClick={() => setPreviewConvId(conv.id)}>
              <Eye size={14} /> Convention <ChevronRight size={13} />
            </button>
          </>
        )}

        {/* STAGE 7: report validated, waiting attestation */}
        {set === "report_validated" && conv && (
          <>
            <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 5 }}>
              <FileCheck size={13} /> Attestation pending…
            </span>
            <button className="app-view-btn" onClick={() => setPreviewConvId(conv.id)}>
              <Eye size={14} /> Convention <ChevronRight size={13} />
            </button>
          </>
        )}

        {/* STAGE 8: completed — attestation + convention */}
        {set === "completed" && conv && (
          <>
            <button
              className="sc-btn-download"
              style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" }}
              onClick={() => setModal(app)}
            >
              <Award size={13} /> Attestation
            </button>
            <button className="app-view-btn" onClick={() => setPreviewConvId(conv.id)}>
              <Eye size={14} /> Convention <ChevronRight size={13} />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout pageTitle="My Applications">

      {/* HERO */}
      <div className="page-hero applications-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>My Applications</h1>
          <p>Track every application, sign conventions, submit reports and download your attestation</p>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="app-stat-strip">
        {[
          { label: "Total",     value: counts.all,       color: "var(--sc-blue)" },
          { label: "Pending",   value: counts.pending,   color: "var(--sc-warn)" },
          { label: "In Review", value: counts.review,    color: "var(--sc-purple)" },
          { label: "Accepted",  value: counts.accepted,  color: "var(--sc-green)" },
          { label: "Validated", value: counts.validated, color: "var(--sc-blue)" },
          { label: "Rejected",  value: counts.rejected,  color: "var(--sc-red)" },
        ].map(s => (
          <div className="app-stat-item" key={s.label}>
            <span className="app-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="app-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="app-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`app-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
            <span className="app-tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="mi-loading"><div className="mi-spinner" /><p>Chargement des candidatures…</p></div>
      )}

      {/* LIST */}
      {!loading && (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div className="mi-empty" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="mi-empty-icon"><Briefcase size={40} strokeWidth={1.5} /></span>
              <h3>Aucune candidature trouvée</h3>
              <p>{activeTab === "all" ? "Vous n'avez pas encore postulé à des offres." : "Aucune candidature dans cette catégorie."}</p>
            </motion.div>
          ) : (
            <div className="app-list" key="list">
              {filtered.map((app, i) => {
                const cfg = statusConfig[app.status];
                return (
                  <motion.div
                    key={app.id}
                    className="app-row"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22, delay: i * 0.05 }}
                  >
                    <div className="app-row-bar" style={{ background: cfg.color }} />
                    <div className="sc-offer-logo app-logo">{app.logo}</div>
                    <div className="app-row-info">
                      <div className="app-row-top">
                        <h4>{app.title}</h4>
                        <span className={`sc-badge ${cfg.badgeClass}`}>{cfg.icon} {cfg.label}</span>
                      </div>
                      <div className="app-row-meta">
                        <span><Building2 size={12} />{app.company}</span>
                        <span><MapPin size={12} />{app.wilaya}</span>
                        <span><Calendar size={12} />Applied {app.appliedDate}</span>
                      </div>
                    </div>
                    {renderRowActions(app)}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* ── DETAIL MODAL (centered) ── */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              className="off-modal-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
            />
            <motion.div
              className="off-modal app-modal"
              style={{
                /* Force centered positioning regardless of CSS class defaults */
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxHeight: "85vh",
                overflowY: "auto",
                zIndex: 1000,
              }}
              initial={{ opacity: 0, scale: 0.93, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="off-modal-header">
                <div className="sc-offer-logo off-modal-logo">{modal.logo}</div>
                <div className="off-modal-title">
                  <h2>{modal.title}</h2>
                  <span>{modal.company} · {modal.wilaya}</span>
                </div>
                <button className="off-modal-close" onClick={() => setModal(null)}><X size={20} /></button>
              </div>

              {/* Badges */}
              <div className="off-modal-badges">
                <span className={`sc-badge ${statusConfig[modal.status].badgeClass}`}>
                  {statusConfig[modal.status].icon} {statusConfig[modal.status].label}
                </span>
                <span className="off-mpill"><Calendar size={12} />Applied {modal.appliedDate}</span>
              </div>

              {/* Timeline */}
              <div className="off-modal-section">
                <h3>Application Timeline</h3>
                <div className="app-timeline">
                  {buildTimeline(modal, modalConv).map((ev, idx, arr) => (
                    <div key={idx} className={`app-tl-step ${ev.done ? "done" : "todo"}`}>
                      <div className="app-tl-dot">
                        {ev.done ? <CheckCircle2 size={16} /> : <div className="app-tl-empty-dot" />}
                      </div>
                      {idx < arr.length - 1 && <div className={`app-tl-line ${ev.done ? "done" : ""}`} />}
                      <div className="app-tl-content">
                        <span className="app-tl-label">{ev.label}</span>
                        <span className="app-tl-date">{ev.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="off-modal-section">
                <h3>Details</h3>
                <div className="off-modal-details">
                  <div className="off-mdetail"><span>Applied on</span><strong>{modal.appliedDate}</strong></div>
                  <div className="off-mdetail"><span>Company</span><strong>{modal.company}</strong></div>
                  <div className="off-mdetail"><span>Location</span><strong>{modal.wilaya}</strong></div>
                  <div className="off-mdetail"><span>Status</span><strong>{statusConfig[modal.status].label}</strong></div>
                </div>
              </div>

              {/* CTA */}
              <div className="off-modal-cta">
                <ModalCTA
                  app={modal}
                  conv={modalConv}
                  onSign={() => { if (modalConv) { setSignTarget({ app: modal, conv: modalConv }); setModal(null); } }}
                  onPreviewConvention={() => { if (modalConv) { setPreviewConvId(modalConv.id); setModal(null); } }}
                  onDownloadConvention={async () => {
                    if (modalConv) {
                      try { await downloadConvention(modalConv.id); }
                      catch { toast.error("Impossible de télécharger la convention."); }
                    }
                  }}
                  onRefresh={() => { setModal(null); void loadAll(); }}
                />
                <button className="sc-btn-outline" onClick={() => setModal(null)}>Close</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Convention Sign Popup */}
      {signTarget && (
        <ConventionPopup
          conventionId={signTarget.conv.id}
          offerTitle={signTarget.app.title}
          companyName={signTarget.app.company}
          onClose={() => setSignTarget(null)}
          onSigned={() => void handleSigned()}
        />
      )}

      {/* Convention Preview Popup */}
      {previewConvId !== null && (
        <ConventionPreviewPopup conventionId={previewConvId} onClose={() => setPreviewConvId(null)} />
      )}
    </DashboardLayout>
  );
};

/* ══════════════════════════════════════════════════════════
   MODAL CTA — full workflow actions inside the detail modal
   ══════════════════════════════════════════════════════════ */
function ModalCTA({ app, conv, onSign, onPreviewConvention, onDownloadConvention, onRefresh }: {
  app: Application;
  conv: ConventionRow | undefined;
  onSign: () => void;
  onPreviewConvention: () => void;
  onDownloadConvention: () => void;
  onRefresh: () => void;
}) {
  const set = getButtonSet(app, conv);

  /* STAGE 1-2: PENDING / REVIEW / REJECTED */
  if (set === "pending") {
    return (
      <div className="app-no-convention">
        <FileText size={16} />
        {app.status === "accepted"
          ? "Convention is being prepared…"
          : app.status === "rejected"
          ? "Application not selected"
          : "Convention available once accepted"}
      </div>
    );
  }

  /* STAGE 3: SIGN CONVENTION */
  if (set === "sign_convention" && conv) {
    return (
      <button className="sc-btn-primary off-apply-full" onClick={onSign} style={{ gap: 8 }}>
        <PenLine size={16} /> ✍️ Signer la convention
      </button>
    );
  }

  /* STAGE 4: AWAITING COMPANY / ADMIN SIGNATURES */
  if (set === "awaiting_signatures") {
    return (
      <div className="app-no-convention" style={{ background: "#fef9c3", borderColor: "#fde68a", color: "#92400e" }}>
        <Clock size={16} /> Convention en attente de signature(s) restante(s)…
      </div>
    );
  }

  /* STAGE 5: UPLOAD REPORT
     Buttons: View convention | Download convention | Upload physical convention | Upload report */
  if (set === "upload_report" && conv) {
    return (
      <>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#3b82f6", gap: 8 }}
          onClick={onPreviewConvention}
        >
          <Eye size={16} /> Voir la convention
        </button>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#1d4ed8", gap: 8 }}
          onClick={onDownloadConvention}
        >
          <Download size={16} /> Télécharger la convention
        </button>
        {/* Physical convention upload (scanned signed copy) */}
        <PhysicalConventionUpload appId={app.id} onRefresh={onRefresh} />
        {/* Internship report upload */}
        <ReportSection appId={app.id} onRefresh={onRefresh} />
      </>
    );
  }

  /* STAGE 6: REPORT SUBMITTED — PENDING COMPANY VALIDATION */
  if (set === "report_pending" && conv) {
    return (
      <>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#3b82f6", gap: 8 }}
          onClick={onPreviewConvention}
        >
          <Eye size={16} /> Voir la convention
        </button>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#1d4ed8", gap: 8 }}
          onClick={onDownloadConvention}
        >
          <Download size={16} /> Télécharger la convention
        </button>
        <div className="app-no-convention" style={{ background: "#fef3c7", borderColor: "#fde68a", color: "#92400e" }}>
          <FileCheck size={16} /> Rapport soumis — en attente de validation par l'entreprise
        </div>
      </>
    );
  }

  /* STAGE 7: REPORT VALIDATED — WAITING FOR ATTESTATION */
  if (set === "report_validated" && conv) {
    return (
      <>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#3b82f6", gap: 8 }}
          onClick={onPreviewConvention}
        >
          <Eye size={16} /> Voir la convention
        </button>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#1d4ed8", gap: 8 }}
          onClick={onDownloadConvention}
        >
          <Download size={16} /> Télécharger la convention
        </button>
        <div className="app-no-convention" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#065f46" }}>
          <Award size={16} /> Rapport validé — attestation en cours de préparation par l'administration
        </div>
      </>
    );
  }

  /* STAGE 8: COMPLETED — attestation + convention */
  if (set === "completed" && conv) {
    return (
      <>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#3b82f6", gap: 8 }}
          onClick={onPreviewConvention}
        >
          <Eye size={16} /> Voir la convention
        </button>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#1d4ed8", gap: 8 }}
          onClick={onDownloadConvention}
        >
          <Download size={16} /> Télécharger la convention
        </button>
        <AttestationDownload appId={app.id} />
      </>
    );
  }

  return null;
}

export default ApplicationsPage;