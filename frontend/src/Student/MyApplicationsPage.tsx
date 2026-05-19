import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Eye, Clock, CheckCircle2, XCircle,
  AlertCircle, Building2, MapPin, Calendar, ChevronRight,
  X, Briefcase, Upload, Award, ScrollText,
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
  };
}

/* ══════════════════════════════════════════════════════════
   WORKFLOW STATE HELPERS
   Determines which buttons to show based on the full state
   ══════════════════════════════════════════════════════════ */

/** Step 3: App accepted, convention exists, student hasn't signed yet */
function needsStudentSignature(app: Application, conv: ConventionRow | undefined): boolean {
  return app.status === "accepted" && !!conv && !conv.student_signed;
}

/** Step 4: Student signed, waiting for company */
function waitingForCompany(app: Application, conv: ConventionRow | undefined): boolean {
  return app.status === "accepted" && !!conv && conv.student_signed && !conv.company_signed;
}

/** Step 5: Company signed, waiting for admin */
function waitingForAdmin(app: Application, conv: ConventionRow | undefined): boolean {
  return app.status === "accepted" && !!conv && conv.student_signed && conv.company_signed && !conv.admin_validated;
}

/** Step 6a: Convention validated, internship in progress, no report yet */
function conventionValidated(app: Application, conv: ConventionRow | undefined): boolean {
  return conv?.admin_validated === true &&
    !["report_to_validate", "report_validated", "completed"].includes(app.stage_state) &&
    !app.attestation_issued;
}

/** Step 6b: Report uploaded, waiting for validation */
function reportUploaded(app: Application): boolean {
  return app.stage_state === "report_to_validate" || app.stage_state === "report_validated";
}

/** Step 7: Attestation issued — internship fully complete */
function attestationIssued(app: Application): boolean {
  return app.attestation_issued || app.stage_state === "completed";
}

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG
   ══════════════════════════════════════════════════════════ */
const statusConfig: Record<AppStatus, { label: string; badgeClass: string; icon: React.ReactNode; color: string }> = {
  pending:   { label: "Pending",    badgeClass: "sc-badge-pending",   icon: <Clock size={14} />,        color: "var(--sc-warn)" },
  review:    { label: "In Review",  badgeClass: "sc-badge-review",    icon: <AlertCircle size={14} />,  color: "var(--sc-purple)" },
  accepted:  { label: "Accepted",   badgeClass: "sc-badge-accepted",  icon: <CheckCircle2 size={14} />, color: "var(--sc-green)" },
  validated: { label: "Validated",  badgeClass: "sc-badge-validated", icon: <CheckCircle2 size={14} />, color: "var(--sc-blue)" },
  rejected:  { label: "Rejected",   badgeClass: "sc-badge-rejected",  icon: <XCircle size={14} />,      color: "var(--sc-red)" },
};

const tabs: { key: AppStatus | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "review",    label: "In Review" },
  { key: "accepted",  label: "Accepted" },
  { key: "validated", label: "Validated" },
  { key: "rejected",  label: "Rejected" },
];

/* ══════════════════════════════════════════════════════════
   TIMELINE
   ══════════════════════════════════════════════════════════ */
function buildTimeline(app: Application, conv: ConventionRow | undefined) {
  return [
    { label: "Application submitted",          date: app.appliedDate, done: true },
    { label: "Under review",                   date: "—", done: ["review","accepted","validated"].includes(app.status) },
    { label: app.status === "rejected" ? "Not selected" : "Accepted", date: "—", done: ["accepted","validated"].includes(app.status) || app.status === "rejected" },
    { label: "Student signed convention",      date: "—", done: !!conv?.student_signed },
    { label: "Company signed convention",      date: "—", done: !!conv?.company_signed },
    { label: "Administration validated",       date: "—", done: !!conv?.admin_validated },
    { label: "Report submitted",               date: "—", done: ["report_to_validate","report_validated","completed"].includes(app.stage_state) },
    { label: "Attestation issued",             date: "—", done: app.attestation_issued || app.stage_state === "completed" },
  ];
}

/* ══════════════════════════════════════════════════════════
   REPORT UPLOAD BUTTON
   ══════════════════════════════════════════════════════════ */
