import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../components/DashboardLayout";
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
  Briefcase,
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
    title: row.offer_title || `Offer #${row.offer}`,
    company,
    logo: initials(company),
    wilaya: row.offer_location || "—",
    appliedDate: formatDate(appliedIso),
    status,
    stage_state: row.stage_state ?? "",
    attestation_issued: !!row.attestation_issued_at,
  };
}

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG — matches MyInterns STAGE_CONFIG style
   ══════════════════════════════════════════════════════════ */
const STATUS_CONFIG: Record<
  AppStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
    desc: string;
  }
> = {
  pending: {
    label: "En attente",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: "⏳",
    desc: "Candidature soumise",
  },
  review: {
    label: "En révision",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: "🔍",
    desc: "Examinée par l'entreprise",
  },
  accepted: {
    label: "Acceptée",
    color: "#22c55e",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: "✅",
    desc: "Candidature acceptée",
  },
  rejected: {
    label: "Refusée",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: "❌",
    desc: "Non retenu",
  },
  validated: {
    label: "Validée",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: "🏆",
    desc: "Stage validé",
  },
};

const tabs: { key: AppStatus | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "review", label: "En révision" },
  { key: "accepted", label: "Acceptées" },
  { key: "validated", label: "Validées" },
  { key: "rejected", label: "Refusées" },
];
/* ══════════════════════════════════════════════════════════
   REPORT SECTION
   ══════════════════════════════════════════════════════════ */
