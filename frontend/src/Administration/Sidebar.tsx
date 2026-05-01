import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Users,
    Building2,
    CheckSquare,
    BarChart3,
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
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin', badge: null },
        ],
    },
    {
        label: 'Management',
        items: [
            { id: 'offers', label: 'Internship Offers', icon: Briefcase, path: '/admin/offers', badge: '14' },
            { id: 'applications', label: 'Applications', icon: FileText, path: '/admin/applications', badge: '7' },
            { id: 'conventions', label: 'Conventions', icon: CheckSquare, path: '/admin/conventions', badge: '3' },
            { id: 'students', label: 'Students', icon: Users, path: '/admin/students', badge: null },
            { id: 'companies', label: 'Companies', icon: Building2, path: '/admin/companies', badge: '2' },
        ],
    },
    {
        label: 'Reports',
        items: [
            { id: 'stats', label: 'Statistics', icon: BarChart3, path: '/admin/stats', badge: null },
        ],
    },
    {
        label: 'System',
        items: [
            { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings', badge: null },
            { id: 'help', label: 'Help Center', icon: HelpCircle, path: '/admin/help', badge: null },
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