// src/components/CompanyLayout.tsx
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// ── INLINE SVG ICONS ──────────────────────────────────────
const Ico = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  Offers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  CVs: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Interns: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

const NAV = [
  { path: "/company/dashboard", label: "Accueil",        icon: Ico.Home    },
  { path: "/company/offers",    label: "Mes Offres",     icon: Ico.Offers  },
  { path: "/company/cvs",       label: "Découvrir CVs",  icon: Ico.CVs     },
  { path: "/company/interns",   label: "Mes Stagiaires", icon: Ico.Interns },
  { path: "/company/settings",  label: "Paramètres",     icon: Ico.Settings},
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
  const token       = localStorage.getItem("access_token");
  const companyName = localStorage.getItem("company_name") || "Mon Entreprise";
  const fullName    = localStorage.getItem("full_name")    || "Utilisateur";
  const initial     = fullName.charAt(0).toUpperCase();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs,    setNotifs]    = useState<Notif[]>([]);
  const [unread,    setUnread]    = useState(0);

  // Close notif panel on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Load notifications
  useEffect(() => {
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/notifications/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (!d.error && d.data) {
          setNotifs(d.data.slice(0, 6));
          setUnread(d.data.filter((n: Notif) => !n.is_read).length);
        }
      })
      .catch(() => {
        const mock: Notif[] = [
          { id: 1, message: "Nouvelle candidature reçue pour « Développeur Django »", is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 2, message: "Convention CONV-0001 en attente de votre signature",      is_read: false, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, message: "Votre compte a été approuvé par l'administrateur",        is_read: true,  created_at: new Date(Date.now() - 259200000).toISOString() },
        ];
        setNotifs(mock);
        setUnread(2);
      });

    const poll = setInterval(() => {
      fetch("http://127.0.0.1:8000/api/notifications/unread-count/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => { if (!d.error) setUnread(d.data?.unread_count ?? 0); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(poll);
  }, [token]);

  const markAllRead = () => {
    fetch("http://127.0.0.1:8000/api/notifications/read-all/", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const ago = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60)   return `${m}min`;
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
        <Link to="/company/offers/new" className="cl-cta">
          <Ico.Plus />
          Créer une offre
        </Link>

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
        <button className="cl-logout" onClick={() => { localStorage.clear(); navigate("/auth"); }}>
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

        {/* Page content */}
        <main className="cl-content">{children}</main>

      </div>
    </div>
  );
}