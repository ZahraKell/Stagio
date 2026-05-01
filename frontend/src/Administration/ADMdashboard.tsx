// src/pages/AdminDashboard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import {
    Briefcase, FileText, CheckSquare, Building2,
    Users, Clock, TrendingUp, AlertCircle,
    ArrowRight, Eye, Download, CheckCircle,
    XCircle, GraduationCap, MapPin, Activity,
    CalendarDays,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════ */

const stats = [
    { label: 'Pending Offers', value: '14', delta: '+3 today', up: true, icon: Briefcase, color: 'stat-amber' },
    { label: 'Active Applications', value: '87', delta: '+12 this week', up: true, icon: FileText, color: 'stat-blue' },
    { label: 'Conventions Pending', value: '3', delta: '1 urgent', up: false, icon: CheckSquare, color: 'stat-red' },
    { label: 'Partner Companies', value: '42', delta: '+2 awaiting', up: true, icon: Building2, color: 'stat-teal' },
    { label: 'Total Students', value: '1,204', delta: 'Active this semester', up: true, icon: Users, color: 'stat-purple' },
    { label: 'Avg. Response Time', value: '1.4d', delta: '-0.3d vs last week', up: true, icon: Clock, color: 'stat-green' },
];

const pendingOffers = [
    { id: 'OF-2026-091', company: 'Sonatrach', wilaya: 'Hassi Messaoud', role: 'Software Engineering Intern', domain: 'Informatique', submitted: '28 Avr 2026', urgent: true },
    { id: 'OF-2026-090', company: 'Cevital Group', wilaya: 'Béjaïa', role: 'Industrial Automation Intern', domain: 'Électronique', submitted: '27 Avr 2026', urgent: false },
    { id: 'OF-2026-089', company: 'Ooredoo Algeria', wilaya: 'Alger', role: 'Network Engineering Intern', domain: 'Télécom', submitted: '27 Avr 2026', urgent: false },
    { id: 'OF-2026-088', company: 'Mobilis', wilaya: 'Constantine', role: 'Mobile Dev Intern', domain: 'Informatique', submitted: '26 Avr 2026', urgent: false },
];

const recentApplications = [
    { id: 'APP-2026-041', student: 'Mounir Samir', level: 'L3 Info', company: 'Mobilis', role: 'Mobile Dev Intern', status: 'pending', date: '20 Avr 2026' },
    { id: 'APP-2026-040', student: 'Rahmani Yasmine', level: 'M2 Sécu', company: 'Algérie Télécom', role: 'Cybersecurity Intern', status: 'accepted', date: '15 Avr 2026' },
    { id: 'APP-2026-039', student: 'Hadj Ali Rania', level: 'M1 Info', company: 'Ooredoo Algeria', role: 'Software Engineering Intern', status: 'under_review', date: '27 Avr 2026' },
    { id: 'APP-2026-038', student: 'Tebbal Omar', level: 'L3 Élec', company: 'Cevital Group', role: 'Industrial Automation Intern', status: 'pending', date: '23 Avr 2026' },
];

const recentConventions = [
    { id: 'CV-2026-081', student: 'Benali Ahmed', company: 'Condor Electronics', status: 'stamped', date: '28 Avr 2026' },
    { id: 'CV-2026-080', student: 'Kerboua Lyna', company: 'Sonatrach', status: 'complete', date: '26 Avr 2026' },
    { id: 'CV-2026-079', student: 'Mounir Samir', company: 'Mobilis', status: 'signed_student', date: '25 Avr 2026' },
];

const pendingCompanies = [
    { name: 'Cevital Group', initial: 'C', sector: 'Agroalimentaire', wilaya: 'Béjaïa', registered: '28 Avr' },
    { name: 'Transbois Algérie', initial: 'T', sector: 'Logistique', wilaya: 'Sétif', registered: '27 Avr' },
];

const activityFeed = [
    { icon: CheckCircle, color: 'act-green', text: 'Offer OF-2026-087 approved', sub: 'Condor Electronics · Embedded Systems', time: '10 min ago' },
    { icon: Users, color: 'act-purple', text: 'New student registered', sub: 'Ouali Karim · L2 Télécom · Oran', time: '34 min ago' },
    { icon: FileText, color: 'act-blue', text: 'Application APP-2026-040 accepted', sub: 'Rahmani Yasmine → Algérie Télécom', time: '1h ago' },
    { icon: Building2, color: 'act-teal', text: 'Cevital Group registration submitted', sub: 'Awaiting admin approval', time: '2h ago' },
    { icon: XCircle, color: 'act-red', text: 'Offer OF-2026-085 rejected', sub: 'Missing supervisor & resources info', time: '3h ago' },
    { icon: CheckSquare, color: 'act-amber', text: 'Convention CV-2026-081 stamped', sub: 'Benali Ahmed · Condor Electronics', time: 'Yesterday' },
];

