// src/AdminApplications.tsx
import { useState, useEffect } from "react";

interface Application {
  id: string;
  student_name: string;
  student_level: string;
  student_speciality: string;
  offer_title: string;
  company_name: string;
  city: string;
  date: string;
  status: "pending" | "under_review" | "accepted" | "rejected";
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [offerFilter, setOfferFilter] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setTimeout(() => {
      setApplications(getMockApplications());
      setLoading(false);
    }, 500);
  };

  const getMockApplications = (): Application[] => [
    { id: "APP-2026-042", student_name: "Mounir Samir", student_level: "L3", student_speciality: "Informatique", offer_title: "Mobile Dev Intern", company_name: "Mobilis", city: "Constantine", date: "20 Avr 2026", status: "pending" },
    { id: "APP-2026-041", student_name: "Rahmani Yasmine", student_level: "M2", student_speciality: "Sécurité", offer_title: "Cybersecurity Intern", company_name: "Algérie Télécom", city: "Sétif", date: "15 Avr 2026", status: "pending" },
    { id: "APP-2026-040", student_name: "Ahmed Benali", student_level: "L3", student_speciality: "Informatique", offer_title: "Software Engineering Intern", company_name: "Sonatrach", city: "Constantine", date: "10 Avr 2026", status: "accepted" },
    { id: "APP-2026-039", student_name: "Sara Meziane", student_level: "M1", student_speciality: "Informatique", offer_title: "Data Analyst", company_name: "Mobilis", city: "Alger", date: "08 Avr 2026", status: "accepted" },
    { id: "APP-2026-038", student_name: "Karim Lounis", student_level: "L3", student_speciality: "Informatique", offer_title: "Backend Dev Intern", company_name: "Condor Electronics", city: "Bordj Bou Arreridj", date: "05 Avr 2026", status: "under_review" },
    { id: "APP-2026-037", student_name: "Nadia Hamdi", student_level: "L2", student_speciality: "Informatique", offer_title: "UI/UX Designer", company_name: "Ooredoo", city: "Alger", date: "01 Avr 2026", status: "rejected" },
    { id: "APP-2026-036", student_name: "Youcef Ould", student_level: "L3", student_speciality: "Informatique", offer_title: "Network Engineer", company_name: "Algérie Télécom", city: "Sétif", date: "28 Mar 2026", status: "accepted" },
    { id: "APP-2026-035", student_name: "Amira Saadi", student_level: "L2", student_speciality: "Informatique", offer_title: "Frontend Developer", company_name: "Sonatrach", city: "Oran", date: "25 Mar 2026", status: "pending" },
    { id: "APP-2026-034", student_name: "Kamel Djalil", student_level: "L3", student_speciality: "Électronique", offer_title: "Industrial Automation", company_name: "Cevital", city: "Béjaïa", date: "20 Mar 2026", status: "rejected" },
    { id: "APP-2026-033", student_name: "Lyna Kerboua", student_level: "M1", student_speciality: "Informatique", offer_title: "Data Science Intern", company_name: "Mobilis", city: "Alger", date: "15 Mar 2026", status: "accepted" },
  ];

  const handleStatusChange = (id: string, newStatus: Application["status"]) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  const filtered = applications.filter(app => {
    const matchesFilter = filter === "all" ? true : app.status === filter;
    const matchesSearch = search === "" ? true :
      app.student_name.toLowerCase().includes(search.toLowerCase()) ||
      app.offer_title.toLowerCase().includes(search.toLowerCase()) ||
      app.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesOffer = offerFilter === "" ? true : app.offer_title.includes(offerFilter);
    return matchesFilter && matchesSearch && matchesOffer;
  });

  const statusBadge: Record<string, string> = {
    pending: "am-badge-pending",
    under_review: "am-badge-review",
    accepted: "am-badge-accepted",
    rejected: "am-badge-rejected",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    under_review: "Under Review",
    accepted: "Accepted",
    rejected: "Rejected",
  };

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Applications</h1>
          <p className="am-page-sub">
            {applications.length} Total • All: {applications.length} • 
            Pending: {applications.filter(a => a.status === "pending").length} • 
            Under Review: {applications.filter(a => a.status === "under_review").length} • 
            Accepted: {applications.filter(a => a.status === "accepted").length} • 
            Rejected: {applications.filter(a => a.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="am-filter">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={offerFilter} onChange={e => setOfferFilter(e.target.value)} className="am-filter">
          <option value="">All Offers</option>
          <option value="Software">Software Engineering</option>
          <option value="Data">Data Analyst</option>
          <option value="Mobile">Mobile Dev</option>
          <option value="Cyber">Cybersecurity</option>
        </select>
      </div>

      <p className="am-results-count">{filtered.length} applications found</p>

      {/* Applications List */}
      <div className="am-apps-list">
        {filtered.map(app => (
          <div key={app.id} className="am-app-card">
            <div className="am-app-card-left">
              <div className="am-app-student-av">{app.student_name.charAt(0)}</div>
            </div>
            <div className="am-app-card-body">
              <div className="am-app-card-header">
                <h4>{app.offer_title}</h4>
                <span className={`am-app-status ${statusBadge[app.status]}`}>
                  {statusLabel[app.status]}
                </span>
              </div>
              <p className="am-app-student">
                {app.student_name} • {app.student_level} · {app.student_speciality}
              </p>
              <div className="am-app-meta">
                <span>🏢 {app.company_name}</span>
                <span>📍 {app.city}</span>
                <span>📅 {app.date}</span>
                <span className="am-app-id">{app.id}</span>
              </div>
            </div>
            <div className="am-app-card-actions">
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                className="am-status-select"
              >
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="accepted">Accept</option>
                <option value="rejected">Reject</option>
              </select>
              <button className="am-btn-view-details">View Details →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}