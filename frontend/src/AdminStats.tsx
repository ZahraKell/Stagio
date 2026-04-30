// src/AdminStats.tsx
import { useState, useEffect } from "react";

interface StatData {
  label: string;
  value: number;
  change: number;
  color: string;
}

export default function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const stats: StatData[] = [
    { label: "Total Users", value: 245, change: 12, color: "#3b82f6" },
    { label: "Active Students", value: 180, change: 8, color: "#22c55e" },
    { label: "Registered Companies", value: 45, change: 5, color: "#f59e0b" },
    { label: "Internship Offers", value: 89, change: -3, color: "#8b5cf6" },
    { label: "Applications", value: 432, change: 15, color: "#06b6d4" },
    { label: "Validated Conventions", value: 67, change: 10, color: "#ef4444" },
  ];

  const monthlyData = [
    { month: "Jan", students: 45, companies: 12, applications: 89 },
    { month: "Fév", students: 52, companies: 15, applications: 102 },
    { month: "Mar", students: 65, companies: 18, applications: 145 },
    { month: "Avr", students: 78, companies: 22, applications: 156 },
    { month: "Mai", students: 85, companies: 25, applications: 189 },
    { month: "Juin", students: 95, companies: 30, applications: 210 },
  ];

  const topCompanies = [
    { name: "Sonatrach", offers: 12, applications: 45, conventions: 9 },
    { name: "Mobilis", offers: 8, applications: 32, conventions: 6 },
    { name: "Condor Electronics", offers: 6, applications: 28, conventions: 4 },
    { name: "Algérie Télécom", offers: 5, applications: 20, conventions: 3 },
    { name: "Cevital Group", offers: 4, applications: 18, conventions: 2 },
  ];

  const topSpecialties = [
    { name: "Informatique", count: 120, percentage: 40 },
    { name: "Électronique", count: 45, percentage: 15 },
    { name: "Réseaux", count: 35, percentage: 12 },
    { name: "Sécurité", count: 30, percentage: 10 },
    { name: "Data Science", count: 25, percentage: 8 },
  ];

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
              <span className="am-stat-value-lg">{stat.value}</span>
              <span className={`am-stat-change ${stat.change >= 0 ? "am-change-up" : "am-change-down"}`}>
                {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}%
              </span>
            </div>
            <span className="am-stat-label-lg">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="am-charts-grid">
        {/* Monthly Trends */}
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
                  <td>
                    <div className="am-rating">
                      {"★".repeat(5 - idx)}{"☆".repeat(idx)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}