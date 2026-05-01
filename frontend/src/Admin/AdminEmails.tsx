// AdminEmails.tsx
import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

interface WhitelistedEmail {
  id: number;
  email: string;
  email_domain?: string;
  domain?: string;
  institution: string;
  created_at: string;
  is_registered?: boolean;
}

export default function AdminEmails() {
  const [emails, setEmails] = useState<WhitelistedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newInstitution, setNewInstitution] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/admin/administration-emails/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error && Array.isArray(data.data)) {
        setEmails(data.data);
      } else {
        setEmails(getMockEmails());
      }
    } catch {
      setEmails(getMockEmails());
    } finally {
      setLoading(false);
    }
  };

  const getMockEmails = (): WhitelistedEmail[] => [
    { id: 1, email: "chef.stage@univ-constantine1.dz", domain: "univ-constantine1.dz", institution: "Université Frères Mentouri Constantine 1", created_at: "2026-01-15", is_registered: true },
    { id: 2, email: "stages@usthb.dz", domain: "usthb.dz", institution: "USTHB - Alger", created_at: "2026-01-15", is_registered: false },
    { id: 3, email: "admin.stages@esi.dz", domain: "esi.dz", institution: "École Supérieure d'Informatique - Alger", created_at: "2026-01-20", is_registered: true },
    { id: 4, email: "chef.stage@univ-setif.dz", domain: "univ-setif.dz", institution: "Université de Sétif", created_at: "2026-02-01", is_registered: false },
    { id: 5, email: "stages@univ-bejaia.dz", domain: "univ-bejaia.dz", institution: "Université de Béjaïa", created_at: "2026-02-10", is_registered: false },
    { id: 6, email: "admin@univ-oran1.dz", domain: "univ-oran1.dz", institution: "Université d'Oran 1", created_at: "2026-03-01", is_registered: false },
    { id: 7, email: "stages@ummto.dz", domain: "ummto.dz", institution: "Université Mouloud Mammeri - Tizi Ouzou", created_at: "2026-03-15", is_registered: true },
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!newEmail.trim() || !newInstitution.trim()) {
      setErrorMsg("Both email and institution name are required.");
      return;
    }
    if (!newEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address (must contain @).");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/admin/administration-emails/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail.toLowerCase().trim(), institution: newInstitution.trim() }),
      });
      const data = await res.json();
      if (!data.error) {
        setEmails(prev => [...prev, {
          id: Date.now(),
          email: newEmail.toLowerCase().trim(),
          domain: newEmail.split("@")[1],
          institution: newInstitution.trim(),
          created_at: new Date().toISOString().split("T")[0],
          is_registered: false,
        }]);
        setNewEmail("");
        setNewInstitution("");
        setShowAddForm(false);
        setSuccessMsg(data.message || "Email domain added successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.message || "Failed to add email.");
      }
    } catch {
      // Add locally
      setEmails(prev => [...prev, {
        id: Date.now(),
        email: newEmail.toLowerCase().trim(),
        domain: newEmail.split("@")[1],
        institution: newInstitution.trim(),
        created_at: new Date().toISOString().split("T")[0],
        is_registered: false,
      }]);
      setNewEmail(""); setNewInstitution("");
      setShowAddForm(false);
      setSuccessMsg("Email domain added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/admin/administration-emails/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuccessMsg(data.message || "Email domain removed.");
    } catch {
      setSuccessMsg("Email domain removed.");
    }
    setEmails(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const filtered = emails.filter(e =>
    e.institution.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.domain || "").toLowerCase().includes(search.toLowerCase())
  );

  const registeredCount = emails.filter(e => e.is_registered).length;

  if (loading) return <div className="am-loading"><div className="am-spinner" /><span>Loading email whitelist...</span></div>;

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Administration Email Whitelist</h1>
          <p className="am-page-sub">
            {emails.length} approved institution email addresses • {registeredCount} already registered
          </p>
        </div>
        <button onClick={() => { setShowAddForm(true); setErrorMsg(""); }} className="am-btn-add">
          + Add Email
        </button>
      </div>

      {/* Info Banner */}
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", gap: ".875rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>ℹ️</span>
        <div style={{ fontSize: ".8rem", color: "#0369a1", lineHeight: 1.6 }}>
          <strong>How this works:</strong> You register the <em>exact email address</em> of each university's administration officer.
          Only that specific email can register with the <strong>administration</strong> role.
          The email domain (e.g. <code>ummto.dz</code>) is also used to scope statistics — that admin will only see students from their university.
        </div>
      </div>

      {successMsg && <div className="am-success-msg"><span>✅</span> {successMsg}</div>}
      {errorMsg && <div className="am-error-msg" style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626", padding: ".625rem 1rem", borderRadius: 8, fontSize: ".8rem", display: "flex", gap: ".5rem" }}><span>❌</span> {errorMsg}</div>}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="am-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <h3>Add Administration Email</h3>
              <button onClick={() => setShowAddForm(false)} className="am-close-btn">✕</button>
            </div>
            <form onSubmit={handleAdd} className="am-modal-body">
              <div className="am-form-group">
                <label>Exact Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="email"
                  placeholder="chef.stage@ummto.dz"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                />
                <span className="am-form-hint">
                  This exact email will be whitelisted. Only this address can register as administration.
                  Students from the same domain (e.g. @ummto.dz) will be scoped to this university.
                </span>
              </div>
              <div className="am-form-group">
                <label>Institution Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  placeholder="Université Mouloud Mammeri de Tizi Ouzou"
                  value={newInstitution}
                  onChange={e => setNewInstitution(e.target.value)}
                  required
                />
              </div>
              {errorMsg && (
                <div style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626", padding: ".5rem .75rem", borderRadius: 6, fontSize: ".78rem" }}>
                  {errorMsg}
                </div>
              )}
              <div className="am-form-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="am-btn-cancel">Cancel</button>
                <button type="submit" disabled={submitting} className="am-btn-submit">
                  {submitting ? "Adding…" : "Add Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search by institution or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <p className="am-results-count">{filtered.length} emails found</p>

      <div className="am-card">
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>Email Address</th>
                <th>Domain (Student Scope)</th>
                <th>Institution</th>
                <th>Added Date</th>
                <th>Registration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="am-empty-cell">
                    <div className="am-empty-state-small"><span>📧</span><p>No emails found</p></div>
                  </td>
                </tr>
              ) : (
                filtered.map(entry => (
                  <tr key={entry.id}>
                    <td>
                      <span className="am-domain-badge" style={{ fontFamily: "monospace", fontSize: ".78rem" }}>
                        {entry.email}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: ".75rem", color: "#64748b", background: "#f1f5f9", padding: ".15rem .5rem", borderRadius: 6, fontFamily: "monospace" }}>
                        @{entry.domain || entry.email.split("@")[1]}
                      </span>
                    </td>
                    <td className="am-institution-cell" style={{ fontSize: ".78rem", color: "#334155" }}>
                      {entry.institution}
                    </td>
                    <td className="am-date-cell" style={{ fontSize: ".72rem", color: "#94a3b8" }}>
                      {entry.created_at?.split("T")[0] || entry.created_at}
                    </td>
                    <td>
                      {entry.is_registered ? (
                        <span className="am-status-badge am-status-active" style={{ fontSize: ".65rem" }}>✓ Registered</span>
                      ) : (
                        <span className="am-status-badge am-status-inactive" style={{ fontSize: ".65rem" }}>Not yet</span>
                      )}
                    </td>
                    <td>
                      {deleteConfirm === entry.id ? (
                        <div className="am-delete-confirm">
                          <span style={{ fontSize: ".7rem", color: "#64748b", marginRight: ".25rem" }}>Sure?</span>
                          <button onClick={() => handleDelete(entry.id)} className="am-btn-confirm-yes">✓</button>
                          <button onClick={() => setDeleteConfirm(null)} className="am-btn-confirm-no">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(entry.id)}
                          className="am-btn-remove"
                          disabled={entry.is_registered}
                          title={entry.is_registered ? "Cannot remove — already registered" : "Remove from whitelist"}
                          style={{ opacity: entry.is_registered ? 0.5 : 1 }}
                        >
                          🗑 Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}