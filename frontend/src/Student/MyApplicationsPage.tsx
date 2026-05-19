import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Eye, Clock, CheckCircle2, XCircle,
  AlertCircle, Building2, MapPin, Calendar, ChevronRight,
  X, Briefcase, Upload, Award, ScrollText, PenLine,
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
  report_submitted_at: string | null;
  report_validated_at: string | null;
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
  return d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
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
    title: row.offer_title || `Offre #${row.offer}`,
    company,
    logo: initials(company),
    wilaya: row.offer_location || "—",
    appliedDate: formatDate(appliedIso),
    status: mapBackendStatus(row.status ?? "pending"),
    stage_state: row.stage_state ?? "",
    attestation_issued: !!row.attestation_issued_at,
    report_submitted_at: row.report_submitted_at ?? null,
    report_validated_at: row.report_validated_at ?? null,
  };
}

/* ══════════════════════════════════════════════════════════
   WORKFLOW STATE HELPERS
   ══════════════════════════════════════════════════════════ */

/** STEP 3 — Accepted, waiting for student to sign */
function needsStudentSignature(app: Application, conv: ConventionRow | undefined): boolean {
  if (app.status !== "accepted") return false;
  if (!conv) return false;
  return conv.status === "PENDING_STUDENT" || (!conv.student_signed && conv.status !== "VALIDATED");
}

/** STEP 4 — Student signed, waiting for company */
function waitingForCompany(app: Application, conv: ConventionRow | undefined): boolean {
  if (app.status !== "accepted") return false;
  if (!conv) return false;
  return conv.status === "PENDING_COMPANY";
}

/** STEP 5 — Company signed, waiting for admin */
function waitingForAdmin(app: Application, conv: ConventionRow | undefined): boolean {
  if (app.status !== "accepted") return false;
  if (!conv) return false;
  return conv.status === "PENDING_ADMIN";
}

/** Convention fully validated */
function isConventionValidated(conv: ConventionRow | undefined): boolean {
  return conv?.status === "VALIDATED" || conv?.admin_validated === true;
}

/** STEP 6a — Convention validated, no report yet */
function conventionValidatedNoReport(app: Application, conv: ConventionRow | undefined): boolean {
  if (!isConventionValidated(conv)) return false;
  return !app.report_submitted_at && !app.attestation_issued && app.stage_state !== "completed";
}

/** STEP 6b — Report uploaded, waiting for company validation */
function reportPendingValidation(app: Application, conv: ConventionRow | undefined): boolean {
  if (!isConventionValidated(conv)) return false;
  return !!app.report_submitted_at && !app.report_validated_at && !app.attestation_issued && app.stage_state !== "completed";
}

/** STEP 6c — Report validated, waiting for attestation */
function reportValidatedWaitingAttestation(app: Application, conv: ConventionRow | undefined): boolean {
  if (!isConventionValidated(conv)) return false;
  return !!app.report_validated_at && !app.attestation_issued && app.stage_state !== "completed";
}

/** STEP 7 — Attestation issued, everything done */
function isCompleted(app: Application): boolean {
  return app.attestation_issued || app.stage_state === "completed";
}

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG
   ══════════════════════════════════════════════════════════ */
const statusConfig: Record<AppStatus, { label: string; badgeClass: string; icon: React.ReactNode; color: string }> = {
  pending:   { label: "En attente",  badgeClass: "sc-badge-pending",   icon: <Clock size={13} />,        color: "var(--sc-warn)" },
  review:    { label: "En revue",    badgeClass: "sc-badge-review",    icon: <AlertCircle size={13} />,  color: "var(--sc-purple)" },
  accepted:  { label: "Acceptée",    badgeClass: "sc-badge-accepted",  icon: <CheckCircle2 size={13} />, color: "var(--sc-green)" },
  validated: { label: "Validée",     badgeClass: "sc-badge-validated", icon: <CheckCircle2 size={13} />, color: "var(--sc-blue)" },
  rejected:  { label: "Refusée",     badgeClass: "sc-badge-rejected",  icon: <XCircle size={13} />,      color: "var(--sc-red)" },
};

