// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  Briefcase,
  FileText,
  Building2,
  CheckSquare,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Users,
  Clock,
  Download,
  Eye,
  Activity,
} from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

/* ================================================================
   TYPES
   ================================================================ */

interface StatsData {
  period?: string;
  institution?: string;
  students?: { total?: number; placed?: number; unplaced?: number };
  applications?: {
    total?: number;
    pending?: number;
    reviewed?: number;
    accepted?: number;
    refused?: number;
    validated?: number;
  };
  offers?: { total?: number | null; open?: number };
}

interface PendingRow {
  application_id: number;
  student_name: string;
  student_number?: string;
  speciality?: string;
  offer_title: string;
  company_name: string;
  offer_town?: string;
  application_date?: string;
}

interface ConventionRow {
  id: number;
  student_name: string;
  company_name: string;
  offer_title: string;
  offer_town?: string;
  status: string;
}

/* ================================================================
   HELPERS
   ================================================================ */

function unwrapStats(res: { data: unknown }): StatsData | null {
  const body = res.data as { data?: StatsData; error?: boolean };
  if (body?.data) return body.data;
  return null;
}

const convStatusCfg: Record<string, { cls: string; label: string }> = {
  generated: { cls: "cs-generated", label: "Generated" },
  sent_student: { cls: "cs-sent", label: "Sent" },
  signed_student: { cls: "cs-signed-s", label: "Stud. Signed" },
  signed_company: { cls: "cs-signed-c", label: "Co. Signed" },
  stamped: { cls: "cs-stamped", label: "Stamped" },
  complete: { cls: "cs-complete", label: "Complete" },
};

