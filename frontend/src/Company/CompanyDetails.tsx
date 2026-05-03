import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CompanyLayout from "../components/CompanyLayout";
import type { Offer } from "./CompanyOffers";
import api from "../api";
import toast from "react-hot-toast";

// ”€”€ TYPES ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
interface Applicant {
  id:          number;
  student_name: string;
  student_email: string;
  offer_title: string;
  status:      string;
  date:        string;
  cv_score:    number;
  cover_letter?: string;
}

// ”€”€ HELPERS ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
const TYPE_LABELS: Record<string, string> = {
  INTERNSHIP: "Stage professionnel",
  ALTERNANCE: "Alternance",
  FINAL_YEAR: "PFE",
};

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { label: string; cls: string }> = {
    pending:   { label: "En attente",  cls: "od-badge-pending"   },
    reviewed:  { label: "En révision", cls: "od-badge-reviewed"  },
    accepted:  { label: "Accepté",     cls: "od-badge-accepted"  },
    refused:   { label: "Refusé",      cls: "od-badge-refused"   },
    validated: { label: "Validé",      cls: "od-badge-validated" },
  };
  const s = m[status] ?? { label: status, cls: "od-badge-pending" };
  return <span className={`od-badge ${s.cls}`}>{s.label}</span>;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div className="od-score-ring" style={{ "--score-color": color } as React.CSSProperties}>
      <strong style={{ color }}>{score}</strong>
      <span>%</span>
    </div>
  );
}

// ”€”€ MODAL WRAPPER ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="od-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="od-modal">
        {children}
      </div>
    </div>
  );
}