/* ── helpers ── */
const appStatusCfg: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'as-pending', label: 'Pending' },
    under_review: { cls: 'as-review', label: 'Under Review' },
    accepted: { cls: 'as-accepted', label: 'Accepted' },
    rejected: { cls: 'as-rejected', label: 'Rejected' },
};

const convStatusCfg: Record<string, { cls: string; label: string }> = {
    generated: { cls: 'cs-generated', label: 'Generated' },
    sent_student: { cls: 'cs-sent', label: 'Sent' },
    signed_student: { cls: 'cs-signed-s', label: 'Stud. Signed' },
    signed_company: { cls: 'cs-signed-c', label: 'Co. Signed' },
    stamped: { cls: 'cs-stamped', label: 'Stamped' },
    complete: { cls: 'cs-complete', label: 'Complete' },
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */

const AdminDashboard: React.FC = () => {
    const [offerStates, setOfferStates] = useState<Record<string, 'approved' | 'rejected' | null>>({});

    const handleOffer = (id: string, action: 'approved' | 'rejected') => {
        setOfferStates(prev => ({ ...prev, [id]: action }));
    };

    return (
        <DashboardLayout
            pageTitle="Dashboard"
        >
            {/* ── STAT GRID ── */}
            <section className="adm-stat-grid">
                {stats.map(s => (
                    <div key={s.label} className={`adm-stat-card ${s.color}`}>
                        <div className="adm-stat-icon"><s.icon size={18} /></div>
                        <div className="adm-stat-body">
                            <span className="adm-stat-label">{s.label}</span>
                            <span className="adm-stat-value">{s.value}</span>
                            <span className={`adm-stat-delta ${s.up ? 'up' : 'down'}`}>
                                <TrendingUp size={11} /> {s.delta}
                            </span>
                        </div>
                    </div>
                ))}
            </section>

            {/* ══ ROW 1: Pending Offers (wide) + Right column ══ */}
            <div className="adm-row">

                {/* ── PENDING OFFERS TABLE ── */}
                <section className="adm-card">
                    <div className="adm-card-head">
                        <div>
                            <h2>Pending Offer Validation</h2>
                            <p>{pendingOffers.length} offers awaiting your review</p>
                        </div>
                        <Link to="/admin/offers" className="adm-btn-link">
                            View all <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>Domain</th>
                                    <th>Wilaya</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingOffers.map(o => {
                                    const decided = offerStates[o.id];
                                    return (
                                        <tr key={o.id}>
                                            <td>
                                                <span className="adm-id-tag">
                                                    {o.urgent && <AlertCircle size={11} className="urgent-icon" />}
                                                    {o.id}
                                                </span>
                                            </td>
                                            <td className="fw-medium">{o.company}</td>
                                            <td>{o.role}</td>
                                            <td><span className="badge-domain">{o.domain}</span></td>
                                            <td>{o.wilaya}</td>
                                            <td className="text-muted">{o.submitted}</td>
                                            <td>
                                                {decided ? (
                                                    <span className={`adm-decided-label ${decided === 'approved' ? 'dec-approved' : 'dec-rejected'}`}>
                                                        {decided === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                                    </span>
                                                ) : (
                                                    <div className="adm-actions">
                                                        <button className="adm-action-btn approve" onClick={() => handleOffer(o.id, 'approved')}>Approve</button>
                                                        <button className="adm-action-btn reject" onClick={() => handleOffer(o.id, 'rejected')}>Reject</button>
                                                        <Link to="/admin/offers" className="adm-action-icon" title="View full page">
                                                            <Eye size={14} />
                                                        </Link>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── RIGHT COLUMN ── */}
                <div className="adm-col-right">

                    {/* CONVENTIONS */}
                    <section className="adm-card">
                        <div className="adm-card-head">
                            <div>
                                <h2>Conventions</h2>
                                <p>Recent pipeline activity</p>
                            </div>
                            <Link to="/admin/conventions" className="adm-btn-link">
                                View all <ArrowRight size={13} />
                            </Link>
                        </div>
                        <div className="adm-conv-list">
                            {recentConventions.map(c => {
                                const cfg = convStatusCfg[c.status] ?? { cls: 'cs-generated', label: c.status };
                                return (
                                    <div key={c.id} className="adm-conv-item">
                                        <div className="adm-conv-meta">
                                            <span className="adm-conv-id">{c.id}</span>
                                            <span className={`cv-status-badge ${cfg.cls}`} style={{ fontSize: 10 }}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="adm-conv-names">
                                            {c.student} <span>→</span> {c.company}
                                        </p>
                                        <div className="adm-conv-foot">
                                            <span className="text-muted">{c.date}</span>
                                            <button className="adm-action-icon" title="Download PDF">
                                                <Download size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* PENDING COMPANIES */}
                    <section className="adm-card">
                        <div className="adm-card-head">
                            <div>
                                <h2>New Companies</h2>
                                <p>Awaiting approval</p>
                            </div>
                            <Link to="/admin/companies" className="adm-btn-link">
                                View all <ArrowRight size={13} />
                            </Link>
                        </div>
                        <div className="adm-company-list">
                            {pendingCompanies.map(c => (
                                <div key={c.name} className="adm-company-item">
                                    <div className="adm-company-logo">{c.initial}</div>
                                    <div className="adm-company-info">
                                        <span className="fw-medium">{c.name}</span>
                                        <span className="text-muted">{c.sector} · {c.wilaya}</span>
                                        <span className="text-muted small">{c.registered}</span>
                                    </div>
                                    <div className="adm-actions">
                                        <button className="adm-action-btn approve sm">Approve</button>
                                        <button className="adm-action-btn reject sm">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ══ ROW 2: Recent Applications + Activity Feed ══ */}
            <div className="adm-row adm-row-mt">

                {/* ── RECENT APPLICATIONS ── */}
                <section className="adm-card">
                    <div className="adm-card-head">
                        <div>
                            <h2>Recent Applications</h2>
                            <p>Latest student submissions</p>
                        </div>
                        <Link to="/admin/applications" className="adm-btn-link">
                            View all <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentApplications.map(a => {
                                    const cfg = appStatusCfg[a.status];
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div className="adm-student-cell">
                                                    <div className="adm-student-avatar">
                                                        {a.student.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-medium">{a.student}</div>
                                                        <div className="adm-cell-sub">{a.level}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="fw-medium">{a.company}</td>
                                            <td className="text-muted">{a.role}</td>
                                            <td className="text-muted">{a.date}</td>
                                            <td>
                                                <span className={`app-status-badge ${cfg.cls}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to="/admin/applications" className="adm-action-icon" title="View application">
                                                    <Eye size={13} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── ACTIVITY FEED ── */}
                <div className="adm-col-right">
                    <section className="adm-card">
                        <div className="adm-card-head">
                            <div>
                                <h2>Activity Feed</h2>
                                <p>Recent system events</p>
                            </div>
                            <Activity size={15} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div className="adm-activity-list">
                            {activityFeed.map((item, i) => (
                                <div key={i} className="adm-activity-item">
                                    <div className={`adm-act-icon ${item.color}`}>
                                        <item.icon size={13} />
                                    </div>
                                    <div className="adm-act-body">
                                        <span className="adm-act-text">{item.text}</span>
                                        <span className="adm-act-sub">{item.sub}</span>
                                    </div>
                                    <span className="adm-act-time">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* QUICK LINKS */}
                    <section className="adm-card">
                        <div className="adm-card-head">
                            <div><h2>Quick Links</h2></div>
                        </div>
                        <div className="adm-quick-links">
                            {[
                                { to: '/admin/offers', icon: Briefcase, label: 'Validate Offers', count: '14 pending' },
                                { to: '/admin/applications', icon: FileText, label: 'Review Applications', count: '87 active' },
                                { to: '/admin/conventions', icon: CheckSquare, label: 'Manage Conventions', count: '3 in progress' },
                                { to: '/admin/students', icon: GraduationCap, label: 'Browse Students', count: '1,204 total' },
                                { to: '/admin/companies', icon: Building2, label: 'Partner Companies', count: '2 awaiting' },
                            ].map(l => (
                                <Link key={l.to} to={l.to} className="adm-quick-link">
                                    <div className="adm-ql-icon"><l.icon size={15} /></div>
                                    <div className="adm-ql-text">
                                        <span>{l.label}</span>
                                        <span className="adm-ql-count">{l.count}</span>
                                    </div>
                                    <ArrowRight size={13} className="adm-ql-arrow" />
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

        </DashboardLayout>
    );
};

export default AdminDashboard;