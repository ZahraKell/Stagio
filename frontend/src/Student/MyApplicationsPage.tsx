import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  ChevronRight,
  X,
  Briefcase,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */
type AppStatus = "pending" | "review" | "accepted" | "rejected" | "validated";

interface Application {
  id: number;
  offerId: number;
  title: string;
  company: string;
  logo: string;
  wilaya: string;
  appliedDate: string;
  status: AppStatus;
  stage_state: string;
  attestation_issued: boolean;
  has_report: boolean;
  has_uploaded_convention: boolean;
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
  has_report?: boolean;
  has_uploaded_convention?: boolean;
};

interface OfferDetail {
  id: number;
  title: string;
  company_name?: string;
  town?: string;
  duration?: string;
  internship_type?: string;
  description?: string;
  is_paid?: boolean;
  salary?: string | null;
  tech_stack?: string | null;
  skills?: string | null;
  deadline?: string | null;
  field?: string | null;
}

type RowActions = {
  enAttente?: boolean;
  signConvention?: boolean;
  uploadConvention?: boolean;
  uploadReport?: boolean;
  uploadAttestation?: boolean;
  downloadAttestation?: boolean;
  viewOffer?: boolean;
  viewConvention?: boolean;
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
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  const status = mapBackendStatus(row.status ?? "pending");
  return {
    id: row.id,
    offerId: row.offer,
    title: row.offer_title || `Offer #${row.offer}`,
    company,
    logo: initials(company),
    wilaya: row.offer_location || "—",
    appliedDate: formatDate(appliedIso),
    status,
    stage_state: row.stage_state ?? "",
    attestation_issued: !!row.attestation_issued_at,
    has_report: !!row.has_report || !!row.report_submitted_at,
    has_uploaded_convention: !!row.has_uploaded_convention,
    report_validated: !!row.report_validated_at,
  };
}

function conventionReady(conv: ConventionRow | undefined): boolean {
  return !!(
    conv &&
    conv.student_signed &&
    conv.company_signed &&
    conv.admin_validated
  );
}

function resolveRowActions(
  app: Application,
  conv: ConventionRow | undefined,
): RowActions {
  if (app.status === "rejected") {
    return { viewOffer: true };
  }

  if (app.status === "pending" || app.status === "review") {
    return { enAttente: true, viewOffer: true };
  }

  if (app.status === "accepted" && conv && !conv.student_signed) {
    return { signConvention: true, viewOffer: true };
  }

  if (
    app.status === "accepted" &&
    conv &&
    conv.student_signed &&
    !conv.admin_validated
  ) {
    return { enAttente: true, viewOffer: true };
  }

  if (app.stage_state === "report_to_validate") {
    return { enAttente: true, viewConvention: true };
  }

  if (app.stage_state === "report_validated" && !app.attestation_issued) {
    return {
      uploadAttestation: true,
      uploadConvention: true,
      viewConvention: true,
    };
  }

  if (app.attestation_issued) {
    return {
      downloadAttestation: true,
      viewConvention: true,
    };
  }

  const postSign =
    conventionReady(conv) ||
    app.status === "validated" ||
    app.stage_state === "internship_in_progress" ||
    app.stage_state === "validated";

  if (postSign && !app.has_report) {
    return {
      uploadConvention: true,
      uploadReport: true,
      viewConvention: true,
    };
  }

  if (postSign && app.has_report) {
    return { enAttente: true, viewConvention: true };
  }

  if (app.status === "accepted") {
    return { enAttente: true, viewOffer: true };
  }

  return { viewOffer: true };
}

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG
   ══════════════════════════════════════════════════════════ */
const statusConfig: Record<
  AppStatus,
  { label: string; badgeClass: string; icon: React.ReactNode; color: string }