const tabs: { key: AppStatus | "all"; label: string }[] = [
  { key: "all",       label: "Toutes" },
  { key: "pending",   label: "En attente" },
  { key: "review",    label: "En revue" },
  { key: "accepted",  label: "Acceptées" },
  { key: "validated", label: "Validées" },
  { key: "rejected",  label: "Refusées" },
];

/* ══════════════════════════════════════════════════════════
   WORKFLOW STEP LABELS (for timeline)
   ══════════════════════════════════════════════════════════ */
function buildTimeline(app: Application, conv: ConventionRow | undefined) {
  return [
    { label: "Candidature soumise",              done: true },
    { label: "En cours d'examen",                done: ["review","accepted","validated"].includes(app.status) },
    { label: app.status === "rejected" ? "Non retenue" : "Acceptée par l'entreprise",
                                                 done: ["accepted","validated"].includes(app.status) || app.status === "rejected" },
    { label: "Convention signée (étudiant)",     done: !!conv?.student_signed },
    { label: "Convention signée (entreprise)",   done: !!conv?.company_signed },
    { label: "Convention validée (admin)",       done: !!conv?.admin_validated || conv?.status === "VALIDATED" },
    { label: "Rapport de stage soumis",          done: !!app.report_submitted_at },
    { label: "Rapport validé par l'entreprise",  done: !!app.report_validated_at },
    { label: "Attestation de stage émise",       done: app.attestation_issued || app.stage_state === "completed" },
  ];
}

/* ══════════════════════════════════════════════════════════
   CONVENTION PREVIEW MODAL
   ══════════════════════════════════════════════════════════ */
