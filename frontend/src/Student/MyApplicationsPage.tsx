import React, { useState, useMemo, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Eye, Clock, CheckCircle2,
  XCircle, AlertCircle, Building2, MapPin,
  Calendar, ChevronRight, X, Briefcase, Upload, Award, PenLine, ScrollText,
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
  status: string;               // PENDING_STUDENT | PENDING_COMPANY | PENDING_ADMIN | VALIDATED
  application_id: number;
  student_signed: boolean;
  company_signed: boolean;
  admin_validated: boolean;
  offer_title?: string;
  company_name?: string;
}

type ApiRow = {
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
}

function mapBackendStatus(s: string): AppStatus {
  if (s === "reviewed") return "review";
  if (s === "refused") return "rejected";
  if (s === "accepted") return "accepted";
  if (s === "validated") return "validated";
  return "pending";
}

function mapRow(row: ApiRow): Application {
  const company = row.offer_company_name || "Company";
  return {
    id: row.id,
    title: row.offer_title || `Offre #${row.offer}`,
    company,
    logo: initials(company),
    wilaya: row.offer_location || "—",
    appliedDate: formatDate(row.application_date),
    status: mapBackendStatus(row.status ?? "pending"),
    stage_state: row.stage_state ?? "",
    attestation_issued: !!row.attestation_issued_at,
    report_submitted_at: row.report_submitted_at ?? null,
    report_validated_at: row.report_validated_at ?? null,
  };
}

/* ══════════════════════════════════════════════════════════
   WORKFLOW HELPERS
   ══════════════════════════════════════════════════════════ */
function needsStudentSign(app: Application, conv?: ConventionRow) {
  return app.status === "accepted" && !!conv && conv.status === "PENDING_STUDENT" && !conv.student_signed;
}
function waitingCompany(app: Application, conv?: ConventionRow) {
  return app.status === "accepted" && !!conv && conv.status === "PENDING_COMPANY";
}
function waitingAdmin(app: Application, conv?: ConventionRow) {
  return app.status === "accepted" && !!conv && conv.status === "PENDING_ADMIN";
}
function convValidated(conv?: ConventionRow) {
  return !!conv && (conv.status === "VALIDATED" || conv.admin_validated);
}
// Step 6a — convention validated, no report yet → show upload button on card
function canUploadReport(app: Application, conv?: ConventionRow) {
  return convValidated(conv) && !app.report_submitted_at && !app.attestation_issued && app.stage_state !== "completed";
}
// Step 6b — report uploaded, waiting company validation
function reportPending(app: Application, conv?: ConventionRow) {
  return convValidated(conv) && !!app.report_submitted_at && !app.report_validated_at && !app.attestation_issued;
}
// Step 6c — report validated, waiting attestation
function reportValidatedWaiting(app: Application, conv?: ConventionRow) {
  return convValidated(conv) && !!app.report_validated_at && !app.attestation_issued && app.stage_state !== "completed";
}
// Step 7 — fully done
function isCompleted(app: Application) {
  return app.attestation_issued || app.stage_state === "completed";
}

/* ══════════════════════════════════════════════════════════
   TIMELINE
   ══════════════════════════════════════════════════════════ */
function buildTimeline(app: Application, conv?: ConventionRow) {
  return [
    { label: "Candidature soumise",             done: true },
    { label: "En cours d'examen",               done: ["review", "accepted", "validated"].includes(app.status) },
    { label: app.status === "rejected" ? "Non retenue" : "Acceptée par l'entreprise",
      done: ["accepted", "validated"].includes(app.status) || app.status === "rejected" },
    { label: "Convention signée (étudiant)",    done: !!conv?.student_signed },
    { label: "Convention signée (entreprise)",  done: !!conv?.company_signed },
    { label: "Convention validée (admin)",      done: convValidated(conv) },
    { label: "Rapport de stage soumis",         done: !!app.report_submitted_at },
    { label: "Rapport validé par l'entreprise", done: !!app.report_validated_at },
    { label: "Attestation émise",               done: app.attestation_issued || app.stage_state === "completed" },
  ];
}

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG
   ══════════════════════════════════════════════════════════ */
