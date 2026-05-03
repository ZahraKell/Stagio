import api from "../api";
// src/components/OfferForm.tsx
// ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
//  Shared form used in TWO places:
//    1. CreateOffer page  → mode="create", no initialData
//    2. OfferDetail page  → mode="update", pass initialData
//
//  Usage:
//    <OfferForm mode="create" onSuccess={() => navigate("/company/offers")} />
//    <OfferForm mode="update" initialData={offer} onSuccess={handleSaved} onCancel={close} />
// ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€

import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ”€”€ TYPES ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
export interface OfferFormData {
  title:           string;
  town:            string;
  duration:        string;
  internship_type: string;
  is_paid:         boolean;
  salary:          string;
  tech_stack:      string;
  field:           string;
  description:     string;
  deadline:        string;
  status:          string;
}

interface Props {
  mode:          "create" | "update";
  initialData?:  Partial<OfferFormData> & { id?: number };
  onSuccess?:    (data: OfferFormData) => void;
  onCancel?:     () => void;
  // When used inside a modal — no back button needed
  insideModal?:  boolean;
}

const EMPTY: OfferFormData = {
  title:           "",
  town:            "",
  duration:        "",
  internship_type: "INTERNSHIP",
  is_paid:         false,
  salary:          "",
  tech_stack:      "",
  field:           "",
  description:     "",
  deadline:        "",
  status:          "open",
};

