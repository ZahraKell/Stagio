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
} from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

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

function unwrapStats(res: { data: unknown }): StatsData | null {
  const body = res.data as { data?: StatsData; error?: boolean };
  if (body?.data) return body.data;
  return null;
}

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

  return (
    <DashboardLayout pageTitle="Dashboard">
      {stats?.institution && (
        <p style={{ padding: "8px 24px", color: "var(--text-muted)", fontSize: 14 }}>Scope: {stats.institution}</p>
      )}

      <section className="adm-stat-grid">
        <div className="adm-stat-card stat-blue">
          <div className="adm-stat-body">
            <span className="adm-stat-label">Applications (total)</span>
            <span className="adm-stat-value">{app?.total ?? "—"}</span>
          </div>
        </div>
        <div className="adm-stat-card stat-amber">
          <div className="adm-stat-body">
            <span className="adm-stat-label">Pending</span>
            <span className="adm-stat-value">{app?.pending ?? "—"}</span>
          </div>
        </div>
        <div className="adm-stat-card stat-teal">
          <div className="adm-stat-body">
            <span className="adm-stat-label">Accepted</span>
            <span className="adm-stat-value">{app?.accepted ?? "—"}</span>
          </div>
        </div>
        <div className="adm-stat-card stat-red">
          <div className="adm-stat-body">
            <span className="adm-stat-label">Refused</span>
            <span className="adm-stat-value">{app?.refused ?? "—"}</span>
          </div>
        </div>
        <div className="adm-stat-card stat-green">
          <div className="adm-stat-body">
            <span className="adm-stat-label">Validated</span>
            <span className="adm-stat-value">{app?.validated ?? "—"}</span>
          </div>
        </div>
        <div className="adm-stat-card stat-purple">
          <div className="adm-stat-body">
            <span className="adm-stat-label">Students (scoped)</span>
            <span className="adm-stat-value">{stud?.total ?? "—"}</span>
          </div>
        </div>
      </section>

      <div className="adm-row">
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Pending internship validation</h2>
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
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 12).map((row) => (
                  <tr key={row.application_id}>
                    <td>{row.student_name}</td>
                    <td>{row.offer_title}</td>
                    <td>{row.company_name}</td>
                    <td className="text-muted">{row.application_date ? String(row.application_date).slice(0, 10) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pending.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No pending validations.</p>}
          </div>
        </section>

        <div className="adm-col-right">
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
              {conventions.slice(0, 8).map((c) => (
                <div key={c.id} className="adm-conv-item">
                  <div className="adm-conv-meta">
                    <span className="adm-conv-id">#{c.id}</span>
                    <span className="cv-status-badge cs-generated" style={{ fontSize: 10 }}>
                      {c.status}
                    </span>
                  </div>
                  <p className="adm-conv-names">
                    {c.student_name} <span>→</span> {c.company_name}
                  </p>
                  <p className="text-muted small">{c.offer_title}</p>
                </div>
              ))}
              {conventions.length === 0 && <p className="text-muted small" style={{ padding: 8 }}>None pending.</p>}
            </div>
          </section>
        </div>
      </div>

      <section className="adm-card" style={{ marginTop: 24 }}>
        <div className="adm-card-head">
          <h2>Quick links</h2>
        </div>
        <div className="adm-quick-links">
          {[
            { to: "/administration/offers", icon: Briefcase, label: "Open internship offers" },
            { to: "/administration/applications", icon: FileText, label: "Applications" },
            { to: "/administration/conventions", icon: CheckSquare, label: "Conventions" },
            { to: "/administration/students", icon: GraduationCap, label: "Students" },
            { to: "/administration/companies", icon: Building2, label: "Companies" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="adm-quick-link">
              <div className="adm-ql-icon">
                <l.icon size={15} />
              </div>
              <div className="adm-ql-text">
                <span>{l.label}</span>
              </div>
              <ArrowRight size={13} className="adm-ql-arrow" />
            </Link>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default AdminDashboard;