const statusCfg: Record<AppStatus, { label: string; badgeClass: string; icon: React.ReactNode; color: string }> = {
  pending:   { label: "En attente", badgeClass: "sc-badge-pending",   icon: <Clock size={13} />,        color: "var(--sc-warn)" },
  review:    { label: "En revue",   badgeClass: "sc-badge-review",    icon: <AlertCircle size={13} />,  color: "var(--sc-purple)" },
  accepted:  { label: "Acceptée",   badgeClass: "sc-badge-accepted",  icon: <CheckCircle2 size={13} />, color: "var(--sc-green)" },
  validated: { label: "Validée",    badgeClass: "sc-badge-validated", icon: <CheckCircle2 size={13} />, color: "var(--sc-blue)" },
  rejected:  { label: "Refusée",    badgeClass: "sc-badge-rejected",  icon: <XCircle size={13} />,      color: "var(--sc-red)" },
};

const TABS: { key: AppStatus | "all"; label: string }[] = [
  { key: "all",       label: "Toutes" },
  { key: "pending",   label: "En attente" },
  { key: "review",    label: "En revue" },
  { key: "accepted",  label: "Acceptées" },
  { key: "validated", label: "Validées" },
  { key: "rejected",  label: "Refusées" },
];

/* ══════════════════════════════════════════════════════════
   CONVENTION PREVIEW MODAL (full-screen PDF viewer)
   ══════════════════════════════════════════════════════════ */
