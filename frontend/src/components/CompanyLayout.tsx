// src/components/CompanyLayout.tsx
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCompanyStatus, logout as authLogout } from "../auth";
import api from "../api";

// ”€”€ INLINE SVG ICONS ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
const Ico = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  Offers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  CVs: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  Interns: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

const NAV = [
  { path: "/company/dashboard", label: "Accueil", icon: Ico.Home },
  { path: "/company/offers", label: "Mes Offres", icon: Ico.Offers },
  { path: "/company/cvs", label: "Découvrir CVs", icon: Ico.CVs },
  { path: "/company/interns", label: "Mes Stagiaires", icon: Ico.Interns },
  { path: "/company/settings", label: "Paramètres", icon: Ico.Settings },
];

interface Notif {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("access_token");
  const companyName = localStorage.getItem("company_name") || "Mon Entreprise";
  const fullName = localStorage.getItem("full_name") || "Utilisateur";
  const initial = fullName.charAt(0).toUpperCase();
  const companyStatus = getCompanyStatus();
  const isCompanyApproved = companyStatus === "approved";

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  // Close notif panel on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Load notifications (shared Axios instance adds Authorization)
  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const { data } = await api.get("notifications/");
        const wrap = data as { data?: { notifications?: Notif[]; unread?: number } };
        const list = wrap.data?.notifications ?? [];
        setNotifs(list.slice(0, 6));
        setUnread(wrap.data?.unread ?? list.filter((n) => !n.is_read).length);
      } catch {
        setNotifs([]);
        setUnread(0);
      }
    };
    void load();

    const poll = setInterval(() => {
      void (async () => {
        try {
          const { data } = await api.get("notifications/unread-count/");
          const wrap = data as { data?: { unread_count?: number } };
          setUnread(wrap.data?.unread_count ?? 0);
        } catch {
          /* ignore */
        }
      })();
    }, 30000);
    return () => clearInterval(poll);
  }, [token]);

  const markAllRead = () => {
    void api.patch("notifications/read-all/", {}).catch(() => { });
    setNotifs((p) => p.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const ago = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}min`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return `${Math.floor(m / 1440)}j`;
  };

  const currentLabel = NAV.find(n =>
    location.pathname === n.path ||
    (n.path !== "/company/dashboard" && location.pathname.startsWith(n.path))
  )?.label ?? "Tableau de bord";

  return (
    <div className="cl-root">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="cl-sidebar">

        {/* Brand */}
        <div className="cl-brand">
          <span className="cl-brand-logo">S</span>
          <div>
            <p className="cl-brand-title">Stag<em>.io</em></p>
            <p className="cl-brand-sub">Espace Entreprise</p>
          </div>
        </div>

        {/* Company card */}
        <div className="cl-co-card">
          <div className="cl-co-avatar">{initial}</div>
          <div className="cl-co-info">
            <p className="cl-co-name">{companyName}</p>
            <p className="cl-co-contact">{fullName}</p>
          </div>
        </div>

        {/* Create offer button */}
        <Link
          to={isCompanyApproved ? "/company/offers/new" : "#"}
          className="cl-cta"
          onClick={(e) => {
            if (!isCompanyApproved) {
              e.preventDefault();
            }
          }}
          title={isCompanyApproved ? "Create Offer" : "Your account is pending approval"}
          style={!isCompanyApproved ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
        >
          <Ico.Plus />
          {isCompanyApproved ? "Create Offer" : "Create Offer (disabled)"}
        </Link>
        {!isCompanyApproved && (
          <p style={{ marginTop: ".45rem", fontSize: ".75rem", color: "#92400e" }}>
            Your account is pending approval
          </p>
        )}

        <div className="cl-sidebar-sep" />

        {/* Nav items */}
        <nav className="cl-nav">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active =
              location.pathname === path ||
              (path !== "/company/dashboard" && location.pathname.startsWith(path));
            return (
              <Link key={path} to={path} className={`cl-nav-item${active ? " cl-active" : ""}`}>
                <span className="cl-nav-ico"><Icon /></span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          type="button"
          className="cl-logout"
          onClick={() => {
            void authLogout().then(() => {
              localStorage.removeItem("user_data");
              localStorage.removeItem("full_name");
              localStorage.removeItem("company_name");
              navigate("/login");
            });
          }}
        >
          <Ico.Logout />
          Déconnexion
        </button>

      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div className="cl-main">

        {/* Topbar */}
        <header className="cl-topbar">
          <div className="cl-topbar-left">
            <span className="cl-crumb">Entreprise</span>
            <span className="cl-crumb-arrow">›</span>
            <h1 className="cl-topbar-title">{currentLabel}</h1>
          </div>

          <div className="cl-topbar-right">

            {/* Notification bell */}
            <div className="cl-notif-wrap" ref={notifRef}>
              <button
                className={`cl-bell-btn${notifOpen ? " cl-bell-open" : ""}`}
                onClick={() => setNotifOpen(v => !v)}
              >
                <Ico.Bell />
                {unread > 0 && <span className="cl-badge">{unread > 9 ? "9+" : unread}</span>}
              </button>

              {notifOpen && (
                <div className="cl-notif-panel">
                  <div className="cl-notif-head">
                    <span>Notifications {unread > 0 && <strong>({unread})</strong>}</span>
                    {unread > 0 && (
                      <button className="cl-mark-all" onClick={markAllRead}>Tout lire</button>
                    )}
                  </div>

                  {notifs.length === 0
                    ? <p className="cl-notif-empty">Aucune notification</p>
                    : notifs.map(n => (
                      <div key={n.id} className={`cl-notif-row${!n.is_read ? " cl-notif-new" : ""}`}>
                        <span className={`cl-notif-dot${n.is_read ? " cl-dot-read" : ""}`} />
                        <div className="cl-notif-msg">
                          <p>{n.message}</p>
                          <time>{ago(n.created_at)} ago</time>
                        </div>
                      </div>
                    ))
                  }

                  <div className="cl-notif-foot">
                    <Link to="/company/notifications" onClick={() => setNotifOpen(false)}>
                      Voir toutes →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User pill — NOW CLICKABLE */}
            <div
              className="cl-user-pill"
              onClick={() => navigate("/company/profile")}
              style={{ cursor: "pointer" }}
              title="Voir le profil"
            >
              <div className="cl-user-av">{initial}</div>
              <span className="cl-user-name">{fullName}</span>
            </div>

          </div>
        </header>

        {!isCompanyApproved && (
          <div style={{ margin: "0 1.1rem", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 10, padding: ".7rem .9rem", fontSize: ".82rem" }}>
            Votre compte entreprise est en attente d'approbation administrateur. Vous pouvez consulter votre tableau de bord mais les actions de modification sont verrouillées.
          </div>
        )}

        {/* Page content */}
        <main className="cl-content">{children}</main>

      </div>
    </div>
  );
}