function ConventionPreviewModal({ convId, onClose }: { convId: number; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    const load = async () => {
      try {
        const response = await api.get(`conventions/${convId}/download/`, { responseType: "blob" });
        const blob = new Blob([response.data as BlobPart], { type: "application/pdf" });
        objectUrl = window.URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        setError("Impossible de charger la convention.");
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl); };
  }, [convId]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "90vw", maxWidth: 900,
        height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #e5e7eb", background: "#f8fafc",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={20} style={{ color: "#3b82f6" }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
              Convention CONV-{String(convId).padStart(4, "0")}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 12px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#64748b",
              fontSize: 13, fontWeight: 600,
            }}
          >
            <X size={15} /> Fermer
          </button>
        </div>

        {/* PDF frame */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", gap: 10 }}>
              <div className="mi-spinner" style={{ width: 24, height: 24 }} />
              Chargement…
            </div>
          )}
          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ef4444", fontSize: 14 }}>
              {error}
            </div>
          )}
          {url && !loading && (
            <iframe src={url} style={{ width: "100%", height: "100%", border: "none" }} title="Convention PDF" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONVENTION SIGNING POPUP
   ══════════════════════════════════════════════════════════ */
function ConventionPopup({
  conventionId, offerTitle, companyName, onClose, onSigned,
}: {
  conventionId: number; offerTitle: string;
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
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !done) onClose(); }}
    >
      <div className="conv-popup" style={{ position: "relative", maxWidth: 520, width: "95vw" }}>
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
            <p>Votre signature a été enregistrée. L'entreprise sera notifiée pour signer à son tour.</p>
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
                <p>En signant, vous confirmez votre accord pour effectuer le stage <strong>« {offerTitle} »</strong> chez <strong>{companyName}</strong>.</p>
              </div>

              {/* Signature chain */}
              <div className="conv-chain">
                <div className="conv-chain-step conv-chain-current">
                  <span className="conv-chain-dot conv-chain-pulse" />
                  <span>Votre signature</span>
                </div>
                <div className="conv-chain-line" />
                <div className="conv-chain-step conv-chain-waiting">
                  <span className="conv-chain-dot conv-chain-empty" />
                  <span>Entreprise</span>
                </div>
                <div className="conv-chain-line" />
                <div className="conv-chain-step conv-chain-waiting">
                  <span className="conv-chain-dot conv-chain-empty" />
                  <span>Administration</span>
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
                {signing ? "Signature en cours…" : agreed ? "✍️  Je signe la convention" : "Cochez pour signer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT UPLOAD SECTION
   ══════════════════════════════════════════════════════════ */
function ReportUploadSection({ appId, onRefresh }: { appId: number; onRefresh: () => void }) {
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
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input type="file" accept=".pdf,.doc,.docx" ref={fileRef} style={{ display: "none" }} onChange={handleUpload} />
      <button
        className="sc-btn-primary off-apply-full"
        style={{ background: "#8b5cf6", display: "inline-flex", alignItems: "center", gap: 6 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <Upload size={15} />
        {uploading ? "Envoi en cours…" : "Soumettre mon rapport de stage"}
      </button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   STATUS INFO BADGE (waiting states)
   ══════════════════════════════════════════════════════════ */
function StatusInfo({ icon, text, color = "var(--sc-warn)" }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <div className="app-no-convention" style={{ color, borderColor: color }}>
      {icon}
      <span style={{ fontSize: 13 }}>{text}</span>
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
  const [previewConvId, setPreviewConvId] = useState<number | null>(null);

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
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
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

  const handleDownloadAttestation = async (appId: number) => {
    try {
      const response = await api.get(`applications/${appId}/attestation/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
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
     CARD ACTION BUTTONS
     Only the most important actions visible on the card row.
     ════════════════════════════════════════════════════════ */
  function renderCardActions(app: Application) {
    const conv = conventions.find((c) => c.application_id === app.id);

    /* STEP 3 — Sign convention */
    if (needsStudentSignature(app, conv)) {
      return (
        <>
          <button
            className="sc-btn-download"
            style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe", fontWeight: 700 }}
            onClick={() => setSignTarget({ app, conv: conv! })}
          >
            <PenLine size={13} /> Signer
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={13} /> Voir <ChevronRight size={12} />
          </button>
        </>
      );
    }

    /* STEP 4 — Waiting for company */
    if (waitingForCompany(app, conv)) {
      return (
        <button className="app-view-btn" onClick={() => setModal(app)}>
          <Eye size={13} /> Voir <ChevronRight size={12} />
        </button>
      );
    }

    /* STEP 5 — Waiting for admin */
    if (waitingForAdmin(app, conv)) {
      return (
        <button className="app-view-btn" onClick={() => setModal(app)}>
          <Eye size={13} /> Voir <ChevronRight size={12} />
        </button>
      );
    }

    /* STEP 7 — Completed: attestation + convention + view */
    if (isCompleted(app) && isConventionValidated(conv)) {
      return (
        <>
          <button
            className="sc-btn-download"
            style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0", fontWeight: 700 }}
            onClick={() => handleDownloadAttestation(app.id)}
          >
            <Award size={13} /> Attestation
          </button>
          <button
            className="sc-btn-download"
            onClick={() => conv && handleDownloadConvention(conv.id)}
          >
            <Download size={13} /> Convention
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={13} /> Voir <ChevronRight size={12} />
          </button>
        </>
      );
    }

    /* STEP 6c — Report validated, waiting attestation */
    if (reportValidatedWaitingAttestation(app, conv)) {
      return (
        <>
          <button className="sc-btn-download" onClick={() => conv && handleDownloadConvention(conv.id)}>
            <Download size={13} /> Convention
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={13} /> Voir <ChevronRight size={12} />
          </button>
        </>
      );
    }

    /* STEP 6b — Report submitted, waiting validation */
    if (reportPendingValidation(app, conv)) {
      return (
        <>
          <button className="sc-btn-download" onClick={() => conv && handleDownloadConvention(conv.id)}>
            <Download size={13} /> Convention
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={13} /> Voir <ChevronRight size={12} />
          </button>
        </>
      );
    }

    /* STEP 6a — Convention validated, can upload report */
    if (conventionValidatedNoReport(app, conv)) {
      return (
        <>
          <button
            className="sc-btn-download"
            style={{ background: "#f5f3ff", color: "#6d28d9", borderColor: "#ddd6fe", fontWeight: 700 }}
            onClick={() => conv && setPreviewConvId(conv.id)}
          >
            <Eye size={13} /> Convention
          </button>
          <button className="sc-btn-download" onClick={() => conv && handleDownloadConvention(conv.id)}>
            <Download size={13} />
          </button>
          <button className="app-view-btn" onClick={() => setModal(app)}>
            <Eye size={13} /> Voir <ChevronRight size={12} />
          </button>
        </>
      );
    }

    /* DEFAULT — pending / review / rejected */
    return (
      <button className="app-view-btn" onClick={() => setModal(app)}>
        <Eye size={13} /> Voir <ChevronRight size={12} />
      </button>
    );
  }

  /* ════════════════════════════════════════════════════════
     MODAL CTA — full action area inside detail popup
     ════════════════════════════════════════════════════════ */
  function renderModalCTA(app: Application, conv: ConventionRow | undefined) {

    /* STEP 3 — Sign */
    if (needsStudentSignature(app, conv)) {
      return (
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#2563eb", display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => { setSignTarget({ app, conv: conv! }); setModal(null); }}
        >
          <PenLine size={15} /> Signer la convention
        </button>
      );
    }

    /* STEP 4 — Waiting for company */
    if (waitingForCompany(app, conv)) {
      return <StatusInfo icon={<Clock size={15} />} text="En attente de la signature de l'entreprise…" />;
    }

    /* STEP 5 — Waiting for admin */
    if (waitingForAdmin(app, conv)) {
      return <StatusInfo icon={<Clock size={15} />} text="En attente de validation par l'administration…" color="var(--sc-purple)" />;
    }

    /* STEP 7 — Fully completed */
    if (isCompleted(app) && isConventionValidated(conv)) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#16a34a", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => handleDownloadAttestation(app.id)}
          >
            <Award size={15} /> Télécharger l'attestation de stage
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && setPreviewConvId(conv.id)}
            >
              <Eye size={15} /> Voir la convention
            </button>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && handleDownloadConvention(conv.id)}
            >
              <Download size={15} /> Télécharger
            </button>
          </div>
        </div>
      );
    }

    /* STEP 6c — Report validated, waiting attestation */
    if (reportValidatedWaitingAttestation(app, conv)) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <StatusInfo
            icon={<ScrollText size={15} />}
            text="Rapport validé — en attente de l'attestation de l'administration"
            color="#8b5cf6"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && setPreviewConvId(conv.id)}
            >
              <Eye size={15} /> Voir la convention
            </button>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && handleDownloadConvention(conv.id)}
            >
              <Download size={15} /> Télécharger
            </button>
          </div>
        </div>
      );
    }

    /* STEP 6b — Report submitted, waiting company validation */
    if (reportPendingValidation(app, conv)) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <StatusInfo
            icon={<ScrollText size={15} />}
            text="Rapport soumis — en attente de validation par l'entreprise"
            color="#d97706"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && setPreviewConvId(conv.id)}
            >
              <Eye size={15} /> Voir la convention
            </button>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && handleDownloadConvention(conv.id)}
            >
              <Download size={15} /> Télécharger
            </button>
          </div>
        </div>
      );
    }

    /* STEP 6a — Convention validated, upload report */
    if (conventionValidatedNoReport(app, conv)) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && setPreviewConvId(conv.id)}
            >
              <Eye size={15} /> Voir la convention
            </button>
            <button
              className="sc-btn-primary off-apply-full"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => conv && handleDownloadConvention(conv.id)}
            >
              <Download size={15} /> Télécharger
            </button>
          </div>
          <ReportUploadSection appId={app.id} onRefresh={() => { setModal(null); void loadAll(); }} />
        </div>
      );
    }

    /* Not yet actionable */
    return (
      <div className="app-no-convention">
        <FileText size={15} />
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
    <DashboardLayout pageTitle="Mes Candidatures">

      {/* HERO */}
      <div className="page-hero applications-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Mes Candidatures</h1>
          <p>Suivez chaque candidature, de l'envoi à l'attestation de stage</p>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="app-stat-strip">
        {[
          { label: "Total",      value: counts.all,       color: "var(--sc-blue)" },
          { label: "En attente", value: counts.pending,   color: "var(--sc-warn)" },
          { label: "En revue",   value: counts.review,    color: "var(--sc-purple)" },
          { label: "Acceptées",  value: counts.accepted,  color: "var(--sc-green)" },
          { label: "Validées",   value: counts.validated, color: "var(--sc-blue)" },
          { label: "Refusées",   value: counts.rejected,  color: "var(--sc-red)" },
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
                        <span><Calendar size={12} />Postulé le {app.appliedDate}</span>
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

      {/* ── DETAIL MODAL — centered on screen ── */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                maxHeight: "85vh",
                overflowY: "auto",
                width: "min(640px, 94vw)",
              }}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
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
                  <X size={18} />
                </button>
              </div>

              {/* Status badges */}
              <div className="off-modal-badges">
                <span className={`sc-badge ${statusConfig[modal.status].badgeClass}`}>
                  {statusConfig[modal.status].icon} {statusConfig[modal.status].label}
                </span>
                <span className="off-mpill"><Calendar size={11} />Postulé le {modal.appliedDate}</span>
              </div>

              {/* Timeline */}
              <div className="off-modal-section">
                <h3>Parcours de la candidature</h3>
                <div className="app-timeline">
                  {buildTimeline(modal, modalConv).map((ev, idx, arr) => (
                    <div key={idx} className={`app-tl-step ${ev.done ? "done" : "todo"}`}>
                      <div className="app-tl-dot">
                        {ev.done ? <CheckCircle2 size={16} /> : <div className="app-tl-empty-dot" />}
                      </div>
                      {idx < arr.length - 1 && <div className={`app-tl-line ${ev.done ? "done" : ""}`} />}
                      <div className="app-tl-content">
                        <span className="app-tl-label">{ev.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details grid */}
              <div className="off-modal-section">
                <h3>Détails</h3>
                <div className="off-modal-details">
                  <div className="off-mdetail"><span>Date de candidature</span><strong>{modal.appliedDate}</strong></div>
                  <div className="off-mdetail"><span>Entreprise</span><strong>{modal.company}</strong></div>
                  <div className="off-mdetail"><span>Localisation</span><strong>{modal.wilaya}</strong></div>
                  <div className="off-mdetail"><span>Statut</span><strong>{statusConfig[modal.status].label}</strong></div>
                  {modalConv && (
                    <div className="off-mdetail">
                      <span>Convention</span>
                      <strong>
                        {modalConv.status === "VALIDATED"        ? "✅ Validée" :
                         modalConv.status === "PENDING_ADMIN"    ? "⏳ En attente admin" :
                         modalConv.status === "PENDING_COMPANY"  ? "⏳ En attente entreprise" :
                         modalConv.status === "PENDING_STUDENT"  ? "✍️ À signer" :
                         modalConv.status}
                      </strong>
                    </div>
                  )}
                  {modal.report_submitted_at && (
                    <div className="off-mdetail">
                      <span>Rapport soumis le</span>
                      <strong>{formatDate(modal.report_submitted_at)}</strong>
                    </div>
                  )}
                  {modal.report_validated_at && (
                    <div className="off-mdetail">
                      <span>Rapport validé le</span>
                      <strong>{formatDate(modal.report_validated_at)}</strong>
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
          offerTitle={signTarget.app.title}
          companyName={signTarget.app.company}
          onClose={() => setSignTarget(null)}
          onSigned={() => void handleSigned()}
        />
      )}

      {/* CONVENTION PREVIEW MODAL */}
      {previewConvId !== null && (
        <ConventionPreviewModal
          convId={previewConvId}
          onClose={() => setPreviewConvId(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default ApplicationsPage;