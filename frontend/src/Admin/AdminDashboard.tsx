// AdminDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

interface DashStats {
  total_users: number;
  total_students: number;
  total_companies: number;
  total_applications: number;
  total_conventions: number;
  total_offers: number;
  pending_companies: number;
  pending_applications: number;
  accepted_applications: number;
  refused_applications: number;
  active_offers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashStats>({
    total_users: 0, total_students: 0, total_companies: 0,
    total_applications: 0, total_conventions: 0, total_offers: 0,
    pending_companies: 0, pending_applications: 0,
    accepted_applications: 0, refused_applications: 0,
    active_offers: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, appsRes, companiesRes, offersRes] = await Promise.allSettled([
        api.get("admin/users/"),
        api.get("applications/admin/all/"),
        api.get("admin/companies/pending/"),
        api.get("admin/offers/"),
      ]);

      type UserRow = { role?: string };
      type AppRow = { status?: string; id?: number; student_name?: string; offer_title?: string; offer_company_name?: string; company_name?: string; application_date?: string };
      type OfferRow = { status?: string };

      const users: UserRow[] =
        usersRes.status === "fulfilled"
          ? ((usersRes.value.data as { data?: UserRow[] })?.data ?? [])
          : [];
      const apps: AppRow[] =
        appsRes.status === "fulfilled"
          ? ((appsRes.value.data as { data?: AppRow[] })?.data ?? [])
          : [];
      const pendingComps: unknown[] =
        companiesRes.status === "fulfilled"
          ? ((companiesRes.value.data as { data?: unknown[] })?.data ?? [])
          : [];
      const offersBody = offersRes.status === "fulfilled" ? offersRes.value.data : null;
      const offers: OfferRow[] = Array.isArray(offersBody) ? (offersBody as OfferRow[]) : [];
      if (offersRes.status === "rejected") {
        toast.error("Could not load offers list.");
      }

      if (
        usersRes.status === "rejected" ||
        appsRes.status === "rejected" ||
        companiesRes.status === "rejected"
      ) {
        toast.error("Some dashboard data could not be loaded. Check admin permissions.");
      }

      setStats({
        total_users: users.length,
        total_students: users.filter((u) => u.role === "student").length,
        total_companies: users.filter((u) => u.role === "company").length,
        total_applications: apps.length,
        total_conventions: 0,
        total_offers: offers.length,
        pending_companies: pendingComps.length,
        pending_applications: apps.filter((a) => a.status === "pending").length,
        accepted_applications: apps.filter((a) => a.status === "accepted").length,
        refused_applications: apps.filter((a) => a.status === "refused").length,
        active_offers: offers.filter((o) => o.status === "open").length,
      });
      setRecentApplications(apps.slice(0, 5));
      setPendingCompanies(pendingComps.slice(0, 3));
    } catch {
      toast.error("Dashboard load failed.");
      setRecentApplications([]);
      setPendingCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCompany = async (id: number) => {
    try {
      await api.post(`admin/companies/${id}/approve/`, {});
      setPendingCompanies((prev) => prev.filter((c) => (c as { id: number }).id !== id));
      setStats((prev) => ({ ...prev, pending_companies: Math.max(0, prev.pending_companies - 1) }));
      toast.success("Company approved.");
    } catch {
      toast.error("Approve failed.");
    }
  };

  const handleRejectCompany = async (id: number) => {
    try {
      await api.post(`admin/companies/${id}/reject/`, { reason: "Does not meet requirements" });
      setPendingCompanies((prev) => prev.filter((c) => (c as { id: number }).id !== id));
      toast.success("Company rejected.");
    } catch {
      toast.error("Reject failed.");
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "am-dash-pending", accepted: "am-dash-accepted", reviewed: "am-dash-reviewed", refused: "am-dash-refused", validated: "am-dash-accepted" };
    return map[s] || "am-dash-pending";
  };

  const statsCards = [
    { label: "Total Users", value: stats.total_users, sub: `${stats.total_students} students`, color: "#3b82f6", icon: "👥", path: "/admin/users" },
    { label: "Active Students", value: stats.total_students, sub: "Registered students", color: "#22c55e", icon: "🎓", path: "/admin/students" },
    { label: "Companies", value: stats.total_companies, sub: `${stats.pending_companies} pending approval`, color: "#f59e0b", icon: "🏢", path: "/admin/companies" },
    { label: "Applications", value: stats.total_applications, sub: `${stats.pending_applications} pending`, color: "#8b5cf6", icon: "📋", path: "/admin/applications" },
    { label: "Active Offers", value: stats.active_offers, sub: `${stats.total_offers} total`, color: "#06b6d4", icon: "📌", path: "/admin/offers" },
    { label: "Pending Review", value: stats.pending_companies, sub: "Companies awaiting", color: "#ef4444", icon: "⏳", path: "/admin/companies" },
  ];

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="am-dash-root">
      <div className="am-dash-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, Administrator — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="am-dash-date">
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="am-dash-stats">
        {statsCards.map((stat, idx) => (
          <div
            key={idx}
            className="am-dash-stat"
            style={{ borderTopColor: stat.color, cursor: "pointer" }}
            onClick={() => navigate(stat.path)}
          >
            <div className="am-dash-stat-top">
              <span className="am-dash-stat-icon">{stat.icon}</span>
              <span className="am-dash-stat-value">{stat.value}</span>
            </div>
            <div className="am-dash-stat-label">{stat.label}</div>
            <div className="am-dash-stat-sub">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="am-dash-grid">
        {/* Recent Applications */}
        <div className="am-dash-card">
          <div className="am-dash-card-head">
            <h3>Recent Applications</h3>
            <a href="/admin/applications" className="am-dash-link" onClick={e => { e.preventDefault(); navigate("/admin/applications"); }}>View all →</a>
          </div>
          <div className="am-dash-table-wrap">
            <table className="am-dash-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Offer</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app, i) => (
                  <tr key={app.id || i}>
                    <td><strong>{app.student_name}</strong></td>
                    <td className="am-dash-offer-cell">{app.offer_title}</td>
                    <td>{app.offer_company_name || (app as { offer_company?: string }).offer_company || (app as { company_name?: string }).company_name}</td>
                    <td className="am-dash-date-cell">{app.application_date || app.date}</td>
                    <td>
                      <span className={`am-dash-badge ${statusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="am-dash-right">
          {/* Pending Companies */}
          <div className="am-dash-card">
            <div className="am-dash-card-head">
              <h3>Pending Companies</h3>
              <a href="/admin/companies" className="am-dash-link" onClick={e => { e.preventDefault(); navigate("/admin/companies"); }}>Review all →</a>
            </div>
            <div className="am-dash-card-body">
              {pendingCompanies.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1rem", color: "#94a3b8", fontSize: ".8rem" }}>
                  ✅ No pending companies
                </div>
              ) : (
                pendingCompanies.map((comp) => (
                  <div key={comp.id} className="am-dash-pending-item">
                    <div className="am-dash-pending-info">
                      <strong>{comp.company_name}</strong>
                      <span>{comp.company_sector} • {comp.town}</span>
                      <span className="am-dash-pending-date">Applied: {comp.submitted_at?.split("T")[0] || comp.submitted_at}</span>
                    </div>
                    <div className="am-dash-pending-actions">
                      <button className="am-dash-btn-approve" onClick={() => handleApproveCompany(comp.id)} title="Approve">✓</button>
                      <button className="am-dash-btn-reject" onClick={() => handleRejectCompany(comp.id)} title="Reject">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Distribution */}
          <div className="am-dash-card">
            <div className="am-dash-card-head">
              <h3>Applications Distribution</h3>
            </div>
            <div className="am-dash-card-body">
              <div className="am-dash-distro">
                {[
                  { label: "Pending", count: stats.pending_applications, color: "#f59e0b", pct: stats.total_applications ? Math.round((stats.pending_applications / stats.total_applications) * 100) : 0 },
                  { label: "Accepted", count: stats.accepted_applications, color: "#22c55e", pct: stats.total_applications ? Math.round((stats.accepted_applications / stats.total_applications) * 100) : 0 },
                  { label: "Refused", count: stats.refused_applications, color: "#ef4444", pct: stats.total_applications ? Math.round((stats.refused_applications / stats.total_applications) * 100) : 0 },
                ].map(item => (
                  <div key={item.label} className="am-dash-distro-item">
                    <div className="am-dash-distro-bar">
                      <div className="am-dash-distro-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="am-dash-card">
            <div className="am-dash-card-head"><h3>Quick Actions</h3></div>
            <div className="am-dash-card-body">
              {[
                { icon: "📧", label: "Manage Whitelist", desc: "Add university emails", path: "/admin/emails" },
                { icon: "📊", label: "View Statistics", desc: "Platform analytics", path: "/admin/stats" },
                { icon: "👥", label: "Manage Users", desc: "View all users", path: "/admin/users" },
              ].map(action => (
                <div key={action.path} className="am-dash-pending-item" style={{ cursor: "pointer" }} onClick={() => navigate(action.path)}>
                  <div style={{ fontSize: "1.2rem", width: 36, textAlign: "center" }}>{action.icon}</div>
                  <div className="am-dash-pending-info">
                    <strong>{action.label}</strong>
                    <span>{action.desc}</span>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
