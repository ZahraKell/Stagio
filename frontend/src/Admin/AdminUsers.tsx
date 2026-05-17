// AdminUsers.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  town?: string;
  pnum?: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { fetchUsers(); }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = filter ? { role: filter } : undefined;
      const { data } = await api.get("admin/users/", { params });
      const body = data as { error?: boolean; data?: User[]; message?: string };
      if (!body.error && Array.isArray(body.data)) setUsers(body.data);
      else {
        setUsers([]);
        toast.error(body.message || "Could not load users.");
      }
    } catch {
      setUsers([]);
      toast.error("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, current: boolean) => {
    try {
      await api.patch(`admin/users/${userId}/update/`, { is_active: !current });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !current } : u)));
      setSuccessMsg(`User ${current ? "deactivated" : "activated"} successfully!`);
      toast.success("Updated.");
    } catch {
      toast.error("Update failed.");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = async (userId: number) => {
    try {
      await api.delete(`admin/users/${userId}/delete/`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
      setSuccessMsg("User deleted successfully!");
      toast.success("Deleted.");
    } catch {
      toast.error("Delete failed.");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all: users.length,
    student: users.filter(u => u.role === "student").length,
    company: users.filter(u => u.role === "company").length,
    administration: users.filter(u => u.role === "administration").length,
    admin: users.filter(u => u.role === "admin").length,
    active: users.filter(u => u.is_active).length,
  };

  const roleBadge: Record<string, string> = {
    student: "am-role-student",
    company: "am-role-company",
    administration: "am-role-administration",
    admin: "am-role-admin",
  };

  if (loading) return <div className="am-loading"><div className="am-spinner" /><span>Loading users...</span></div>;

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Users Management</h1>
          <p className="am-page-sub">
            {counts.all} total • {counts.student} students • {counts.company} companies • {counts.active} active
          </p>
        </div>
      </div>

      {successMsg && <div className="am-success-msg"><span>✅</span> {successMsg}</div>}

      {/* Role summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: ".75rem" }}>
        {[
          { label: "All", key: "", value: counts.all, color: "#3b82f6" },
          { label: "Students", key: "student", value: counts.student, color: "#22c55e" },
          { label: "Companies", key: "company", value: counts.company, color: "#f59e0b" },
          { label: "Admin Staff", key: "administration", value: counts.administration, color: "#8b5cf6" },
          { label: "Admins", key: "admin", value: counts.admin, color: "#ef4444" },
        ].map(s => (
          <div
            key={s.key}
            className="am-dash-stat"
            style={{ borderTopColor: s.color, cursor: "pointer", opacity: filter === s.key ? 1 : 0.7 }}
            onClick={() => setFilter(s.key)}
          >
            <span className="am-dash-stat-value">{s.value}</span>
            <div className="am-dash-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="am-filter">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="company">Companies</option>
          <option value="administration">Administration</option>
          <option value="admin">Admins</option>
        </select>
        <span className="am-results-count">{filtered.length} found</span>
      </div>

      <div className="am-card">
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="am-empty-cell">
                    <div className="am-empty-state-small"><span>📭</span><p>No users found</p></div>
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="am-user-cell">
                        <div className="am-user-av">{user.full_name.charAt(0)}</div>
                        <div>
                          <strong>{user.full_name}</strong>
                          <span className="am-username">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="am-email-cell">{user.email}</td>
                    <td>
                      <span className={`am-role-badge ${roleBadge[user.role] || ""}`}>{user.role}</span>
                    </td>
                    <td>
                      {user.town ? (
                        <span className="am-town-badge">📍 {user.town}</span>
                      ) : <span className="am-no-data">—</span>}
                    </td>
                    <td>
                      <span className={`am-status-badge ${user.is_active ? "am-status-active" : "am-status-inactive"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="am-action-btns">
                        <a href={`/admin/users/${user.id}`} className="am-btn-view"
                          onClick={e => { e.preventDefault(); navigate(`/admin/users/${user.id}`); }}>
                          👁 View
                        </a>
                        <button
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={`am-btn-toggle ${user.is_active ? "am-btn-deactivate" : "am-btn-activate"}`}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? "⏸" : "▶"}
                        </button>
                        {deleteConfirm === user.id ? (
                          <div className="am-delete-confirm">
                            <button onClick={() => handleDelete(user.id)} className="am-btn-confirm-yes">✓</button>
                            <button onClick={() => setDeleteConfirm(null)} className="am-btn-confirm-no">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(user.id)} className="am-btn-delete" title="Delete">🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 10 && (
        <div className="am-pagination">
          <button className="am-page-btn" disabled>← Previous</button>
          <button className="am-page-btn am-page-active">1</button>
          <button className="am-page-btn">Next →</button>
        </div>
      )}
    </div>
  );
}