export default function OfferForm({ mode, initialData, onSuccess, onCancel, insideModal }: Props) {
  const navigate = useNavigate();

  const [form,    setForm]    = useState<OfferFormData>({ ...EMPTY, ...initialData });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  // Track which step we're on (only matters for create mode, gives a wizard feel)
  const [step, setStep] = useState<1 | 2>(1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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

    const payload = {
      ...form,
      salary: form.is_paid ? form.salary : null,
      deadline: form.deadline || null,
    };

    try {
      if (mode === "create") {
        await api.post("offers/create/", payload);
      } else {
        await api.put(`offers/${initialData?.id}/update/`, payload);
      }

      setSuccess(
        mode === "create"
          ? "Offre créée avec succès !"
          : "Offre mise à jour avec succès !"
      );

      if (onSuccess) {
        setTimeout(() => onSuccess(form), 800);
      } else {
        setTimeout(() => navigate("/company/offers"), 1200);
      }

    } catch (err: unknown) {
      const ax = err as { response?: { data?: Record<string, unknown> } };
      const d = ax.response?.data;
      const msg =
        d && typeof d === "object"
          ? String(
              Object.values((d.errors as Record<string, unknown>) ?? d)
                .flat()
                .join(" ") || (d.message as string) || (d.detail as string) || ""
            )
          : "";
      setError(
        msg ||
          (err instanceof Error ? err.message : "") ||
          (mode === "create" ? "Erreur lors de la création." : "Erreur lors de la mise à jour.")
      );
    } finally {
      setSaving(false);
    }
  };

  // ”€”€ Step 1 validation ”€”€
  const step1Valid = form.title.trim() && form.town.trim() && form.description.trim();

  return (
    <div className={`of-root${insideModal ? " of-modal-mode" : ""}`}>

      {/* Header — only shown when NOT inside a modal */}
      {!insideModal && (
        <div className="of-page-header">
          <div>
            <h2 className="of-page-title">
              {mode === "create" ? "Créer une nouvelle offre" : "Modifier l'offre"}
            </h2>
            <p className="of-page-sub">
              {mode === "create"
                ? "Remplissez les informations de votre offre de stage"
                : "Modifiez les champs que vous souhaitez mettre à jour"}
            </p>
          </div>
          {onCancel && (
            <button className="of-back-btn" onClick={onCancel}>
              ← Annuler
            </button>
          )}
        </div>
      )}

      {/* Progress steps — only for create mode */}
      {mode === "create" && !insideModal && (
        <div className="of-steps">
          <div className={`of-step ${step >= 1 ? "of-step-active" : ""}`}>
            <span className="of-step-num">1</span>
            <span>Informations essentielles</span>
          </div>
          <div className="of-step-line" />
          <div className={`of-step ${step === 2 ? "of-step-active" : ""}`}>
            <span className="of-step-num">2</span>
            <span>Détails et compétences</span>
          </div>
        </div>
      )}

      {/* Messages */}
      {error   && <div className="of-msg of-msg-error">{error}</div>}
      {success && <div className="of-msg of-msg-success">✅ {success}</div>}

      <form onSubmit={handleSubmit} noValidate>

        {/* ”€”€ STEP 1 / UPDATE: Essential info ”€”€ */}
        <div className={`of-section${(mode === "create" && step === 2) ? " of-hidden" : ""}`}>
          {!insideModal && <h3 className="of-section-title">Informations essentielles</h3>}

          <div className="of-grid">

            {/* Title */}
            <div className="of-field of-field-full">
              <label>
                Titre du poste
                <span className="of-required">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="ex : Développeur Backend Django"
                required
              />
              <span className="of-hint">Soyez précis — les étudiants filtrent par titre</span>
            </div>

            {/* Town + Type */}
            <div className="of-field">
              <label>Ville <span className="of-required">*</span></label>
              <input
                name="town"
                value={form.town}
                onChange={handleChange}
                placeholder="ex : Alger, Tizi Ouzou, Oran"
                required
              />
            </div>

            <div className="of-field">
              <label>Type de stage</label>
              <select name="internship_type" value={form.internship_type} onChange={handleChange}>
                <option value="INTERNSHIP">Stage professionnel</option>
                <option value="ALTERNANCE">Alternance</option>
                <option value="FINAL_YEAR">Projet de Fin d'Études (PFE)</option>
              </select>
            </div>

            {/* Duration + Deadline */}
            <div className="of-field">
              <label>Durée</label>
              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="ex : 3 mois, 6 mois"
              />
            </div>

            <div className="of-field">
              <label>Date limite de candidature</label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div className="of-field of-field-full">
              <label>Description du poste <span className="of-required">*</span></label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Décrivez les missions, l'environnement de travail et les objectifs du stage…"
                required
              />
            </div>

          </div>
        </div>

        {/* ”€”€ STEP 2 / UPDATE: Details ”€”€ */}
        <div className={`of-section${(mode === "create" && step === 1) ? " of-hidden" : ""}`}>
          {!insideModal && mode === "create" && (
            <h3 className="of-section-title">Détails et compétences</h3>
          )}

          <div className="of-grid">

            {/* Field */}
            <div className="of-field">
              <label>Domaine</label>
              <input
                name="field"
                value={form.field}
                onChange={handleChange}
                placeholder="ex : Informatique, Data Science"
              />
            </div>

            {/* Status — only for update */}
            {mode === "update" && (
              <div className="of-field">
                <label>Statut de l'offre</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="open">Ouverte</option>
                  <option value="closed">Fermée</option>
                  <option value="filled">Pourvue</option>
                </select>
              </div>
            )}

            {/* Tech stack */}
            <div className={`of-field ${mode === "update" ? "" : "of-field-full"}`}>
              <label>Technologies / Compétences requises</label>
              <input
                name="tech_stack"
                value={form.tech_stack}
                onChange={handleChange}
                placeholder="ex : Python, Django, React, PostgreSQL"
              />
              <span className="of-hint">Séparez par des virgules</span>
            </div>

            {/* Paid toggle */}
            <div className="of-field of-field-full">
              <label className="of-toggle-wrap">
                <input
                  type="checkbox"
                  name="is_paid"
                  checked={form.is_paid}
                  onChange={handleChange}
                />
                <span className="of-toggle-track">
                  <span className="of-toggle-thumb" />
                </span>
                <span className="of-toggle-text">
                  <strong>Stage rémunéré</strong>
                  <span>{form.is_paid ? "Le stagiaire recevra une indemnité" : "Stage non rémunéré"}</span>
                </span>
              </label>
            </div>

            {/* Salary — conditionally shown */}
            {form.is_paid && (
              <div className="of-field of-field-full">
                <label>Montant de la rémunération</label>
                <div className="of-salary-wrap">
                  <span className="of-salary-icon">DZD</span>
                  <input
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    placeholder="ex : 15 000 DA/mois"
                    className="of-salary-input"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ”€”€ FORM ACTIONS ”€”€ */}
        <div className="of-actions">

          {/* Create mode — step navigation */}
          {mode === "create" && !insideModal && step === 1 && (
            <>
              {onCancel && (
                <button type="button" className="of-btn-cancel" onClick={onCancel}>
                  Annuler
                </button>
              )}
              <button
                type="button"
                className="of-btn-next"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Suivant →
              </button>
            </>
          )}

          {mode === "create" && !insideModal && step === 2 && (
            <>
              <button type="button" className="of-btn-cancel" onClick={() => setStep(1)}>
                ← Retour
              </button>
              <button type="submit" className="of-btn-submit" disabled={saving}>
                {saving ? "Publication en cours…" : "Publier l'offre"}
              </button>
            </>
          )}

          {/* Update mode or inside modal — single submit */}
          {(mode === "update" || insideModal) && (
            <>
              {onCancel && (
                <button type="button" className="of-btn-cancel" onClick={onCancel}>
                  Annuler
                </button>
              )}
              <button type="submit" className="of-btn-submit" disabled={saving}>
                {saving
                  ? "Enregistrement…"
                  : mode === "create"
                  ? "Publier l'offre"
                  : "Enregistrer les modifications"}
              </button>
            </>
          )}

        </div>

      </form>
    </div>
  );
}