/* ================================================================
   COMPONENT
   ================================================================ */

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [conventions, setConventions] = useState<ConventionRow[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [sRes, pRes, cRes] = await Promise.all([
          api.get("applications/stats/"),
          api.get("applications/pending-validation/"),
          api.get("conventions/pending-admin/"),
        ]);
        setStats(unwrapStats(sRes));
        const pBody = pRes.data as { pending_validations?: PendingRow[] };
        setPending(pBody.pending_validations ?? []);
        const cBody = cRes.data as { data?: ConventionRow[] };
        setConventions(Array.isArray(cBody.data) ? cBody.data : []);
      } catch {
        toast.error("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const app = stats?.applications;
  const stud = stats?.students;

  if (loading) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <p style={{ padding: 24 }}>Loading…</p>
      </DashboardLayout>
    );
  }

  /* ── derived stat cards ── */
  const statCards = [
    { label: "Applications (total)", value: app?.total ?? "—", delta: "All time", up: true, icon: FileText, color: "stat-blue" },
    { label: "Pending", value: app?.pending ?? "—", delta: "Awaiting review", up: false, icon: Clock, color: "stat-amber" },
    { label: "Accepted", value: app?.accepted ?? "—", delta: "By companies", up: true, icon: CheckSquare, color: "stat-teal" },
    { label: "Refused", value: app?.refused ?? "—", delta: "By companies", up: false, icon: Briefcase, color: "stat-red" },
    { label: "Validated", value: app?.validated ?? "—", delta: "Admin validated", up: true, icon: Activity, color: "stat-green" },
    { label: "Students (scoped)", value: stud?.total ?? "—", delta: "Active this scope", up: true, icon: Users, color: "stat-purple" },
  ];

  return (
    <DashboardLayout pageTitle="Dashboard">

      {/* Scope label */}
      {stats?.institution && (
        <p style={{ padding: "8px 0 0", color: "var(--sc-muted)", fontSize: 13 }}>
          Scope: {stats.institution}
        </p>
      )}

      {/* ── STAT GRID ── */}
      <section className="adm-stat-grid">
        {statCards.map((s) => (
          <div key={s.label} className={`adm-stat-card ${s.color}`}>
            <div className="adm-stat-icon"><s.icon size={18} /></div>
            <div className="adm-stat-body">
              <span className="adm-stat-label">{s.label}</span>
              <span className="adm-stat-value">{s.value}</span>
              <span className={`adm-stat-delta ${s.up ? "up" : "down"}`}>
                <TrendingUp size={11} /> {s.delta}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ══ ROW 1: Pending validations (wide) + Conventions ══ */}
      <div className="adm-row">

        {/* ── PENDING INTERNSHIP VALIDATION TABLE ── */}
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Pending Internship Validation</h2>
              <p>Accepted applications awaiting administration ({pending.length})</p>
            </div>
            <Link to="/administration/applications" className="adm-btn-link">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Offer</th>
                  <th>Company</th>
                  <th>Town</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 12).map((row) => (
                  <tr key={row.application_id}>
                    <td>
                      <div className="adm-student-cell">
                        <div className="adm-student-avatar">
                          {row.student_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-medium">{row.student_name}</div>
                          {row.speciality && <div className="adm-cell-sub">{row.speciality}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{row.offer_title}</td>
                    <td className="fw-medium">{row.company_name}</td>
                    <td className="text-muted">{row.offer_town ?? "—"}</td>
                    <td className="text-muted">
                      {row.application_date ? String(row.application_date).slice(0, 10) : "—"}
                    </td>
                    <td>
                      <Link to="/administration/applications" className="adm-action-icon" title="View">
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pending.length === 0 && (
              <p className="text-muted" style={{ padding: 16 }}>No pending validations.</p>
            )}
          </div>
        </section>

        {/* ── RIGHT COLUMN ── */}
        <div className="adm-col-right">

          {/* CONVENTIONS */}
          <section className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2>Conventions</h2>
                <p>Awaiting administration signature ({conventions.length})</p>
              </div>
              <Link to="/administration/conventions" className="adm-btn-link">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="adm-conv-list">
              {conventions.slice(0, 8).map((c) => {
                const cfg = convStatusCfg[c.status] ?? { cls: "cs-generated", label: c.status };
                return (
                  <div key={c.id} className="adm-conv-item">
                    <div className="adm-conv-meta">
                      <span className="adm-conv-id">#{c.id}</span>
                      <span className={`cv-status-badge ${cfg.cls}`} style={{ fontSize: 10 }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="adm-conv-names">
                      {c.student_name} <span>→</span> {c.company_name}
                    </p>
                    <div className="adm-conv-foot">
                      <p className="text-muted small">{c.offer_title}</p>
                      <button className="adm-action-icon" title="Download PDF">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {conventions.length === 0 && (
                <p className="text-muted small" style={{ padding: 8 }}>None pending.</p>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* ══ ROW 2: Performance strip + Quick links ══ */}
      <div className="adm-row adm-row-mt">

        {/* ── PLACEMENT PERFORMANCE ── */}
        <section className="adm-card adm-perf-card-dash">
          <div className="adm-card-head">
            <div>
              <h2>Placement Overview</h2>
              <p>Student internship placement rate</p>
            </div>
            <span className="adm-year-badge">
              <Activity size={11} /> {stats?.period ?? new Date().getFullYear()}
            </span>
          </div>

          <div className="adm-perf-list">
            {[
              { label: "Applications submitted", value: app?.total ?? 0, max: app?.total || 1, color: "#63a4f2" },
              { label: "Accepted by companies", value: app?.accepted ?? 0, max: app?.total || 1, color: "#4ade80" },
              { label: "Validated by admin", value: app?.validated ?? 0, max: app?.accepted || 1, color: "#f57da9" },
              { label: "Students placed", value: stud?.placed ?? 0, max: stud?.total || 1, color: "#a78bfa" },
            ].map((item) => (
              <div key={item.label} className="adm-perf-item">
                <div className="adm-perf-top">
                  <span className="adm-perf-label">{item.label}</span>
                  <span className="adm-perf-value">{item.value}</span>
                </div>
                <div className="adm-perf-track">
                  <div
                    className="adm-perf-fill"
                    style={{ width: `${Math.min(100, Math.round(((item.value as number) / (item.max as number)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="adm-perf-strip">
            {[
              { val: app?.total ?? "—", lbl: "Total" },
              { val: app?.pending ?? "—", lbl: "Pending" },
              { val: app?.accepted ?? "—", lbl: "Accepted" },
              { val: app?.validated ?? "—", lbl: "Validated" },
            ].map((s) => (
              <div key={s.lbl} className="adm-perf-strip-item">
                <span className="adm-perf-strip-val">{s.val}</span>
                <span className="adm-perf-strip-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── QUICK LINKS ── */}
        <div className="adm-col-right">
          <section className="adm-card">
            <div className="adm-card-head">
              <div><h2>Quick Links</h2></div>
            </div>
            <div className="adm-quick-links">
              {[
                { to: "/administration/offers", icon: Briefcase, label: "Open internship offers", count: `${app?.pending ?? 0} pending` },
                { to: "/administration/applications", icon: FileText, label: "Applications", count: `${app?.total ?? 0} total` },
                { to: "/administration/conventions", icon: CheckSquare, label: "Conventions", count: `${conventions.length} pending` },
                { to: "/administration/students", icon: GraduationCap, label: "Students", count: `${stud?.total ?? 0} total` },
                { to: "/administration/companies", icon: Building2, label: "Companies", count: `${stud?.placed ?? 0} placed` },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="adm-quick-link">
                  <div className="adm-ql-icon"><l.icon size={15} /></div>
                  <div className="adm-ql-text">
                    <span>{l.label}</span>
                    <span className="adm-ql-count">{l.count}</span>
                  </div>
                  <ArrowRight size={13} className="adm-ql-arrow" />
                </Link>
              ))}
            </div>
          </section>
        </div>

      </div>

    </DashboardLayout>
  );
};

export default AdminDashboard;