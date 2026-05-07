// src/pages/company/MyInterns.tsx
import { useState, useEffect } from "react";
import CompanyLayout from "../components/CompanyLayout";
import api from "../api";
import toast from "react-hot-toast";

// ── TYPES ──────────────────────────────────────────────────────────────────
interface Intern {
  application_id: number;
  student_name: string;
  student_email: string;
  offer_title: string;
  application_date: string;
  stage:
    | "convention_to_sign"
    | "convention_pending"
    | "ongoing"
    | "completed"
    | "pending_convention";
  convention_id: number | null;
  convention_status: string | null;
  status?: string;
  stage_state?: string;
  report_file?: string | null;
}

// ── STAGE CONFIG ───────────────────────────────────────────────────────────
const STAGE_CONFIG = {
  pending_convention: {
    label: "En attente",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: "⏳",
    desc: "Convention pas encore générée",
  },
  convention_to_sign: {
    label: "Convention à signer",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: "✍️",
    desc: "En attente de votre signature",
  },
  convention_pending: {
    label: "Convention en cours",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: "📄",
    desc: "En attente de validation",
  },
  ongoing: {
    label: "Stage en cours",
    color: "#22c55e",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: "🎓",
    desc: "Stagiaire actif",
  },
  completed: {
    label: "Terminé",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    icon: "✅",
    desc: "Stage terminé",
  },
};

