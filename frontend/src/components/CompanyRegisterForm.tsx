// src/components/CompanyRegisterForm.tsx
// ─────────────────────────────────────────────────────────
// This component handles the full company registration flow:
// Step 1 — Company enters email + password → backend creates
//           a pending account and returns status
// Step 2 — Form appears to fill company details
// Step 3 — Success message shown
//
// HOW TO USE in AuthPage.tsx:
// When user selects role="company" and submits signup,
// instead of going to the normal register endpoint,
// render this component in place of the form.
// ─────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

type Step = "credentials" | "details" | "pending" | "rejected";

interface Props {
  onBackToLogin: () => void;
}

export default function CompanyRegisterForm({ onBackToLogin }: Props) {
  const navigate = useNavigate();

  const [step,    setStep]    = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [userId,  setUserId]  = useState<number | null>(null);
  const [rejReason, setRejReason] = useState("");

  // Step 1 — credentials
  const [creds, setCreds] = useState({
    email:    "",
    password: "",
    confirm:  "",
  });

  // Step 2 — company details
  const [details, setDetails] = useState({
    full_name:      "",   // contact person name
    company_name:   "",
    company_sector: "",
    company_rc:     "",
    town:           "",
  });

  // ── Step 1 submit ──────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (creds.password !== creds.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (creds.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      // First check if email already exists
      const checkRes = await fetch(`${API}/api/auth/company/check-email/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creds.email }),
      });
      const checkData = await checkRes.json();

      if (!checkData.error && checkData.data) {
        const status = checkData.data.status;
        if (status === "approved") {
          setError("Cette adresse email est déjà approuvée. Connectez-vous directement.");
          setLoading(false);
          return;
        }
        if (status === "pending") {
          setStep("pending");
          setLoading(false);
          return;
        }
        if (status === "rejected") {
          setRejReason(checkData.data.reason || "");
          setStep("rejected");
          setLoading(false);
          return;
        }
      }

      // New company — create account
      const autoUsername = creds.email.split("@")[0] + "_" + Date.now().toString().slice(-4);
      const regRes = await fetch(`${API}/api/auth/register/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:  autoUsername,
          email:     creds.email,
          password:  creds.password,
          full_name: "",
          role:      "company",
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        const msgs = Object.values(regData.errors ?? regData).flat().join(" ");
        throw new Error(msgs || "Erreur lors de l'inscription.");
      }

      // Save user id if returned
      if (regData.data?.user_id) setUserId(regData.data.user_id);

      // Move to step 2 — fill company details
      setStep("details");

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 submit ──────────────────────────────────────
  const handleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!details.full_name.trim() || !details.company_name.trim() ||
        !details.company_rc.trim() || !details.town.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/company/complete/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:          creds.email,
          full_name:      details.full_name,
          company_name:   details.company_name,
          company_sector: details.company_sector,
          company_rc:     details.company_rc,
          town:           details.town,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(
          Object.values(d.errors ?? d).flat().join(" ") || "Erreur."
        );
      }

      setStep("pending");

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 1 — Credentials ──────────────────────────────
  if (step === "credentials") {
    return (
      <div className="crf-root">
        <div className="crf-header">
          <div className="crf-icon">🏢</div>
          <h2 className="crf-title">Inscription Entreprise</h2>
          <p className="crf-sub">
            Créez votre espace recruteur sur Stag.io
          </p>
        </div>

        {/* Step indicator */}
        <div className="crf-steps">
          <div className="crf-step crf-step-active">
            <span className="crf-step-dot">1</span>
            <span>Identifiants</span>
          </div>
          <div className="crf-step-line" />
          <div className="crf-step">
            <span className="crf-step-dot crf-dot-inactive">2</span>
            <span>Informations entreprise</span>
          </div>
        </div>

        {error && <div className="crf-error">{error}</div>}

        <form className="crf-form" onSubmit={handleCredentials} noValidate>
          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email professionnel *
            </label>
            <input
              type="email"
              value={creds.email}
              onChange={e => setCreds({ ...creds, email: e.target.value })}
              placeholder="contact@votre-entreprise.dz"
              required
              autoComplete="email"
            />
            <span className="crf-hint">Utilisez l'adresse officielle de votre entreprise</span>
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Mot de passe *
            </label>
            <input
              type="password"
              value={creds.password}
              onChange={e => setCreds({ ...creds, password: e.target.value })}
              placeholder="Minimum 6 caractères"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              value={creds.confirm}
              onChange={e => setCreds({ ...creds, confirm: e.target.value })}
              placeholder="Répétez votre mot de passe"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="crf-btn-primary" disabled={loading}>
            {loading ? "Vérification…" : "Continuer →"}
          </button>
        </form>

        <div className="crf-back-login">
          Déjà inscrit ?{" "}
          <button onClick={onBackToLogin} className="crf-link">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 2 — Company Details ──────────────────────────
  if (step === "details") {
    return (
      <div className="crf-root">
        <div className="crf-header">
          <div className="crf-icon">📋</div>
          <h2 className="crf-title">Informations de l'entreprise</h2>
          <p className="crf-sub">
            Ces informations seront vérifiées par l'administrateur
          </p>
        </div>

        {/* Step indicator */}
        <div className="crf-steps">
          <div className="crf-step crf-step-done">
            <span className="crf-step-dot crf-dot-done">✓</span>
            <span>Identifiants</span>
          </div>
          <div className="crf-step-line crf-line-done" />
          <div className="crf-step crf-step-active">
            <span className="crf-step-dot">2</span>
            <span>Informations entreprise</span>
          </div>
        </div>

        {error && <div className="crf-error">{error}</div>}

        <form className="crf-form" onSubmit={handleDetails} noValidate>
          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Nom du responsable (personne de contact) *
            </label>
            <input
              type="text"
              value={details.full_name}
              onChange={e => setDetails({ ...details, full_name: e.target.value })}
              placeholder="Prénom et nom du représentant"
              required
            />
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
              Raison sociale (nom officiel) *
            </label>
            <input
              type="text"
              value={details.company_name}
              onChange={e => setDetails({ ...details, company_name: e.target.value })}
              placeholder="ex: TechCorp Algeria SPA"
              required
            />
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
              Secteur d'activité
            </label>
            <select
              value={details.company_sector}
              onChange={e => setDetails({ ...details, company_sector: e.target.value })}
            >
              <option value="">Sélectionnez un secteur</option>
              <option value="Informatique / IT">Informatique / IT</option>
              <option value="Télécommunications">Télécommunications</option>
              <option value="Banque / Finance">Banque / Finance</option>
              <option value="Énergie / Pétrole">Énergie / Pétrole</option>
              <option value="Industrie">Industrie</option>
              <option value="Santé">Santé</option>
              <option value="Éducation">Éducation</option>
              <option value="Commerce / Distribution">Commerce / Distribution</option>
              <option value="Conseil / Services">Conseil / Services</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Numéro RC (Registre de Commerce) *
            </label>
            <input
              type="text"
              value={details.company_rc}
              onChange={e => setDetails({ ...details, company_rc: e.target.value })}
              placeholder="ex: 16/00-123456B19"
              required
            />
            <span className="crf-hint">
              Obligatoire pour vérifier l'existence légale de votre entreprise
            </span>
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Ville (Wilaya) *
            </label>
            <input
              type="text"
              value={details.town}
              onChange={e => setDetails({ ...details, town: e.target.value })}
              placeholder="ex: Alger, Tizi Ouzou, Oran"
              required
            />
          </div>

          <button type="submit" className="crf-btn-primary" disabled={loading}>
            {loading ? "Envoi en cours…" : "Soumettre ma demande"}
          </button>
        </form>
      </div>
    );
  }

  // ── STEP 3 — Pending ──────────────────────────────────
  if (step === "pending") {
    return (
      <div className="crf-root crf-status-root">
        <div className="crf-status-icon crf-icon-pending">⏳</div>
        <h2 className="crf-status-title">Demande envoyée !</h2>
        <p className="crf-status-msg">
          Votre demande d'inscription a bien été reçue.<br />
          L'administrateur de la plateforme va examiner votre dossier
          et vous enverrez un email de confirmation à l'adresse<br />
          <strong>{creds.email}</strong>
        </p>
        <div className="crf-status-steps">
          <div className="crf-status-step crf-ss-done">
            <span>✓</span> Demande soumise
          </div>
          <div className="crf-status-step crf-ss-wait">
            <span>⏳</span> Vérification par l'admin
          </div>
          <div className="crf-status-step crf-ss-wait">
            <span>📧</span> Email de confirmation
          </div>
          <div className="crf-status-step crf-ss-wait">
            <span>🚀</span> Accès au tableau de bord
          </div>
        </div>
        <button
          className="crf-btn-secondary"
          onClick={onBackToLogin}
        >
          ← Retour à la connexion
        </button>
      </div>
    );
  }

  // ── STEP 4 — Rejected ─────────────────────────────────
  return (
    <div className="crf-root crf-status-root">
      <div className="crf-status-icon crf-icon-rejected">❌</div>
      <h2 className="crf-status-title">Inscription refusée</h2>
      <p className="crf-status-msg">
        Votre demande d'inscription avec l'adresse{" "}
        <strong>{creds.email}</strong> a été refusée.
      </p>
      {rejReason && (
        <div className="crf-rejection-reason">
          <strong>Motif :</strong> {rejReason}
        </div>
      )}
      <p className="crf-status-contact">
        Si vous pensez qu'il s'agit d'une erreur, contactez
        l'administrateur de la plateforme.
      </p>
      <button className="crf-btn-secondary" onClick={onBackToLogin}>
        ← Retour à la connexion
      </button>
    </div>
  );
}