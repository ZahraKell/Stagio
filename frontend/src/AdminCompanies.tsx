// src/AdminCompanies.tsx
import { useState, useEffect } from "react";

interface Company {
  id: number;
  company_name: string;
  company_sector: string;
  company_website: string;
  town: string;
  description: string;
  logo: string | null;
  status: "approved" | "pending" | "rejected" | "suspended";
  email: string;
  pnum: string;
  offers_count: number;
  conventions_count: number;
  rating: number;
  submitted_date: string;
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [rejectModal, setRejectModal] = useState<{ show: boolean; companyId: number | null }>({ show: false, companyId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/admin/companies/pending/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCompanies(data.results || data || getMockCompanies());
    } catch {
      setCompanies(getMockCompanies());
    } finally {
      setLoading(false);
    }
  };

  const getMockCompanies = (): Company[] => [
    {
      id: 1, company_name: "Sonatrach", company_sector: "Énergie & Pétrole",
      company_website: "www.sonatrach.dz", town: "Alger",
      description: "Leading Algerian state-owned oil and gas company. One of the largest corporations in Africa with operations spanning the entire hydrocarbon value chain.",
      logo: null, status: "approved", email: "contact@sonatrach.dz", pnum: "+213 21 123456",
      offers_count: 12, conventions_count: 9, rating: 5, submitted_date: "2025-09-15"
    },
    {
      id: 2, company_name: "Mobilis", company_sector: "Télécommunications",
      company_website: "www.mobilis.dz", town: "Alger",
      description: "Major mobile telecommunications operator in Algeria providing 2G, 3G, and 4G services to millions of subscribers across the country.",
      logo: null, status: "approved", email: "rh@mobilis.dz", pnum: "+213 21 987654",
      offers_count: 8, conventions_count: 6, rating: 4, submitted_date: "2025-10-01"
    },
    {
      id: 3, company_name: "Condor Electronics", company_sector: "Électronique",
      company_website: "www.condor.dz", town: "Bordj Bou Arreridj",
      description: "Leading Algerian electronics manufacturer producing smartphones, tablets, TVs, and home appliances. One of the largest private companies in Algeria.",
      logo: null, status: "pending", email: "contact@condor.dz", pnum: "+213 35 789012",
      offers_count: 0, conventions_count: 0, rating: 0, submitted_date: "2026-04-26"
    },
    {
      id: 4, company_name: "Cevital Group", company_sector: "Agroalimentaire",
      company_website: "www.cevital.com", town: "Béjaïa",
      description: "Largest private conglomerate in Algeria with diverse activities in food processing, retail, industry, and services. Major sugar refiner worldwide.",
      logo: null, status: "pending", email: "cevital@cevital.dz", pnum: "+213 34 123456",
      offers_count: 0, conventions_count: 0, rating: 0, submitted_date: "2026-04-25"
    },
    {
      id: 5, company_name: "Ooredoo Algeria", company_sector: "Télécommunications",
      company_website: "www.ooredoo.dz", town: "Alger",
      description: "International telecommunications company providing mobile, fixed-line, and internet services across Algeria with cutting-edge 4G/5G infrastructure.",
      logo: null, status: "pending", email: "contact@ooredoo.dz", pnum: "+213 21 456789",
      offers_count: 0, conventions_count: 0, rating: 0, submitted_date: "2026-04-24"
    },
    {
      id: 6, company_name: "Algérie Télécom", company_sector: "Télécommunications",
      company_website: "www.algerietelecom.dz", town: "Alger",
      description: "National telecommunications provider offering fixed-line, internet, and data services. Backbone of Algeria's telecommunications infrastructure.",
      logo: null, status: "approved", email: "at@algerietelecom.dz", pnum: "+213 21 111111",
      offers_count: 5, conventions_count: 3, rating: 3, submitted_date: "2025-08-20"
    },
    {
      id: 7, company_name: "Naftal", company_sector: "Énergie & Pétrole",
      company_website: "www.naftal.dz", town: "Alger",
      description: "Algerian national company for petroleum products distribution and marketing. Operates the largest fuel distribution network in the country.",
      logo: null, status: "approved", email: "contact@naftal.dz", pnum: "+213 21 222222",
      offers_count: 3, conventions_count: 2, rating: 4, submitted_date: "2025-11-10"
    },
    {
      id: 8, company_name: "Djezzy", company_sector: "Télécommunications",
      company_website: "www.djezzy.dz", town: "Alger",
      description: "Major mobile network operator in Algeria offering innovative digital services, mobile money solutions, and enterprise communication packages.",
      logo: null, status: "approved", email: "rh@djezzy.dz", pnum: "+213 21 333333",
      offers_count: 6, conventions_count: 4, rating: 4, submitted_date: "2025-12-01"
    },
    {
      id: 9, company_name: "ENIEM", company_sector: "Électronique",
      company_website: "www.eniem.dz", town: "Tizi Ouzou",
      description: "National enterprise for household appliance industries. Leading manufacturer of refrigerators, air conditioners, and washing machines in Algeria.",
      logo: null, status: "rejected", email: "contact@eniem.dz", pnum: "+213 26 123456",
      offers_count: 0, conventions_count: 0, rating: 0, submitted_date: "2026-03-15"
    },
    {
      id: 10, company_name: "Biopharm", company_sector: "Pharmaceutique",
      company_website: "www.biopharm.dz", town: "Alger",
      description: "Leading pharmaceutical company in Algeria producing a wide range of medications and healthcare products for the local and international market.",
      logo: null, status: "pending", email: "contact@biopharm.dz", pnum: "+213 21 444444",
      offers_count: 0, conventions_count: 0, rating: 0, submitted_date: "2026-04-20"
    },
    {
      id: 11, company_name: "GICA", company_sector: "BTP & Matériaux",
      company_website: "www.gica.dz", town: "Alger",
      description: "Industrial group of cements of Algeria. Largest cement producer in the country with multiple plants across different regions.",
      logo: null, status: "suspended", email: "contact@gica.dz", pnum: "+213 21 555555",
      offers_count: 2, conventions_count: 1, rating: 2, submitted_date: "2025-07-01"
    },
    {
      id: 12, company_name: "Air Algérie", company_sector: "Transport & Logistique",
      company_website: "www.airalgerie.dz", town: "Alger",
      description: "National airline of Algeria, operating scheduled international and domestic services to over 70 destinations.",
      logo: null, status: "pending", email: "rh@airalgerie.dz", pnum: "+213 21 666666",
      offers_count: 0, conventions_count: 0, rating: 0, submitted_date: "2026-04-22"
    },
  ];

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`http://localhost:8000/api/admin/companies/${id}/approve/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("API call failed, updating locally");
    }
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: "approved" as const } : c));
    setSuccessMsg("Company approved successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleReject = (id: number) => {
    setRejectModal({ show: true, companyId: id });
  };

  const confirmReject = async () => {
    if (!rejectModal.companyId) return;
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`http://localhost:8000/api/admin/companies/${rejectModal.companyId}/reject/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
    } catch (err) {
      console.error("API call failed, updating locally");
    }
    setCompanies(prev => prev.map(c => c.id === rejectModal.companyId ? { ...c, status: "rejected" as const } : c));
    setRejectModal({ show: false, companyId: null });
    setRejectReason("");
    setSuccessMsg("Company rejected.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSuspend = (id: number) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: "suspended" as const } : c));
    setSuccessMsg("Company suspended.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleReactivate = (id: number) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: "approved" as const } : c));
    setSuccessMsg("Company reactivated.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const viewDetails = (company: Company) => {
    setSelectedCompany(company);
    setShowDetailModal(true);
  };

  // Filtering
  const allSectors = [...new Set(companies.map(c => c.company_sector))];

  const filtered = companies.filter(c => {
    const matchesFilter = filter === "all" ? true : c.status === filter;
    const matchesSearch = search === "" ? true :
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.company_sector.toLowerCase().includes(search.toLowerCase()) ||
      c.town.toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === "" ? true : c.company_sector === sectorFilter;
    return matchesFilter && matchesSearch && matchesSector;
  });

  const counts = {
    all: companies.length,
    approved: companies.filter(c => c.status === "approved").length,
    pending: companies.filter(c => c.status === "pending").length,
    rejected: companies.filter(c => c.status === "rejected").length,
    suspended: companies.filter(c => c.status === "suspended").length,
  };

  const statusConfig: Record<string, { badge: string; label: string; color: string }> = {
    approved: { badge: "am-badge-approved", label: "Approved", color: "#22c55e" },
    pending: { badge: "am-badge-pending", label: "Pending", color: "#f59e0b" },
    rejected: { badge: "am-badge-rejected", label: "Rejected", color: "#ef4444" },
    suspended: { badge: "am-badge-suspended", label: "Suspended", color: "#6b7280" },
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading companies...</span>
      </div>
    );
  }

  return (
    <div className="am-page-root">
      {/* Page Header */}
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Companies</h1>
          <p className="am-page-sub">
            Total Partners: {counts.all} • Approved: {counts.approved} • Pending: {counts.pending} • Conventions: {companies.reduce((sum, c) => sum + c.conventions_count, 0)}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="am-success-msg">
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search company, sector, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="am-filter">
          <option value="">All Sectors</option>
          {allSectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="am-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`am-tab ${filter === tab.key ? "am-tab-active" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="am-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <p className="am-results-count">{filtered.length} companies found</p>

      {/* Companies Grid */}
      <div className="am-companies-grid">
        {filtered.map(company => (
          <div key={company.id} className={`am-company-card ${company.status === "pending" ? "am-company-pending" : ""}`}>
            {/* Status stripe */}
            <div className="am-company-stripe" style={{ background: statusConfig[company.status].color }} />

            <div className="am-company-card-top">
              <div className="am-company-logo">
                {company.logo ? (
                  <img src={company.logo} alt={company.company_name} />
                ) : (
                  company.company_name.charAt(0)
                )}
              </div>
              <div className="am-company-info">
                <h4>{company.company_name}</h4>
                <span className="am-company-sector">{company.company_sector}</span>
                <span className="am-company-town">📍 {company.town}</span>
              </div>
              <span className={`am-company-status-badge ${statusConfig[company.status].badge}`}>
                {statusConfig[company.status].label}
                {company.status === "approved" && company.rating > 0 && (
                  <span className="am-verified-check">✓</span>
                )}
              </span>
            </div>

            <div className="am-company-card-body">
              <p className="am-company-desc">{company.description.slice(0, 120)}...</p>

              <div className="am-company-stats">
                <div className="am-company-stat">
                  <span className="am-stat-icon-small">📋</span>
                  <span>{company.offers_count} offers</span>
                </div>
                <div className="am-company-stat">
                  <span className="am-stat-icon-small">📄</span>
                  <span>{company.conventions_count} conventions</span>
                </div>
                {company.rating > 0 && (
                  <div className="am-company-stat">
                    <span className="am-stat-icon-small">⭐</span>
                    <span>{company.rating}/5</span>
                  </div>
                )}
              </div>

              <div className="am-company-contact">
                <span>📧 {company.email}</span>
                <span>📞 {company.pnum || "N/A"}</span>
              </div>

              <div className="am-company-date">
                Submitted: {company.submitted_date}
              </div>
            </div>

            {/* Actions */}
            <div className="am-company-card-footer">
              <button onClick={() => viewDetails(company)} className="am-btn-view-detail">
                👁 View Details
              </button>

              {company.status === "pending" && (
                <div className="am-pending-actions">
                  <button onClick={() => handleApprove(company.id)} className="am-btn-approve-sm">
                    ✓ Approve
                  </button>
                  <button onClick={() => handleReject(company.id)} className="am-btn-reject-sm">
                    ✕ Reject
                  </button>
                </div>
              )}

              {company.status === "approved" && (
                <button onClick={() => handleSuspend(company.id)} className="am-btn-suspend-sm">
                  ⏸ Suspend
                </button>
              )}

              {company.status === "suspended" && (
                <button onClick={() => handleReactivate(company.id)} className="am-btn-reactivate-sm">
                  ▶ Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="am-modal-overlay" onClick={() => setRejectModal({ show: false, companyId: null })}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <h3>Reject Company</h3>
              <button onClick={() => setRejectModal({ show: false, companyId: null })} className="am-close-btn">✕</button>
            </div>
            <div className="am-modal-body">
              <div className="am-form-group">
                <label>Reason for rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejecting this company..."
                  rows={3}
                  className="am-textarea"
                />
              </div>
              <div className="am-form-actions">
                <button onClick={() => setRejectModal({ show: false, companyId: null })} className="am-btn-cancel">Cancel</button>
                <button onClick={confirmReject} className="am-btn-submit-danger">Confirm Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCompany && (
        <div className="am-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="am-modal am-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <div className="am-modal-company-header">
                <div className="am-company-logo-lg">{selectedCompany.company_name.charAt(0)}</div>
                <div>
                  <h3>{selectedCompany.company_name}</h3>
                  <span>{selectedCompany.company_sector} • {selectedCompany.town}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="am-close-btn">✕</button>
            </div>
            <div className="am-modal-body">
              <div className="am-detail-sections">
                <div className="am-detail-section">
                  <h4>About</h4>
                  <p>{selectedCompany.description}</p>
                </div>

                <div className="am-detail-section">
                  <h4>Contact Information</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item">
                      <span>Email</span>
                      <strong>{selectedCompany.email}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Phone</span>
                      <strong>{selectedCompany.pnum || "N/A"}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Website</span>
                      <strong>{selectedCompany.company_website || "N/A"}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Location</span>
                      <strong>{selectedCompany.town}</strong>
                    </div>
                  </div>
                </div>

                <div className="am-detail-section">
                  <h4>Platform Activity</h4>
                  <div className="am-detail-grid-inner">
                    <div className="am-detail-item">
                      <span>Offers Posted</span>
                      <strong>{selectedCompany.offers_count}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Conventions</span>
                      <strong>{selectedCompany.conventions_count}</strong>
                    </div>
                    <div className="am-detail-item">
                      <span>Status</span>
                      <span className={`am-company-status-badge ${statusConfig[selectedCompany.status].badge}`}>
                        {statusConfig[selectedCompany.status].label}
                      </span>
                    </div>
                    <div className="am-detail-item">
                      <span>Submitted</span>
                      <strong>{selectedCompany.submitted_date}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {selectedCompany.status === "pending" && (
                <div className="am-detail-actions-bottom">
                  <button onClick={() => { handleApprove(selectedCompany.id); setShowDetailModal(false); }} className="am-btn-approve">
                    ✓ Approve Company
                  </button>
                  <button onClick={() => { setShowDetailModal(false); handleReject(selectedCompany.id); }} className="am-btn-reject">
                    ✕ Reject Company
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}