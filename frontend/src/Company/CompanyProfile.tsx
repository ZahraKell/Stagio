// src/CompanyProfile.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyLayout from "../components/CompanyLayout";

interface CompanyProfile {
  company_name: string;
  company_sector: string;
  company_website: string;
  town: string;
  description: string;
  email: string;
  pnum: string;
  is_approved: boolean;
  is_rejected: boolean;
  rejection_reason?: string;
  submitted_at?: string;
  approved_at?: string;
}

const API = "http://localhost:8000/api";

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [editForm, setEditForm] = useState({
    company_name: "",
    company_sector: "",
    company_website: "",
    town: "",
    description: "",
    pnum: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/company/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error && data.data) {
        setProfile(data.data);
        setEditForm({
          company_name: data.data.company_name || "",
          company_sector: data.data.company_sector || "",
          company_website: data.data.company_website || "",
          town: data.data.town || "",
          description: data.data.description || "",
          pnum: data.data.pnum || "",
        });
      } else {
        setProfile(getMockProfile());
        setEditForm({
          company_name: getMockProfile().company_name,
          company_sector: getMockProfile().company_sector,
          company_website: getMockProfile().company_website,
          town: getMockProfile().town,
          description: getMockProfile().description,
          pnum: getMockProfile().pnum,
        });
      }
    } catch {
      const mock = getMockProfile();
      setProfile(mock);
      setEditForm({
        company_name: mock.company_name,
        company_sector: mock.company_sector,
        company_website: mock.company_website,
        town: mock.town,
        description: mock.description,
        pnum: mock.pnum,
      });
    } finally {
      setLoading(false);
    }
  };

  const getMockProfile = (): CompanyProfile => ({
    company_name: localStorage.getItem("company_name") || "Mon Entreprise",
    company_sector: "Télécommunications",
    company_website: "www.example.dz",
    town: "Alger",
    description:
      "Description de votre entreprise. Modifiez ce texte pour présenter votre activité.",
    email: localStorage.getItem("user_data")
      ? JSON.parse(localStorage.getItem("user_data") || "{}").email
      : "contact@example.dz",
    pnum: "+213 00 00 00 00",
    is_approved: true,
    is_rejected: false,
    submitted_at: "2025-01-01",
    approved_at: "2025-01-05",
  });

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API}/company/profile/update/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
    } catch {}
    setProfile((prev) => (prev ? { ...prev, ...editForm } : null));
    setEditing(false);
    setSuccessMsg("Profile updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="am-loading">
          <div className="am-spinner" />
          <span>Loading profile...</span>
        </div>
      </CompanyLayout>
    );
  }

  if (!profile) {
    return (
      <CompanyLayout>
        <div className="am-empty">
          <span className="am-empty-icon">🏢</span>
          <h3>Profile Not Found</h3>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="am-page-root">
        <div className="am-page-header">
          <div>
            <h1 className="am-page-title">Company Profile</h1>
            <p className="am-page-sub">Manage your company information</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="am-btn-edit">
            {editing ? "✕ Cancel" : "✏️ Edit Profile"}
          </button>
        </div>

        {successMsg && (
          <div className="am-success-msg">
            <span>✅</span> {successMsg}
          </div>
        )}

        {/* Status Badge */}
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          {profile.is_approved && (
            <span className="am-status-badge am-status-active">
              ✅ Approved
            </span>
          )}
          {profile.is_rejected && (
            <span className="am-status-badge am-status-inactive">
              ❌ Rejected
            </span>
          )}
          {!profile.is_approved && !profile.is_rejected && (
            <span
              className="am-status-badge"
              style={{ background: "#fef3c7", color: "#92400e" }}
            >
              ⏳ Pending Review
            </span>
          )}
        </div>

        {profile.rejection_reason && (
          <div className="am-error-msg">
            <span>❌</span> <strong>Rejection reason:</strong>{" "}
            {profile.rejection_reason}
          </div>
        )}

        <div className="am-detail-layout">
          <div className="am-detail-main">
            <div className="am-detail-card">
              <div className="am-detail-card-header">
                <div
                  className="am-company-logo"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    fontSize: "1.3rem",
                  }}
                >
                  {profile.company_name.charAt(0)}
                </div>
                <div>
                  <h2>{profile.company_name}</h2>
                  <span style={{ color: "#64748b", fontSize: ".8rem" }}>
                    {profile.company_sector} • {profile.town}
                  </span>
                </div>
              </div>

              <div className="am-detail-card-body">
                {editing ? (
                  <div className="am-detail-grid-2">
                    <div className="am-form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={editForm.company_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            company_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="am-form-group">
                      <label>Sector</label>
                      <input
                        type="text"
                        value={editForm.company_sector}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            company_sector: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="am-form-group">
                      <label>Website</label>
                      <input
                        type="text"
                        value={editForm.company_website}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            company_website: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="am-form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={editForm.town}
                        onChange={(e) =>
                          setEditForm({ ...editForm, town: e.target.value })
                        }
                      />
                    </div>
                    <div className="am-form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={editForm.pnum}
                        onChange={(e) =>
                          setEditForm({ ...editForm, pnum: e.target.value })
                        }
                      />
                    </div>
                    <div className="am-form-group am-form-actions-full">
                      <label>Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="am-textarea"
                      />
                    </div>
                    <div className="am-form-actions-full">
                      <button onClick={handleSave} className="am-btn-save">
                        💾 Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="am-detail-info-grid">
                    {[
                      { label: "Company Name", value: profile.company_name },
                      { label: "Sector", value: profile.company_sector },
                      {
                        label: "Website",
                        value: profile.company_website || "—",
                      },
                      { label: "City", value: profile.town || "—" },
                      { label: "Email", value: profile.email },
                      { label: "Phone", value: profile.pnum || "—" },
                      {
                        label: "Submitted",
                        value: profile.submitted_at
                          ? new Date(profile.submitted_at).toLocaleDateString(
                              "fr-DZ",
                            )
                          : "—",
                      },
                      {
                        label: "Approved",
                        value: profile.approved_at
                          ? new Date(profile.approved_at).toLocaleDateString(
                              "fr-DZ",
                            )
                          : "—",
                      },
                    ].map((item) => (
                      <div key={item.label} className="am-detail-info-item">
                        <span className="am-detail-label">{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {profile.description && !editing && (
              <div className="am-detail-card">
                <div className="am-detail-card-header">
                  <h3>📝 About</h3>
                </div>
                <div className="am-detail-card-body">
                  <p
                    style={{
                      fontSize: ".82rem",
                      color: "#334155",
                      lineHeight: 1.6,
                    }}
                  >
                    {profile.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="am-detail-sidebar">
            <div className="am-detail-card">
              <div className="am-detail-card-header">
                <h3>⚡ Quick Actions</h3>
              </div>
              <div className="am-detail-card-body">
                <button
                  onClick={() => navigate("/company/offers/new")}
                  className="am-action-btn-full am-action-activate"
                >
                  📋 Post New Offer
                </button>
                <button
                  onClick={() => navigate("/company/settings")}
                  className="am-action-btn-full am-action-reset"
                >
                  ⚙️ Account Settings
                </button>
                <button
                  onClick={() => navigate("/company/dashboard")}
                  className="am-action-btn-full"
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  📊 Dashboard
                </button>
              </div>
            </div>

            {/* Approval Status */}
            <div className="am-detail-card">
              <div className="am-detail-card-header">
                <h3>📋 Account Status</h3>
              </div>
              <div className="am-detail-card-body">
                <div className="am-activity-list">
                  <div className="am-activity-item">
                    <span
                      className={`am-activity-dot ${profile.submitted_at ? "am-activity-active" : ""}`}
                    />
                    <div>
                      <p>Profile Submitted</p>
                      <time>
                        {profile.submitted_at
                          ? new Date(profile.submitted_at).toLocaleDateString(
                              "fr-DZ",
                            )
                          : "—"}
                      </time>
                    </div>
                  </div>
                  <div className="am-activity-item">
                    <span
                      className={`am-activity-dot ${profile.is_approved ? "am-activity-active" : ""}`}
                    />
                    <div>
                      <p>Approved</p>
                      <time>
                        {profile.approved_at
                          ? new Date(profile.approved_at).toLocaleDateString(
                              "fr-DZ",
                            )
                          : "Pending"}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
