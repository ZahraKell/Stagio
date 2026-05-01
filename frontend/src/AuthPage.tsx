// src/AuthPage.tsx  — complete updated version
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyRegisterForm from "./components/CompanyRegisterForm";

const API = "http://127.0.0.1:8000";

export default function AuthPage() {
  const navigate = useNavigate();

  const [isSignIn,       setIsSignIn]       = useState(true);
  const [animClass,      setAnimClass]       = useState("");
  const [loading,        setLoading]         = useState(false);
  const [googleLoading,  setGoogleLoading]   = useState(false);
  const [error,          setError]           = useState("");
  const [successMessage, setSuccessMessage]  = useState("");

  // When true — show the full company registration flow
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  const [formData, setFormData] = useState({
    email:           "",
    password:        "",
    confirmPassword: "",
    role:            "student",
  });

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const handleSignUpChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    setTimeout(() => setAnimClass(""), 1000);
  };

  // ── GOOGLE AUTH ────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    
    try {
      // Redirect to Google OAuth endpoint
      // Replace with your actual Google OAuth URL
      window.location.href = `${API}/api/auth/google/`;
    } catch (err: unknown) {
      setError("Erreur lors de la connexion avec Google.");
      setGoogleLoading(false);
    }
  };

  // ── SIGN UP ────────────────────────────────────────────
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Company → show dedicated multi-step form
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

      const res = await fetch(`${API}/api/auth/register/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:  autoUsername,
          email:     formData.email,
          password:  formData.password,
          full_name: "",
          role:      formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msgs = Object.values(data.errors ?? data).flat().join(" ");
        throw new Error(msgs || "Erreur lors de l'inscription.");
      }

      setSuccessMessage("Compte créé ! Vous pouvez maintenant vous connecter.");
      setFormData({ email: "", password: "", confirmPassword: "", role: "student" });
      setTimeout(() => {
        switchToSignIn();
        setSuccessMessage("");
      }, 2000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
      const res = await fetch(`${API}/api/auth/login/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Identifiant ou mot de passe incorrect.");
      }

      // Save tokens
      localStorage.setItem("access_token",  data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_role",     data.role);
      localStorage.setItem("full_name",     data.full_name || "");

      // Fetch full profile
      const meRes = await fetch(`${API}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        localStorage.setItem("user_data",    JSON.stringify(me));
        localStorage.setItem("full_name",    me.full_name    || "");
        localStorage.setItem("company_name", me.company_name || "Mon Entreprise");
      }

      setSuccessMessage("Connexion réussie ! Redirection…");
      setLoginData({ username: "", password: "" });

      setTimeout(() => {
        if (data.role === "student")             navigate("/student/dashboard");
        else if (data.role === "company")        navigate("/company/dashboard");
        else if (data.role === "admin")          navigate("/admin/dashboard");
        else if (data.role === "administration") navigate("/administration/dashboard");
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

  // ── Normal auth page ───────────────────────────────────
  return (
    <div className="auth-page">
      <div className={`auth-wrapper ${animClass}`}>

        {/* ══════════ SIGN UP FORM ══════════ */}
        <div className={`auth-form-container auth-sign-up ${!isSignIn ? "auth-front" : ""}`}>
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
              </select>
              <i className="fas fa-user-tag" />
              <label className="auth-select-label">rôle</label>
            </div>

            {/* Password — only shown for student */}
            {formData.role === "student" && (
              <>
                <div className="auth-form-group">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleSignUpChange}
                    required={formData.role === "student"}
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
                    required={formData.role === "student"}
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

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
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
              <svg viewBox="0 0 24 24" width="20" height="20" className="auth-google-icon">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
        <div className={`auth-form-container auth-sign-in ${isSignIn ? "auth-front" : ""}`}>
          <form onSubmit={handleLoginSubmit} noValidate>
            <h2>Login</h2>

            {error && isSignIn && (
              <div className="auth-error-message">{error}</div>
            )}
            {successMessage && isSignIn && (
              <div className="auth-success-message">{successMessage}</div>
            )}

            {/* Username */}
            <div className="auth-form-group">
              <input
                type="text"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                required
                autoComplete="username"
              />
              <i className="fas fa-user" />
              <label>username</label>
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
              <span>Mot de passe oublié ?</span>
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
              <svg viewBox="0 0 24 24" width="20" height="20" className="auth-google-icon">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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