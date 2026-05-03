// src/components/DashboardLayout.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Home, Briefcase, FileText, User, Lock, Settings, HelpCircle,
    LayoutDashboard, Users, Building2, CheckSquare, BarChart3, LogOut,
    Search, Bell, BookOpen, Menu, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { getUserRole, logout as authLogout } from "../auth";

interface DashboardLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    userName?: string;
    userRole?: string;
    userAvatar?: string;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    badge?: string | null;
}

interface NotificationItem {
    id: number;
    type: string;
    text: string;
    time: string;
    read: boolean;
}

// ---------- STUDENT MENU ----------
const STUDENT_MENU: MenuItem[] = [
    { id: "homepage", label: "Homepage", icon: Home, path: "/", badge: null },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/student", badge: null },
    { id: "offers", label: "Internship Offers", icon: Briefcase, path: "/offers", badge: null },
    { id: "applications", label: "My Applications", icon: FileText, path: "/student/applications", badge: null },
    { id: "cv", label: "My CV", icon: FileText, path: "/student/cv", badge: null },
    { id: "courses", label: "Courses", icon: BookOpen, path: "/student/courses", badge: null },
    { id: "profile", label: "Profile", icon: User, path: "/student/profile", badge: null },
    { id: "settings", label: "Settings", icon: Settings, path: "/student/settings", badge: null },
    { id: "privacy", label: "Privacy", icon: Lock, path: "/privacy", badge: null },
    { id: "help", label: "Help Center", icon: HelpCircle, path: "/student/help", badge: null },
];

// ---------- UNIVERSITY ADMINISTRATION MENU (routes: /administration/*) ----------
const ADMIN_MENU: MenuItem[] = [
    { id: "homepage", label: "Homepage", icon: Home, path: "/", badge: null },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/administration", badge: null },
    { id: "profile", label: "Profile", icon: User, path: "/administration/profile", badge: null },
    { id: "offers", label: "Internship Offers", icon: Briefcase, path: "/administration/offers", badge: null },
    { id: "applications", label: "Applications", icon: FileText, path: "/administration/applications", badge: null },
    { id: "conventions", label: "Conventions", icon: CheckSquare, path: "/administration/conventions", badge: null },
    { id: "students", label: "Students", icon: Users, path: "/administration/students", badge: null },
    { id: "companies", label: "Companies", icon: Building2, path: "/administration/companies", badge: null },
    { id: "settings", label: "Settings", icon: Settings, path: "/administration/settings", badge: null },
    { id: "help", label: "Help Center", icon: HelpCircle, path: "/administration/help", badge: null },
];

const TYPE_COLORS: Record<string, string> = {
    offer: "notif-type-offer",
    application: "notif-type-app",
    convention: "notif-type-conv",
    company: "notif-type-offer",
    conv: "notif-type-conv",
    student: "notif-type-app",
};
const TYPE_LABELS: Record<string, string> = {
    offer: "New Offer",
    application: "Application",
    convention: "Convention",
    company: "Company",
    conv: "Convention",
    student: "Application",
};

// ---------- Layout mode: student portal vs university administration ----------
const getRoleFromPath = (pathname: string): "student" | "admin" => {
    if (pathname.startsWith("/administration")) return "admin";
    return "student";
};

