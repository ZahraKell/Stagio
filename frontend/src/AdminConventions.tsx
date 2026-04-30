// src/AdminConventions.tsx
import { useState } from "react";

export default function AdminConventions() {
  const [activeTab, setActiveTab] = useState("all");

  const conventions = [
    { id: "CV-2026-081", student: "Benali Ahmed", company: "Condor Electronics", start: "01 Juin 2026", end: "31 Juil 2026", field: "Électronique", status: "complete" },
    { id: "CV-2026-079", student: "Mounir Samir", company: "Mobilis", start: "01 Juin 2026", end: "31 Août 2026", field: "Informatique", status: "active" },
    { id: "CV-2026-078", student: "Rahmani Yasmine", company: "Algérie Télécom", start: "15 Mai 2026", end: "15 Août 2026", field: "Sécurité", status: "pending" },
    { id: "CV-2026-077", student: "Amira Saadi", company: "Sonatrach", start: "01 Mai 2026", end: "31 Juil 2026", field: "Informatique", status: "expired" },
  ];

  const tabs = [
    { key: "all", label: "All", count: 4 },
    { key: "active", label: "Active", count: 1 },
    { key: "complete", label: "Complete", count: 1 },
    { key: "expired", label: "Expired", count: 1 },
  ];

  const filteredConvs = activeTab === "all" ? conventions : conventions.filter(c => c.status === activeTab);

  const statusBadge: Record<string, string> = {
    complete: "am-conv-complete",
    active: "am-conv-active",
    pending: "am-conv-pending",
    expired: "am-conv-expired",
  };

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Conventions</h1>
          <p className="am-page-sub">1 Generated • 1 Sent • 1 Stud. Signed • 1 Co. Signed • 1 Stamped • 1 Complete</p>
        </div>
      </div>

      <div className="am-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`am-tab ${activeTab === tab.key ? "am-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="am-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="am-conv-list">
        {filteredConvs.map(conv => (
          <div key={conv.id} className="am-conv-card">
            <div className="am-conv-card-left">
              <span className="am-conv-id">{conv.id}</span>
            </div>
            <div className="am-conv-card-body">
              <h4>{conv.student} → {conv.company}</h4>
              <div className="am-conv-dates">
                <span>📅 {conv.start} – {conv.end}</span>
                <span>📂 {conv.field}</span>
              </div>
            </div>
            <div className="am-conv-card-right">
              <span className={`am-conv-badge ${statusBadge[conv.status]}`}>
                {conv.status}
              </span>
              <button className="am-btn-view">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}