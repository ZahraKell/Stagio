import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CompanyLayout from "../components/CompanyLayout";
import api from "../api";
import toast from "react-hot-toast";

// ”€”€ TYPES ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
interface Stats {
  total_applications:  number;
  new_this_week:       number;
  pending:             number;
  accepted:            number;
  refused:             number;
  active_offers:       number;
  internships_ongoing: number;
  conventions_pending: number;
}

interface PendingAction {
  id:      number;
  type:    "convention" | "report";
  label:   string;
  student: string;
  offer:   string;
  date:    string;
  linkTo:  string;
}

interface RecentApp {
  id:       number;
  student:  string;
  offer:    string;
  status:   string;
  date:     string;
  cv_score: number;
}

// ”€”€ HELPERS ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente",  cls: "badge-pending"   },
  reviewed:  { label: "En révision", cls: "badge-reviewed"  },
  accepted:  { label: "Accepté",     cls: "badge-accepted"  },
  refused:   { label: "Refusé",      cls: "badge-refused"   },
  validated: { label: "Validé",      cls: "badge-validated" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: "badge-pending" };
  return <span className={`ch-badge ${s.cls}`}>{s.label}</span>;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div className="ch-score-bar">
      <div className="ch-score-track">
        <div className="ch-score-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ color }}>{score}%</span>
    </div>
  );
}

// ”€”€ STAT CARD ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
function StatCard({
  value, label, sub, accent, icon,
}: {
  value: number | string;
  label: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="ch-stat" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="ch-stat-icon">{icon}</div>
      <div className="ch-stat-body">
        <strong className="ch-stat-val">{value}</strong>
        <span className="ch-stat-label">{label}</span>
        {sub && <span className="ch-stat-sub">{sub}</span>}
      </div>
      <div className="ch-stat-glow" />
    </div>
  );
}

