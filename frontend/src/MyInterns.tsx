// src/pages/company/MyInterns.tsx
import { useState, useEffect } from "react";
import CompanyLayout from "./components/CompanyLayout";

// ── TYPES ──────────────────────────────────────────────────
interface Intern {
  application_id:    number;
  student_name:      string;
  student_email:     string;
  offer_title:       string;
  application_date:  string;
  stage:             "convention_to_sign" | "convention_pending" | "ongoing" | "completed" | "pending_convention";
  convention_id:     number | null;
  convention_status: string | null;
}

// ── STAGE CONFIG ───────────────────────────────────────────
const STAGE_CONFIG = {
  pending_convention: {
    label:   "En attente",
    color:   "#f59e0b",
    bg:      "#fffbeb",
    border:  "#fde68a",
    icon:    "⏳",
    desc:    "Convention pas encore générée",
  },
  convention_to_sign: {
    label:   "Convention à signer",
    color:   "#3b82f6",
    bg:      "#eff6ff",
    border:  "#bfdbfe",
    icon:    "✍️",
    desc:    "En attente de votre signature",
  },
  convention_pending: {
    label:   "Convention en cours",
    color:   "#8b5cf6",
    bg:      "#f5f3ff",
    border:  "#ddd6fe",
    icon:    "📄",
    desc:    "En attente de validation",
  },
  ongoing: {
    label:   "Stage en cours",
    color:   "#22c55e",
    bg:      "#f0fdf4",
    border:  "#bbf7d0",
    icon:    "🎓",
    desc:    "Stagiaire actif",
  },
  completed: {
    label:   "Terminé",
    color:   "#64748b",
    bg:      "#f8fafc",
    border:  "#e2e8f0",
    icon:    "✅",
    desc:    "Stage terminé",
  },
};

