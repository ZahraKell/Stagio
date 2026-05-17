// src/components/Header.tsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { getUserRole, clearTokens, getAccessToken } from "../auth";
import logoRemoved from "../assets/logo-removed.png";
import logoWRemoved from "../assets/logo-w-removed.png";

type UserRole = "student" | "company" | "admin" | "administration" | null;

const ROLE_DASHBOARD: Record<string, string> = {
  student: "/student",
  company: "/company",
  admin: "/admin/dashboard",
  administration: "/administration",
};
const ROLE_PROFILE: Record<string, string> = {
  student: "/student/profile",
  company: "/company/profile",
  admin: "/admin/dashboard",
  administration: "/administration/profile",
};
const ROLE_LABEL: Record<string, string> = {
  student: "Student Portal",
  company: "Company Portal",
  admin: "Admin Panel",
  administration: "Administration",
};
const ROLE_COLOR: Record<string, string> = {
  student: "#d7e44f",
  company: "#f59e0b",
  admin: "#3532e7",
  administration: "#4f4023",
};

const PICTURE_KEY = "profile_picture_url";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [initials, setInitials] = useState("");
  const [fullName, setFullName] = useState("");
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Scroll listener — original behaviour
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > window.innerHeight - 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Re-read auth state on every route change
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setRole(null); setPictureUrl(null); return; }

    const r = getUserRole() as UserRole;
    setRole(r);

    // Profile picture written to localStorage by useProfilePicture after every upload
    setPictureUrl(localStorage.getItem(PICTURE_KEY) || null);

    // Display name
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        const u = JSON.parse(raw) as { full_name?: string; company_name?: string };
        const name = (r === "company" ? u.company_name : u.full_name) || "";
        setFullName(name);
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) setInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase());
        else if (parts.length === 1) setInitials(parts[0].slice(0, 2).toUpperCase());
        else setInitials(r ? r[0].toUpperCase() : "U");
      } else {
        setInitials(r ? r[0].toUpperCase() : "U");
      }
    } catch { setInitials("U"); }
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem(PICTURE_KEY);
    setRole(null); setPictureUrl(null);
    setDropOpen(false);
    navigate("/login");
  };

  const accent = role ? (ROLE_COLOR[role] ?? "#64748b") : "#64748b";

  return (
    <nav className={`hs-nav ${isScrolled ? "hs-nav-scrolled" : ""}`}>
      <div className="hs-nav-left">
        <Link to="/" className="hs-logo">
            <img
    src={isScrolled ? logoRemoved : logoWRemoved}
    alt="InternChips"
    style={{ height: isScrolled ? "55px" : "70px", objectFit: "contain", transition: "opacity 0.3s ease" }}
  /> 
        </Link>
        <ul className="hs-nav-links">
          <li><Link to="/offers">Offers</Link></li>
          <li><Link to="/Testimonials">Testimonials</Link></li>
          <li><Link to="/FAQ">FAQ</Link></li>
          <li><Link to="/Companies">Companies</Link></li>
          <li><Link to="/Blog">Blog</Link></li>
          <li><Link to="/about">About us</Link></li>
          <li><Link to="/contact">Contact us</Link></li>
        </ul>
      </div>

      <div className="hs-nav-right">
        {role ? (
          /* ── LOGGED IN ───────────────────────────────────────────────────── */
          <div className="hdr-avatar-wrap" ref={dropRef}>
            <button
              className="hdr-avatar-btn"
              style={{ borderColor: accent }}
              onClick={() => setDropOpen(o => !o)}
              aria-label="User menu"
            >
              {pictureUrl
                ? <img src={pictureUrl} alt="avatar" className="hdr-avatar-photo" />
                : <span className="hdr-avatar-initials" style={{ color: accent }}>{initials}</span>
              }
              <span className="hdr-role-dot" style={{ background: accent }} />
            </button>

            {dropOpen && (
              <div className="hdr-dropdown">
                <div className="hdr-drop-user">
                  <div className="hdr-drop-avatar">
                    {pictureUrl
                      ? <img src={pictureUrl} alt="" className="hdr-drop-avatar-photo" />
                      : <span style={{ color: accent }}>{initials}</span>
                    }
                  </div>
                  <div>
                    <div className="hdr-drop-name">{fullName || "User"}</div>
                    <div className="hdr-drop-role" style={{ color: accent }}>
                      {ROLE_LABEL[role] ?? role}
                    </div>
                  </div>
                </div>

                <div className="hdr-drop-divider" />

                <Link to={ROLE_DASHBOARD[role] ?? "/"} className="hdr-drop-item"
                  onClick={() => setDropOpen(false)}>
                  <DashIcon /> Dashboard
                </Link>
                <Link to={ROLE_PROFILE[role] ?? "/"} className="hdr-drop-item"
                  onClick={() => setDropOpen(false)}>
                  <UserIcon /> My Profile
                </Link>

                <div className="hdr-drop-divider" />

                <button className="hdr-drop-item hdr-drop-logout" onClick={handleLogout}>
                  <LogoutIcon /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── LOGGED OUT ──────────────────────────────────────────────────── */
          <Link to="/login" className="hs-login-btn"   style={{
    color: isScrolled ? "#000" : "#fff",
    borderColor: isScrolled ? "#000" : "#fff",
    transition: "color 0.3s ease, border-color 0.3s ease"
  }}>
            <LogIn size={16} /><span>Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

/* ── Tiny inline SVG icons so we don't bloat lucide imports ────────────────── */
const DashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);