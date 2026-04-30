import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";

export default function AuthPage() {
  const navigate = useNavigate();

  const [isSignIn,        setIsSignIn]        = useState(true);
  const [animClass,       setAnimClass]        = useState("");
  const [loading,         setLoading]          = useState(false);
  const [error,           setError]            = useState("");
  const [successMessage,  setSuccessMessage]   = useState("");

  // ── Simplified signup — only email, password, role ──
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

  // ── Switch animations — mirrors the original CSS ──
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
    setTimeout(() => setAnimClass(""), 1000);
  };

  // ── SIGN UP ──────────────────────────────────────────
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // Auto-generate a username from the email (before the @)
      const autoUsername = formData.email.split("@")[0] + "_" + Date.now().toString().slice(-4);

      const res = await fetch(`${API_BASE}/api/auth/register/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:  autoUsername,
          email:     formData.email,
          password:  formData.password,
          full_name: "",          // user fills this later in profile settings
          role:      formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msgs = Object.values(data.errors || data)
          .flat()
          .join(" ");
        throw new Error(msgs || "Registration failed.");
      }

      // Company goes to pending — show special message
      if (formData.role === "company") {
        setSuccessMessage(
          "Registration submitted! Complete your company profile to proceed."
        );
        setTimeout(() => {
          switchToSignIn();
          setSuccessMessage("");
        }, 3000);
      } else {
        setSuccessMessage("Account created! Please sign in.");
        setTimeout(() => {
          switchToSignIn();
          setSuccessMessage("");
        }, 2000);
      }

      setFormData({
        email: "", password: "", confirmPassword: "", role: "student",
      });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password.");
      }

      // Save tokens and role
      localStorage.setItem("access_token",  data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_role",     data.role);
      localStorage.setItem("full_name",     data.full_name  || "");

      // Fetch full user details
      const meRes = await fetch(`${API_BASE}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      if (meRes.ok) {
        const userData = await meRes.json();
        localStorage.setItem("user_data",     JSON.stringify(userData));
        localStorage.setItem("full_name",     userData.full_name    || "");
        localStorage.setItem("company_name",  userData.company_name || "Mon Entreprise");
      }

      setSuccessMessage("Login successful! Redirecting...");
      setLoginData({ username: "", password: "" });

      // Redirect based on role
      setTimeout(() => {
        if (data.role === "student")             navigate("/student/dashboard");
        else if (data.role === "company")        navigate("/company/dashboard");
        else if (data.role === "admin")          navigate("/admin/dashboard");
        else if (data.role === "administration") navigate("/administration/dashboard");
        else navigate("/");
      }, 1200);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ───────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className={`auth-wrapper ${animClass}`}>

        {/* ── SIGN UP FORM (back card) ── */}
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
              <i className="fas fa-at"></i>
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
                <option value="student">Student</option>
                <option value="company">Company</option>
              </select>
              <i className="fas fa-user-tag"></i>
              <label className="auth-select-label">role</label>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleSignUpChange}
                required
              />
              <i className="fas fa-lock"></i>
              <label>password</label>
            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleSignUpChange}
                required
              />
              <i className="fas fa-lock"></i>
              <label>confirm password</label>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>

            <p className="auth-link">
              Already have an account?{" "}
              <span className="auth-switch-link" onClick={switchToSignIn}>
                Sign In
              </span>
            </p>
          </form>
        </div>

        {/* ── SIGN IN FORM (front card) ── */}
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
              <i className="fas fa-user"></i>
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
              <i className="fas fa-lock"></i>
              <label>password</label>
            </div>

            <div className="auth-forgot-pass">
              <span>Forgot Password?</span>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="auth-link">
              Don't have an account?{" "}
              <span className="auth-switch-link" onClick={switchToSignUp}>
                Sign Up
              </span>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}