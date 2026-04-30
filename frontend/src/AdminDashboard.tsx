// src/AdminDashboard.tsx
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const statsCards = [
    { label: "Total Users", value: 45, sub: "12 new this month", color: "#3b82f6", icon: "👥" },
    { label: "Active Students", value: 28, sub: "3 currently in internship", color: "#22c55e", icon: "🎓" },
    { label: "Companies", value: 12, sub: "5 pending approval", color: "#f59e0b", icon: "🏢" },
    { label: "Applications", value: 67, sub: "23 accepted, 15 pending", color: "#8b5cf6", icon: "📋" },
    { label: "Conventions", value: 23, sub: "18 completed, 5 in progress", color: "#06b6d4", icon: "📄" },
    { label: "Offers Active", value: 14, sub: "7 pending review", color: "#ef4444", icon: "📌" },
  ];

  const recentApplications = [
    { id: "APP-042", student: "Ahmed Benali", offer: "Software Engineering Intern", company: "Sonatrach", date: "28 Apr", status: "pending" },
    { id: "APP-041", student: "Sara Meziane", offer: "Data Analyst", company: "Mobilis", date: "27 Apr", status: "accepted" },
    { id: "APP-040", student: "Karim Lounis", offer: "Backend Dev", company: "Condor", date: "26 Apr", status: "reviewed" },
    { id: "APP-039", student: "Nadia Hamdi", offer: "UI/UX Designer", company: "Ooredoo", date: "25 Apr", status: "refused" },
    { id: "APP-038", student: "Youcef Ould", offer: "Network Engineer", company: "Algérie Télécom", date: "24 Apr", status: "pending" },
  ];

  const pendingCompanies = [
    { id: 1, name: "Condor Electronics", sector: "Électronique", city: "Bordj Bou Arreridj", date: "26 Apr" },
    { id: 2, name: "Cevital Group", sector: "Agroalimentaire", city: "Béjaïa", date: "25 Apr" },
    { id: 3, name: "Ooredoo Algeria", sector: "Télécommunications", city: "Alger", date: "24 Apr" },
  ];

  return (
    <div className="am-dash-root">
      <div className="am-dash-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, Administrator</p>
        </div>
        <div className="am-dash-date">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="am-dash-stats">
        {statsCards.map((stat, idx) => (
          <div key={idx} className="am-dash-stat" style={{ borderTopColor: stat.color }}>
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
            <a href="/admin/applications" className="am-dash-link">View all →</a>
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
                {recentApplications.map((app) => (
                  <tr key={app.id}>
                    <td><strong>{app.student}</strong></td>
                    <td className="am-dash-offer-cell">{app.offer}</td>
                    <td>{app.company}</td>
                    <td className="am-dash-date-cell">{app.date}</td>
                    <td>
                      <span className={`am-dash-badge am-dash-${app.status}`}>
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
              <a href="/admin/companies" className="am-dash-link">Review →</a>
            </div>
            <div className="am-dash-card-body">
              {pendingCompanies.map((comp) => (
                <div key={comp.id} className="am-dash-pending-item">
                  <div className="am-dash-pending-info">
                    <strong>{comp.name}</strong>
                    <span>{comp.sector} • {comp.city}</span>
                    <span className="am-dash-pending-date">Applied: {comp.date}</span>
                  </div>
                  <div className="am-dash-pending-actions">
                    <button className="am-dash-btn-approve">✓</button>
                    <button className="am-dash-btn-reject">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution */}
          <div className="am-dash-card">
            <div className="am-dash-card-head">
              <h3>Applications Distribution</h3>
            </div>
            <div className="am-dash-card-body">
              <div className="am-dash-distro">
                <div className="am-dash-distro-item">
                  <div className="am-dash-distro-bar">
                    <div className="am-dash-distro-fill" style={{ width: "35%", background: "#f59e0b" }} />
                  </div>
                  <span>Pending</span>
                  <strong>15</strong>
                </div>
                <div className="am-dash-distro-item">
                  <div className="am-dash-distro-bar">
                    <div className="am-dash-distro-fill" style={{ width: "20%", background: "#3b82f6" }} />
                  </div>
                  <span>In Review</span>
                  <strong>8</strong>
                </div>
                <div className="am-dash-distro-item">
                  <div className="am-dash-distro-bar">
                    <div className="am-dash-distro-fill" style={{ width: "55%", background: "#22c55e" }} />
                  </div>
                  <span>Accepted</span>
                  <strong>23</strong>
                </div>
                <div className="am-dash-distro-item">
                  <div className="am-dash-distro-bar">
                    <div className="am-dash-distro-fill" style={{ width: "25%", background: "#ef4444" }} />
                  </div>
                  <span>Refused</span>
                  <strong>10</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}