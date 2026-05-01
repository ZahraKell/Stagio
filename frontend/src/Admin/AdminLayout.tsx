// AdminLayout.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

const API = "http://localhost:8000/api";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("user_data");
    if (data) setUserData(JSON.parse(data));
    fetchNotifCount();
  }, []);

  const fetchNotifCount = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/notifications/unread-count/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) setNotifCount(data.data?.unread_count || 0);
    } catch {
      setNotifCount(3);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/notifications/?is_read=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) setNotifications(data.data?.notifications?.slice(0, 5) || []);
    } catch {
      setNotifications([
        { id: 1, message: "New company registration: Condor Electronics", created_at: "5 min ago" },
        { id: 2, message: "3 new internship applications pending review", created_at: "1 hour ago" },
        { id: 3, message: "Convention CV-2026-078 validated", created_at: "Yesterday" },
      ]);
    }
  };

  const handleBellClick = () => {
    if (!showNotif) fetchNotifications();
    setShowNotif(!showNotif);
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API}/notifications/read-all/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifCount(0);
      setNotifications([]);
    } catch {}
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");
      await fetch(`${API}/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refresh }),
      });
    } catch {}
    localStorage.clear();
    navigate("/auth");
  };

  const menuItems = [
    { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin/offers", icon: "📋", label: "Internship Offers" },
    { path: "/admin/applications", icon: "📝", label: "Applications" },
    { path: "/admin/conventions", icon: "📄", label: "Conventions" },
    { path: "/admin/students", icon: "🎓", label: "Students" },
    { path: "/admin/companies", icon: "🏢", label: "Companies" },
    { path: "/admin/users", icon: "👥", label: "Users" },
    { path: "/admin/emails", icon: "📧", label: "Email Whitelist" },
    { path: "/admin/stats", icon: "📈", label: "Statistics" },
    { path: "/admin/notifications", icon: "🔔", label: "Notifications" },
    { path: "/admin/settings", icon: "⚙️", label: "Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const currentPage = menuItems.find(m => m.path === location.pathname)?.label || "Dashboard";

  return (
    <div className="am-layout">
      {/* Sidebar */}
      <aside className="am-sidebar">
        <div className="am-brand" onClick={() => navigate("/admin/dashboard")}>
          <div className="am-brand-logo">SC</div>
          <div>
            <div className="am-brand-title">StageConnect</div>
            <div className="am-brand-sub">Admin Portal</div>
          </div>
        </div>

        <nav className="am-nav">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
              className={`am-nav-item ${isActive(item.path) ? "am-nav-active" : ""}`}
            >
              <span className="am-nav-icon">{item.icon}</span>
              <span className="am-nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <button onClick={handleLogout} className="am-logout-btn">
          <span>🚪</span> Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="am-main">
        {/* Topbar */}
        <header className="am-topbar">
          <div className="am-topbar-left">
            <span className="am-breadcrumb">Admin</span>
            <span className="am-breadcrumb-arrow">›</span>
            <span className="am-current-page">{currentPage}</span>
          </div>

          <div className="am-topbar-right">
            {/* Notifications */}
            <div className="am-notif-wrap">
              <button className="am-bell-btn" onClick={handleBellClick}>
                🔔
                {notifCount > 0 && <span className="am-badge">{notifCount}</span>}
              </button>

              {showNotif && (
                <div className="am-notif-panel">
                  <div className="am-notif-head">
                    <span>Notifications ({notifCount} unread)</span>
                    <button className="am-mark-all" onClick={markAllRead}>Mark all read</button>
                  </div>
                  <div className="am-notif-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8", fontSize: ".8rem" }}>
                        All caught up! 🎉
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="am-notif-item am-notif-new">
                          <div className="am-notif-dot" />
                          <div>
                            <p>{n.message}</p>
                            <time>{n.created_at}</time>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ padding: ".5rem 1rem", borderTop: "1px solid #f1f5f9" }}>
                    <a
                      href="/admin/notifications"
                      onClick={(e) => { e.preventDefault(); navigate("/admin/notifications"); setShowNotif(false); }}
                      style={{ fontSize: ".75rem", color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}
                    >
                      View all notifications →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="am-user-pill">
              <div className="am-user-avatar">
                {userData?.full_name?.charAt(0) || "A"}
              </div>
              <span className="am-user-name">{userData?.full_name || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="am-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}