> = {
  pending: { label: "Pending", badgeClass: "sc-badge-pending", icon: <Clock size={14} />, color: "var(--sc-warn)" },
  review: { label: "In Review", badgeClass: "sc-badge-review", icon: <AlertCircle size={14} />, color: "var(--sc-purple)" },
  accepted: { label: "Accepted", badgeClass: "sc-badge-accepted", icon: <CheckCircle2 size={14} />, color: "var(--sc-green)" },
  validated: { label: "Validated", badgeClass: "sc-badge-validated", icon: <CheckCircle2 size={14} />, color: "var(--sc-blue)" },
  rejected: { label: "Rejected", badgeClass: "sc-badge-rejected", icon: <XCircle size={14} />, color: "var(--sc-red)" },
};

const tabs: { key: AppStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "review", label: "In Review" },
  { key: "accepted", label: "Accepted" },
  { key: "validated", label: "Validated" },
  { key: "rejected", label: "Rejected" },
];

/* ── build a timeline from real convention/application state ── */
function buildTimeline(app: Application, conv: ConventionRow | undefined) {
  return [
    { label: "Application submitted", date: app.appliedDate, done: true },
    {
      label: "Under review",
      date: "—",
      done: app.status === "review" || app.status === "accepted" || app.status === "validated",
    },
    {
      label: app.status === "rejected" ? "Not selected" : "Accepted",
      date: "—",
      done: app.status === "accepted" || app.status === "validated" || app.status === "rejected",
    },
    {
      label: "Convention signed",
      date: "—",
      done: !!conv && conv.student_signed && conv.company_signed && conv.admin_validated,
    },
    {
      label: "Internship validated",
      date: "—",
      done: app.status === "validated",
    },
  ];
}

/* ══════════════════════════════════════════════════════════
   CENTERED MODAL SHELL
   ══════════════════════════════════════════════════════════ */
function CenteredModal({
  onClose,
  children,
  wide,
}: {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <motion.div
      className="app-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`app-modal${wide ? " app-modal-wide" : ""}`}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   OFFER DETAIL MODAL
   ══════════════════════════════════════════════════════════ */
function OfferDetailModal({
  offerId,
  fallback,
  onClose,
}: {
  offerId: number;
  fallback: Application;
  onClose: () => void;
}) {
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<OfferDetail>(`offers/${offerId}/`)
      .then((res) => setOffer(res.data))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false));
  }, [offerId]);

  const title = offer?.title ?? fallback.title;
  const company = offer?.company_name ?? fallback.company;
  const town = offer?.town ?? fallback.wilaya;

  return (
    <CenteredModal onClose={onClose}>
      <motion.div
        className="off-modal-header"
        style={{ margin: 0, padding: 0, border: "none" }}
      >
        <motion.div className="sc-offer-logo off-modal-logo">
          {initials(company)}
        </motion.div>
        <motion.div className="off-modal-title">
          <h2>{title}</h2>
          <span>
            {company} · {town}
          </span>
        </motion.div>
        <button type="button" className="off-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
      </motion.div>

      {loading ? (
        <p style={{ color: "var(--sc-muted)", fontSize: 13 }}>Chargement…</p>
      ) : (
        <>
          <motion.div className="off-modal-badges">
            <span className={`sc-badge ${statusConfig[fallback.status].badgeClass}`}>
              {statusConfig[fallback.status].icon}{" "}
              {statusConfig[fallback.status].label}
            </span>
            {offer?.duration && (
              <span className="off-mpill">
                <Clock size={12} /> {offer.duration}
              </span>
            )}
            {offer?.deadline && (
              <span className="off-mpill">
                <Calendar size={12} /> Clôture {formatDate(offer.deadline)}
              </span>
            )}
          </motion.div>

          <motion.div className="off-modal-section">
            <h3>Description</h3>
            <p>{offer?.description || "Aucune description disponible."}</p>
          </motion.div>

          <motion.div className="off-modal-details">
            <motion.div className="off-mdetail">
              <span>Type</span>
              <strong>{offer?.internship_type || "—"}</strong>
            </motion.div>
            <motion.div className="off-mdetail">
              <span>Rémunération</span>
              <strong>
                {offer?.is_paid
                  ? offer.salary || "Rémunéré"
                  : "Non rémunéré"}
              </strong>
            </motion.div>
            <motion.div className="off-mdetail">
              <span>Domaine</span>
              <strong>{offer?.field || "—"}</strong>
            </motion.div>
            <motion.div className="off-mdetail">
              <span>Technologies</span>
              <strong>{offer?.tech_stack || offer?.skills || "—"}</strong>
            </motion.div>
          </motion.div>
        </>
      )}

      <motion.div className="off-modal-cta">
        <button type="button" className="sc-btn-outline" onClick={onClose}>
          Fermer
        </button>
      </motion.div>
    </CenteredModal>
  );
}