function getStoredUserDisplay(portal: "student" | "admin"): { name: string; roleText: string; avatar: string } {
    const role = getUserRole() ?? "";
    try {
        const raw = localStorage.getItem("user_data");
        const u = raw ? (JSON.parse(raw) as { full_name?: string }) : {};
        const name = u.full_name || localStorage.getItem("full_name") || "User";
        const avatar = name
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
        const roleText = portal === "admin" ? "Administration" : role || "Student";
        return { name, roleText, avatar: avatar || "?" };
    } catch {
        return { name: "User", roleText: portal === "admin" ? "Administration" : "Student", avatar: "?" };
    }
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    pageTitle,
    userName: propUserName,
    userRole: propUserRole,
    userAvatar: propUserAvatar,
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profilePopupOpen, setProfilePopupOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const role = getRoleFromPath(location.pathname);

    const menu = role === "student" ? STUDENT_MENU : ADMIN_MENU;
    const [notifList, setNotifList] = useState<NotificationItem[]>([]);
    const unreadCount = notifList.filter((n) => !n.read).length;

    const staticDefaults = getStoredUserDisplay(role);
    const userName = propUserName ?? staticDefaults.name;
    const userRole = propUserRole ?? staticDefaults.roleText;
    const userAvatar = propUserAvatar ?? staticDefaults.avatar;

    const brandSubtitle = role === "student" ? "Student Portal" : "Administration Portal";
    const searchPlaceholder =
        role === "student" ? "Search offers, companies, wilayas…" : "Search offers, companies, students…";

    const privacyPath = role === "student" ? "/privacy" : "/administration/settings";
    const helpPath = role === "student" ? "/student/help" : "/administration/help";
    const settingsPath = role === "student" ? "/student/settings" : "/administration/settings";
    const profilePath = role === "student" ? "/student/profile" : "/administration/profile";

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get("notifications/");
                const body = res.data as {
                    data?: { notifications?: { id: number; message: string; is_read: boolean; created_at: string }[] };
                };
                const raw = body.data?.notifications ?? [];
                if (cancelled) return;
                setNotifList(
                    raw.map((n) => ({
                        id: n.id,
                        type: "application",
                        text: n.message,
                        time: n.created_at,
                        read: n.is_read,
                    }))
                );
            } catch {
                if (!cancelled) setNotifList([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [location.pathname]);

    const handleLogout = async () => {
        await authLogout();
        localStorage.removeItem("user_data");
        localStorage.removeItem("full_name");
        localStorage.removeItem("company_name");
        navigate("/login");
    };

    const markAllRead = () => {
        setNotifList(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="sc-layout" data-role={role}>
            {/* HEADER */}
            <header className="sc-header">
                <div className="sc-header-left">
                    <button className="sc-menu-toggle" onClick={() => setSidebarOpen(s => !s)}>
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="sc-brand">
                        <span className="sc-brand-icon">S</span>
                        <span className="sc-brand-name">StageConnect</span>
                    </div>
                </div>

                <div className="sc-search-bar">
                    <Search size={15} />
                    <input type="text" placeholder={searchPlaceholder} />
                </div>

                <div className="sc-header-right">
                    <button className="sc-notif-btn" onClick={() => setNotifOpen(o => !o)}>
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="sc-notif-badge">{unreadCount}</span>}
                    </button>

                    {/* Profile popup */}
                    <div className="sc-profile-popup-container">
                        <div className="sc-avatar clickable" onClick={() => setProfilePopupOpen(!profilePopupOpen)}>
                            {userAvatar}
                        </div>
                        <AnimatePresence>
                            {profilePopupOpen && (
                                <motion.div
                                    className="sc-profile-popup"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="sc-popup-user">
                                        <div className="sc-popup-avatar">{userAvatar}</div>
                                        <div>
                                            <div className="sc-popup-name">{userName}</div>
                                            <div className="sc-popup-role">{userRole}</div>
                                        </div>
                                    </div>
                                    <div className="sc-popup-divider" />
                                    <Link to={profilePath} className="sc-popup-link" onClick={() => setProfilePopupOpen(false)}>
                                        <User size={14} /> View full profile
                                    </Link>
                                    <button className="sc-popup-logout" onClick={handleLogout}>
                                        <LogOut size={14} /> Logout
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* NOTIFICATION PANEL */}
            <AnimatePresence>
                {notifOpen && (
                    <motion.div
                        className="sc-notif-panel"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="sc-notif-header">
                            <h3>Notifications</h3>
                            <button className="sc-mark-all" onClick={markAllRead}>Mark all read</button>
                        </div>
                        <div className="sc-notif-list">
                            {notifList.map(n => (
                                <div
                                    key={n.id}
                                    className={`sc-notif-item ${n.read ? "" : "unread"}`}
                                    onClick={() =>
                                        setNotifList(prev =>
                                            prev.map(x => (x.id === n.id ? { ...x, read: true } : x))
                                        )
                                    }
                                >
                                    <span className={`sc-notif-type ${TYPE_COLORS[n.type] ?? ""}`}>
                                        {TYPE_LABELS[n.type] ?? n.type}
                                    </span>
                                    <p>{n.text}</p>
                                    <span className="sc-notif-time">{n.time}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="sc-scroll-area">
                <div className="sc-content-wrapper">
                    {/* SIDEBAR */}
                    <aside className={`sc-sidebar ${sidebarOpen ? "open" : "closed"}`} data-role={role} >

                        <div className="sc-sidebar-logo">
                            <h2>StageConnect</h2>
                            <p>{brandSubtitle}</p>
                        </div>
                        <nav className="sc-sidebar-menu">
                            {menu.map(item => {
                                const active = location.pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.id}
                                        to={item.path}
                                        className={`sc-menu-item ${active ? "active" : ""}`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                        {item.badge && <span className="sc-nav-badge">{item.badge}</span>}
                                    </Link>
                                );
                            })}
                            <button type="button" onClick={() => void handleLogout()} className="sc-menu-item" style={{ marginTop: "auto" }}>
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </nav>
                        <div className="sc-sidebar-footer">
                            <div className="sc-avatar">{userAvatar}</div>
                            <div className="sc-user-info">
                                <span className="sc-user-name">{userName}</span>
                                <span className="sc-user-role">{userRole}</span>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="sc-main">
                        {pageTitle && <h1 className="sc-page-title">{pageTitle}</h1>}
                        <div style={{ position: "relative", overflow: "hidden", isolation: "isolate" }}>
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    pointerEvents: "none",
                                    zIndex: 1,
                                    background: "linear-gradient(to bottom, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.07) 100%)",
                                }}
                            />
                            <motion.div
                                style={{ position: "relative", zIndex: 2 }}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -18 }}
                                transition={{ duration: 0.28 }}
                            >
                                {children}
                            </motion.div>
                        </div>
                    </main>
                </div>

                {/* FOOTER */}
                <footer className="sc-footer">
                    <span>© 2026 StageConnect · UFMC1</span>
                    <div className="sc-footer-links">
                        <Link to={privacyPath}>Privacy</Link>
                        <Link to={helpPath}>Help Center</Link>
                        <Link to={settingsPath}>Settings</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DashboardLayout;