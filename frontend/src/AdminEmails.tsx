// src/AdminEmails.tsx
import { useState } from "react";

interface WhitelistedEmail {
  id: number;
  email_domain: string;
  institution: string;
  added_date: string;
}

export default function AdminEmails() {
  const [emails, setEmails] = useState<WhitelistedEmail[]>([
    { id: 1, email_domain: "@univ-constantine1.dz", institution: "Université Frères Mentouri Constantine 1", added_date: "2026-01-15" },
    { id: 2, email_domain: "@usthb.dz", institution: "USTHB - Alger", added_date: "2026-01-15" },
    { id: 3, email_domain: "@esi.dz", institution: "École Supérieure d'Informatique - Alger", added_date: "2026-01-20" },
    { id: 4, email_domain: "@univ-setif.dz", institution: "Université de Sétif", added_date: "2026-02-01" },
    { id: 5, email_domain: "@univ-bejaia.dz", institution: "Université de Béjaïa", added_date: "2026-02-10" },
    { id: 6, email_domain: "@univ-oran1.dz", institution: "Université d'Oran 1", added_date: "2026-03-01" },
    { id: 7, email_domain: "@ummto.dz", institution: "Université Mouloud Mammeri - Tizi Ouzou", added_date: "2026-03-15" },
  ]);

  const [newDomain, setNewDomain] = useState("");
  const [newInstitution, setNewInstitution] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain || !newInstitution) return;

    const newEntry: WhitelistedEmail = {
      id: emails.length + 1,
      email_domain: newDomain.startsWith("@") ? newDomain : `@${newDomain}`,
      institution: newInstitution,
      added_date: new Date().toISOString().split("T")[0],
    };

    setEmails(prev => [...prev, newEntry]);
    setNewDomain("");
    setNewInstitution("");
    setShowAddForm(false);
    setSuccessMsg("Email domain added successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (id: number) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    setSuccessMsg("Email domain removed successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const filtered = emails.filter(e =>
    e.institution.toLowerCase().includes(search.toLowerCase()) ||
    e.email_domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Administration Email Whitelist</h1>
          <p className="am-page-sub">
            {emails.length} approved institution email domains
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="am-btn-add">
          + Add Domain
        </button>
      </div>

      {successMsg && (
        <div className="am-success-msg">
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="am-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <h3>Add Institution Email Domain</h3>
              <button onClick={() => setShowAddForm(false)} className="am-close-btn">✕</button>
            </div>
            <form onSubmit={handleAdd} className="am-modal-body">
              <div className="am-form-group">
                <label>Email Domain</label>
                <input
                  type="text"
                  placeholder="@univ-example.dz"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  required
                />
                <span className="am-form-hint">Must end with .dz for Algerian institutions</span>
              </div>
              <div className="am-form-group">
                <label>Institution Name</label>
                <input
                  type="text"
                  placeholder="Full institution name"
                  value={newInstitution}
                  onChange={e => setNewInstitution(e.target.value)}
                  required
                />
              </div>
              <div className="am-form-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="am-btn-cancel">Cancel</button>
                <button type="submit" className="am-btn-submit">Add Domain</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search by institution or domain..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <p className="am-results-count">{filtered.length} domains found</p>

      {/* Table */}
      <div className="am-card">
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>Email Domain</th>
                <th>Institution</th>
                <th>Added Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(email => (
                <tr key={email.id}>
                  <td>
                    <span className="am-domain-badge">{email.email_domain}</span>
                  </td>
                  <td className="am-institution-cell">{email.institution}</td>
                  <td className="am-date-cell">{email.added_date}</td>
                  <td>
                    <button onClick={() => handleDelete(email.id)} className="am-btn-remove">
                      🗑 Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}