// ── INTERN CARD ────────────────────────────────────────────
function InternCard({
  intern,
  onSignConvention,
}: {
  intern:            Intern;
  onSignConvention:  (intern: Intern) => void;
}) {
  const cfg = STAGE_CONFIG[intern.stage] ?? STAGE_CONFIG.pending_convention;
  const initial = intern.student_name.charAt(0).toUpperCase();

  return (
    <div
      className="mi-card"
      style={{
        "--stage-color":  cfg.color,
        "--stage-bg":     cfg.bg,
        "--stage-border": cfg.border,
      } as React.CSSProperties}
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
          <span>{intern.offer_title}</span>
        </div>

        {/* Convention status */}
        {intern.convention_status && (
          <div className="mi-conv-status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Convention : {intern.convention_status.replace("_", " ").toLowerCase()}</span>
          </div>
        )}

        {/* Date */}
        <div className="mi-date-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Candidature acceptée le {intern.application_date}</span>
        </div>

      </div>

      {/* Card footer — action */}
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
        {intern.stage === "ongoing" && (
          <div className="mi-ongoing-msg">
            🎓 Stage en cours — Rapport attendu en fin de stage
          </div>
        )}
        {intern.stage === "completed" && (
          <div className="mi-done-msg">
            ✅ Stage terminé avec succès
          </div>
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

// ── CONVENTION SIGN POPUP ──────────────────────────────────
function ConventionPopup({
  intern,
  onClose,
  onSigned,
}: {
  intern:   Intern;
  onClose:  () => void;
  onSigned: () => void;
}) {
  const token   = localStorage.getItem("access_token");
  const [signing, setSigning] = useState(false);
  const [agreed,  setAgreed]  = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  const handleSign = async () => {
    if (!agreed) return;
    setSigning(true);
    setError("");
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/conventions/${intern.convention_id}/sign/`,
        {
          method:  "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la signature.");
      setDone(true);
      setTimeout(onSigned, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur.");
      setSigning(false);
    }
  };

  return (
    <div className="conv-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="conv-popup">

        {/* Header */}
        <div className="conv-head">
          <div className="conv-head-icon">📋</div>
          <div>
            <h3>Convention de Stage</h3>
            <p>CONV-{String(intern.convention_id).padStart(4, "0")}</p>
          </div>
          {!done && (
            <button className="conv-close" onClick={onClose}>✕</button>
          )}
        </div>

        {done ? (
          /* Success state */
          <div className="conv-success">
            <div className="conv-success-icon">✅</div>
            <h3>Convention signée !</h3>
            <p>
              Votre signature a été enregistrée. La convention sera
              transmise à l'administration universitaire pour validation finale.
            </p>
          </div>
        ) : (
          <>
            {/* Convention summary */}
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
                  <strong>CONV-{String(intern.convention_id).padStart(4, "0")}</strong>
                </div>
              </div>

              {/* Explanation */}
              <div className="conv-explainer">
                <div className="conv-explainer-icon">ℹ️</div>
                <p>
                  En signant cette convention, vous confirmez en tant que représentant
                  de l'entreprise que vous acceptez d'accueillir{" "}
                  <strong>{intern.student_name}</strong> pour un stage portant sur le
                  poste <strong>« {intern.offer_title} »</strong>.
                  Cette signature électronique a valeur juridique équivalente à une
                  signature manuscrite.
                </p>
              </div>

              {/* Signature chain */}
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

              {/* Agreement checkbox */}
              <label className="conv-agree">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                />
                <span className="conv-check-box" />
                <span>
                  Je certifie avoir lu la convention et j'accepte ses termes
                  en tant que représentant légal de l'entreprise.
                </span>
              </label>

              {error && <div className="conv-error">{error}</div>}
            </div>

            {/* Footer */}
            <div className="conv-footer">
              <button className="conv-btn-cancel" onClick={onClose}>
                Plus tard
              </button>
              <button
                className={`conv-btn-sign ${agreed ? "conv-btn-sign-ready" : ""}`}
                disabled={!agreed || signing}
                onClick={handleSign}
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

// ── MAIN PAGE ──────────────────────────────────────────────
export default function MyInterns() {
  const token = localStorage.getItem("access_token");

  const [interns,    setInterns]    = useState<Intern[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<"all" | "convention_to_sign" | "ongoing" | "completed">("all");
  const [signTarget, setSignTarget] = useState<Intern | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/applications/my-interns/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (!d.error && d.data) setInterns(d.data);
        else throw new Error();
      })
      .catch(() => {
        // Mock data
        setInterns([
          { application_id: 1, student_name: "Sara Meziane",  student_email: "sara.m@usthb.edu.dz",   offer_title: "Data Analyst",         application_date: "2026-04-20", stage: "convention_to_sign", convention_id: 1,    convention_status: "PENDING_COMPANY" },
          { application_id: 2, student_name: "Youcef Ould",   student_email: "y.ould@esi.edu.dz",      offer_title: "Développeur Django",    application_date: "2026-04-18", stage: "ongoing",            convention_id: 2,    convention_status: "VALIDATED"       },
          { application_id: 3, student_name: "Meriem Aït",    student_email: "m.ait@ummto.edu.dz",     offer_title: "Développeur React",     application_date: "2026-04-15", stage: "convention_pending", convention_id: 3,    convention_status: "PENDING_ADMIN"   },
          { application_id: 4, student_name: "Riad Khelifi",  student_email: "r.khelifi@esi.edu.dz",   offer_title: "Data Analyst",         application_date: "2026-03-10", stage: "completed",          convention_id: 4,    convention_status: "VALIDATED"       },
          { application_id: 5, student_name: "Loubna Hamza",  student_email: "l.hamza@usthb.edu.dz",   offer_title: "Développeur Django",    application_date: "2026-04-22", stage: "pending_convention", convention_id: null, convention_status: "PENDING_STUDENT" },
        ]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = activeTab === "all"
    ? interns
    : interns.filter(i => i.stage === activeTab ||
        (activeTab === "ongoing" && i.stage === "convention_pending"));

  const counts = {
    all:              interns.length,
    convention_to_sign: interns.filter(i => i.stage === "convention_to_sign").length,
    ongoing:          interns.filter(i => i.stage === "ongoing" || i.stage === "convention_pending").length,
    completed:        interns.filter(i => i.stage === "completed").length,
  };

  const handleSigned = () => {
    if (!signTarget) return;
    setInterns(prev =>
      prev.map(i =>
        i.application_id === signTarget.application_id
          ? { ...i, stage: "convention_pending", convention_status: "PENDING_ADMIN" }
          : i
      )
    );
    setSignTarget(null);
  };

  return (
    <CompanyLayout>
      <div className="mi-root">

        {/* Page header */}
        <div className="mi-page-header">
          <div>
            <h2 className="mi-page-title">Mes Stagiaires</h2>
            <p className="mi-page-sub">
              Suivez l'avancement de vos stages — de la convention à l'attestation
            </p>
          </div>

          {/* Quick action badge */}
          {counts.convention_to_sign > 0 && (
            <div className="mi-urgent-badge">
              <span>✍️</span>
              {counts.convention_to_sign} convention{counts.convention_to_sign > 1 ? "s" : ""} à signer
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mi-stats-row">
          {[
            { label: "Total",            val: interns.length,            icon: "👥", color: "#3b82f6" },
            { label: "À signer",         val: counts.convention_to_sign, icon: "✍️", color: "#f59e0b" },
            { label: "En cours",         val: counts.ongoing,            icon: "🎓", color: "#22c55e" },
            { label: "Terminés",         val: counts.completed,          icon: "✅", color: "#64748b" },
          ].map(s => (
            <div key={s.label} className="mi-stat" style={{ "--stat-color": s.color } as React.CSSProperties}>
              <span className="mi-stat-icon">{s.icon}</span>
              <strong className="mi-stat-val">{s.val}</strong>
              <span className="mi-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Pipeline flow diagram */}
        <div className="mi-pipeline">
          {[
            { stage: "convention_to_sign", icon: "✍️", label: "Convention\nà signer",  count: interns.filter(i => i.stage === "convention_to_sign").length },
            { stage: "convention_pending", icon: "📄", label: "Convention\nen attente", count: interns.filter(i => i.stage === "convention_pending").length },
            { stage: "ongoing",            icon: "🎓", label: "Stage\nen cours",       count: interns.filter(i => i.stage === "ongoing").length },
            { stage: "completed",          icon: "🏆", label: "Stage\nterminé",        count: interns.filter(i => i.stage === "completed").length },
          ].map((p, i) => (
            <div key={p.stage} className="mi-pipeline-row">
              <div className="mi-pipeline-step">
                <div className="mi-pipeline-icon">{p.icon}</div>
                <div className="mi-pipeline-info">
                  <span className="mi-pipeline-label">{p.label}</span>
                  <strong className="mi-pipeline-count">{p.count} stagiaire{p.count !== 1 ? "s" : ""}</strong>
                </div>
              </div>
              {i < 3 && <div className="mi-pipeline-arrow">→</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mi-tabs">
          {([
            ["all",               "Tous",                   counts.all              ],
            ["convention_to_sign","À signer",               counts.convention_to_sign],
            ["ongoing",           "En cours",               counts.ongoing           ],
            ["completed",         "Terminés",               counts.completed         ],
          ] as const).map(([key, label, count]) => (
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
              <div
                key={intern.application_id}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <InternCard
                  intern={intern}
                  onSignConvention={setSignTarget}
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
    </CompanyLayout>
  );
}