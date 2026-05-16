import { useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";

interface ReportRow {
  id: number;
  student_name: string;
  student_email: string;
  offer_title: string;
  offer_company_name: string;
  stage_state: string;
  report_submitted_at: string | null;
  report_validated_at: string | null;
  attestation_issued_at: string | null;
}

type ApiRow = {
  id: number;
  student_name?: string;
  student_email?: string;
  offer_title?: string;
  offer_company_name?: string;
  stage_state?: string;
  report_submitted_at?: string | null;
  report_validated_at?: string | null;
  attestation_issued_at?: string | null;
};

const STAGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  convention_to_sign: { label: "Convention à signer", color: "#3b82f6", bg: "#eff6ff" },
  internship_in_progress: { label: "Stage en cours", color: "#22c55e", bg: "#f0fdf4" },
  report_to_validate: { label: "Rapport soumis", color: "#f59e0b", bg: "#fffbeb" },
  report_validated: { label: "Rapport validé ✓", color: "#8b5cf6", bg: "#f5f3ff" },
  completed: { label: "Terminé", color: "#64748b", bg: "#f8fafc" },
};

export default function ADMReports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"report_to_validate" | "report_validated" | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("applications/administration/scope/applications/");
      const body = res.data as { data?: ApiRow[] };
      const all = (body.data ?? []) as ReportRow[];
      // Only show internships that have progressed past convention signing
      setRows(
        all.filter((a) =>
          ["report_to_validate", "report_validated", "completed", "internship_in_progress"].includes(
            a.stage_state ?? ""
          )
        )
      );
    } catch {
      toast.error("Impossible de charger les rapports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const issueAttestation = async (id: number) => {
    setIssuing(id);
    try {
      await api.post(`applications/${id}/issue-attestation/`);
      toast.success("Attestation émise avec succès !");
      await load();
    } catch {
      toast.error("Échec de l'émission de l'attestation.");
    } finally {
      setIssuing(null);
    }
  };

  const filtered =
    activeTab === "all"
      ? rows
      : rows.filter((r) => r.stage_state === activeTab);

  const counts = {
    all: rows.length,
    report_to_validate: rows.filter((r) => r.stage_state === "report_to_validate").length,
    report_validated: rows.filter((r) => r.stage_state === "report_validated").length,
  };

  const fmtDate = (s: string | null) => {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("fr-DZ", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <DashboardLayout pageTitle="Rapports de Stage">
      {/* Hero */}
      <div className="page-hero applications-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Rapports de Stage</h1>
          <p>Gérez les rapports soumis et émettez les attestations de stage</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mi-stats-row" style={{ marginBottom: 20 }}>
        {[
          { label: "Total", val: counts.all, icon: "📋", color: "#3b82f6" },
          { label: "Rapports soumis", val: counts.report_to_validate, icon: "📄", color: "#f59e0b" },
          { label: "Prêts pour attestation", val: counts.report_validated, icon: "🏅", color: "#8b5cf6" },
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

      {/* Tabs */}
      <div className="mi-tabs" style={{ marginBottom: 20 }}>
        {[
          { key: "all" as const, label: "Tous", count: counts.all },
          { key: "report_to_validate" as const, label: "Rapport soumis", count: counts.report_to_validate },
          { key: "report_validated" as const, label: "Prêts pour attestation", count: counts.report_validated },
        ].map((t) => (
          <button
            key={t.key}
            className={`mi-tab ${activeTab === t.key ? "mi-tab-active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="mi-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mi-loading">
          <div className="mi-spinner" />
          <p>Chargement…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="mi-empty">
          <span className="mi-empty-icon">📋</span>
          <h3>Aucun rapport trouvé</h3>
          <p>Les rapports soumis par les stagiaires apparaîtront ici.</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Offre</th>
                <th>Entreprise</th>
                <th>Statut</th>
                <th>Rapport soumis</th>
                <th>Rapport validé</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const stageCfg = STAGE_LABELS[r.stage_state] ?? {
                  label: r.stage_state,
                  color: "#64748b",
                  bg: "#f8fafc",
                };
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.student_name}</div>
                      <div style={{ fontSize: ".75rem", color: "#64748b" }}>{r.student_email}</div>
                    </td>
                    <td>{r.offer_title}</td>
                    <td>{r.offer_company_name}</td>
                    <td>
                      <span
                        style={{
                          fontSize: ".72rem",
                          padding: ".2rem .6rem",
                          borderRadius: 99,
                          background: stageCfg.bg,
                          color: stageCfg.color,
                          fontWeight: 700,
                        }}
                      >
                        {stageCfg.label}
                      </span>
                    </td>
                    <td>{fmtDate(r.report_submitted_at)}</td>
                    <td>{fmtDate(r.report_validated_at)}</td>
                    <td>
                      {r.stage_state === "report_validated" && (
                        <button
                          className="adm-action-btn approve sm"
                          disabled={issuing === r.id}
                          onClick={() => void issueAttestation(r.id)}
                        >
                          🏅 {issuing === r.id ? "…" : "Émettre attestation"}
                        </button>
                      )}
                      {r.stage_state === "report_to_validate" && (
                        <span style={{ fontSize: ".72rem", color: "#94a3b8" }}>
                          En attente validation entreprise
                        </span>
                      )}
                      {r.stage_state === "completed" && (
                        <span style={{ fontSize: ".72rem", color: "#22c55e", fontWeight: 600 }}>
                          ✅ Attestation émise
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}