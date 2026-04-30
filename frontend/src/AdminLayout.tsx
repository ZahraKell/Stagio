// src/AdminLayout.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(3);
  const [showNotif, setShowNotif] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("user_data");
    if (data) setUserData(JSON.parse(data));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const menuItems = [
    { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin/offers", icon: "📋", label: "Internship Offers", count: 14 },
    { path: "/admin/applications", icon: "📝", label: "Applications", count: 7 },
    { path: "/admin/conventions", icon: "📄", label: "Conventions", count: 3 },
    { path: "/admin/students", icon: "🎓", label: "Students", count: 2 },
    { path: "/admin/companies", icon: "🏢", label: "Companies", count: 2 },
    { path: "/admin/stats", icon: "📈", label: "Statistics", count: 1 },
    { path: "/admin/settings", icon: "⚙️", label: "Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

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
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`am-nav-item ${isActive(item.path) ? "am-nav-active" : ""}`}
            >
              <span className="am-nav-icon">{item.icon}</span>
              <span className="am-nav-label">{item.label}</span>
              {item.count && (
                <span className="am-nav-count">{item.count}</span>
              )}
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
            <span className="am-current-page">
              {menuItems.find(m => m.path === location.pathname)?.label || "Dashboard"}
            </span>
          </div>

          <div className="am-topbar-right">
            {/* Notifications */}
            <div className="am-notif-wrap">
              <button
                className="am-bell-btn"
                onClick={() => setShowNotif(!showNotif)}
              >
                🔔
                {notifCount > 0 && <span className="am-badge">{notifCount}</span>}
              </button>

              {showNotif && (
                <div className="am-notif-panel">
                  <div className="am-notif-head">
                    <span>Notifications</span>
                    <button className="am-mark-all">Mark all read</button>
                  </div>
                  <div className="am-notif-list">
                    <div className="am-notif-item am-notif-new">
                      <div className="am-notif-dot" />
                      <div>
                        <p>New company registration: Condor Electronics</p>
                        <time>5 min ago</time>
                      </div>
                    </div>
                    <div className="am-notif-item am-notif-new">
                      <div className="am-notif-dot" />
                      <div>
                        <p>3 new internship applications pending review</p>
                        <time>1 hour ago</time>
                      </div>
                    </div>
                    <div className="am-notif-item">
                      <div className="am-notif-dot am-dot-read" />
                      <div>
                        <p>Convention CV-2026-078 validated</p>
                        <time>Yesterday</time>
                      </div>
                    </div>
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