import React, { useState } from 'react';
import { Bell, Search, ChevronDown, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface HeaderProps {
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const notifications = [
    { id: 1, type: 'offer', text: 'Sonatrach submitted 3 new internship offers awaiting validation', time: '5 min ago', read: false },
    { id: 2, type: 'convention', text: 'Convention #A-2026-081 signed by student — pending university stamp', time: '42 min ago', read: false },
    { id: 3, type: 'company', text: 'New company registration: Cevital Group — requires approval', time: '2h ago', read: false },
    { id: 4, type: 'offer', text: '2 offers from Ooredoo Algeria flagged for missing details', time: 'Yesterday', read: true },
    { id: 5, type: 'student', text: 'Benali Ahmed submitted application — UFMC1 / L3 Informatique', time: '2 days ago', read: true },
];

const typeMeta: Record<string, { label: string; cls: string }> = {
    offer: { label: 'Offer', cls: 'tag-offer' },
    convention: { label: 'Convention', cls: 'tag-conv' },
    company: { label: 'Company', cls: 'tag-company' },
    student: { label: 'Student', cls: 'tag-student' },
};

const HeaderADM: React.FC<HeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifList, setNotifList] = useState(notifications);

    const unread = notifList.filter(n => !n.read).length;
    const markAll = () => setNotifList(prev => prev.map(n => ({ ...n, read: true })));
    const markOne = (id: number) =>
        setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    return (
        <>
            <header className="adm-header">
                <div className="adm-header-left">
                    <button className="adm-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                    <div className="adm-brand">
                        <div className="adm-brand-mark">
                            <span>S</span>
                        </div>
                        <div className="adm-brand-text">
                            <span className="adm-brand-name">Stag.io</span>
                            <span className="adm-brand-sub">Administration</span>
                        </div>
                    </div>
                </div>

                <div className="adm-search">
                    <Search size={14} />
                    <input type="text" placeholder="Search students, companies, offers…" />
                </div>

                <div className="adm-header-right">
                    <button
                        className={`adm-notif-btn ${notifOpen ? 'active' : ''}`}
                        onClick={() => setNotifOpen(o => !o)}
                        aria-label="Notifications"
                    >
                        <Bell size={17} />
                        {unread > 0 && <span className="adm-notif-badge">{unread}</span>}
                    </button>

                    <div className="adm-user-chip">
                        <div className="adm-avatar">AD</div>
                        <div className="adm-user-info">
                            <span className="adm-user-name">Admin UFMC1</span>
                            <span className="adm-user-role">University · Sétif</span>
                        </div>
                        <ChevronDown size={13} />
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {notifOpen && (
                    <motion.div
                        className="adm-notif-panel"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="adm-notif-head">
                            <span>Notifications</span>
                            <button onClick={markAll}>Mark all read</button>
                        </div>
                        <div className="adm-notif-list">
                            {notifList.map(n => (
                                <div
                                    key={n.id}
                                    className={`adm-notif-item ${n.read ? '' : 'unread'}`}
                                    onClick={() => markOne(n.id)}
                                >
                                    <span className={`adm-tag ${typeMeta[n.type].cls}`}>
                                        {typeMeta[n.type].label}
                                    </span>
                                    <p>{n.text}</p>
                                    <span className="adm-notif-time">{n.time}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HeaderADM;