function ReportSection({
  appId,
  onRefresh,
}: {
  appId: number;
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = React.useState(false);
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
      toast.success("Rapport soumis !");
      onRefresh();
    } catch {
      toast.error("Échec de l'envoi du rapport.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 8, width: "100%" }}>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        ref={fileRef}
        style={{ display: "none" }}
        onChange={handleUpload}
      />
      <button
        className="mi-action-btn mi-sign-btn"
        style={{ background: "#8b5cf6" }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        📄 {uploading ? "Envoi en cours…" : "Soumettre le rapport de stage"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONVENTION SIGNING POPUP — same as MyInterns ConventionPopup
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
              {/* Summary */}
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

              {/* Explanation */}
              <div className="conv-explainer">
                <div className="conv-explainer-icon">ℹ️</div>
                <p>
                  En signant cette convention, vous confirmez votre accord pour
                  effectuer le stage <strong>« {offerTitle} »</strong> chez{" "}
                  <strong>{companyName}</strong>. Cette signature électronique a
                  valeur juridique équivalente à une signature manuscrite.
                </p>
              </div>

              {/* Signature chain — student signs first */}
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

              {/* Checkbox */}
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
   APPLICATION CARD — mirrors InternCard from MyInterns
   ══════════════════════════════════════════════════════════ */
function ApplicationCard({
  app,
  conv,
  onSignConvention,
  onDownload,
  onPreview,
  onRefresh,
  onDownloadAttestation,
}: {
  app: Application;
  conv: ConventionRow | undefined;
  onSignConvention: (app: Application, conv: ConventionRow) => void;
  onDownload: (convId: number) => void;
  onPreview: (convId: number) => void;
  onRefresh: () => void;
  onDownloadAttestation: (appId: number) => void;
}) {
  const cfg = STATUS_CONFIG[app.status];
  const initial = app.logo;

  /* Convention status label */
  const convLabel = () => {
    if (!conv) return null;
    if (!conv.student_signed)
      return {
        text: "✍️ En attente de votre signature",
        color: "#f59e0b",
        bg: "#fffbeb",
      };
    if (!conv.company_signed)
      return {
        text: "📄 En attente de la signature entreprise",
        color: "#1e40af",
        bg: "#eff6ff",
      };
    if (!conv.admin_validated)
      return {
        text: "🏛️ En attente de validation admin",
        color: "#5b21b6",
        bg: "#f5f3ff",
      };
    return { text: "✅ Convention validée", color: "#14532d", bg: "#f0fdf4" };
  };
  const cl = convLabel();

  return (
    <div
      className="mi-card"
      style={
        {
          "--stage-color": cfg.color,
          "--stage-bg": cfg.bg,
          "--stage-border": cfg.border,
        } as React.CSSProperties
      }
    >
      {/* Colored stripe */}
      <div className="mi-card-stripe" />

      <div className="mi-card-body">
        {/* Student / company identity row */}
        <div className="mi-student-row">
          <div
            className="mi-avatar"
            style={{
              background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}aa)`,
            }}
          >
            {initial}
          </div>
          <div className="mi-student-info">
            <strong>{app.title}</strong>
            <span>{app.company}</span>
          </div>
          <div className="mi-stage-badge">
            <span className="mi-stage-icon">{cfg.icon}</span>
            <span>{cfg.label}</span>
          </div>
        </div>

        {/* Location row */}
        <div className="mi-offer-row">
          <MapPin size={13} />
          <span>{app.wilaya}</span>
        </div>

        {/* Applied date */}
        <div className="mi-date-row">
          <Calendar size={13} />
          <span>Candidature déposée le {app.appliedDate}</span>
        </div>

        {/* Convention status badge */}
        {cl && (
          <div
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 20,
              background: cl.bg,
              color: cl.color,
              fontWeight: 600,
              display: "inline-block",
              marginTop: 4,
            }}
          >
            {cl.text}
          </div>
        )}
      </div>

      {/* Footer action — mirrors InternCard exactly */}
      <div className="mi-card-footer">
        {/* ACCEPTED + convention needs student signature */}
        {app.status === "accepted" && conv && !conv.student_signed && (
          <button
            className="mi-action-btn mi-sign-btn"
            onClick={() => onSignConvention(app, conv)}
          >
            ✍️ Signer la convention
          </button>
        )}

        {/* Waiting for company */}
        {conv && conv.student_signed && !conv.company_signed && (
          <div className="mi-waiting-msg">
            <div className="mi-waiting-dot" />
            En attente de la signature entreprise…
          </div>
        )}

        {/* Waiting for admin */}
        {conv && conv.company_signed && !conv.admin_validated && (
          <div className="mi-waiting-msg">
            <div className="mi-waiting-dot" />
            En attente de la validation administration…
          </div>
        )}

        {/* Accepted but no convention yet */}
        {app.status === "accepted" && !conv && (
          <div className="mi-waiting-msg">
            <div className="mi-waiting-dot" />
            Convention en cours de préparation…
          </div>
        )}

        {/* Pending / review */}
        {(app.status === "pending" || app.status === "review") && (
          <div className="mi-waiting-msg">
            <div className="mi-waiting-dot" />
            {cfg.desc}
          </div>
        )}

        {/* Rejected */}
        {app.status === "rejected" && (
          <div className="mi-done-msg" style={{ color: "#ef4444" }}>
            ❌ Candidature non retenue
          </div>
        )}

        {/* Validated + download */}
        {/* Validated + download */}
        {app.status === "validated" && conv?.admin_validated && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
            }}
          >
            <button
              className="mi-action-btn mi-sign-btn"
              style={{ background: "#3b82f6" }}
              onClick={() => onPreview(conv!.id)}
            >
              <Eye size={14} /> Voir la convention
            </button>
            <button
              className="mi-action-btn mi-sign-btn"
              style={{ background: "#0f4c99" }}
              onClick={() => onDownload(conv!.id)}
            >
              <Download size={14} /> Télécharger la convention
            </button>

            {app.attestation_issued ? (
              <button
                className="mi-action-btn mi-sign-btn"
                style={{ background: "#22c55e" }}
                onClick={() => onDownloadAttestation(app.id)}
              >
                🏅 Télécharger l'attestation de stage
              </button>
            ) : (
              <ReportSection appId={app.id} onRefresh={onRefresh} />
            )}
          </div>
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

  return (
    <DashboardLayout pageTitle="Mes Candidatures">
      {/* ── HERO ── */}
      <div className="page-hero applications-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Mes Candidatures</h1>
          <p>Suivez vos candidatures et signez vos conventions de stage</p>
        </div>
      </div>

      {/* ── STATS ROW — same as MyInterns mi-stats-row ── */}
      <div className="mi-stats-row" style={{ marginBottom: 20 }}>
        {[
          { label: "Total", val: counts.all, icon: "📋", color: "#3b82f6" },
          {
            label: "En attente",
            val: counts.pending,
            icon: "⏳",
            color: "#f59e0b",
          },
          {
            label: "En révision",
            val: counts.review,
            icon: "🔍",
            color: "#8b5cf6",
          },
          {
            label: "Acceptées",
            val: counts.accepted,
            icon: "✅",
            color: "#22c55e",
          },
          {
            label: "Validées",
            val: counts.validated,
            icon: "🏆",
            color: "#3b82f6",
          },
          {
            label: "Refusées",
            val: counts.rejected,
            icon: "❌",
            color: "#ef4444",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="mi-stat"
            style={{ "--stat-color": s.color } as React.CSSProperties}
          >
            <span className="mi-stat-icon">{s.icon}</span>
            <strong className="mi-stat-val">{s.val}</strong>
            <span className="mi-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS — same as MyInterns mi-tabs ── */}
      <div className="mi-tabs" style={{ marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`mi-tab ${activeTab === t.key ? "mi-tab-active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="mi-tab-count">{counts[t.key]}</span>
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

      {/* ── EMPTY ── */}
      {!loading && filtered.length === 0 && (
        <div className="mi-empty">
          <span className="mi-empty-icon">
            <Briefcase size={40} strokeWidth={1.5} />
          </span>
          <h3>Aucune candidature trouvée</h3>
          <p>
            {activeTab === "all"
              ? "Vous n'avez pas encore postulé à des offres."
              : "Aucune candidature dans cette catégorie."}
          </p>
        </div>
      )}

      {/* ── CARDS GRID — same mi-grid as MyInterns ── */}
      {!loading && filtered.length > 0 && (
        <div className="mi-grid">
          {filtered.map((app, i) => {
            const conv = conventions.find((c) => c.application_id === app.id);

            return (
              <div key={app.id} style={{ animationDelay: `${i * 60}ms` }}>
                <ApplicationCard
                  app={app}
                  conv={conv}
                  onSignConvention={(a, c) =>
                    setSignTarget({ app: a, conv: c })
                  }
                  onDownload={handleDownloadConvention}
                  onPreview={handlePreviewConvention}
                  onRefresh={loadAll}
                  onDownloadAttestation={handleDownloadAttestation}
                />
              </div>
            );
          })}
        </div>
      )}

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