// ”€”€ UPDATE FORM ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
function UpdateForm({
  offer,
  onClose,
  onSaved,
}: {
  offer: Offer;
  onClose: () => void;
  onSaved: (updated: Offer) => void;
}) {
  const [form, setForm] = useState({
    title:           offer.title,
    town:            offer.town,
    duration:        offer.duration || "",
    internship_type: offer.internship_type,
    is_paid:         offer.is_paid,
    salary:          offer.salary || "",
    tech_stack:      offer.tech_stack || "",
    field:           offer.field || "",
    description:     offer.description,
    deadline:        offer.deadline || "",
    status:          offer.status,
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`offers/${offer.id}/update/`, {
        ...form,
        salary: form.is_paid ? form.salary : null,
      });
      onSaved({ ...offer, ...form });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="od-update-form">
        <div className="od-modal-head">
          <h3>Modifier l'offre</h3>
          <button className="od-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="od-form-error">{error}</div>}

        <form onSubmit={handleSubmit} className="od-form-grid">

          {/* Title */}
          <div className="od-field od-field-full">
            <label>Titre du poste *</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>

          {/* Town + Duration */}
          <div className="od-field">
            <label>Ville *</label>
            <input name="town" value={form.town} onChange={handleChange} required />
          </div>
          <div className="od-field">
            <label>Durée</label>
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="ex: 3 mois" />
          </div>

          {/* Type + Status */}
          <div className="od-field">
            <label>Type de stage</label>
            <select name="internship_type" value={form.internship_type} onChange={handleChange}>
              <option value="INTERNSHIP">Stage professionnel</option>
              <option value="ALTERNANCE">Alternance</option>
              <option value="FINAL_YEAR">PFE</option>
            </select>
          </div>
          <div className="od-field">
            <label>Statut</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="open">Ouverte</option>
              <option value="closed">Fermée</option>
              <option value="filled">Pourvue</option>
            </select>
          </div>

          {/* Field */}
          <div className="od-field">
            <label>Domaine</label>
            <input name="field" value={form.field} onChange={handleChange} placeholder="ex: Informatique" />
          </div>

          {/* Deadline */}
          <div className="od-field">
            <label>Date limite</label>
            <input type="date" name="deadline" value={form.deadline} onChange={handleChange} />
          </div>

          {/* Paid toggle + salary */}
          <div className="od-field od-field-full">
            <label className="od-toggle-label">
              <input
                type="checkbox"
                name="is_paid"
                checked={form.is_paid}
                onChange={handleChange}
              />
              <span className="od-toggle-track">
                <span className="od-toggle-thumb" />
              </span>
              Stage rémunéré
            </label>
          </div>
          {form.is_paid && (
            <div className="od-field od-field-full">
              <label>Rémunération</label>
              <input name="salary" value={form.salary} onChange={handleChange} placeholder="ex: 15000 DA/mois" />
            </div>
          )}

          {/* Tech stack */}
          <div className="od-field od-field-full">
            <label>Technologies / Compétences requises</label>
            <input name="tech_stack" value={form.tech_stack} onChange={handleChange} placeholder="ex: Python, Django, React" />
          </div>

          {/* Description */}
          <div className="od-field od-field-full">
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
          </div>

          {/* Actions */}
          <div className="od-form-actions od-field-full">
            <button type="button" className="od-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="od-btn-save" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
}

// ”€”€ DELETE CONFIRM POPUP ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
function DeleteConfirm({
  offerTitle,
  onCancel,
  onConfirm,
  loading,
}: {
  offerTitle: string;
  onCancel:  () => void;
  onConfirm: () => void;
  loading:   boolean;
}) {
  return (
    <Modal onClose={onCancel}>
      <div className="od-delete-popup">
        <div className="od-delete-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <h3>Supprimer cette offre ?</h3>
        <p>
          Vous êtes sur le point de supprimer l'offre<br />
          <strong>« {offerTitle} »</strong>.<br />
          Cette action est irréversible. Toutes les candidatures associées seront également supprimées.
        </p>
        <div className="od-delete-actions">
          <button className="od-btn-cancel" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button className="od-btn-delete" onClick={onConfirm} disabled={loading}>
            {loading ? "Suppression…" : "Oui, supprimer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ”€”€ CV MODAL ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
function CVModal({
  applicant,
  onClose,
  onAccept,
  onRefuse,
  actionLoading,
}: {
  applicant:     Applicant;
  onClose:       () => void;
  onAccept:      (id: number) => void;
  onRefuse:      (id: number) => void;
  actionLoading: number | null;
}) {
  const [cvData, setCvData] = useState<Record<string, unknown> | null>(null);
  const [cvLoading, setCvLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`applications/${applicant.id}/`);
        const body = data as { error?: boolean; data?: Record<string, unknown> };
        setCvData(body.data ?? null);
      } catch {
        setCvData(null);
      } finally {
        setCvLoading(false);
      }
    })();
  }, [applicant.id]);

  const isActing = actionLoading === applicant.id;

  return (
    <Modal onClose={onClose}>
      <div className="od-cv-modal">
        <div className="od-modal-head">
          <div className="od-cv-modal-title">
            <div className="od-cv-av">{applicant.student_name.charAt(0)}</div>
            <div>
              <h3>{applicant.student_name}</h3>
              <p>{applicant.student_email}</p>
            </div>
          </div>
          <button className="od-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="od-cv-body">
          {cvLoading ? (
            <div className="od-cv-loading">
              <div className="od-spinner" />
              <p>Chargement du CV…</p>
            </div>
          ) : (
            <>
              {/* Score + Status */}
              <div className="od-cv-score-row">
                <ScoreRing score={applicant.cv_score} />
                <div>
                  <p className="od-cv-score-label">Score de complétude du CV</p>
                  <StatusBadge status={applicant.status} />
                </div>
              </div>

              {/* Cover letter */}
              {applicant.cover_letter && (
                <div className="od-cv-section">
                  <h4>Lettre de motivation</h4>
                  <p>{applicant.cover_letter}</p>
                </div>
              )}

              {/* Raw CV info from API */}
              {cvData && (
                <div className="od-cv-section">
                  <h4>Informations de candidature</h4>
                  <div className="od-cv-info-grid">
                    <div className="od-cv-info-item">
                      <span>Offre</span>
                      <strong>{applicant.offer_title}</strong>
                    </div>
                    <div className="od-cv-info-item">
                      <span>Date de candidature</span>
                      <strong>{applicant.date}</strong>
                    </div>
                    <div className="od-cv-info-item">
                      <span>Statut actuel</span>
                      <StatusBadge status={applicant.status} />
                    </div>
                  </div>
                </div>
              )}

              <div className="od-cv-section od-cv-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Le CV complet du stagiaire sera disponible une fois la fonctionnalité CV connectée au profil étudiant.
              </div>
            </>
          )}
        </div>

        {/* Action buttons — only show if status is pending or reviewed */}
        {(applicant.status === "pending" || applicant.status === "reviewed") && (
          <div className="od-cv-footer">
            <button
              className="od-btn-refuse"
              disabled={isActing}
              onClick={() => onRefuse(applicant.id)}
            >
              {isActing ? "…" : "✕  Refuser"}
            </button>
            <button
              className="od-btn-accept"
              disabled={isActing}
              onClick={() => onAccept(applicant.id)}
            >
              {isActing ? "…" : "✓  Accepter"}
            </button>
          </div>
        )}

        {applicant.status === "accepted" && (
          <div className="od-cv-footer od-cv-footer-accepted">
            ✅ Candidat accepté — Convention générée automatiquement
          </div>
        )}
        {applicant.status === "refused" && (
          <div className="od-cv-footer od-cv-footer-refused">
            ✕ Candidature refusée
          </div>
        )}
      </div>
    </Modal>
  );
}