// ”€”€ MAIN ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
export default function CompanyHome() {
  const fullName = localStorage.getItem("full_name") || "Responsable";

  const [stats,   setStats]   = useState<Stats | null>(null);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [recent,  setRecent]  = useState<RecentApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, recentRes, actionsRes, offersRes] = await Promise.allSettled([
          api.get("applications/company-stats/"),
          api.get("applications/company-recent/"),
          api.get("applications/company-actions/"),
          api.get("offers/mine/"),
        ]);

        if (cancelled) return;

        if (statsRes.status === "fulfilled") {
          const body = statsRes.value.data as { error?: boolean; data?: Record<string, number> };
          const d = body.data;
          if (!body.error && d) {
            const openOffers =
              offersRes.status === "fulfilled" && Array.isArray(offersRes.value.data)
                ? (offersRes.value.data as { status?: string }[]).filter((o) => o.status === "open").length
                : 0;
            setStats({
              total_applications: d.total_applications ?? 0,
              new_this_week: 0,
              pending: d.pending ?? 0,
              accepted: d.accepted ?? 0,
              refused: d.refused ?? 0,
              active_offers: openOffers,
              internships_ongoing: d.validated ?? 0,
              conventions_pending: 0,
            });
          } else {
            setStats(null);
          }
        } else {
          setStats(null);
        }

        if (recentRes.status === "fulfilled") {
          const body = recentRes.value.data as {
            error?: boolean;
            data?: Array<Record<string, unknown>>;
          };
          if (!body.error && body.data) {
            setRecent(
              body.data.map((row) => ({
                id: (row.application_id as number) ?? (row.id as number),
                student: String(row.student_name ?? ""),
                offer: String(row.offer_title ?? ""),
                status: String(row.status ?? "pending").toLowerCase(),
                date: String(row.application_date ?? "").split("T")[0],
                cv_score: 0,
              })),
            );
          } else setRecent([]);
        } else setRecent([]);

        if (actionsRes.status === "fulfilled") {
          const body = actionsRes.value.data as {
            error?: boolean;
            data?: {
              pending_candidate_reviews?: number;
              pending_report_validation?: number;
              pending_administration_validation?: number;
            };
          };
          const d = body.data;
          const built: PendingAction[] = [];
          let nid = 1;
          if (d?.pending_candidate_reviews && d.pending_candidate_reviews > 0) {
            built.push({
              id: nid++,
              type: "convention",
              label: `${d.pending_candidate_reviews} candidature(s) en attente de décision`,
              student: "—",
              offer: "—",
              date: "",
              linkTo: "/company/offers",
            });
          }
          if (d?.pending_report_validation && d.pending_report_validation > 0) {
            built.push({
              id: nid++,
              type: "report",
              label: `${d.pending_report_validation} rapport(s) à valider`,
              student: "—",
              offer: "—",
              date: "",
              linkTo: "/company/interns",
            });
          }
          if (d?.pending_administration_validation && d.pending_administration_validation > 0) {
            built.push({
              id: nid++,
              type: "convention",
              label: `${d.pending_administration_validation} dossier(s) en validation administration`,
              student: "—",
              offer: "—",
              date: "",
              linkTo: "/company/interns",
            });
          }
          setActions(built);
        } else setActions([]);

        if (
          statsRes.status === "rejected" ||
          recentRes.status === "rejected" ||
          actionsRes.status === "rejected"
        ) {
          toast.error("Certaines données du tableau de bord n'ont pas pu être chargées.");
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setRecent([]);
          setActions([]);
          toast.error("Chargement du tableau de bord impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  if (loading) {
    return (
      <CompanyLayout>
        <div className="ch-loading">
          <div className="ch-spinner" />
          <p>Chargement du tableau de bord…</p>
        </div>
      </CompanyLayout>
    );
  }

  const total = stats?.total_applications ?? 0;
  const accepted_pct = total > 0 ? Math.round(((stats?.accepted ?? 0) / total) * 100) : 0;
  const refused_pct  = total > 0 ? Math.round(((stats?.refused  ?? 0) / total) * 100) : 0;
  const pending_pct  = total > 0 ? Math.round(((stats?.pending  ?? 0) / total) * 100) : 0;

  return (
    <CompanyLayout>
      <div className="ch-root">

        {/* ”€”€ GREETING BAR ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <div className="ch-greet-bar">
          <div className="ch-greet-text">
            <h2 className="ch-greeting">{greeting}, <strong>{fullName}</strong> 👋</h2>
            <p className="ch-greet-sub">
              Voici un aperçu de votre activité de recrutement sur Stag.io
            </p>
          </div>
          <Link to="/company/offers/new" className="ch-new-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle offre
          </Link>
        </div>

        {/* ”€”€ PENDING ACTIONS ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        {actions.length > 0 && (
          <div className="ch-actions-wrap">
            <div className="ch-actions-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Actions requises ({actions.length})
            </div>
            {actions.map(a => (
              <div key={a.id} className="ch-action-row">
                <span className="ch-action-emoji">{a.type === "convention" ? "✍️" : "📋"}</span>
                <div className="ch-action-info">
                  <strong>{a.label}</strong>
                  <span>{a.student} · {a.offer}</span>
                </div>
                <Link
                  to={a.linkTo}
                  className="ch-action-cta"
                >
                  Traiter →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ”€”€ STATS GRID ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <div className="ch-stats-grid">
          <StatCard
            value={stats?.total_applications ?? 0}
            label="Candidatures totales"
            sub={`+${stats?.new_this_week ?? 0} cette semaine`}
            accent="#3b82f6"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            }
          />
          <StatCard
            value={stats?.pending ?? 0}
            label="En attente de décision"
            sub="À traiter"
            accent="#f59e0b"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            }
          />
          <StatCard
            value={stats?.accepted ?? 0}
            label="Candidats acceptés"
            sub="Ce mois"
            accent="#22c55e"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            }
          />
          <StatCard
            value={stats?.active_offers ?? 0}
            label="Offres actives"
            sub="En ligne"
            accent="#8b5cf6"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
            }
          />
          <StatCard
            value={stats?.internships_ongoing ?? 0}
            label="Stages en cours"
            sub="Stagiaires actifs"
            accent="#06b6d4"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            }
          />
          <StatCard
            value={stats?.conventions_pending ?? 0}
            label="Conventions à signer"
            sub="Action requise"
            accent="#ef4444"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            }
          />
        </div>

        {/* ”€”€ BOTTOM ROW ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <div className="ch-bottom">

          {/* Recent applications table */}
          <div className="ch-card ch-table-card">
            <div className="ch-card-head">
              <h3>Candidatures récentes</h3>
              <Link to="/company/offers" className="ch-link-all">Voir tout →</Link>
            </div>
            <div className="ch-table-wrap">
              <table className="ch-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Offre</th>
                    <th>Score CV</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div className="ch-student-cell">
                          <div className="ch-student-av">{app.student.charAt(0)}</div>
                          <span>{app.student}</span>
                        </div>
                      </td>
                      <td><span className="ch-offer-name">{app.offer}</span></td>
                      <td><ScoreBar score={app.cv_score} /></td>
                      <td><StatusBadge status={app.status} /></td>
                      <td><span className="ch-date">{app.date}</span></td>
                      <td>
                        <Link to={`/company/applications/${app.id}`} className="ch-view-btn">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown chart */}
          <div className="ch-card ch-chart-card">
            <div className="ch-card-head">
              <h3>Répartition</h3>
            </div>
            <div className="ch-chart-body">
              {/* CSS donut */}
              <div
                className="ch-donut"
                style={{
                  background: `conic-gradient(
                    #22c55e 0% ${accepted_pct}%,
                    #ef4444 ${accepted_pct}% ${accepted_pct + refused_pct}%,
                    #f59e0b ${accepted_pct + refused_pct}% 100%
                  )`
                }}
              >
                <div className="ch-donut-hole">
                  <strong>{total}</strong>
                  <span>total</span>
                </div>
              </div>

              <div className="ch-legend">
                {[
                  { color: "#22c55e", label: "Acceptés",   val: stats?.accepted ?? 0 },
                  { color: "#ef4444", label: "Refusés",    val: stats?.refused  ?? 0 },
                  { color: "#f59e0b", label: "En attente", val: stats?.pending  ?? 0 },
                ].map(item => (
                  <div key={item.label} className="ch-legend-row">
                    <span className="ch-legend-dot" style={{ background: item.color }} />
                    <span className="ch-legend-label">{item.label}</span>
                    <strong className="ch-legend-val">{item.val}</strong>
                  </div>
                ))}
              </div>

              {/* Simple bar summary */}
              <div className="ch-bar-summary">
                <div className="ch-bar-track">
                  <div className="ch-bar-seg" style={{ width: `${accepted_pct}%`, background: "#22c55e" }} />
                  <div className="ch-bar-seg" style={{ width: `${refused_pct}%`,  background: "#ef4444" }} />
                  <div className="ch-bar-seg" style={{ width: `${pending_pct}%`,  background: "#f59e0b" }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </CompanyLayout>
  );
}
