// src/components/CompanyRegisterForm.tsx
import type { AxiosError } from "axios";
import api from "../api";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../auth";

function formatApiError(err: unknown): string {
  const ax = err as AxiosError<{
    errors?: Record<string, string[]>;
    message?: string;
    detail?: string;
  }>;
  const d = ax.response?.data;
  if (d?.message) return d.message;
  if (d?.detail) return String(d.detail);
  if (d?.errors) return Object.values(d.errors).flat().join(" ");
  if (ax.message) return ax.message;
  return "Une erreur est survenue.";
}

type Step = "credentials" | "otp" | "details" | "pending" | "rejected";

interface Props {
  onBackToLogin: () => void;
}

export default function CompanyRegisterForm({ onBackToLogin }: Props) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejReason, setRejReason] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [creds, setCreds] = useState({ email: "", password: "", confirm: "" });

  const [details, setDetails] = useState({
    full_name: "",
    company_name: "",
    company_sector: "",
    company_rc: "",
    town: "",
    company_website: "",
    description: "",
  });

  // ── STEP 1 — Credentials ──────────────────────────────────────────────────
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
      const autoUsername = creds.email.split("@")[0] + "_" + Date.now().toString().slice(-4);
      await api.post("auth/register/", {
        username: autoUsername,
        email: creds.email,
        password: creds.password,
        confirm_password: creds.confirm,
        full_name: "",
        role: "company",
      });
      setStep("otp");
    } catch (err: unknown) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 — OTP Verification ─────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("auth/verify-otp/", { email: creds.email, code: otpCode.trim() });
      await login(creds.email, creds.password);
      // Safety wait — ensures token is stored in localStorage before the
      // next request fires, avoiding a spurious 401 on complete-profile.
      await new Promise(res => setTimeout(res, 300));
      setStep("details");
    } catch (err: unknown) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("auth/resend-otp/", { email: creds.email });
    } catch (err: unknown) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3 — Company Details ──────────────────────────────────────────────
  const handleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !details.full_name.trim() ||
      !details.company_name.trim() ||
      !details.company_rc.trim() ||
      !details.town.trim() ||
      !details.description.trim()
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await api.patch("auth/company/complete-profile/", {
        full_name:       details.full_name,
        company_name:    details.company_name,
        company_sector:  details.company_sector,
        company_rc:      details.company_rc,
        company_website: details.company_website || "",
        town:            details.town,
        description:     details.description,
      });
      localStorage.setItem("company_status", "pending_approval");
      setStep("pending");
      navigate("/company/dashboard");
    } catch (err: unknown) {
      // Always show the real error — never silently skip to pending.
      // If you see "401 Unauthorized" here it means the token wasn't
      // set before this request fired — increase the setTimeout above.
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER: Step 1 — Credentials ─────────────────────────────────────────
  if (step === "credentials") {
    return (
      <div className="crf-root">
        <div className="crf-header">
          <div className="crf-icon">🏢</div>
          <h2 className="crf-title">Inscription Entreprise</h2>
          <p className="crf-sub">Créez votre espace recruteur sur Stag.io</p>
        </div>

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
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
          <button onClick={onBackToLogin} className="crf-link">Se connecter</button>
        </div>
      </div>
    );
  }

  // ── RENDER: Step 2 — OTP ──────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="crf-root">
        <div className="crf-header">
          <div className="crf-icon">📧</div>
          <h2 className="crf-title">Vérification Email</h2>
          <p className="crf-sub">
            Entrez le code OTP envoyé à <strong>{creds.email}</strong>
          </p>
        </div>

        {error && <div className="crf-error">{error}</div>}

        <form className="crf-form" onSubmit={handleVerifyOtp} noValidate>
          <div className="crf-field">
            <label>Code OTP *</label>
            <input
              type="text"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              placeholder="Entrez le code à 6 chiffres"
              required
            />
          </div>

          <button type="submit" className="crf-btn-primary" disabled={loading}>
            {loading ? "Vérification…" : "Vérifier et continuer"}
          </button>
          <button type="button" className="crf-btn-secondary" onClick={handleResendOtp} disabled={loading}>
            Renvoyer le code
          </button>
        </form>
      </div>
    );
  }

  // ── RENDER: Step 3 — Company Details ──────────────────────────────────────
  if (step === "details") {
    return (
      <div className="crf-root">
        <div className="crf-header">
          <div className="crf-icon">📋</div>
          <h2 className="crf-title">Informations de l'entreprise</h2>
          <p className="crf-sub">Ces informations seront vérifiées par l'administrateur</p>
        </div>

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="1" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              Numéro RC (Registre de Commerce) *
            </label>
            <input
              type="text"
              value={details.company_rc}
              onChange={e => setDetails({ ...details, company_rc: e.target.value })}
              placeholder="ex: 16/00-123456B19"
              required
            />
            <span className="crf-hint">Obligatoire pour vérifier l'existence légale de votre entreprise</span>
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              Description *
            </label>
            <input
              type="text"
              value={details.description}
              onChange={e => setDetails({ ...details, description: e.target.value })}
              placeholder="ex: Notre entreprise est spécialisée dans..."
              required
            />
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
              Site web de l'entreprise
            </label>
            <input
              type="text"
              value={details.company_website}
              onChange={e => setDetails({ ...details, company_website: e.target.value })}
              placeholder="ex: https://www.votreentreprise.dz (optionnel)"
            />
          </div>

          <div className="crf-field">
            <label>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
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

  // ── RENDER: Step 4 — Pending ──────────────────────────────────────────────
  if (step === "pending") {
    return (
      <div className="crf-root crf-status-root">
        <div className="crf-status-icon crf-icon-pending">⏳</div>
        <h2 className="crf-status-title">Demande envoyée !</h2>
        <p className="crf-status-msg">
          Votre demande d'inscription a bien été reçue.<br />
          L'administrateur de la plateforme va examiner votre dossier
          et vous enverra un email de confirmation à l'adresse<br />
          <strong>{creds.email}</strong>
        </p>
        <div className="crf-status-steps">
          <div className="crf-status-step crf-ss-done"><span>✓</span> Demande soumise</div>
          <div className="crf-status-step crf-ss-wait"><span>⏳</span> Vérification par l'admin</div>
          <div className="crf-status-step crf-ss-wait"><span>📧</span> Email de confirmation</div>
          <div className="crf-status-step crf-ss-wait"><span>🚀</span> Accès au tableau de bord</div>
        </div>
        <button className="crf-btn-secondary" onClick={onBackToLogin}>
          ← Retour à la connexion
        </button>
      </div>
    );
  }

  // ── RENDER: Step 5 — Rejected ─────────────────────────────────────────────
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
        Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur de la plateforme.
      </p>
      <button className="crf-btn-secondary" onClick={onBackToLogin}>
        ← Retour à la connexion
      </button>
    </div>
  );
}