/* ══════════════════════════════════════════════════════════
   FILE UPLOAD BUTTON
   ══════════════════════════════════════════════════════════ */
function FileUploadBtn({
  label,
  accept,
  uploading,
  onPick,
}: {
  label: string;
  accept: string;
  uploading: boolean;
  onPick: (file: File) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        type="file"
        accept={accept}
        ref={ref}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="sc-btn-download"
        disabled={uploading}
        onClick={() => ref.current?.click()}
      >
        <FileText size={13} /> {uploading ? "Envoi…" : label}
      </button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   ROW ACTION BUTTONS
   ══════════════════════════════════════════════════════════ */
function AppRowActions({
  app,
  conv,
  actions,
  uploading,
  onSign,
  onViewOffer,
  onViewConvention,
  onUploadConvention,
  onUploadReport,
  onUploadAttestation,
  onDownloadAttestation,
}: {
  app: Application;
  conv?: ConventionRow;
  actions: RowActions;
  uploading: string | null;
  onSign: () => void;
  onViewOffer: () => void;
  onViewConvention: () => void;
  onUploadConvention: (file: File) => void;
  onUploadReport: (file: File) => void;
  onUploadAttestation: (file: File) => void;
  onDownloadAttestation: () => void;
}) {
  return (
    <motion.div className="app-row-actions">
      {actions.enAttente && (
        <button type="button" className="app-btn-wait" disabled>
          <Clock size={13} /> En attente
        </button>
      )}
      {actions.signConvention && conv && (
        <button type="button" className="sc-btn-download" onClick={onSign}>
          ✍️ Signer convention
        </button>
      )}
      {actions.uploadConvention && (
        <FileUploadBtn
          label={
            app.has_uploaded_convention
              ? "Convention envoyée"
              : "Téléverser convention"
          }
          accept=".pdf"
          uploading={uploading === `conv-${app.id}`}
          onPick={onUploadConvention}
        />
      )}
      {actions.uploadReport && (
        <FileUploadBtn
          label="Téléverser rapport"
          accept=".pdf,.doc,.docx"
          uploading={uploading === `report-${app.id}`}
          onPick={onUploadReport}
        />
      )}
      {actions.uploadAttestation && (
        <FileUploadBtn
          label="Téléverser attestation"
          accept=".pdf"
          uploading={uploading === `att-${app.id}`}
          onPick={onUploadAttestation}
        />
      )}
      {actions.downloadAttestation && (
        <button
          type="button"
          className="sc-btn-download"
          onClick={onDownloadAttestation}
        >
          <Download size={13} /> Attestation
        </button>
      )}
      {actions.viewConvention && conv && (
        <button
          type="button"
          className="app-view-btn"
          onClick={onViewConvention}
        >
          <Eye size={14} /> Voir
        </button>
      )}
      {actions.viewOffer && (
        <button type="button" className="app-view-btn" onClick={onViewOffer}>
          <Eye size={14} /> Voir <ChevronRight size={13} />
        </button>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONVENTION SIGNING POPUP
   ══════════════════════════════════════════════════════════ */
function ConventionPopup({
  conventionId,
  studentName,
  offerTitle,
  companyName,
  onClose,
  onSigned,
}: {
  conventionId: number;
  studentName: string;
  offerTitle: string;
  companyName: string;
  onClose: () => void;
  onSigned: () => void;
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
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg || "Erreur lors de la signature.");
      setSigning(false);
    }
  };

  return (
    <div
      className="conv-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="conv-popup">
        {/* Header */}
        <div className="conv-head">
          <div className="conv-head-icon">📋</div>
          <div>
            <h3>Convention de Stage</h3>
            <p>CONV-{String(conventionId).padStart(4, "0")}</p>
          </div>
          {!done && (
            <button className="conv-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        {done ? (
          <div className="conv-success">
            <div className="conv-success-icon">✅</div>
            <h3>Convention signée !</h3>
            <p>
              Votre signature a été enregistrée. L'entreprise recevra une
              notification pour signer à son tour.
            </p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              <div className="conv-summary">
                <div className="conv-summary-item">
                  <span>Stagiaire</span>
                  <strong>{studentName || "Vous"}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Entreprise</span>
                  <strong>{companyName}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Réf. Convention</span>
                  <strong>CONV-{String(conventionId).padStart(4, "0")}</strong>
                </div>
              </div>

              <div className="conv-explainer">
                <div className="conv-explainer-icon">ℹ️</div>
                <p>
                  En signant cette convention, vous confirmez votre accord pour
                  effectuer le stage <strong>« {offerTitle} »</strong> chez{" "}
                  <strong>{companyName}</strong>. Cette signature électronique a
                  valeur juridique équivalente à une signature manuscrite.
                </p>
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
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="conv-check-box" />
                <span>
                  Je certifie avoir lu la convention et j'accepte ses termes en
                  tant que stagiaire.
                </span>
              </label>

              {error && <div className="conv-error">{error}</div>}
            </div>

            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>
                Plus tard
              </button>
              <button
                className={`conv-btn-sign ${agreed ? "conv-btn-sign-ready" : ""}`}
                disabled={!agreed || signing}
                onClick={() => void handleSign()}
              >
                {signing
                  ? "Signature en cours…"
                  : agreed
                    ? "✍️  Je signe la convention"
                    : "Cochez la case pour signer"}
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
const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [conventions, setConventions] = useState<ConventionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppStatus | "all">("all");
  const [offerModal, setOfferModal] = useState<Application | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [signTarget, setSignTarget] = useState<{
    app: Application;
    conv: ConventionRow;
  } | null>(null);

  /* ── Load data ── */
  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        error?: boolean;
        data?: ApiMyApplicationRow[];
      }>("applications/my-applications/");
      const rows = res.data?.error ? [] : (res.data?.data ?? []);
      setApplications(rows.map(mapRow));
    } catch {
      toast.error("Impossible de charger les candidatures.");
    }

    try {
      const cRes = await api.get<{ error?: boolean; data?: ConventionRow[] }>(
        "conventions/mine/",
      );
      setConventions(cRes.data?.error ? [] : (cRes.data?.data ?? []));
    } catch {
      // silent — conventions may not exist yet
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  /* ── Derived ── */
  const filtered = useMemo(
    () =>
      activeTab === "all"
        ? applications
        : applications.filter((a) => a.status === activeTab),
    [activeTab, applications],
  );

  const counts = useMemo(
    () => ({
      all: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      review: applications.filter((a) => a.status === "review").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      validated: applications.filter((a) => a.status === "validated").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications],
  );

  /* ── Actions (unchanged API logic) ── */
  const handleSigned = async () => {
    setSignTarget(null);
    await loadAll();
    toast.success("Convention signée !");
  };

  const handleDownloadConvention = async (convId: number) => {
    try {
      const response = await api.get(`conventions/${convId}/download/`, {
        responseType: "blob",
      });
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
      const response = await api.get(`conventions/${convId}/download/`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("Impossible d'afficher la convention.");
    }
  };

  const handleDownloadAttestation = async (appId: number) => {
    try {
      const response = await api.get(`applications/${appId}/attestation/`, {
        responseType: "blob",
      });
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

  const handleUploadConvention = async (appId: number, file: File) => {
    setUploading(`conv-${appId}`);
    try {
      const form = new FormData();
      form.append("convention_file", file);
      await api.post(`applications/${appId}/upload-convention/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Convention téléversée.");
      await loadAll();
    } catch {
      toast.error("Échec du téléversement de la convention.");
    } finally {
      setUploading(null);
    }
  };

  const handleUploadReport = async (appId: number, file: File) => {
    setUploading(`report-${appId}`);
    try {
      const form = new FormData();
      form.append("report_file", file);
      await api.post(`applications/${appId}/submit-report/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Rapport soumis à l'entreprise.");
      await loadAll();
    } catch {
      toast.error("Échec de l'envoi du rapport.");
    } finally {
      setUploading(null);
    }
  };

  const handleUploadAttestation = async (appId: number, file: File) => {
    setUploading(`att-${appId}`);
    try {
      const form = new FormData();
      form.append("attestation_file", file);
      await api.post(`applications/${appId}/upload-attestation/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Attestation téléversée.");
      await loadAll();
    } catch {
      toast.error("Échec du téléversement de l'attestation.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <DashboardLayout pageTitle="My Applications">

      {/* ── HERO ── */}
      <div className="page-hero applications-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>My Applications</h1>
          <p>Track every application, monitor status updates, and download your conventions</p>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div className="app-stat-strip">
        {[
          { label: "Total", value: counts.all, color: "var(--sc-blue)" },
          { label: "Pending", value: counts.pending, color: "var(--sc-warn)" },
          { label: "In Review", value: counts.review, color: "var(--sc-purple)" },
          { label: "Accepted", value: counts.accepted, color: "var(--sc-green)" },
          { label: "Validated", value: counts.validated, color: "var(--sc-blue)" },
          { label: "Rejected", value: counts.rejected, color: "var(--sc-red)" },
        ].map((s) => (
          <div className="app-stat-item" key={s.label}>
            <span className="app-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="app-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
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

      {/* ── LOADING ── */}
      {loading && (
        <div className="mi-loading">
          <div className="mi-spinner" />
          <p>Chargement des candidatures…</p>
        </div>
      )}

      {/* ── LIST ── */}
      {!loading && (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              className="mi-empty"
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="mi-empty-icon">
                <Briefcase size={40} strokeWidth={1.5} />
              </span>
              <h3>Aucune candidature trouvée</h3>
              <p>
                {activeTab === "all"
                  ? "Vous n'avez pas encore postulé à des offres."
                  : "Aucune candidature dans cette catégorie."}
              </p>
            </motion.div>
          ) : (
            <div className="app-list" key="list">
              {filtered.map((app, i) => {
                const cfg = statusConfig[app.status];
                const conv = conventions.find((c) => c.application_id === app.id);
                const actions = resolveRowActions(app, conv);

                return (
                  <motion.div
                    key={app.id}
                    className="app-row"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22, delay: i * 0.05 }}
                  >
                    {/* Status bar on left */}
                    <div className="app-row-bar" style={{ background: cfg.color }} />

                    {/* Logo */}
                    <div className="sc-offer-logo app-logo">{app.logo}</div>

                    {/* Info */}
                    <div className="app-row-info">
                      <div className="app-row-top">
                        <h4>{app.title}</h4>
                        <span className={`sc-badge ${cfg.badgeClass}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div className="app-row-meta">
                        <span><Building2 size={12} />{app.company}</span>
                        <span><MapPin size={12} />{app.wilaya}</span>
                        <span><Calendar size={12} />Applied {app.appliedDate}</span>
                      </div>
                    </div>

                    <AppRowActions
                      app={app}
                      conv={conv}
                      actions={actions}
                      uploading={uploading}
                      onSign={() => conv && setSignTarget({ app, conv })}
                      onViewOffer={() => setOfferModal(app)}
                      onViewConvention={() =>
                        conv && void handlePreviewConvention(conv.id)
                      }
                      onUploadConvention={(file) =>
                        void handleUploadConvention(app.id, file)
                      }
                      onUploadReport={(file) =>
                        void handleUploadReport(app.id, file)
                      }
                      onUploadAttestation={(file) =>
                        void handleUploadAttestation(app.id, file)
                      }
                      onDownloadAttestation={() =>
                        void handleDownloadAttestation(app.id)
                      }
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {offerModal && (
          <OfferDetailModal
            offerId={offerModal.offerId}
            fallback={offerModal}
            onClose={() => setOfferModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ── CONVENTION SIGNING POPUP ── */}
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