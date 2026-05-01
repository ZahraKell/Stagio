import React, { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';  // adjust path as needed

import {
    Bell, Lock, Eye, EyeOff, Globe, Moon, Sun,
    Smartphone, Shield, Trash2, LogOut, ChevronRight,
    Check, User, Palette, Database, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TOGGLE COMPONENT ───────────────────────────────────────── */
const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <label className="sc-switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="sc-switch-slider" />
    </label>
);

/* ─── SECTION NAV ITEMS ──────────────────────────────────────── */
const navItems = [
    { id: 'account', icon: <User size={16} />, label: 'Account' },
    { id: 'appearance', icon: <Palette size={16} />, label: 'Appearance' },
    { id: 'notifications', icon: <Bell size={16} />, label: 'Notifications' },
    { id: 'privacy', icon: <Eye size={16} />, label: 'Privacy' },
    { id: 'security', icon: <Shield size={16} />, label: 'Security' },
    { id: 'data', icon: <Database size={16} />, label: 'Data & Storage' },
    { id: 'danger', icon: <AlertTriangle size={16} />, label: 'Danger Zone' },
];

const SettingsPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState('account');

    /* Account */
    const [lang, setLang] = useState('fr');
    const [timezone, setTZ] = useState('Africa/Algiers');

    /* Appearance */
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
    const [compact, setCompact] = useState(false);
    const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

    /* Notifications */
    const [notifs, setNotifs] = useState({
        newOffer: true,
        appUpdate: true,
        convention: true,
        newsletter: false,
        emailDigest: true,
        pushMobile: false,
    });
    const toggleNotif = (k: keyof typeof notifs) =>
        setNotifs(p => ({ ...p, [k]: !p[k] }));

    /* Privacy */
    const [privacy, setPrivacy] = useState({
        profileVisible: true,
        cvPublic: false,
        showEmail: false,
        allowIndexing: false,
        shareStats: true,
    });
    const togglePrivacy = (k: keyof typeof privacy) =>
        setPrivacy(p => ({ ...p, [k]: !p[k] }));

    /* Security */
    const [showPass, setShowPass] = useState(false);
    const [twoFA, setTwoFA] = useState(false);
    const [sessions] = useState([
        { id: 1, device: 'Chrome · Windows 11', location: 'Constantine, DZ', current: true, time: 'Active now' },
        { id: 2, device: 'Firefox · Android 14', location: 'Sétif, DZ', current: false, time: '2 hours ago' },
        { id: 3, device: 'Safari · iPhone 15', location: 'Alger, DZ', current: false, time: '3 days ago' },
    ]);

    const [saved, setSaved] = useState(false);
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    /* ── SECTION RENDERERS ── */
    const renderAccount = () => (
        <div className="stg-section-body">
            <h2 className="stg-section-title">Account Settings</h2>
            <p className="stg-section-desc">Manage your language, region and account preferences.</p>

            <div className="stg-group">
                <label className="stg-label">Display Language</label>
                <div className="stg-select-wrap">
                    <Globe size={14} />
                    <select value={lang} onChange={e => setLang(e.target.value)}>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div className="stg-group">
                <label className="stg-label">Timezone</label>
                <div className="stg-select-wrap">
                    <Globe size={14} />
                    <select value={timezone} onChange={e => setTZ(e.target.value)}>
                        <option value="Africa/Algiers">Africa/Algiers (UTC+1)</option>
                        <option value="Europe/Paris">Europe/Paris (UTC+2)</option>
                        <option value="UTC">UTC</option>
                    </select>
                </div>
            </div>

            <div className="stg-save-row">
                <button className="sc-btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
        </div>
    );

    const renderAppearance = () => (
        <div className="stg-section-body">
            <h2 className="stg-section-title">Appearance</h2>
            <p className="stg-section-desc">Personalise how StageConnect looks for you.</p>

            <div className="stg-group">
                <label className="stg-label">Theme</label>
                <div className="stg-theme-picker">
                    {[
                        { key: 'light', icon: <Sun size={18} />, label: 'Light' },
                        { key: 'dark', icon: <Moon size={18} />, label: 'Dark' },
                        { key: 'auto', icon: <Smartphone size={18} />, label: 'System' },
                    ].map(t => (
                        <button
                            key={t.key}
                            className={`stg-theme-card ${theme === t.key ? 'active' : ''}`}
                            onClick={() => setTheme(t.key as typeof theme)}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                            {theme === t.key && <Check size={12} className="stg-theme-check" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="stg-group">
                <label className="stg-label">Font Size</label>
                <div className="stg-font-picker">
                    {(['sm', 'md', 'lg'] as const).map(s => (
                        <button
                            key={s}
                            className={`stg-font-btn ${fontSize === s ? 'active' : ''}`}
                            onClick={() => setFontSize(s)}
                        >
                            {s === 'sm' ? 'Small' : s === 'md' ? 'Medium' : 'Large'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sc-toggle-row">
                <div>
                    <div className="sc-toggle-label">Compact Mode</div>
                    <div className="sc-toggle-desc">Reduce padding and card sizes for more content density</div>
                </div>
                <Toggle checked={compact} onChange={() => setCompact(p => !p)} />
            </div>

            <div className="stg-save-row">
                <button className="sc-btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="stg-section-body">
            <h2 className="stg-section-title">Notifications</h2>
            <p className="stg-section-desc">Choose what you want to be notified about.</p>

            <div className="stg-notif-group">
                <div className="stg-notif-group-label">In-App Notifications</div>
                {[
                    { key: 'newOffer', label: 'New internship offers', desc: 'Get notified when a matching offer is posted' },
                    { key: 'appUpdate', label: 'Application status updates', desc: 'When your application is reviewed or accepted' },
                    { key: 'convention', label: 'Convention ready', desc: 'When your internship convention is generated' },
                ].map(n => (
                    <div className="sc-toggle-row" key={n.key}>
                        <div>
                            <div className="sc-toggle-label">{n.label}</div>
                            <div className="sc-toggle-desc">{n.desc}</div>
                        </div>
                        <Toggle checked={notifs[n.key as keyof typeof notifs]} onChange={() => toggleNotif(n.key as keyof typeof notifs)} />
                    </div>
                ))}
            </div>

            <div className="stg-notif-group">
                <div className="stg-notif-group-label">Email Notifications</div>
                {[
                    { key: 'emailDigest', label: 'Weekly digest', desc: 'A summary of new offers and your activity every Monday' },
                    { key: 'newsletter', label: 'Newsletter', desc: 'Tips, guides, and StageConnect news' },
                ].map(n => (
                    <div className="sc-toggle-row" key={n.key}>
                        <div>
                            <div className="sc-toggle-label">{n.label}</div>
                            <div className="sc-toggle-desc">{n.desc}</div>
                        </div>
                        <Toggle checked={notifs[n.key as keyof typeof notifs]} onChange={() => toggleNotif(n.key as keyof typeof notifs)} />
                    </div>
                ))}
            </div>

            <div className="stg-notif-group">
                <div className="stg-notif-group-label">Push Notifications</div>
                <div className="sc-toggle-row">
                    <div>
                        <div className="sc-toggle-label">Mobile push notifications</div>
                        <div className="sc-toggle-desc">Requires the StageConnect mobile app</div>
                    </div>
                    <Toggle checked={notifs.pushMobile} onChange={() => toggleNotif('pushMobile')} />
                </div>
            </div>

            <div className="stg-save-row">
                <button className="sc-btn-primary" onClick={handleSave}>Save Preferences</button>
            </div>
        </div>
    );

    const renderPrivacy = () => (
        <div className="stg-section-body">
            <h2 className="stg-section-title">Privacy</h2>
            <p className="stg-section-desc">Control what others can see and how your data is used.</p>

            <div className="stg-privacy-banner">
                <Shield size={20} />
                <div>
                    <strong>Your data stays in Algeria</strong>
                    <p>StageConnect stores all data on servers located in Algeria in compliance with Algerian data protection law.</p>
                </div>
            </div>

            {[
                { key: 'profileVisible', label: 'Public profile', desc: 'Allow companies to find your profile in searches' },
                { key: 'cvPublic', label: 'Public CV', desc: 'Make your Euro CV visible to verified companies' },
                { key: 'showEmail', label: 'Show email to companies', desc: 'Display your email on your public profile' },
                { key: 'allowIndexing', label: 'Search engine indexing', desc: 'Allow search engines to index your public profile' },
                { key: 'shareStats', label: 'Anonymous usage data', desc: 'Help us improve StageConnect with anonymised analytics' },
            ].map(p => (
                <div className="sc-toggle-row" key={p.key}>
                    <div>
                        <div className="sc-toggle-label">{p.label}</div>
                        <div className="sc-toggle-desc">{p.desc}</div>
                    </div>
                    <Toggle checked={privacy[p.key as keyof typeof privacy]} onChange={() => togglePrivacy(p.key as keyof typeof privacy)} />
                </div>
            ))}

            <div className="stg-save-row">
                <button className="sc-btn-primary" onClick={handleSave}>Save Privacy Settings</button>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="stg-section-body">
            <h2 className="stg-section-title">Security</h2>
            <p className="stg-section-desc">Manage your password, two-factor auth, and active sessions.</p>

            {/* Change Password */}
            <div className="stg-card">
                <div className="stg-card-title"><Lock size={15} /> Change Password</div>
                <div className="stg-pass-fields">
                    <div className="stg-group">
                        <label className="stg-label">Current password</label>
                        <div className="stg-input-wrap">
                            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" />
                            <button onClick={() => setShowPass(p => !p)} type="button">
                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className="stg-group">
                        <label className="stg-label">New password</label>
                        <div className="stg-input-wrap">
                            <input type="password" placeholder="Min. 8 characters" />
                        </div>
                    </div>
                    <div className="stg-group">
                        <label className="stg-label">Confirm new password</label>
                        <div className="stg-input-wrap">
                            <input type="password" placeholder="Repeat new password" />
                        </div>
                    </div>
                    <button className="sc-btn-primary stg-inline-btn" onClick={handleSave}>
                        Update Password
                    </button>
                </div>
            </div>

            {/* 2FA */}
            <div className="stg-card">
                <div className="stg-card-title"><Smartphone size={15} /> Two-Factor Authentication</div>
                <div className="sc-toggle-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <div>
                        <div className="sc-toggle-label">Enable 2FA</div>
                        <div className="sc-toggle-desc">Secure your account with an authenticator app (Google Authenticator, Authy…)</div>
                    </div>
                    <Toggle checked={twoFA} onChange={() => setTwoFA(p => !p)} />
                </div>
                {twoFA && (
                    <motion.div
                        className="stg-2fa-note"
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    >
                        Scan the QR code in your authenticator app to complete setup. (Backend integration required.)
                    </motion.div>
                )}
            </div>

            {/* Active Sessions */}
            <div className="stg-card">
                <div className="stg-card-title"><Shield size={15} /> Active Sessions</div>
                {sessions.map(s => (
                    <div key={s.id} className="stg-session-row">
                        <div className="stg-session-info">
                            <span className="stg-session-device">{s.device}</span>
                            <span className="stg-session-meta">{s.location} · {s.time}</span>
                        </div>
                        {s.current
                            ? <span className="stg-session-current">Current</span>
                            : <button className="stg-session-revoke">Revoke</button>
                        }
                    </div>
                ))}
            </div>
        </div>
    );

    const renderData = () => (
        <div className="stg-section-body">
            <h2 className="stg-section-title">Data & Storage</h2>
            <p className="stg-section-desc">Download, manage, or delete your personal data.</p>

            <div className="stg-data-cards">
                {[
                    { icon: <Database size={22} />, label: 'Export My Data', desc: 'Download a full archive of your profile, CV, and applications as JSON / PDF.', btn: 'Request Export', color: 'var(--sc-blue)' },
                    { icon: <Lock size={22} />, label: 'Data Retention', desc: 'Your data is retained for 3 years after account creation or last login.', btn: null, color: 'var(--sc-green)' },
                ].map(d => (
                    <div className="stg-data-card" key={d.label}>
                        <div className="stg-data-icon" style={{ background: `${d.color}18`, color: d.color }}>{d.icon}</div>
                        <div className="stg-data-info">
                            <strong>{d.label}</strong>
                            <p>{d.desc}</p>
                        </div>
                        {d.btn && <button className="sc-btn-outline stg-inline-btn">{d.btn}</button>}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderDanger = () => (
        <div className="stg-section-body">
            <h2 className="stg-section-title stg-danger-title">Danger Zone</h2>
            <p className="stg-section-desc">These actions are irreversible. Please proceed carefully.</p>

            <div className="stg-danger-card">
                <div className="stg-danger-row">
                    <div>
                        <strong>Log out of all devices</strong>
                        <p>Terminate all active sessions except this one.</p>
                    </div>
                    <button className="stg-danger-btn outline">
                        <LogOut size={14} /> Log out everywhere
                    </button>
                </div>
                <div className="stg-danger-row">
                    <div>
                        <strong>Delete my account</strong>
                        <p>Permanently delete your account and all associated data. This cannot be undone.</p>
                    </div>
                    <button className="stg-danger-btn red">
                        <Trash2 size={14} /> Delete Account
                    </button>
                </div>
            </div>
        </div>
    );

    // ✅ Fixed type – let TypeScript infer, or use proper return type
    const sectionMap = {
        account: renderAccount,
        appearance: renderAppearance,
        notifications: renderNotifications,
        privacy: renderPrivacy,
        security: renderSecurity,
        data: renderData,
        danger: renderDanger,
    };

    return (
        <DashboardLayout pageTitle="Settings">
            <div className="page-hero stg-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>Settings & Privacy</h1>
                    <p>Manage your account, appearance, notifications and privacy in one place</p>
                </div>
            </div>

            <div className="stg-layout">
                <nav className="stg-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`stg-nav-item ${activeSection === item.id ? 'active' : ''} ${item.id === 'danger' ? 'danger' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            <ChevronRight size={14} className="stg-nav-arrow" />
                        </button>
                    ))}
                </nav>

                <div className="stg-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {sectionMap[activeSection as keyof typeof sectionMap]?.()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {saved && (
                    <motion.div
                        className="stg-toast"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <Check size={16} /> Settings saved successfully
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default SettingsPage;