// ── REPORT POPUP (Fix 1: broken <a> tag fixed) ────────────────────────────
function ReportPopup({
  intern,
  onClose,
  onValidated,
}: {
  intern: Intern;
  onClose: () => void;
  onValidated: () => void;
}) {
  const [validating, setValidating] = useState(false);
  const [done, setDone] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const reportUrl = `http://127.0.0.1:8000/media/${intern.report_file}`;

  const handleValidate = async () => {
    setValidating(true);
    setError("");
    try {
      await api.post(`applications/${intern.application_id}/validate-report/`);
      setDone(true);
      setTimeout(onValidated, 1800);
    } catch {
      setError("Échec de la validation. Réessayez.");
      setValidating(false);
    }
  };

  return (
    <div
      className="conv-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="conv-popup" style={{ maxWidth: 600, width: "95%" }}>
        {/* Header */}
        <div className="conv-head">
          <div className="conv-head-icon">📄</div>
          <div>
            <h3>Rapport de Stage</h3>
            <p>
              {intern.student_name} — {intern.offer_title}
            </p>
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
            <h3>Rapport validé !</h3>
            <p>
              L'administration universitaire sera notifiée pour émettre
              l'attestation de stage.
            </p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              {/* Summary */}
              <div className="conv-summary">
                <div className="conv-summary-item">
                  <span>Stagiaire</span>
                  <strong>{intern.student_name}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Poste</span>
                  <strong>{intern.offer_title}</strong>
                </div>
              </div>

              {/* PDF Preview — Fix 1: <a> tag is now correct */}
              <div style={{ margin: "12px 0" }}>
                <p
                  style={{
                    fontSize: ".8rem",
                    color: "#64748b",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  📎 Rapport soumis par l'étudiant :
                </p>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    overflow: "hidden",
                    height: 320,
                  }}
                >
                  <iframe
                    src={reportUrl}
                    width="100%"
                    height="320"
                    style={{ border: "none" }}
                    title="Rapport de stage"
                  />
                </div>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    fontSize: ".75rem",
                    color: "#3b82f6",
                    textDecoration: "underline",
                  }}
                >
                  Ouvrir dans un nouvel onglet ↗
                </a>
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
                  J'ai lu le rapport et je confirme qu'il est conforme au stage
                  effectué.
                </span>
              </label>

              {error && <div className="conv-error">{error}</div>}
            </div>

            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>
                Fermer
              </button>
              <button
                className={`conv-btn-sign ${agreed ? "conv-btn-sign-ready" : ""}`}
                disabled={!agreed || validating}
                onClick={() => void handleValidate()}
              >
                {validating
                  ? "Validation en cours…"
                  : agreed
                    ? "✅ Valider le rapport"
                    : "Lisez et cochez pour valider"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── INTERN CARD ────────────────────────────────────────────────────────────
function InternCard({
  intern,
  onSignConvention,
  onValidateReport,
}: {
  intern: Intern;
  onSignConvention: (intern: Intern) => void;
  onValidateReport: (intern: Intern) => void;  // Fix 3: accepts Intern not void
}) {
  const cfg = STAGE_CONFIG[intern.stage] ?? STAGE_CONFIG.pending_convention;
  const initial = intern.student_name.charAt(0).toUpperCase();

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
      {/* Stage indicator stripe */}
      <div className="mi-card-stripe" />

      {/* Card content */}
      <div className="mi-card-body">
        {/* Student identity */}
        <div className="mi-student-row">
          <div className="mi-avatar">{initial}</div>
          <div className="mi-student-info">
            <strong>{intern.student_name}</strong>
            <span>{intern.student_email}</span>
          </div>
          <div className="mi-stage-badge">
            <span className="mi-stage-icon">{cfg.icon}</span>
            <span>{cfg.label}</span>
          </div>
        </div>

        {/* Offer info */}
        <div className="mi-offer-row">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          </svg>
          <span>{intern.offer_title}</span>
        </div>

        {/* Convention status */}
        {intern.convention_status && (
          <div className="mi-conv-status">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>
              Convention :{" "}
              {intern.convention_status.replace("_", " ").toLowerCase()}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="mi-date-row">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Candidature acceptée le {intern.application_date}</span>
        </div>
      </div>

      {/* Card footer */}
      <div className="mi-card-footer">
        {intern.stage === "convention_to_sign" && (
          <button
            className="mi-action-btn mi-sign-btn"
            onClick={() => onSignConvention(intern)}
          >
            ✍️ Signer la convention
          </button>
        )}
        {intern.stage === "convention_pending" && (
          <div className="mi-waiting-msg">
            <div className="mi-waiting-dot" />
            En attente des autres signatures…
          </div>
        )}
        {intern.stage === "ongoing" &&
          intern.stage_state !== "report_to_validate" && (
            <div className="mi-ongoing-msg">
              🎓 Stage en cours — Rapport attendu en fin de stage
            </div>
          )}
        {intern.stage === "ongoing" &&
          intern.stage_state === "report_to_validate" && (
            <button
              className="mi-action-btn mi-sign-btn"
              style={{ background: "#f59e0b" }}
              onClick={() => onValidateReport(intern)}
            >
              📄 Valider le rapport de stage
            </button>
          )}
        {intern.stage === "completed" && (
          <div className="mi-done-msg">✅ Stage terminé avec succès</div>
        )}
        {intern.stage === "pending_convention" && (
          <div className="mi-waiting-msg">
            <div className="mi-waiting-dot" />
            En attente de la signature étudiant…
          </div>
        )}
      </div>
    </div>
  );
}

// ── CONVENTION SIGN POPUP ──────────────────────────────────────────────────
function ConventionPopup({
  intern,
  onClose,
  onSigned,
}: {
  intern: Intern;
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
      if (intern.convention_id == null)
        throw new Error("Convention manquante.");
      await api.post(`conventions/${intern.convention_id}/sign/`, {});
      setDone(true);
      setTimeout(onSigned, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur.");
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
            <p>CONV-{String(intern.convention_id).padStart(4, "0")}</p>
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
              Votre signature a été enregistrée. La convention sera transmise à
              l'administration universitaire pour validation finale.
            </p>
          </div>
        ) : (
          <>
            <div className="conv-body">
              <div className="conv-summary">
                <div className="conv-summary-item">
                  <span>Stagiaire</span>
                  <strong>{intern.student_name}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Poste</span>
                  <strong>{intern.offer_title}</strong>
                </div>
                <div className="conv-summary-item">
                  <span>Réf. Convention</span>
                  <strong>
                    CONV-{String(intern.convention_id).padStart(4, "0")}
                  </strong>
                </div>
              </div>

              <div className="conv-explainer">
                <div className="conv-explainer-icon">ℹ️</div>
                <p>
                  En signant cette convention, vous confirmez en tant que
                  représentant de l'entreprise que vous acceptez d'accueillir{" "}
                  <strong>{intern.student_name}</strong> pour un stage portant
                  sur le poste <strong>« {intern.offer_title} »</strong>. Cette
                  signature électronique a valeur juridique équivalente à une
                  signature manuscrite.
                </p>
              </div>

              <div className="conv-chain">
                <div className="conv-chain-step conv-chain-done">
                  <span className="conv-chain-dot">✓</span>
                  <span>Signature étudiant</span>
                </div>
                <div className="conv-chain-line conv-chain-line-active" />
                <div className="conv-chain-step conv-chain-current">
                  <span className="conv-chain-dot conv-chain-pulse" />
                  <span>Votre signature</span>
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
                  tant que représentant légal de l'entreprise.
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

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function MyInterns() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "convention_to_sign" | "ongoing" | "completed"
  >("all");
  const [signTarget, setSignTarget] = useState<Intern | null>(null);
  const [reportTarget, setReportTarget] = useState<Intern | null>(null); // Fix 2 & 4

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("applications/my-interns/");
        const body = data as { error?: boolean; data?: Intern[] };
        if (!body.error && body.data) {
          setInterns(
            body.data.map((row) => ({
              ...row,
              application_date: (row.application_date || "").split("T")[0],
              stage: row.stage ?? "ongoing",
            })),
          );
        } else {
          setInterns([]);
          toast.error("Impossible de charger les stagiaires.");
        }
      } catch {
        setInterns([]);
        toast.error("Impossible de charger les stagiaires.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered =
    activeTab === "all"
      ? interns
      : interns.filter(
          (i) =>
            i.stage === activeTab ||
            (activeTab === "ongoing" && i.stage === "convention_pending"),
        );

  const counts = {
    all: interns.length,
    convention_to_sign: interns.filter((i) => i.stage === "convention_to_sign")
      .length,
    ongoing: interns.filter(
      (i) => i.stage === "ongoing" || i.stage === "convention_pending",
    ).length,
    completed: interns.filter((i) => i.stage === "completed").length,
  };

  const handleSigned = () => {
    if (!signTarget) return;
    setInterns((prev) =>
      prev.map((i) =>
        i.application_id === signTarget.application_id
          ? { ...i, stage: "convention_pending", convention_status: "PENDING_ADMIN" }
          : i,
      ),
    );
    setSignTarget(null);
  };

  // Fix 2: replaced direct API call with state-based handler
  const handleReportValidated = () => {
    if (!reportTarget) return;
    setInterns((prev) =>
      prev.map((i) =>
        i.application_id === reportTarget.application_id
          ? { ...i, stage_state: "report_validated" }
          : i,
      ),
    );
    setReportTarget(null);
  };

  return (
    <CompanyLayout>
      <div className="mi-root">
        {/* Page header */}
        <div className="mi-page-header">
          <div>
            <h2 className="mi-page-title">Mes Stagiaires</h2>
            <p className="mi-page-sub">
              Suivez l'avancement de vos stages — de la convention à
              l'attestation
            </p>
          </div>
          {counts.convention_to_sign > 0 && (
            <div className="mi-urgent-badge">
              <span>✍️</span>
              {counts.convention_to_sign} convention
              {counts.convention_to_sign > 1 ? "s" : ""} à signer
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mi-stats-row">
          {[
            { label: "Total",    val: interns.length,              icon: "👥", color: "#3b82f6" },
            { label: "À signer", val: counts.convention_to_sign,   icon: "✍️", color: "#f59e0b" },
            { label: "En cours", val: counts.ongoing,              icon: "🎓", color: "#22c55e" },
            { label: "Terminés", val: counts.completed,            icon: "✅", color: "#64748b" },
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

        {/* Pipeline */}
        <div className="mi-pipeline">
          {[
            { stage: "convention_to_sign", icon: "✍️", label: "Convention\nà signer",    count: interns.filter((i) => i.stage === "convention_to_sign").length },
            { stage: "convention_pending", icon: "📄", label: "Convention\nen attente",  count: interns.filter((i) => i.stage === "convention_pending").length },
            { stage: "ongoing",            icon: "🎓", label: "Stage\nen cours",         count: interns.filter((i) => i.stage === "ongoing").length },
            { stage: "completed",          icon: "🏆", label: "Stage\nterminé",          count: interns.filter((i) => i.stage === "completed").length },
          ].map((p, i) => (
            <div key={p.stage} className="mi-pipeline-row">
              <div className="mi-pipeline-step">
                <div className="mi-pipeline-icon">{p.icon}</div>
                <div className="mi-pipeline-info">
                  <span className="mi-pipeline-label">{p.label}</span>
                  <strong className="mi-pipeline-count">
                    {p.count} stagiaire{p.count !== 1 ? "s" : ""}
                  </strong>
                </div>
              </div>
              {i < 3 && <div className="mi-pipeline-arrow">→</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mi-tabs">
          {(
            [
              ["all",                "Tous",      counts.all],
              ["convention_to_sign", "À signer",  counts.convention_to_sign],
              ["ongoing",            "En cours",  counts.ongoing],
              ["completed",          "Terminés",  counts.completed],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              className={`mi-tab ${activeTab === key ? "mi-tab-active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              <span className="mi-tab-count">{count}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mi-loading">
            <div className="mi-spinner" />
            <p>Chargement des stagiaires…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="mi-empty">
            <span className="mi-empty-icon">🎓</span>
            <h3>Aucun stagiaire trouvé</h3>
            <p>
              {activeTab === "all"
                ? "Acceptez des candidatures pour voir vos stagiaires ici."
                : "Aucun stagiaire dans cette catégorie."}
            </p>
          </div>
        )}

        {/* Cards grid */}
        {!loading && filtered.length > 0 && (
          <div className="mi-grid">
            {filtered.map((intern, i) => (
              <div key={intern.application_id} style={{ animationDelay: `${i * 60}ms` }}>
                {/* Fix 3: onValidateReport now uses setReportTarget */}
                <InternCard
                  intern={intern}
                  onSignConvention={setSignTarget}
                  onValidateReport={setReportTarget}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Convention signing popup */}
      {signTarget && (
        <ConventionPopup
          intern={signTarget}
          onClose={() => setSignTarget(null)}
          onSigned={handleSigned}
        />
      )}

      {/* Fix 4: Report validation popup is now rendered */}
      {reportTarget && (
        <ReportPopup
          intern={reportTarget}
          onClose={() => setReportTarget(null)}
          onValidated={handleReportValidated}
        />
      )}
    </CompanyLayout>
  );
}