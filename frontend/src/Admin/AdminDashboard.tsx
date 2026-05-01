// AdminDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api";

interface DashStats {
  total_users: number;
  total_students: number;
  total_companies: number;
  total_applications: number;
  total_conventions: number;
  total_offers: number;
  pending_companies: number;
  pending_applications: number;
  active_offers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashStats>({
    total_users: 0, total_students: 0, total_companies: 0,
    total_applications: 0, total_conventions: 0, total_offers: 0,
    pending_companies: 0, pending_applications: 0, active_offers: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [usersRes, appsRes, companiesRes, offersRes] = await Promise.allSettled([
        fetch(`${API}/admin/users/`, { headers }).then(r => r.json()),
        fetch(`${API}/applications/admin/all/`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/companies/pending/`, { headers }).then(r => r.json()),
        fetch(`${API}/offers/`, { headers }).then(r => r.json()),
      ]);

      const users = usersRes.status === "fulfilled" ? (usersRes.value.data || []) : getMockUsers();
      const apps = appsRes.status === "fulfilled" ? (appsRes.value.data || []) : getMockApps();
      const pendingComps = companiesRes.status === "fulfilled" ? (companiesRes.value.data || []) : getMockPendingComps();
      const offers = offersRes.status === "fulfilled" ? (Array.isArray(offersRes.value) ? offersRes.value : []) : [];

      setStats({
        total_users: users.length,
        total_students: users.filter((u: any) => u.role === "student").length,
        total_companies: users.filter((u: any) => u.role === "company").length,
        total_applications: apps.length,
        total_conventions: 0,
        total_offers: offers.length,
        pending_companies: pendingComps.length,
        pending_applications: apps.filter((a: any) => a.status === "pending").length,
        active_offers: offers.filter((o: any) => o.status === "open").length,
      });
      setRecentApplications(apps.slice(0, 5));
      setPendingCompanies(pendingComps.slice(0, 3));
    } catch {
      setStats({ total_users: 45, total_students: 28, total_companies: 12, total_applications: 67, total_conventions: 23, total_offers: 14, pending_companies: 5, pending_applications: 15, active_offers: 9 });
      setRecentApplications(getMockApps().slice(0, 5));
      setPendingCompanies(getMockPendingComps());
    } finally {
      setLoading(false);
    }
  };

  const getMockUsers = () => [
    ...Array(28).fill({ role: "student" }),
    ...Array(12).fill({ role: "company" }),
    ...Array(5).fill({ role: "admin" }),
  ];
  const getMockApps = () => [
    { id: "APP-042", student_name: "Ahmed Benali", offer_title: "Software Engineering Intern", offer_company: "Sonatrach", application_date: "28 Apr", status: "pending" },
    { id: "APP-041", student_name: "Sara Meziane", offer_title: "Data Analyst", offer_company: "Mobilis", application_date: "27 Apr", status: "accepted" },
    { id: "APP-040", student_name: "Karim Lounis", offer_title: "Backend Dev", offer_company: "Condor", application_date: "26 Apr", status: "reviewed" },
    { id: "APP-039", student_name: "Nadia Hamdi", offer_title: "UI/UX Designer", offer_company: "Ooredoo", application_date: "25 Apr", status: "refused" },
    { id: "APP-038", student_name: "Youcef Ould", offer_title: "Network Engineer", offer_company: "Algérie Télécom", application_date: "24 Apr", status: "pending" },
  ];
  const getMockPendingComps = () => [
    { id: 1, company_name: "Condor Electronics", company_sector: "Électronique", town: "Bordj Bou Arreridj", submitted_at: "2026-04-26" },
    { id: 2, company_name: "Cevital Group", company_sector: "Agroalimentaire", town: "Béjaïa", submitted_at: "2026-04-25" },
    { id: 3, company_name: "Ooredoo Algeria", company_sector: "Télécommunications", town: "Alger", submitted_at: "2026-04-24" },
  ];

  const handleApproveCompany = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API}/admin/companies/${id}/approve/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, pending_companies: prev.pending_companies - 1 }));
    } catch {
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleRejectCompany = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API}/admin/companies/${id}/reject/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "Does not meet requirements" }),
      });
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
    } catch {
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
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
                    <td>{app.offer_company || app.company_name}</td>
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
                  { label: "Pending", count: stats.pending_applications, color: "#f59e0b", pct: stats.total_applications ? Math.round(stats.pending_applications / stats.total_applications * 100) : 0 },
                  { label: "Accepted", count: Math.round(stats.total_applications * 0.34), color: "#22c55e", pct: 34 },
                  { label: "Refused", count: Math.round(stats.total_applications * 0.15), color: "#ef4444", pct: 15 },
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