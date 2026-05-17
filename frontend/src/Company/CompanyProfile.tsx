// src/CompanyProfile.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyLayout from "../components/CompanyLayout";
import api from "../api";
import toast from "react-hot-toast";

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
      const { data: body } = await api.get("auth/profile/");
      const res = body as { error?: boolean; data?: Record<string, unknown> };
      if (!res.error && res.data) {
        const profileData = res.data as {
          email?: string;
          town?: string;
          pnum?: string;
          company?: Record<string, unknown> | null;
        };
        const companyData = profileData.company ?? {};
        const cName = (companyData.company_name as string) || "";
        const approved = Boolean(companyData.is_approved);
        const rejected = Boolean(companyData.is_rejected);
        setEditForm({
          company_name: cName,
          company_sector: (companyData.company_sector as string) || "",
          company_website: (companyData.company_website as string) || "",
          town: (companyData.town as string) || (profileData.town as string) || "",
          description: (companyData.description as string) || "",
          pnum: (profileData.pnum as string) || "",
        });
        setProfile({
          company_name: cName,
          company_sector: (companyData.company_sector as string) || "",
          company_website: (companyData.company_website as string) || "",
          town: (companyData.town as string) || (profileData.town as string) || "",
          description: (companyData.description as string) || "",
          email: (profileData.email as string) || "",
          pnum: (profileData.pnum as string) || "",
          is_approved: approved,
          is_rejected: rejected,
          rejection_reason: companyData.rejection_reason as string | undefined,
          submitted_at: companyData.submitted_at as string | undefined,
          approved_at: companyData.approved_at as string | undefined,
        });
        if (cName) localStorage.setItem("company_name", cName);
      } else {
        toast.error("Could not load company profile.");
        setProfile(null);
      }
    } catch {
      toast.error("Could not load company profile.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.patch("auth/profile/update/", {
        ...editForm,
        company_town: editForm.town,
      });
      setProfile((prev) => (prev ? { ...prev, ...editForm } : null));
      setEditing(false);
      setSuccessMsg("Profile updated successfully!");
      toast.success("Profile updated.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchProfile();
    } catch {
      toast.error("Update failed (your account may be locked while pending approval).");
    }
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