function ConventionPreviewModal({ convId, onClose }: { convId: number; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    (async () => {
      try {
        const res = await api.get(`conventions/${convId}/download/`, { responseType: "blob" });
        const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
        objectUrl = window.URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        setError("Impossible de charger la convention.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl); };
  }, [convId]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "92vw", maxWidth: 960,
        height: "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 28px 64px rgba(0,0,0,0.45)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid #e5e7eb", background: "#f8fafc",
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
              background: "#f1f5f9", border: "none", borderRadius: 8,
              padding: "6px 14px", cursor: "pointer", color: "#64748b",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <X size={14} /> Fermer
          </button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", gap: 10 }}>
              <div className="mi-spinner" style={{ width: 24, height: 24 }} /> Chargement…
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
  convId, offerTitle, companyName, onClose, onSigned,
}: {
  convId: number; offerTitle: string; companyName: string;
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
      await api.post(`conventions/${convId}/sign/`, {});
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
      className="conv-overlay"
      onClick={e => { if (e.target === e.currentTarget && !done) onClose(); }}
    >
      <div className="conv-popup" style={{ maxWidth: 520, width: "95vw" }}>
        <div className="conv-head">
          <div className="conv-head-icon">📋</div>
          <div>
            <h3>Convention de Stage</h3>
            <p>CONV-{String(convId).padStart(4, "0")}</p>
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
                <div className="conv-summary-item"><span>Réf.</span><strong>CONV-{String(convId).padStart(4, "0")}</strong></div>
              </div>
              <div className="conv-explainer">
                <div className="conv-explainer-icon">ℹ️</div>
                <p>En signant, vous confirmez votre accord pour effectuer le stage <strong>« {offerTitle} »</strong> chez <strong>{companyName}</strong>.</p>
              </div>
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
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
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
   REPORT UPLOAD BUTTON — shown directly on the card row
   ══════════════════════════════════════════════════════════ */
function ReportUploadBtn({ appId, onRefresh }: { appId: number; onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <input type="file" accept=".pdf,.doc,.docx" ref={fileRef} style={{ display: "none" }} onChange={handle} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "6px 13px", borderRadius: 20,
          border: "1.5px solid #ddd6fe",
          background: "#f5f3ff", color: "#6d28d9",
          fontSize: 12, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.6 : 1, fontFamily: "Inter, sans-serif",
        }}
      >
        <Upload size={13} />
        {uploading ? "Envoi…" : "Soumettre rapport"}
      </button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   INFO BADGE (waiting states inside modal)
   ══════════════════════════════════════════════════════════ */
function InfoBadge({ icon, text, color = "var(--sc-warn)" }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <div className="app-no-convention" style={{ color, borderColor: color }}>
      {icon}<span style={{ fontSize: 13 }}>{text}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OFFER DETAILS MODAL — simple view for step 3 (sign flow)
   Shows: title, company, location, date, status only.
   No signing CTA — signing is done via the "Signer" card button.
   ══════════════════════════════════════════════════════════ */
function OfferDetailsModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const cfg = statusCfg[app.status];
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          zIndex: 999,
        }}
      />
      {/* Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          width: "min(540px, 94vw)",
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          padding: 28,
          display: "flex", flexDirection: "column", gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: "var(--sc-sidebar-grad, #b8893e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Epilogue, sans-serif", fontSize: 14, fontWeight: 800,
            color: "#fff", flexShrink: 0,
          }}>
            {app.logo}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "Epilogue, sans-serif", fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
              {app.title}
            </h2>
            <span style={{ fontSize: 13, color: "#64748b" }}>{app.company} · {app.wilaya}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0",
              background: "#f8fafc", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
          <span className={`sc-badge ${cfg.badgeClass}`}>{cfg.icon} {cfg.label}</span>
          <span className="off-mpill"><Calendar size={11} /> Postulé le {app.appliedDate}</span>
        </div>

        {/* Details grid */}
        <div className="off-modal-details">
          <div className="off-mdetail"><span>Entreprise</span><strong>{app.company}</strong></div>
          <div className="off-mdetail"><span>Localisation</span><strong>{app.wilaya}</strong></div>
          <div className="off-mdetail"><span>Date de candidature</span><strong>{app.appliedDate}</strong></div>
          <div className="off-mdetail"><span>Statut</span><strong>{cfg.label}</strong></div>
        </div>

        {/* Info about what to do */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 12,
          background: "#eff6ff", border: "1px solid #bfdbfe",
          fontSize: 13, color: "#1d4ed8",
        }}>
          <PenLine size={15} style={{ flexShrink: 0 }} />
          <span>Utilisez le bouton <strong>Signer</strong> sur la carte pour signer votre convention de stage.</span>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 12,
            border: "1.5px solid #e2e8f0", background: "none",
            color: "#1e293b", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}
        >
          Fermer
        </button>
      </motion.div>
    </>
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

  // Full workflow modal (timeline + CTA) — used for steps 4,5,6,7
  const [modal, setModal] = useState<Application | null>(null);
  // Simple offer details modal — used for step 3 (sign flow) "Voir" button
  const [detailsModal, setDetailsModal] = useState<Application | null>(null);

  const [signTarget, setSignTarget] = useState<{
    appId: number; convId: number; offerTitle: string; companyName: string;
  } | null>(null);
  const [previewConvId, setPreviewConvId] = useState<number | null>(null);

  /* ── Load ── */
  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ error?: boolean; data?: ApiRow[] }>("applications/my-applications/");
      const rows = res.data?.error ? [] : (res.data?.data ?? []);
      setApplications(rows.map(mapRow));
    } catch {
      toast.error("Impossible de charger les candidatures.");
    }
    try {
      const cr = await api.get<{ error?: boolean; data?: ConventionRow[] }>("conventions/mine/");
      setConventions(cr.data?.error ? [] : (cr.data?.data ?? []));
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { void loadAll(); }, []);

  /* ── Derived ── */
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

  /* ── Actions ── */
  const handleSigned = async () => {
    setSignTarget(null);
    await loadAll();
    toast.success("Convention signée !");
  };

  const downloadConvention = async (convId: number) => {
    try {
      const res = await api.get(`conventions/${convId}/download/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement("a");
      a.href = url; a.setAttribute("download", `convention_${convId}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Impossible de télécharger la convention."); }
  };

  const downloadAttestation = async (appId: number) => {
    try {
      const res = await api.get(`applications/${appId}/attestation/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement("a");
      a.href = url; a.setAttribute("download", `attestation_${appId}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Impossible de télécharger l'attestation."); }
  };

  const modalConv = modal ? conventions.find(c => c.application_id === modal.id) : undefined;

  /* ════════════════════════════════════════════════════════
     CARD BUTTONS
     ════════════════════════════════════════════════════════

     STEP 3 (sign_convention):
       [Signer]  [Voir →]   ← "Voir" opens simple offer details (no sign CTA)

     STEP 4 (waiting_company):
       [Voir →]

     STEP 5 (waiting_admin):
       [Voir →]

     STEP 6a (canUploadReport):
       [👁 Convention]  [↓]  [↑ Soumettre rapport]
       ← "Voir" is REMOVED; upload is the main action on the card

     STEP 6b (reportPending):
       [↓ Convention]  [Voir →]

     STEP 6c (reportValidatedWaiting):
       [↓ Convention]  [Voir →]

     STEP 7 (completed):
       [🏅 Attestation]  [↓ Convention]  [Voir →]

     DEFAULT (pending / review / rejected / no conv):
       [Voir →]
  */
  function cardButtons(app: Application) {
    const conv = conventions.find(c => c.application_id === app.id);

    /* ── STEP 3 — needs student signature ── */
    if (needsStudentSign(app, conv)) return (
      <>
        <button
          className="sc-btn-download"
          style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe", fontWeight: 700 }}
          onClick={() => setSignTarget({
            appId: app.id, convId: conv!.id, offerTitle: app.title, companyName: app.company,
          })}
        >
          <PenLine size={13} /> Signer
        </button>
        {/* "Voir" opens simple offer details — NOT the workflow modal */}
        <button className="app-view-btn" onClick={() => setDetailsModal(app)}>
          <Eye size={13} /> Voir <ChevronRight size={12} />
        </button>
      </>
    );

    /* ── STEPS 4 & 5 — waiting others ── */
    if (waitingCompany(app, conv) || waitingAdmin(app, conv)) return (
      <button className="app-view-btn" onClick={() => setModal(app)}>
        <Eye size={13} /> Voir <ChevronRight size={12} />
      </button>
    );

    /* ── STEP 7 — completed ── */
    if (isCompleted(app) && convValidated(conv)) return (
      <>
        <button
          className="sc-btn-download"
          style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0", fontWeight: 700 }}
          onClick={() => downloadAttestation(app.id)}
        >
          <Award size={13} /> Attestation
        </button>
        <button className="sc-btn-download" onClick={() => downloadConvention(conv!.id)}>
          <Download size={13} /> Convention
        </button>
        <button className="app-view-btn" onClick={() => setModal(app)}>
          <Eye size={13} /> Voir <ChevronRight size={12} />
        </button>
      </>
    );

    /* ── STEP 6c — report validated, waiting attestation ── */
    if (reportValidatedWaiting(app, conv)) return (
      <>
        <button className="sc-btn-download" onClick={() => downloadConvention(conv!.id)}>
          <Download size={13} /> Convention
        </button>
        <button className="app-view-btn" onClick={() => setModal(app)}>
          <Eye size={13} /> Voir <ChevronRight size={12} />
        </button>
      </>
    );

    /* ── STEP 6b — report submitted, pending validation ── */
    if (reportPending(app, conv)) return (
      <>
        <button className="sc-btn-download" onClick={() => downloadConvention(conv!.id)}>
          <Download size={13} /> Convention
        </button>
        <button className="app-view-btn" onClick={() => setModal(app)}>
          <Eye size={13} /> Voir <ChevronRight size={12} />
        </button>
      </>
    );

    /* ── STEP 6a — convention validated, upload report (NO "Voir" button) ── */
    if (canUploadReport(app, conv)) return (
      <>
        <button
          className="sc-btn-download"
          style={{ background: "#f5f3ff", color: "#6d28d9", borderColor: "#ddd6fe", fontWeight: 700 }}
          onClick={() => setPreviewConvId(conv!.id)}
        >
          <Eye size={13} /> Convention
        </button>
        <button className="sc-btn-download" onClick={() => downloadConvention(conv!.id)}>
          <Download size={13} />
        </button>
        {/* Upload replaces "Voir" as the primary action */}
        <ReportUploadBtn appId={app.id} onRefresh={() => void loadAll()} />
      </>
    );

    /* ── DEFAULT — pending / review / rejected / no convention yet ── */
    return (
      <button className="app-view-btn" onClick={() => setModal(app)}>
        <Eye size={13} /> Voir <ChevronRight size={12} />
      </button>
    );
  }

  /* ════════════════════════════════════════════════════════
     MODAL CTA — buttons inside the full workflow detail popup
     (not shown for step 3 — that uses OfferDetailsModal instead)
  ════════════════════════════════════════════════════════ */
  function modalCTA(app: Application, conv: ConventionRow | undefined) {

    /* Steps 4 & 5 — waiting others */
    if (waitingCompany(app, conv)) return (
      <InfoBadge icon={<Clock size={15} />} text="En attente de la signature de l'entreprise…" />
    );
    if (waitingAdmin(app, conv)) return (
      <InfoBadge icon={<Clock size={15} />} text="En attente de validation par l'administration…" color="var(--sc-purple)" />
    );

    /* Step 7 — completed */
    if (isCompleted(app) && convValidated(conv)) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <button
          className="sc-btn-primary off-apply-full"
          style={{ background: "#16a34a", display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => downloadAttestation(app.id)}
        >
          <Award size={15} /> Télécharger l'attestation de stage
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setPreviewConvId(conv!.id)}
          >
            <Eye size={15} /> Voir la convention
          </button>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => downloadConvention(conv!.id)}
          >
            <Download size={15} /> Télécharger
          </button>
        </div>
      </div>
    );

    /* Step 6c — report validated, waiting attestation */
    if (reportValidatedWaiting(app, conv)) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <InfoBadge icon={<ScrollText size={15} />} text="Rapport validé — en attente de l'attestation" color="#8b5cf6" />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setPreviewConvId(conv!.id)}
          >
            <Eye size={15} /> Voir la convention
          </button>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => downloadConvention(conv!.id)}
          >
            <Download size={15} /> Télécharger
          </button>
        </div>
      </div>
    );

    /* Step 6b — report submitted, waiting company */
    if (reportPending(app, conv)) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <InfoBadge icon={<ScrollText size={15} />} text="Rapport soumis — en attente de validation par l'entreprise" color="#d97706" />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setPreviewConvId(conv!.id)}
          >
            <Eye size={15} /> Voir la convention
          </button>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => downloadConvention(conv!.id)}
          >
            <Download size={15} /> Télécharger
          </button>
        </div>
      </div>
    );

    /* Step 6a — convention validated, upload report
       (upload button is on the card row, but keep it here too for completeness) */
    if (canUploadReport(app, conv)) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ background: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setPreviewConvId(conv!.id)}
          >
            <Eye size={15} /> Voir la convention
          </button>
          <button
            className="sc-btn-primary off-apply-full"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => downloadConvention(conv!.id)}
          >
            <Download size={15} /> Télécharger
          </button>
        </div>
      </div>
    );

    /* Not actionable */
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
        ].map(s => (
          <div className="app-stat-item" key={s.label}>
            <span className="app-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="app-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="app-tabs">
        {TABS.map(t => (
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
                const cfg = statusCfg[app.status];
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
                    <div className="app-row-actions">{cardButtons(app)}</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* ════════════════════════════════════════════════════════
          FULL WORKFLOW MODAL — steps 4, 5, 6, 7
          (centered, not bottom sheet)
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(3px)",
                zIndex: 999,
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                width: "min(640px, 94vw)",
                maxHeight: "88vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: 24,
                boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
                padding: 28,
                display: "flex", flexDirection: "column", gap: 20,
              }}
            >
              {/* Header */}
              <div className="off-modal-header">
                <div className="sc-offer-logo off-modal-logo">{modal.logo}</div>
                <div className="off-modal-title">
                  <h2>{modal.title}</h2>
                  <span>{modal.company} · {modal.wilaya}</span>
                </div>
                <button className="off-modal-close" onClick={() => setModal(null)}><X size={18} /></button>
              </div>

              {/* Badges */}
              <div className="off-modal-badges">
                <span className={`sc-badge ${statusCfg[modal.status].badgeClass}`}>
                  {statusCfg[modal.status].icon} {statusCfg[modal.status].label}
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

              {/* Details */}
              <div className="off-modal-section">
                <h3>Détails</h3>
                <div className="off-modal-details">
                  <div className="off-mdetail"><span>Date de candidature</span><strong>{modal.appliedDate}</strong></div>
                  <div className="off-mdetail"><span>Entreprise</span><strong>{modal.company}</strong></div>
                  <div className="off-mdetail"><span>Localisation</span><strong>{modal.wilaya}</strong></div>
                  <div className="off-mdetail"><span>Statut</span><strong>{statusCfg[modal.status].label}</strong></div>
                  {modalConv && (
                    <div className="off-mdetail">
                      <span>Convention</span>
                      <strong>
                        {modalConv.status === "VALIDATED"        ? "✅ Validée"
                        : modalConv.status === "PENDING_ADMIN"   ? "⏳ En attente admin"
                        : modalConv.status === "PENDING_COMPANY" ? "⏳ En attente entreprise"
                        : modalConv.status === "PENDING_STUDENT" ? "✍️ À signer"
                        : modalConv.status}
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
                {modalCTA(modal, modalConv)}
                <button className="sc-btn-outline" onClick={() => setModal(null)}>Fermer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          OFFER DETAILS MODAL — step 3 "Voir" button (no sign CTA)
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailsModal && (
          <OfferDetailsModal app={detailsModal} onClose={() => setDetailsModal(null)} />
        )}
      </AnimatePresence>

      {/* CONVENTION SIGNING POPUP */}
      {signTarget && (
        <ConventionPopup
          convId={signTarget.convId}
          offerTitle={signTarget.offerTitle}
          companyName={signTarget.companyName}
          onClose={() => setSignTarget(null)}
          onSigned={() => void handleSigned()}
        />
      )}

      {/* CONVENTION PDF PREVIEW */}
      {previewConvId !== null && (
        <ConventionPreviewModal convId={previewConvId} onClose={() => setPreviewConvId(null)} />
      )}

    </DashboardLayout>
  );
};

export default ApplicationsPage;