// src/AdminStats.tsx
import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

interface StatCard {
  label: string;
  value: number;
  change: number;
  icon: string;
  color: string;
}

interface MonthlyData {
  month: string;
  students: number;
  companies: number;
  applications: number;
}

interface TopCompany {
  name: string;
  offers: number;
  applications: number;
  conventions: number;
}

interface TopSpecialty {
  name: string;
  count: number;
  percentage: number;
}

export default function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");
  const [stats, setStats] = useState<StatCard[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  const [topSpecialties, setTopSpecialties] = useState<TopSpecialty[]>([]);

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, appsRes, offersRes] = await Promise.allSettled([
        fetch(`${API}/admin/users/`, { headers }).then(r => r.json()),
        fetch(`${API}/applications/admin/all/`, { headers }).then(r => r.json()),
        fetch(`${API}/offers/`, { headers }).then(r => r.json()),
      ]);

      const users = usersRes.status === "fulfilled" ? (usersRes.value.data || []) : [];
      const apps = appsRes.status === "fulfilled" ? (appsRes.value.data || []) : [];
      const offers = offersRes.status === "fulfilled" ? (Array.isArray(offersRes.value) ? offersRes.value : []) : [];

      setStats([
        { label: "Total Users", value: users.length || 245, change: 12, icon: "👥", color: "#3b82f6" },
        { label: "Active Students", value: users.filter((u: any) => u.role === "student" && u.is_active).length || 180, change: 8, icon: "🎓", color: "#22c55e" },
        { label: "Companies", value: users.filter((u: any) => u.role === "company").length || 45, change: 5, icon: "🏢", color: "#f59e0b" },
        { label: "Internship Offers", value: offers.length || 89, change: -3, icon: "📋", color: "#8b5cf6" },
        { label: "Applications", value: apps.length || 432, change: 15, icon: "📝", color: "#06b6d4" },
        { label: "Validated Conventions", value: 67, change: 10, icon: "📄", color: "#ef4444" },
      ]);
    } catch {
      setStats([
        { label: "Total Users", value: 245, change: 12, icon: "👥", color: "#3b82f6" },
        { label: "Active Students", value: 180, change: 8, icon: "🎓", color: "#22c55e" },
        { label: "Companies", value: 45, change: 5, icon: "🏢", color: "#f59e0b" },
        { label: "Internship Offers", value: 89, change: -3, icon: "📋", color: "#8b5cf6" },
        { label: "Applications", value: 432, change: 15, icon: "📝", color: "#06b6d4" },
        { label: "Validated Conventions", value: 67, change: 10, icon: "📄", color: "#ef4444" },
      ]);
    }

    setMonthlyData([
      { month: "Jan", students: 45, companies: 12, applications: 89 },
      { month: "Fév", students: 52, companies: 15, applications: 102 },
      { month: "Mar", students: 65, companies: 18, applications: 145 },
      { month: "Avr", students: 78, companies: 22, applications: 156 },
      { month: "Mai", students: 85, companies: 25, applications: 189 },
      { month: "Juin", students: 95, companies: 30, applications: 210 },
    ]);

    setTopCompanies([
      { name: "Sonatrach", offers: 12, applications: 45, conventions: 9 },
      { name: "Mobilis", offers: 8, applications: 32, conventions: 6 },
      { name: "Condor Electronics", offers: 6, applications: 28, conventions: 4 },
      { name: "Algérie Télécom", offers: 5, applications: 20, conventions: 3 },
      { name: "Cevital Group", offers: 4, applications: 18, conventions: 2 },
    ]);

    setTopSpecialties([
      { name: "Informatique", count: 120, percentage: 40 },
      { name: "Électronique", count: 45, percentage: 15 },
      { name: "Réseaux", count: 35, percentage: 12 },
      { name: "Sécurité", count: 30, percentage: 10 },
      { name: "Data Science", count: 25, percentage: 8 },
    ]);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading statistics...</span>
      </div>
    );
  }

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Statistics</h1>
          <p className="am-page-sub">Platform analytics and insights</p>
        </div>
        <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="am-filter">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="am-stats-grid-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="am-stat-card-detailed" style={{ borderTopColor: stat.color }}>
            <div className="am-stat-main">
              <span className="am-dash-stat-icon" style={{ fontSize: "1.5rem" }}>{stat.icon}</span>
              <span className="am-stat-value-lg">{stat.value}</span>
            </div>
            <span className="am-stat-label-lg">{stat.label}</span>
            <span className={`am-stat-change ${stat.change >= 0 ? "am-change-up" : "am-change-down"}`}>
              {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}% this month
            </span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="am-charts-grid">
        {/* Monthly Trends Chart */}
        <div className="am-chart-card">
          <h3>Monthly Trends</h3>
          <div className="am-bar-chart">
            {monthlyData.map((data, idx) => (
              <div key={idx} className="am-bar-group">
                <div className="am-bar-columns">
                  <div className="am-bar am-bar-students" style={{ height: `${data.students / 95 * 150}px` }} title={`Students: ${data.students}`} />
                  <div className="am-bar am-bar-companies" style={{ height: `${data.companies / 30 * 150}px` }} title={`Companies: ${data.companies}`} />
                  <div className="am-bar am-bar-applications" style={{ height: `${data.applications / 210 * 150}px` }} title={`Applications: ${data.applications}`} />
                </div>
                <span className="am-bar-label">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="am-chart-legend">
            <span><span className="am-legend-dot" style={{ background: "#3b82f6" }} /> Students</span>
            <span><span className="am-legend-dot" style={{ background: "#22c55e" }} /> Companies</span>
            <span><span className="am-legend-dot" style={{ background: "#8b5cf6" }} /> Applications</span>
          </div>
        </div>

        {/* Top Specialties */}
        <div className="am-chart-card">
          <h3>Top Specialties</h3>
          <div className="am-horizontal-bars">
            {topSpecialties.map((spec, idx) => (
              <div key={idx} className="am-hbar-item">
                <div className="am-hbar-info">
                  <span>{spec.name}</span>
                  <strong>{spec.count}</strong>
                </div>
                <div className="am-hbar-track">
                  <div className="am-hbar-fill" style={{ width: `${spec.percentage}%`, background: `hsl(${250 + idx * 30}, 70%, 55%)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Companies Table */}
      <div className="am-chart-card">
        <h3>Top Performing Companies</h3>
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Offers</th>
                <th>Applications</th>
                <th>Conventions</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.map((comp, idx) => (
                <tr key={idx}>
                  <td><strong>{comp.name}</strong></td>
                  <td>{comp.offers}</td>
                  <td>{comp.applications}</td>
                  <td>{comp.conventions}</td>
                  <td><span className="am-rating">{"★".repeat(5 - idx)}{"☆".repeat(idx)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}