// src/AdminUserDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface UserDetail {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  town: string;
  pnum: string;
  date_joined: string;
  last_login: string;
}

interface StudentProfile {
  student_number: string;
  level: string;
  speciality: string;
  institution: string;
  average_mark: number;
  grade: string;
  field: string;
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "",
    is_active: true,
    town: "",
    pnum: "",
  });

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/admin/users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUser(data);
      setEditForm({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
        town: data.town || "",
        pnum: data.pnum || "",
      });
      // If student, fetch student profile
      if (data.role === "student") {
        fetchStudentProfile();
      }
    } catch (err) {
      // Use mock data
      const mockUser = getMockUserDetail(parseInt(id || "1"));
      setUser(mockUser);
      setEditForm({
        full_name: mockUser.full_name,
        email: mockUser.email,
        role: mockUser.role,
        is_active: mockUser.is_active,
        town: mockUser.town || "",
        pnum: mockUser.pnum || "",
      });
      if (mockUser.role === "student") {
        setStudentProfile(getMockStudentProfile());
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProfile = async () => {
    setStudentProfile(getMockStudentProfile());
  };

  const getMockUserDetail = (userId: number): UserDetail => {
    const users: Record<number, UserDetail> = {
      1: { id: 1, username: "ahmed.benali", email: "ahmed.benali@etu.univ-constantine1.dz", full_name: "Ahmed Benali", role: "student", is_active: true, town: "Constantine", pnum: "+213 555 123456", date_joined: "2023-09-15", last_login: "2026-04-28" },
      2: { id: 2, username: "sara.meziane", email: "sara.m@usthb.dz", full_name: "Sara Meziane", role: "student", is_active: true, town: "Alger", pnum: "+213 555 789012", date_joined: "2023-09-15", last_login: "2026-04-27" },
      3: { id: 3, username: "sonatrach", email: "contact@sonatrach.dz", full_name: "Sonatrach", role: "company", is_active: true, town: "Alger", pnum: "+213 21 123456", date_joined: "2024-01-10", last_login: "2026-04-28" },
      6: { id: 6, username: "condor", email: "condor@condor.dz", full_name: "Condor Electronics", role: "company", is_active: false, town: "Bordj Bou Arreridj", pnum: "+213 35 789012", date_joined: "2025-03-20", last_login: "2026-04-15" },
      9: { id: 9, username: "admin1", email: "admin@stageconnect.dz", full_name: "Admin User", role: "admin", is_active: true, town: "Alger", pnum: "+213 555 999999", date_joined: "2023-01-01", last_login: "2026-04-29" },
    };
    return users[userId] || users[1];
  };

  const getMockStudentProfile = (): StudentProfile => ({
    student_number: "2023/INF/0412",
    level: "L3",
    speciality: "Informatique",
    institution: "Université Frères Mentouri Constantine 1",
    average_mark: 14.5,
    grade: "Bien",
    field: "Informatique",
  });

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/admin/users/${id}/update/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setUser(prev => prev ? { ...prev, ...editForm } : null);
      setEditing(false);
      setSuccessMsg("User updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg("Failed to update user. Please try again.");
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      // Delete API call
      navigate("/admin/users");
    }
  };

  const handleToggleActive = async () => {
    const newStatus = !editForm.is_active;
    setEditForm(prev => ({ ...prev, is_active: newStatus }));
    if (user) setUser({ ...user, is_active: newStatus });
    // API call
  };

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading user details...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="am-empty">
        <span className="am-empty-icon">🔍</span>
        <h3>User Not Found</h3>
        <p>The user you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/admin/users")} className="am-btn-back">← Back to Users</button>
      </div>
    );
  }

  const roleBadge: Record<string, string> = {
    student: "am-role-student",
    company: "am-role-company",
    administration: "am-role-administration",
    admin: "am-role-admin",
  };

  return (
    <div className="am-page-root">
      {/* Back button */}
      <button onClick={() => navigate("/admin/users")} className="am-back-btn">
        ← Back to Users
      </button>

      {/* Messages */}
      {successMsg && <div className="am-success-msg"><span>✅</span> {successMsg}</div>}
      {errorMsg && <div className="am-error-msg"><span>❌</span> {errorMsg}</div>}

      <div className="am-detail-layout">
        {/* Left Column - User Info */}
        <div className="am-detail-main">
          {/* Profile Card */}
          <div className="am-detail-card">
            <div className="am-detail-card-header">
              <div className="am-detail-avatar-lg">
                {user.full_name.charAt(0)}
              </div>
              <div>
                <h2>{user.full_name}</h2>
                <span className={`am-role-badge ${roleBadge[user.role]}`}>
                  {user.role}
                </span>
                <span className={`am-status-badge ${user.is_active ? "am-status-active" : "am-status-inactive"}`} style={{ marginLeft: ".5rem" }}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="am-detail-actions-top">
                <button onClick={() => setEditing(!editing)} className="am-btn-edit">
                  {editing ? "✕ Cancel" : "✏️ Edit"}
                </button>
              </div>
            </div>

            <div className="am-detail-card-body">
              {editing ? (
                /* Edit Form */
                <div className="am-detail-grid-2">
                  <div className="am-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="am-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div className="am-form-group">
                    <label>Role</label>
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="company">Company</option>
                      <option value="administration">Administration</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="am-form-group">
                    <label>Status</label>
                    <div className="am-toggle-row">
                      <label className="am-toggle">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={handleToggleActive}
                        />
                        <span className="am-toggle-slider" />
                      </label>
                      <span>{editForm.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                  <div className="am-form-group">
                    <label>Town</label>
                    <input
                      type="text"
                      value={editForm.town}
                      onChange={e => setEditForm({ ...editForm, town: e.target.value })}
                    />
                  </div>
                  <div className="am-form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={editForm.pnum}
                      onChange={e => setEditForm({ ...editForm, pnum: e.target.value })}
                    />
                  </div>
                  <div className="am-form-actions-full">
                    <button onClick={handleSave} className="am-btn-save">💾 Save Changes</button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="am-detail-info-grid">
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Username</span>
                    <strong>@{user.username}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Email</span>
                    <strong>{user.email}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Role</span>
                    <strong className="capitalize">{user.role}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Status</span>
                    <strong>{user.is_active ? "Active" : "Inactive"}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Town</span>
                    <strong>{user.town || "—"}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Phone</span>
                    <strong>{user.pnum || "—"}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Date Joined</span>
                    <strong>{user.date_joined}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Last Login</span>
                    <strong>{user.last_login}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Profile (if applicable) */}
          {user.role === "student" && studentProfile && (
            <div className="am-detail-card">
              <div className="am-detail-card-header">
                <h3>🎓 Student Profile</h3>
              </div>
              <div className="am-detail-card-body">
                <div className="am-detail-info-grid">
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Student Number</span>
                    <strong>{studentProfile.student_number}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Level</span>
                    <strong>{studentProfile.level}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Speciality</span>
                    <strong>{studentProfile.speciality}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Field</span>
                    <strong>{studentProfile.field}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Institution</span>
                    <strong>{studentProfile.institution}</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Average Mark</span>
                    <strong>{studentProfile.average_mark}/20</strong>
                  </div>
                  <div className="am-detail-info-item">
                    <span className="am-detail-label">Grade</span>
                    <strong>{studentProfile.grade}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="am-detail-sidebar">
          <div className="am-detail-card">
            <div className="am-detail-card-header">
              <h3>⚡ Quick Actions</h3>
            </div>
            <div className="am-detail-card-body">
              <button
                onClick={handleToggleActive}
                className={`am-action-btn-full ${user.is_active ? "am-action-deactivate" : "am-action-activate"}`}
              >
                {user.is_active ? "⏸ Deactivate User" : "▶ Activate User"}
              </button>
              <button className="am-action-btn-full am-action-reset">
                🔑 Reset Password
              </button>
              <button
                onClick={handleDelete}
                className="am-action-btn-full am-action-delete"
              >
                🗑 Delete User
              </button>
            </div>
          </div>

          <div className="am-detail-card">
            <div className="am-detail-card-header">
              <h3>📊 Activity</h3>
            </div>
            <div className="am-detail-card-body">
              <div className="am-activity-list">
                <div className="am-activity-item">
                  <span className="am-activity-dot" />
                  <div>
                    <p>Account created</p>
                    <time>{user.date_joined}</time>
                  </div>
                </div>
                <div className="am-activity-item">
                  <span className="am-activity-dot am-activity-active" />
                  <div>
                    <p>Last login</p>
                    <time>{user.last_login}</time>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}