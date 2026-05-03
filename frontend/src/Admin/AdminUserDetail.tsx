// AdminUserDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

interface UserDetail {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  town: string;
  pnum: string;
  date_joined?: string;
  last_login?: string;
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editForm, setEditForm] = useState({
    full_name: "", email: "", role: "", is_active: true, town: "", pnum: "",
  });

  useEffect(() => { if (id) fetchUser(); }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`admin/users/${id}/`);
      const body = data as { error?: boolean; data?: UserDetail; message?: string };
      if (!body.error && body.data) {
        setUser(body.data);
        setEditForm({
          full_name: body.data.full_name,
          email: body.data.email,
          role: body.data.role,
          is_active: body.data.is_active,
          town: body.data.town || "",
          pnum: body.data.pnum || "",
        });
      } else {
        toast.error(body.message || "User not found.");
        setUser(null);
      }
    } catch {
      toast.error("Could not load user.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setErrorMsg(""); setSuccessMsg("");
    try {
      const { data } = await api.patch(`admin/users/${id}/update/`, editForm);
      const body = data as { error?: boolean; message?: string };
      if (!body.error) {
        setUser((prev) => (prev ? { ...prev, ...editForm } : null));
        setEditing(false);
        setSuccessMsg("User updated successfully!");
        toast.success("Saved.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(body.message || "Update failed.");
      }
    } catch {
      setErrorMsg("Update failed.");
      toast.error("Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this user permanently? This cannot be undone.")) return;
    try {
      await api.delete(`admin/users/${id}/delete/`);
      toast.success("User deleted.");
    } catch {
      toast.error("Delete failed.");
    }
    navigate("/admin/users");
  };

  const handleToggleActive = async () => {
    const newStatus = !editForm.is_active;
    setEditForm((prev) => ({ ...prev, is_active: newStatus }));
    if (user) setUser({ ...user, is_active: newStatus });
    try {
      await api.patch(`admin/users/${id}/update/`, { is_active: newStatus });
      setSuccessMsg(newStatus ? "User activated." : "User deactivated.");
      toast.success(newStatus ? "Activated." : "Deactivated.");
    } catch {
      toast.error("Could not update status.");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const roleBadge: Record<string, string> = {
    student: "am-role-student",
    company: "am-role-company",
    administration: "am-role-administration",
    admin: "am-role-admin",
  };

  if (loading) return <div className="am-loading"><div className="am-spinner" /><span>Loading user details...</span></div>;
  if (!user) return (
    <div className="am-empty">
      <span className="am-empty-icon">🔍</span>
      <h3>User Not Found</h3>
      <button onClick={() => navigate("/admin/users")} className="am-btn-cancel">← Back to Users</button>
    </div>
  );

  return (
    <div className="am-page-root">
      <button onClick={() => navigate("/admin/users")} className="am-back-btn">← Back to Users</button>

      {successMsg && <div className="am-success-msg"><span>✅</span> {successMsg}</div>}
      {errorMsg && <div className="am-error-msg"><span>❌</span> {errorMsg}</div>}

      <div className="am-detail-layout">
        {/* Main Column */}
        <div className="am-detail-main">
          <div className="am-detail-card">
            <div className="am-detail-card-header">
              <div className="am-detail-avatar-lg">{user.full_name.charAt(0)}</div>
              <div>
                <h2>{user.full_name}</h2>
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".25rem", flexWrap: "wrap" }}>
                  <span className={`am-role-badge ${roleBadge[user.role]}`}>{user.role}</span>
                  <span className={`am-status-badge ${user.is_active ? "am-status-active" : "am-status-inactive"}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="am-detail-actions-top">
                <button onClick={() => setEditing(!editing)} className="am-btn-edit">
                  {editing ? "✕ Cancel" : "✏️ Edit"}
                </button>
              </div>
            </div>

            <div className="am-detail-card-body">
              {editing ? (
                <div className="am-detail-grid-2">
                  <div className="am-form-group">
                    <label>Full Name</label>
                    <input type="text" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                  </div>
                  <div className="am-form-group">
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="am-form-group">
                    <label>Role</label>
                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                      <option value="student">Student</option>
                      <option value="company">Company</option>
                      <option value="administration">Administration</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="am-form-group">
                    <label>City / Town</label>
                    <input type="text" value={editForm.town} onChange={e => setEditForm({ ...editForm, town: e.target.value })} />
                  </div>
                  <div className="am-form-group">
                    <label>Phone</label>
                    <input type="text" value={editForm.pnum} onChange={e => setEditForm({ ...editForm, pnum: e.target.value })} />
                  </div>
                  <div className="am-form-group">
                    <label>Account Status</label>
                    <div className="am-toggle-row">
                      <label className="am-toggle">
                        <input type="checkbox" checked={editForm.is_active} onChange={handleToggleActive} />
                        <span className="am-toggle-slider" />
                      </label>
                      <span style={{ fontSize: ".8rem", color: "#334155" }}>{editForm.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                  <div className="am-form-actions-full">
                    <button onClick={handleSave} className="am-btn-save">💾 Save Changes</button>
                  </div>
                </div>
              ) : (
                <div className="am-detail-info-grid">
                  {[
                    { label: "Username", value: `@${user.username}` },
                    { label: "Email", value: user.email },
                    { label: "Role", value: user.role },
                    { label: "Status", value: user.is_active ? "Active" : "Inactive" },
                    { label: "Town", value: user.town || "—" },
                    { label: "Phone", value: user.pnum || "—" },
                    { label: "Date Joined", value: user.date_joined || "—" },
                    { label: "Last Login", value: user.last_login || "—" },
                  ].map(item => (
                    <div key={item.label} className="am-detail-info-item">
                      <span className="am-detail-label">{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="am-detail-sidebar">
          <div className="am-detail-card">
            <div className="am-detail-card-header"><h3>⚡ Quick Actions</h3></div>
            <div className="am-detail-card-body">
              <button onClick={handleToggleActive} className={`am-action-btn-full ${user.is_active ? "am-action-deactivate" : "am-action-activate"}`}>
                {user.is_active ? "⏸ Deactivate User" : "▶ Activate User"}
              </button>
              <button onClick={handleDelete} className="am-action-btn-full am-action-delete">
                🗑 Delete User
              </button>
              {user.role === "company" && (
                <button onClick={() => navigate("/admin/companies")} className="am-action-btn-full am-action-reset">
                  🏢 View Company Details
                </button>
              )}
              {user.role === "student" && (
                <button onClick={() => navigate("/admin/students")} className="am-action-btn-full am-action-reset">
                  🎓 View Student Profile
                </button>
              )}
            </div>
          </div>

          <div className="am-detail-card">
            <div className="am-detail-card-header"><h3>📊 Activity</h3></div>
            <div className="am-detail-card-body">
              <div className="am-activity-list">
                <div className="am-activity-item">
                  <span className="am-activity-dot" />
                  <div>
                    <p>Account created</p>
                    <time>{user.date_joined || "—"}</time>
                  </div>
                </div>
                <div className="am-activity-item">
                  <span className="am-activity-dot am-activity-active" />
                  <div>
                    <p>Last login</p>
                    <time>{user.last_login || "—"}</time>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="am-detail-card">
            <div className="am-detail-card-header"><h3>ℹï¸ Account Info</h3></div>
            <div className="am-detail-card-body">
              <div style={{ fontSize: ".78rem", color: "#64748b", lineHeight: 1.6 }}>
                <p><strong>User ID:</strong> #{user.id}</p>
                <p><strong>Username:</strong> @{user.username}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p style={{ marginTop: ".5rem", padding: ".5rem", background: "#f8fafc", borderRadius: 6, fontSize: ".72rem" }}>
                  Changes are synced with the backend in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