// ”€”€ MAIN DETAIL PAGE ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
export default function OfferDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();

  const [offer,          setOffer]          = useState<Offer | null>(null);
  const [applicants,     setApplicants]     = useState<Applicant[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showDelete,     setShowDelete]     = useState(false);
  const [showUpdate,     setShowUpdate]     = useState(false);
  const [selectedCV,     setSelectedCV]     = useState<Applicant | null>(null);
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [actionLoading,  setActionLoading]  = useState<number | null>(null);
  const [appsFilter,     setAppsFilter]     = useState<"all" | "pending" | "accepted" | "refused">("all");

  const OFFER_IMAGES = [
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop",
  ];

  // ”€”€ Fetch offer + applicants ”€”€
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [offerRes, appsRes] = await Promise.allSettled([
          api.get(`offers/${id}/`),
          api.get(`applications/offer/${id}/`),
        ]);
        if (cancelled) return;
        if (offerRes.status === "fulfilled") {
          setOffer(offerRes.value.data as Offer);
        } else {
          setOffer(null);
          toast.error("Offre introuvable.");
        }
        if (appsRes.status === "fulfilled") {
          const payload = appsRes.value.data as {
            error?: boolean;
            data?: { applications?: Array<Record<string, unknown>> };
          };
          const raw = payload.data?.applications ?? [];
          setApplicants(
            raw.map((row) => ({
              id: row.id as number,
              student_name: String(row.student_name ?? ""),
              student_email: String(row.student_email ?? ""),
              offer_title: String(row.offer_title ?? ""),
              status: String(row.status ?? "pending").toLowerCase(),
              date: String(row.application_date ?? "").split("T")[0],
              cv_score: 0,
              cover_letter: typeof row.cover_letter === "string" ? row.cover_letter : "",
            })),
          );
        } else {
          setApplicants([]);
        }
      } catch {
        if (!cancelled) {
          setOffer(null);
          setApplicants([]);
          toast.error("Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ”€”€ Delete offer ”€”€
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`offers/${id}/delete/`);
      navigate("/company/offers");
    } catch {
      setDeleteLoading(false);
      setShowDelete(false);
      toast.error("Erreur lors de la suppression.");
    }
  };

  // ”€”€ Accept applicant ”€”€
  const handleAccept = async (appId: number) => {
    setActionLoading(appId);
    try {
      await api.patch(`applications/${appId}/review/`, { status: "accepted" });
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: "accepted" } : a));
      setSelectedCV(prev => prev?.id === appId ? { ...prev, status: "accepted" } : prev);
    } catch {
      toast.error("Erreur lors de l'acceptation.");
    } finally {
      setActionLoading(null);
    }
  };

  // ”€”€ Refuse applicant ”€”€
  const handleRefuse = async (appId: number) => {
    setActionLoading(appId);
    try {
      await api.patch(`applications/${appId}/review/`, { status: "refused" });
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: "refused" } : a));
      setSelectedCV(prev => prev?.id === appId ? { ...prev, status: "refused" } : prev);
    } catch {
      toast.error("Erreur lors du refus.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApps = appsFilter === "all"
    ? applicants
    : applicants.filter(a => a.status === appsFilter);

  const appCounts = {
    all:      applicants.length,
    pending:  applicants.filter(a => a.status === "pending" || a.status === "reviewed").length,
    accepted: applicants.filter(a => a.status === "accepted").length,
    refused:  applicants.filter(a => a.status === "refused").length,
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="op-loading">
          <div className="op-spinner" />
          <p>Chargement…</p>
        </div>
      </CompanyLayout>
    );
  }

  if (!offer) {
    return (
      <CompanyLayout>
        <div className="od-not-found">
          <h3>Offre introuvable</h3>
          <button className="op-create-btn" onClick={() => navigate("/company/offers")}>
            ← Retour aux offres
          </button>
        </div>
      </CompanyLayout>
    );
  }

  const coverImg = OFFER_IMAGES[offer.id % OFFER_IMAGES.length];
  const skills   = (offer.tech_stack || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <CompanyLayout>
      <div className="od-root">

        {/* ”€”€ BACK BUTTON ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <button className="od-back-btn" onClick={() => navigate("/company/offers")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}>
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Retour aux offres
        </button>

        {/* ”€”€ OFFER HEADER CARD ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <div className="od-hero">
          <div className="od-hero-img">
            <img src={coverImg} alt={offer.title} />
            <div className="od-hero-img-overlay" />
          </div>
          <div className="od-hero-body">
            <div className="od-hero-top">
              <div>
                <span className="od-hero-type">
                  {TYPE_LABELS[offer.internship_type] ?? offer.internship_type}
                </span>
                <h1 className="od-hero-title">{offer.title}</h1>
              </div>
              <div className="od-hero-actions">
                <button className="od-btn-update" onClick={() => setShowUpdate(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Modifier
                </button>
                <button className="od-btn-del" onClick={() => setShowDelete(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}>
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  </svg>
                  Supprimer
                </button>
              </div>
            </div>

            {/* Offer metadata */}
            <div className="od-meta-row">
              <span className="od-meta-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {offer.town}
              </span>
              <span className="od-meta-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {offer.duration || "Durée variable"}
              </span>
              <span className="od-meta-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                {offer.is_paid ? (offer.salary || "Rémunéré") : "Non rémunéré"}
              </span>
              {offer.deadline && (
                <span className="od-meta-chip od-chip-deadline">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Clôture : {offer.deadline}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="od-description">{offer.description}</p>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="od-skills-row">
                <span className="od-skills-label">Compétences :</span>
                {skills.map(sk => (
                  <span key={sk} className="od-skill-tag">{sk}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ”€”€ APPLICANTS SECTION ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <div className="od-apps-section">
          <div className="od-apps-header">
            <h2 className="od-apps-title">
              Candidatures
              <span className="od-apps-count">{applicants.length}</span>
            </h2>

            {/* Filter tabs */}
            <div className="od-apps-tabs">
              {(["all", "pending", "accepted", "refused"] as const).map(f => (
                <button
                  key={f}
                  className={`od-apps-tab ${appsFilter === f ? "od-tab-active" : ""}`}
                  onClick={() => setAppsFilter(f)}
                >
                  {f === "all" ? "Toutes" : f === "pending" ? "En attente" : f === "accepted" ? "Acceptées" : "Refusées"}
                  <span className="od-tab-count">{appCounts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {filteredApps.length === 0 && (
            <div className="od-apps-empty">
              <p>Aucune candidature {appsFilter !== "all" ? `avec ce statut` : "pour cette offre"} pour le moment.</p>
            </div>
          )}

          {/* Applicant rows */}
          <div className="od-apps-list">
            {filteredApps.map((app, i) => (
              <div
                key={app.id}
                className="od-app-row"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Avatar + name */}
                <div className="od-app-identity">
                  <div className="od-app-av">{app.student_name.charAt(0)}</div>
                  <div className="od-app-info">
                    <strong>{app.student_name}</strong>
                    <span>{app.student_email}</span>
                  </div>
                </div>

                {/* CV Score */}
                <div className="od-app-score">
                  <div
                    className="od-score-bar"
                    title={`Score CV : ${app.cv_score}%`}
                  >
                    <div
                      className="od-score-fill"
                      style={{
                        width: `${app.cv_score}%`,
                        background: app.cv_score >= 80
                          ? "#22c55e"
                          : app.cv_score >= 55
                          ? "#f59e0b"
                          : "#ef4444",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: app.cv_score >= 80 ? "#22c55e" : app.cv_score >= 55 ? "#f59e0b" : "#ef4444",
                    }}
                  >
                    {app.cv_score}%
                  </span>
                </div>

                {/* Date */}
                <span className="od-app-date">{app.date}</span>

                {/* Status */}
                <StatusBadge status={app.status} />

                {/* Actions */}
                <div className="od-app-actions">
                  <button
                    className="od-see-cv-btn"
                    onClick={() => setSelectedCV(app)}
                  >
                    Voir CV
                  </button>

                  {(app.status === "pending" || app.status === "reviewed") && (
                    <>
                      <button
                        className="od-refuse-btn"
                        disabled={actionLoading === app.id}
                        onClick={() => handleRefuse(app.id)}
                      >
                        {actionLoading === app.id ? "…" : "Refuser"}
                      </button>
                      <button
                        className="od-accept-btn"
                        disabled={actionLoading === app.id}
                        onClick={() => handleAccept(app.id)}
                      >
                        {actionLoading === app.id ? "…" : "Accepter"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ”€”€ MODALS ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
      {showDelete && (
        <DeleteConfirm
          offerTitle={offer.title}
          onCancel={() => setShowDelete(false)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      {showUpdate && (
        <UpdateForm
          offer={offer}
          onClose={() => setShowUpdate(false)}
          onSaved={(updated) => { setOffer(updated); setShowUpdate(false); }}
        />
      )}

      {selectedCV && (
        <CVModal
          applicant={selectedCV}
          onClose={() => setSelectedCV(null)}
          onAccept={handleAccept}
          onRefuse={handleRefuse}
          actionLoading={actionLoading}
        />
      )}

    </CompanyLayout>
  );
}
