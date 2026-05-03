// src/AdminStats.tsx
import { useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";

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
      const [usersRes, appsRes, offersRes] = await Promise.allSettled([
        api.get("admin/users/"),
        api.get("applications/admin/all/"),
        api.get("admin/offers/"),
      ]);

      type U = { role?: string; is_active?: boolean };
      const users: U[] =
        usersRes.status === "fulfilled"
          ? ((usersRes.value.data as { data?: U[] })?.data ?? [])
          : [];
      const apps: unknown[] =
        appsRes.status === "fulfilled"
          ? ((appsRes.value.data as { data?: unknown[] })?.data ?? [])
          : [];
      const offersRaw =
        offersRes.status === "fulfilled" ? offersRes.value.data : null;
      const offers: Array<{ company_name?: string; field?: string | null }> = Array.isArray(offersRaw)
        ? (offersRaw as typeof offers)
        : [];

      if (usersRes.status === "rejected" || appsRes.status === "rejected") {
        toast.error("Some statistics could not be loaded.");
      }

      const activeStudents = users.filter((u) => u.role === "student" && u.is_active).length;
      const companies = users.filter((u) => u.role === "company").length;

      const byCompany = new Map<string, number>();
      for (const o of offers) {
        const n = o.company_name || "—";
        byCompany.set(n, (byCompany.get(n) ?? 0) + 1);
      }
      const topCo = [...byCompany.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, offersCount]) => ({
          name,
          offers: offersCount,
          applications: 0,
          conventions: 0,
        }));

      const byField = new Map<string, number>();
      for (const o of offers) {
        const f = (o.field || "").trim() || "Autre";
        byField.set(f, (byField.get(f) ?? 0) + 1);
      }
      const fieldTotal = offers.length || 1;
      const topSpec = [...byField.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / fieldTotal) * 100),
        }));

      setStats([
        { label: "Total Users", value: users.length, change: 0, icon: "👥", color: "#3b82f6" },
        { label: "Active Students", value: activeStudents, change: 0, icon: "🎓", color: "#22c55e" },
        { label: "Companies", value: companies, change: 0, icon: "🏢", color: "#f59e0b" },
        { label: "Internship Offers", value: offers.length, change: 0, icon: "📋", color: "#8b5cf6" },
        { label: "Applications", value: apps.length, change: 0, icon: "📝", color: "#06b6d4" },
        { label: "Validated Conventions", value: 0, change: 0, icon: "📄", color: "#ef4444" },
      ]);

      setMonthlyData([]);
      setTopCompanies(topCo);
      setTopSpecialties(topSpec);
    } catch {
      toast.error("Statistics failed to load.");
      setStats([
        { label: "Total Users", value: 0, change: 0, icon: "👥", color: "#3b82f6" },
        { label: "Active Students", value: 0, change: 0, icon: "🎓", color: "#22c55e" },
        { label: "Companies", value: 0, change: 0, icon: "🏢", color: "#f59e0b" },
        { label: "Internship Offers", value: 0, change: 0, icon: "📋", color: "#8b5cf6" },
        { label: "Applications", value: 0, change: 0, icon: "📝", color: "#06b6d4" },
        { label: "Validated Conventions", value: 0, change: 0, icon: "📄", color: "#ef4444" },
      ]);
      setMonthlyData([]);
      setTopCompanies([]);
      setTopSpecialties([]);
    }

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
