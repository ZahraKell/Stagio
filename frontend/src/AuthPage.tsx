// src/AuthPage.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CompanyRegisterForm from "./components/CompanyRegisterForm";
import api from "./api";
import { login } from "./auth";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function AuthPage() {
  const navigate = useNavigate();

  const [isSignIn, setIsSignIn] = useState(true);
  const [animClass, setAnimClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPassword, setRegisteredPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [showCompanyForm, setShowCompanyForm] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  // Handle Google redirect response
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace("#", "?"));
    const idToken = params.get("id_token");
    if (!idToken) return;

    // Clear the hash from the URL
    window.history.replaceState(null, "", window.location.pathname);

    const role = localStorage.getItem("google_signup_role") || "student";
    localStorage.removeItem("google_signup_role");

    setGoogleLoading(true);
    fetch(`${API}/api/auth/auth/google/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken, role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access) {
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          localStorage.setItem("user_role", data.role);
          if (data.company_status) {
            localStorage.setItem("company_status", data.company_status);
          }
          if (data.role === "student") navigate("/student");
          else if (data.role === "company") navigate("/company");
          else if (data.role === "admin") navigate("/admin");
          else navigate("/");
        } else {
          setError(data.error || "Échec de la connexion Google.");
        }
      })
      .catch(() => setError("Erreur lors de la connexion avec Google."))
      .finally(() => setGoogleLoading(false));
  }, []);

  const handleSignUpChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // ── Switch animations ──────────────────────────────────
  const switchToSignUp = () => {
    setAnimClass("auth-animated-signin");
    setIsSignIn(false);
    setError("");
    setSuccessMessage("");
    setTimeout(() => setAnimClass(""), 1000);
  };

  const switchToSignIn = () => {
    setAnimClass("auth-animated-signup");
    setIsSignIn(true);
    setError("");
    setSuccessMessage("");
    setShowCompanyForm(false);
    setShowOtpStep(false);
    setTimeout(() => setAnimClass(""), 1000);
  };

  // ── GOOGLE AUTH ────────────────────────────────────────
  const handleGoogleLogin = () => {
    // Save role before leaving the page
    localStorage.setItem(
      "google_signup_role",
      formData.role === "company" ? "company" : "student",
    );

    // This opens the full Google account picker page
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: "http://localhost:5173/login",
      response_type: "id_token",
      scope: "openid email profile",
      prompt: "select_account",
      nonce: Math.random().toString(36).slice(2),
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // ── SIGN UP ────────────────────────────────────────────
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.role === "company") {
      setShowCompanyForm(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Le mot de passe doit avoir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      const autoUsername =
        formData.email.split("@")[0] + "_" + Date.now().toString().slice(-4);

      await api.post("auth/register/", {
        username: autoUsername,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        full_name: "",
        role: formData.role,
      });

      setRegisteredEmail(formData.email);
      setRegisteredPassword(formData.password);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
      });
      setShowOtpStep(true);
    } catch (err: unknown) {
      const axErr = err as import("axios").AxiosError<
        Record<string, string[] | string>
      >;
      const data = axErr.response?.data;
      if (data && typeof data === "object") {
        setError(Object.values(data).flat().join(" "));
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP VERIFICATION (student & administration) ────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("auth/verify-otp/", {
        email: registeredEmail,
        code: otpCode.trim(),
      });
      setSuccessMessage("Email vérifié ! Vous pouvez vous connecter.");
      setShowOtpStep(false);
      setTimeout(() => {
        switchToSignIn();
        setSuccessMessage("");
      }, 2000);
    } catch (err) {
      const axErr = err as import("axios").AxiosError<
        Record<string, string[] | string>
      >;
      const data = axErr.response?.data;
      if (data && typeof data === "object") {
        setError(Object.values(data).flat().join(" "));
      } else {
        setError("Code invalide ou expiré.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("auth/resend-otp/", { email: registeredEmail });
      setSuccessMessage("Un nouveau code a été envoyé.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ──────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const role = await login(loginData.email, loginData.password);

      const meRes = await api.get("auth/me/");
      const me = meRes.data as {
        full_name?: string;
        company_name?: string;
        role?: string;
      };
      localStorage.setItem("user_data", JSON.stringify(me));
      localStorage.setItem("full_name", me.full_name || "");
      localStorage.setItem("company_name", me.company_name || "Mon Entreprise");

      setSuccessMessage("Connexion réussie ! Redirection…");
      setLoginData({ email: "", password: "" });

      setTimeout(() => {
        if (role === "student") navigate("/student");
        else if (role === "company") navigate("/company");
        else if (role === "admin") navigate("/admin");
        else if (role === "administration") navigate("/administration");
        else navigate("/");
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ── If company registration flow is active ─────────────
  if (showCompanyForm) {
    return (
      <div className="auth-page">
        <div className="auth-wrapper auth-company-mode">
          <div className="auth-form-container auth-front">
            <CompanyRegisterForm onBackToLogin={switchToSignIn} />
          </div>
        </div>
      </div>
    );
  }

  // ── OTP step (for student & administration) ────────────
  if (showOtpStep) {
    return (
      <div className="auth-page">
        <div className="auth-wrapper">
          <div className="auth-form-container auth-front">
            <div className="crf-root">
              <div className="crf-header">
                <div className="crf-icon">📧</div>
                <h2 className="crf-title">Vérification Email</h2>
                <p className="crf-sub">
                  Entrez le code OTP envoyé à <strong>{registeredEmail}</strong>
                </p>
              </div>
              {error && <div className="crf-error">{error}</div>}
              {successMessage && (
                <div className="crf-success">{successMessage}</div>
              )}
              <form className="crf-form" onSubmit={handleVerifyOtp}>
                <div className="crf-field">
                  <label>Code OTP *</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Entrez le code à 6 chiffres"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="crf-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Vérification…" : "Vérifier et continuer"}
                </button>
                <button
                  type="button"
                  className="crf-btn-secondary"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Renvoyer le code
                </button>
              </form>
              <div className="crf-back-login">
                <button onClick={switchToSignIn} className="crf-link">
                  ← Retour à la connexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal auth page ───────────────────────────────────
  return (
    <div className="auth-page">
      <div className={`auth-wrapper ${animClass}`}>
        {/* ══════════ SIGN UP FORM ══════════ */}
        <div
          className={`auth-form-container auth-sign-up ${!isSignIn ? "auth-front" : ""}`}
        >
          <form onSubmit={handleSignUpSubmit} noValidate>
            <h2>Sign Up</h2>

            {error && !isSignIn && (
              <div className="auth-error-message">{error}</div>
            )}
            {successMessage && !isSignIn && (
              <div className="auth-success-message">{successMessage}</div>
            )}

            {/* Email */}
            <div className="auth-form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleSignUpChange}
                required
              />
              <i className="fas fa-at" />
              <label>email</label>
            </div>

            {/* Role */}
            <div className="auth-form-group">
              <select
                name="role"
                value={formData.role}
                onChange={handleSignUpChange}
                required
                className="auth-select"
              >
                <option value="student">Étudiant</option>
                <option value="company">Entreprise</option>
                <option value="administration">Administration</option>
              </select>
              <i className="fas fa-user-tag" />
              <label className="auth-select-label">rôle</label>
            </div>

            {/* Password — shown for student and administration */}
            {(formData.role === "student" ||
              formData.role === "administration") && (
              <>
                <div className="auth-form-group">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleSignUpChange}
                    required
                  />
                  <i className="fas fa-lock" />
                  <label>mot de passe</label>
                </div>

                <div className="auth-form-group">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleSignUpChange}
                    required
                  />
                  <i className="fas fa-lock" />
                  <label>confirmer</label>
                </div>
              </>
            )}

            {/* Company hint */}
            {formData.role === "company" && (
              <div className="auth-company-hint">
                <span>🏢</span>
                <p>
                  Les entreprises suivent un processus d'inscription en 2 étapes
                  avec vérification par l'administrateur.
                </p>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading
                ? "Chargement…"
                : formData.role === "company"
                  ? "Commencer l'inscription →"
                  : "S'inscrire"}
            </button>

            {/* ── GOOGLE SIGN UP ── */}
            <div className="auth-divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                className="auth-google-icon"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? "Connexion…" : "Continuer avec Google"}
            </button>

            <p className="auth-link">
              Déjà un compte ?{" "}
              <span className="auth-switch-link" onClick={switchToSignIn}>
                Se connecter
              </span>
            </p>
          </form>
        </div>

        {/* ══════════ SIGN IN FORM ══════════ */}
        <div
          className={`auth-form-container auth-sign-in ${isSignIn ? "auth-front" : ""}`}
        >
          <form onSubmit={handleLoginSubmit} noValidate>
            <h2>Login</h2>

            {error && isSignIn && (
              <div className="auth-error-message">{error}</div>
            )}
            {successMessage && isSignIn && (
              <div className="auth-success-message">{successMessage}</div>
            )}

            {/* Email */}
            <div className="auth-form-group">
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                autoComplete="email"
              />
              <i className="fas fa-user" />
              <label>email</label>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                autoComplete="current-password"
              />
              <i className="fas fa-lock" />
              <label>mot de passe</label>
            </div>

            <div className="auth-forgot-pass">
              <span
                className="auth-switch-link"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/forgot-password")}
              >
                Mot de passe oublié ?
              </span>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>

            {/* ── GOOGLE SIGN IN ── */}
            <div className="auth-divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                className="auth-google-icon"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? "Connexion…" : "Continuer avec Google"}
            </button>

            <p className="auth-link">
              Pas encore de compte ?{" "}
              <span className="auth-switch-link" onClick={switchToSignUp}>
                S'inscrire
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