function ReportSection({ appId, onRefresh }: { appId: number; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("report_file", file);
      await api.post(`applications/${appId}/submit-report/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
        style={{ background: "#8b5cf6" }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <Upload size={16} /> {uploading ? "Envoi en cours…" : "Soumettre le rapport de stage"}
      </button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   CONVENTION SIGNING POPUP
   ══════════════════════════════════════════════════════════ */
function ConventionPopup({
  conventionId, studentName, offerTitle, companyName, onClose, onSigned,
}: {
  conventionId: number; studentName: string; offerTitle: string;
  companyName: string; onClose: () => void; onSigned: () => void;
}) {
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSign = async () => {
    if (!agreed) return;
    setSigning(true);
    setError("");
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
    <div className="conv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="conv-popup">
        <div className="conv-head">
          <div className="conv-head-icon">📋</div>
          <div>
            <h3>Convention de Stage</h3>
            <p>CONV-{String(conventionId).padStart(4, "0")}</p>
          </div>
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
                <div className="conv-summary-item"><span>Stagiaire</span><strong>{studentName || "Vous"}</strong></div>
                <div className="conv-summary-item"><span>Entreprise</span><strong>{companyName}</strong></div>
                <div className="conv-summary-item"><span>Réf. Convention</span><strong>CONV-{String(conventionId).padStart(4, "0")}</strong></div>
              </div>
              <div className="conv-explainer">
                <div className="conv-explainer-icon">ℹ️</div>
                <p>En signant cette convention, vous confirmez votre accord pour effectuer le stage <strong>« {offerTitle} »</strong> chez <strong>{companyName}</strong>.</p>
              </div>
              <div className="conv-chain">
                <div className="conv-chain-step conv-chain-current">
                  <span className="conv-chain-dot conv-chain-pulse" />
                  <span>Votre signature</span>
                </div>
                <div className="conv-chain-line" />
                <div className="conv-chain-step conv-chain-waiting">
                  <span className="conv-chain-dot conv-chain-empty" />
                  <span>Signature entreprise</span>
                </div>
                <div className="conv-chain-line" />
                <div className="conv-chain-step conv-chain-waiting">
                  <span className="conv-chain-dot conv-chain-empty" />
                  <span>Validation admin</span>
                </div>
              </div>
              <label className="conv-agree">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="conv-check-box" />
                <span>Je certifie avoir lu la convention et j'accepte ses termes en tant que stagiaire.</span>
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
   STATUS MESSAGE (waiting states)
   ══════════════════════════════════════════════════════════ */
function WaitingBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="app-no-convention" style={{ color: "var(--sc-warn)", borderColor: "var(--sc-warn)" }}>
      {icon} {text}
    </div>
  );
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

  /* ── Load ── */
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
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { void loadAll(); }, []);

  const filtered = useMemo(
    () => activeTab === "all" ? applications : applications.filter((a) => a.status === activeTab),
    [activeTab, applications],
  );

  const counts = useMemo(() => ({
    all:       applications.length,
    pending:   applications.filter((a) => a.status === "pending").length,
    review:    applications.filter((a) => a.status === "review").length,
    accepted:  applications.filter((a) => a.status === "accepted").length,
    validated: applications.filter((a) => a.status === "validated").length,
    rejected:  applications.filter((a) => a.status === "rejected").length,
  }), [applications]);

  /* ── Actions ── */
  const handleSigned = async () => {
    setSignTarget(null);
    await loadAll();
    toast.success("Convention signée !");
  };

  const handleDownloadConvention = async (convId: number) => {
    try {
      const response = await api.get(`conventions/${convId}/download/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `convention_${convId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de télécharger la convention.");
    }
  };

  const handlePreviewConvention = async (convId: number) => {
    try {
      const response = await api.get(`conventions/${convId}/download/`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      window.open(window.URL.createObjectURL(blob), "_blank");
    } catch {
      toast.error("Impossible d'afficher la convention.");
    }
  };

  const handleDownloadAttestation = async (appId: number) => {
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
    }
  };

  const modalConv = modal ? conventions.find((c) => c.application_id === modal.id) : undefined;

  /* ════════════════════════════════════════════════════════
     BUTTON RENDERER — single source of truth for all states
     ════════════════════════════════════════════════════════ */
  function renderCardActions(app: Application) {
    const conv = conventions.find((c) => c.application_id === app.id);

    // STEP 3 — Sign convention (student hasn't signed yet)
    if (needsStudentSignature(app, conv)) {
      return (
        <>
          <button className="sc-btn-download" onClick={() => setSignTarget({ app, conv: conv! })}>
            ✍️ Signer
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={14} /> Voir <ChevronRight size={13} />
          </button>
        </>
      );
    }

    // STEP 4 — Waiting for company
    if (waitingForCompany(app, conv)) {
      return (
        <>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={14} /> Voir <ChevronRight size={13} />
          </button>
        </>
      );
    }

    // STEP 5 — Waiting for admin
    if (waitingForAdmin(app, conv)) {
      return (
        <>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={14} /> Voir <ChevronRight size={13} />
          </button>
        </>
      );
    }

    // STEP 7 — Attestation issued (fully complete)
    if (attestationIssued(app) && conv?.admin_validated) {
      return (
        <>
          <button className="sc-btn-download" onClick={() => handleDownloadAttestation(app.id)}>
            <Award size={13} /> Attestation
          </button>
          <button className="sc-btn-download" onClick={() => handleDownloadConvention(conv!.id)}>
            <Download size={13} /> Convention
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={14} /> Voir <ChevronRight size={13} />
          </button>
        </>
      );
    }

    // STEP 6b — Report uploaded, waiting for validation
    if (reportUploaded(app) && conv?.admin_validated) {
      return (
        <>
          <button className="sc-btn-download" onClick={() => handleDownloadConvention(conv!.id)}>
            <Download size={13} /> Convention
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={14} /> Voir <ChevronRight size={13} />
          </button>
        </>
      );
    }

    // STEP 6a — Convention validated, can upload report
    if (conventionValidated(app, conv)) {
      return (
        <>
          <button className="sc-btn-download" onClick={() => handleDownloadConvention(conv!.id)}>
            <Download size={13} /> Convention
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={14} /> Voir <ChevronRight size={13} />
          </button>
        </>
      );
    }

    // DEFAULT — pending / review / rejected / no convention yet
    return (
      <button className="app-view-btn" onClick={() => setModal(app)}>
        <Eye size={14} /> Voir <ChevronRight size={13} />
      </button>
    );
  }

  /* ════════════════════════════════════════════════════════
     MODAL CTA RENDERER
     ════════════════════════════════════════════════════════ */
  function renderModalCTA(app: Application, conv: ConventionRow | undefined) {

    // STEP 3 — Sign
    if (needsStudentSignature(app, conv)) {
      return (
        <button
          className="sc-btn-primary off-apply-full"
          onClick={() => { setSignTarget({ app, conv: conv! }); setModal(null); }}
        >
          ✍️ Signer la convention
        </button>
      );
    }

    // STEP 4 — Waiting for company
    if (waitingForCompany(app, conv)) {
      return <WaitingBadge icon={<Clock size={16} />} text="En attente de la signature de l'entreprise…" />;
    }

    // STEP 5 — Waiting for admin
    if (waitingForAdmin(app, conv)) {
      return <WaitingBadge icon={<Clock size={16} />} text="En attente de validation par l'administration…" />;
    }

    // STEP 7 — Attestation issued (fully complete)
    if (attestationIssued(app) && conv?.admin_validated) {
      return (
        <>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#22c55e" }}
            onClick={() => handleDownloadAttestation(app.id)}
          >
            <Award size={16} /> Télécharger l'attestation de stage
          </button>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#3b82f6" }}
            onClick={() => handlePreviewConvention(conv!.id)}
          >
            <Eye size={16} /> Voir la convention
          </button>
          <button className="sc-btn-primary off-apply-full" onClick={() => handleDownloadConvention(conv!.id)}>
            <Download size={16} /> Télécharger la convention
          </button>
        </>
      );
    }

    // STEP 6b — Report uploaded, waiting validation
    if (reportUploaded(app) && conv?.admin_validated) {
      return (
        <>
          <div className="app-no-convention" style={{ color: "#8b5cf6", borderColor: "#8b5cf6" }}>
            <ScrollText size={16} />
            {app.stage_state === "report_validated"
              ? "Rapport validé par l'entreprise — en attente de l'attestation"
              : "Rapport soumis — en attente de validation par l'entreprise"}
          </div>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#3b82f6" }}
            onClick={() => handlePreviewConvention(conv!.id)}
          >
            <Eye size={16} /> Voir la convention
          </button>
          <button className="sc-btn-primary off-apply-full" onClick={() => handleDownloadConvention(conv!.id)}>
            <Download size={16} /> Télécharger la convention
          </button>
        </>
      );
    }

    // STEP 6a — Convention validated, upload report
    if (conventionValidated(app, conv)) {
      return (
        <>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#3b82f6" }}
            onClick={() => handlePreviewConvention(conv!.id)}
          >
            <Eye size={16} /> Voir la convention
          </button>
          <button className="sc-btn-primary off-apply-full" onClick={() => handleDownloadConvention(conv!.id)}>
            <Download size={16} /> Télécharger la convention
          </button>
          <ReportSection appId={app.id} onRefresh={loadAll} />
        </>
      );
    }

    // Not yet actionable
    return (
      <div className="app-no-convention">
        <FileText size={16} />
        {app.status === "accepted"
          ? "Convention en cours de préparation…"
          : app.status === "rejected"
          ? "Candidature non retenue"
          : "Convention disponible après acceptation"}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  return (
    <DashboardLayout pageTitle="My Applications">

      {/* HERO */}
      <div className="page-hero applications-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>My Applications</h1>
          <p>Track every application, monitor status updates, and download your conventions</p>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="app-stat-strip">
        {[
          { label: "Total",      value: counts.all,       color: "var(--sc-blue)" },
          { label: "Pending",    value: counts.pending,   color: "var(--sc-warn)" },
          { label: "In Review",  value: counts.review,    color: "var(--sc-purple)" },
          { label: "Accepted",   value: counts.accepted,  color: "var(--sc-green)" },
          { label: "Validated",  value: counts.validated, color: "var(--sc-blue)" },
          { label: "Rejected",   value: counts.rejected,  color: "var(--sc-red)" },
        ].map((s) => (
          <div className="app-stat-item" key={s.label}>
            <span className="app-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="app-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="app-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`app-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="app-tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="mi-loading">
          <div className="mi-spinner" />
          <p>Chargement des candidatures…</p>
        </div>
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
                    <div className="app-row-actions">
                      {renderCardActions(app)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* ── MODAL — centered with fixed positioning ── */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              className="off-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
            />
            <motion.div
              className="off-modal app-modal"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="off-modal-header">
                <div className="sc-offer-logo off-modal-logo">{modal.logo}</div>
                <div className="off-modal-title">
                  <h2>{modal.title}</h2>
                  <span>{modal.company} · {modal.wilaya}</span>
                </div>
                <button className="off-modal-close" onClick={() => setModal(null)}>
                  <X size={20} />
                </button>
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
                  {modalConv && (
                    <div className="off-mdetail">
                      <span>Convention</span>
                      <strong>
                        {modalConv.admin_validated ? "✅ Validée" :
                         modalConv.company_signed  ? "⏳ En attente admin" :
                         modalConv.student_signed  ? "⏳ En attente entreprise" :
                                                     "⏳ En attente de votre signature"}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="off-modal-cta">
                {renderModalCTA(modal, modalConv)}
                <button className="sc-btn-outline" onClick={() => setModal(null)}>Fermer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONVENTION SIGNING POPUP */}
      {signTarget && (
        <ConventionPopup
          conventionId={signTarget.conv.id}
          studentName=""
          offerTitle={signTarget.app.title}
          companyName={signTarget.app.company}
          onClose={() => setSignTarget(null)}
          onSigned={() => void handleSigned()}
        />
      )}
    </DashboardLayout>
  );
};

export default ApplicationsPage;