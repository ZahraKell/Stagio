// src/ForgotPasswordPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

type Step = "email" | "code" | "newPassword" | "success";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Step 1: Send OTP to email ──────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email.");
      return;
    }
    setLoading(true);
    try {
      await api.post("auth/forgot-password/", { email: email.trim().toLowerCase() });
      setSuccessMessage("Un code de réinitialisation a été envoyé à votre email.");
      setStep("code");
    } catch (err: unknown) {
      const axErr = err as import("axios").AxiosError<Record<string, string[] | string>>;
      const data = axErr.response?.data;
      if (data && typeof data === "object") {
        setError(Object.values(data).flat().join(" "));
      } else {
        setError("Une erreur est survenue. Vérifiez votre email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP code ────────────────────────────
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Veuillez entrer le code reçu.");
      return;
    }
    // Just move to next step — the code is verified server-side during reset
    setSuccessMessage("");
    setStep("newPassword");
  };

  // ── Step 3: Reset password ─────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      await api.post("auth/reset-password/", {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep("success");
    } catch (err: unknown) {
      const axErr = err as import("axios").AxiosError<Record<string, string[] | string>>;
      const data = axErr.response?.data;
      if (data && typeof data === "object") {
        setError(Object.values(data).flat().join(" "));
      } else {
        setError("Code invalide ou expiré. Recommencez.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("auth/forgot-password/", { email: email.trim().toLowerCase() });
      setSuccessMessage("Un nouveau code a été envoyé.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      setError("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-form-container auth-front">
          <div className="crf-root">

            {/* ── Step indicator ── */}
            {step !== "success" && (
              <div className="crf-steps" style={{ marginBottom: "1.5rem" }}>
                {(["email", "code", "newPassword"] as Step[]).map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center" }}>
                    <div className={`crf-step ${step === s ? "crf-step-active" : ""}`}>
                      <span
                        className={`crf-step-dot ${
                          ["email", "code", "newPassword"].indexOf(step) > i
                            ? "crf-dot-done"
                            : step === s
                            ? ""
                            : "crf-dot-inactive"
                        }`}
                      >
                        {["email", "code", "newPassword"].indexOf(step) > i ? "✓" : i + 1}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className={`crf-step-line ${
                          ["email", "code", "newPassword"].indexOf(step) > i
                            ? "crf-line-done"
                            : ""
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <div className="crf-error">{error}</div>}
            {successMessage && (
              <div
                className="crf-success"
                style={{
                  background: "#d1fae5",
                  color: "#065f46",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {successMessage}
              </div>
            )}

            {/* ══ STEP 1: Email ══ */}
            {step === "email" && (
              <>
                <div className="crf-header">
                  <div className="crf-icon">🔐</div>
                  <h2 className="crf-title">Mot de passe oublié</h2>
                  <p className="crf-sub">
                    Entrez votre email pour recevoir un code de réinitialisation
                  </p>
                </div>
                <form className="crf-form" onSubmit={handleSendCode}>
                  <div className="crf-field">
                    <label>Adresse email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <button type="submit" className="crf-btn-primary" disabled={loading}>
                    {loading ? "Envoi en cours…" : "Envoyer le code"}
                  </button>
                </form>
                <div className="crf-back-login">
                  <button onClick={() => navigate("/login")} className="crf-link">
                    ← Retour à la connexion
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 2: OTP Code ══ */}
            {step === "code" && (
              <>
                <div className="crf-header">
                  <div className="crf-icon">📧</div>
                  <h2 className="crf-title">Vérification du code</h2>
                  <p className="crf-sub">
                    Entrez le code envoyé à <strong>{email}</strong>
                  </p>
                </div>
                <form className="crf-form" onSubmit={handleVerifyCode}>
                  <div className="crf-field">
                    <label>Code de vérification *</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Entrez le code à 6 chiffres"
                      required
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button type="submit" className="crf-btn-primary" disabled={loading}>
                    Vérifier le code
                  </button>
                  <button
                    type="button"
                    className="crf-btn-secondary"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Renvoyer le code
                  </button>
                </form>
                <div className="crf-back-login">
                  <button onClick={() => setStep("email")} className="crf-link">
                    ← Changer d'email
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 3: New Password ══ */}
            {step === "newPassword" && (
              <>
                <div className="crf-header">
                  <div className="crf-icon">🔑</div>
                  <h2 className="crf-title">Nouveau mot de passe</h2>
                  <p className="crf-sub">
                    Choisissez un nouveau mot de passe sécurisé
                  </p>
                </div>
                <form className="crf-form" onSubmit={handleResetPassword}>
                  <div className="crf-field">
                    <label>Nouveau mot de passe *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="crf-field">
                    <label>Confirmer le mot de passe *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <button type="submit" className="crf-btn-primary" disabled={loading}>
                    {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
                  </button>
                </form>
              </>
            )}

            {/* ══ STEP 4: Success ══ */}
            {step === "success" && (
              <div className="crf-status-root">
                <div className="crf-status-icon" style={{ fontSize: "3rem" }}>✅</div>
                <h2 className="crf-status-title">Mot de passe réinitialisé !</h2>
                <p className="crf-status-msg">
                  Votre mot de passe a été changé avec succès.<br />
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
                <button
                  className="crf-btn-primary"
                  onClick={() => navigate("/login")}
                  style={{ marginTop: "1.5rem" }}
                >
                  Se connecter →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}