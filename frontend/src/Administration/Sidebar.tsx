import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Users,
    Building2,
    CheckSquare,
    ClipboardList,
    Settings,
    HelpCircle,
    LogOut,
} from 'lucide-react';

interface SidebarProps {
    open: boolean;
}

const navGroups = [
    {
        label: 'Overview',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/administration', badge: null },
        ],
    },
    {
        label: 'Management',
        items: [
            { id: 'offers', label: 'Internship Offers', icon: Briefcase, path: '/administration/offers', badge: null },
            { id: 'applications', label: 'Applications', icon: FileText, path: '/administration/applications', badge: null },
            { id: 'conventions', label: 'Conventions', icon: CheckSquare, path: '/administration/conventions', badge: null },
            { id: 'reports', label: 'Rapports & Attestations', icon: ClipboardList, path: '/administration/reports', badge: null },
            { id: 'students', label: 'Students', icon: Users, path: '/administration/students', badge: null },
            { id: 'companies', label: 'Companies', icon: Building2, path: '/administration/companies', badge: null },
        ],
    },
    {
        label: 'System',
        items: [
            { id: 'settings', label: 'Settings', icon: Settings, path: '/administration/settings', badge: null },
            { id: 'help', label: 'Help Center', icon: HelpCircle, path: '/administration/help', badge: null },
        ],
    },
];

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
    const location = useLocation();

    return (
        <aside className={`adm-sidebar ${open ? 'open' : 'closed'}`}>
            <nav className="adm-nav">
                {navGroups.map(group => (
                    <div key={group.label} className="adm-nav-group">
                        {open && <span className="adm-nav-label">{group.label}</span>}
                        {group.items.map(item => {
                            const active = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`adm-nav-item ${active ? 'active' : ''}`}
                                    title={!open ? item.label : undefined}
                                >
                                    <item.icon size={17} />
                                    {open && <span>{item.label}</span>}
                                    {open && item.badge && (
                                        <span className="adm-nav-badge">{item.badge}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="adm-sidebar-footer">
                {open && (
                    <div className="adm-sidebar-user">
                        <div className="adm-avatar sm">AD</div>
                        <div className="adm-user-info">
                            <span className="adm-user-name">Admin UFMC1</span>
                            <span className="adm-user-role">Université Constantine 1</span>
                        </div>
                    </div>
                )}
                <button className="adm-logout" title="Logout">
                    <LogOut size={16} />
                    {open && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;