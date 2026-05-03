import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import DashboardLayout from '../components/DashboardLayout';
import {
    FileText, Download, Eye, Clock, CheckCircle2,
    XCircle, AlertCircle, Building2, MapPin,
    Calendar, ChevronRight, X, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TYPES ──────────────────────────────────────────────────── */
type AppStatus = 'pending' | 'review' | 'accepted' | 'rejected' | 'validated';

interface TimelineEvent {
    date: string;
    label: string;
    done: boolean;
}

interface Application {
    id: number;
    title: string;
    company: string;
    logo: string;
    wilaya: string;
    domain: string;
    duration: string;
    type: string;
    appliedDate: string;
    status: AppStatus;
    lastUpdate: string;
    conventionReady: boolean;
    timeline: TimelineEvent[];
    note?: string; // rejection/review note
}

function initialsCompany(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (p.length === 0) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return `${p[0][0] ?? ''}${p[1][0] ?? ''}`.toUpperCase();
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function mapBackendApplicationStatus(backend: string): AppStatus {
    if (backend === 'reviewed') return 'review';
    if (backend === 'refused') return 'rejected';
    if (backend === 'accepted') return 'accepted';
    if (backend === 'validated') return 'validated';
    return 'pending';
}

function buildTimeline(status: AppStatus, appliedIso: string): TimelineEvent[] {
    const submitted = formatDate(appliedIso);
    const doneSubmitted = true;
    const doneReview =
        status === 'review' || status === 'accepted' || status === 'rejected' || status === 'validated';
    const doneDecision =
        status === 'accepted' || status === 'rejected' || status === 'validated';
    const doneConvention = status === 'accepted' || status === 'validated';
    return [
        { date: submitted, label: 'Application submitted', done: doneSubmitted },
        { date: doneReview ? submitted : '—', label: 'Under review', done: doneReview },
        {
            date: doneDecision ? submitted : '—',
            label: status === 'rejected' ? 'Not selected' : 'Decision',
            done: doneDecision,
        },
        {
            date: doneConvention ? submitted : '—',
            label: 'Convention workflow',
            done: doneConvention,
        },
    ];
}

type ApiMyApplicationRow = {
    id: number;
    offer: number;
    offer_title?: string | null;
    offer_location?: string | null;
    offer_company_name?: string | null;
    status?: string;
    application_date?: string | null;
};

function mapApplicationRow(row: ApiMyApplicationRow): Application {
    const company = row.offer_company_name || 'Company';
    const appliedIso = row.application_date ?? new Date().toISOString();
    const mappedStatus = mapBackendApplicationStatus(row.status ?? 'pending');
    return {
        id: row.id,
        title: row.offer_title || `Offer #${row.offer}`,
        company,
        logo: initialsCompany(company),
        wilaya: row.offer_location || '—',
        domain: '—',
        duration: '—',
        type: '—',
        appliedDate: formatDate(appliedIso),
        lastUpdate: formatDate(appliedIso),
        status: mappedStatus,
        conventionReady: mappedStatus === 'accepted' || mappedStatus === 'validated',
        timeline: buildTimeline(mappedStatus, appliedIso),
    };
}

/* ─── STATUS CONFIG ──────────────────────────────────────────── */
const statusConfig: Record<AppStatus, {
    label: string; badgeClass: string; icon: React.ReactNode; color: string;
}> = {
    pending: { label: 'Pending', badgeClass: 'sc-badge-pending', icon: <Clock size={14} />, color: 'var(--sc-warn)' },
    review: { label: 'In Review', badgeClass: 'sc-badge-review', icon: <AlertCircle size={14} />, color: 'var(--sc-purple)' },
    accepted: { label: 'Accepted', badgeClass: 'sc-badge-accepted', icon: <CheckCircle2 size={14} />, color: 'var(--sc-green)' },
    rejected: { label: 'Rejected', badgeClass: 'sc-badge-rejected', icon: <XCircle size={14} />, color: 'var(--sc-red)' },
    validated: {
        label: 'Validated',
        badgeClass: 'sc-badge-validated',
        icon: <CheckCircle2 size={14} />,
        color: 'var(--sc-green)',
    },
};

const tabs: { key: AppStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'review', label: 'In Review' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'validated', label: 'Validated' },
    { key: 'rejected', label: 'Rejected' },
];

/* ─── COMPONENT ──────────────────────────────────────────────── */
const ApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [activeTab, setActiveTab] = useState<AppStatus | 'all'>('all');
    const [modal, setModal] = useState<Application | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<{ error?: boolean; data?: ApiMyApplicationRow[] }>('applications/my-applications/');
                const rows = res.data?.error === true ? [] : res.data?.data ?? [];
                setApplications(rows.map(mapApplicationRow));
            } catch {
                toast.error('Could not load applications.');
                setApplications([]);
            }
        })();
    }, []);

    const filtered = useMemo(() =>
        activeTab === 'all'
            ? applications
            : applications.filter(a => a.status === activeTab),
        [activeTab, applications]
    );

    const counts = useMemo(() => ({
        all: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        review: applications.filter(a => a.status === 'review').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        validated: applications.filter(a => a.status === 'validated').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }), [applications]);

    return (
        <DashboardLayout pageTitle="My Applications">

            {/* ── HERO ── */}
            <div className="page-hero applications-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>My Applications</h1>
                    <p>Track every application, monitor status updates, and download your conventions</p>
                </div>
            </div>

            {/* ── STAT STRIP ── */}
            <div className="app-stat-strip">
                {[
                    { label: 'Total', value: counts.all, color: 'var(--sc-blue)' },
                    { label: 'Pending', value: counts.pending, color: 'var(--sc-warn)' },
                    { label: 'In Review', value: counts.review, color: 'var(--sc-purple)' },
                    { label: 'Accepted', value: counts.accepted, color: 'var(--sc-green)' },
                    { label: 'Validated', value: counts.validated, color: 'var(--sc-green)' },
                    { label: 'Rejected', value: counts.rejected, color: 'var(--sc-red)' },
                ].map(s => (
                    <div className="app-stat-item" key={s.label}>
                        <span className="app-stat-value" style={{ color: s.color }}>{s.value}</span>
                        <span className="app-stat-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ── TABS ── */}
            <div className="app-tabs">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`app-tab ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                        <span className="app-tab-count">{counts[t.key]}</span>
                    </button>
                ))}
            </div>

            {/* ── LIST ── */}
            <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                    <motion.div
                        className="offers-empty"
                        key="empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    >
                        <Briefcase size={44} />
                        <p>No applications in this category yet.</p>
                    </motion.div>
                ) : (
                    <div className="app-list" key="list">
                        {filtered.map((app, i) => {
                            const cfg = statusConfig[app.status];
                            return (
                                <motion.div
                                    key={app.id}
                                    className="app-row"
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.22, delay: i * 0.05 }}
                                >
                                    {/* Status bar on left */}
                                    <div
                                        className="app-row-bar"
                                        style={{ background: cfg.color }}
                                    />

                                    {/* Logo */}
                                    <div className="sc-offer-logo app-logo">{app.logo}</div>

                                    {/* Info */}
                                    <div className="app-row-info">
                                        <div className="app-row-top">
                                            <h4>{app.title}</h4>
                                            <span className={`sc-badge ${cfg.badgeClass}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </div>
                                        <div className="app-row-meta">
                                            <span><Building2 size={12} />{app.company}</span>
                                            <span><MapPin size={12} />{app.wilaya}</span>
                                            <span><Clock size={12} />{app.duration}</span>
                                            <span><Calendar size={12} />Applied {app.appliedDate}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="app-row-actions">
                                        {app.conventionReady && (
                                            <button className="sc-btn-download">
                                                <Download size={13} /> Convention
                                            </button>
                                        )}
                                        <button
                                            className="app-view-btn"
                                            onClick={() => setModal(app)}
                                        >
                                            <Eye size={14} /> View <ChevronRight size={13} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>

            {/* ── MODAL ── */}
            <AnimatePresence>
                {modal && (
                    <>
                        <motion.div
                            className="off-modal-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setModal(null)}
                        />
                        <motion.div
                            className="off-modal app-modal"
                            initial={{ opacity: 0, scale: 0.93, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 40 }}
                            transition={{ duration: 0.26, ease: 'easeOut' }}
                        >
                            {/* Header */}
                            <div className="off-modal-header">
                                <div className="sc-offer-logo off-modal-logo">{modal.logo}</div>
                                <div className="off-modal-title">
                                    <h2>{modal.title}</h2>
                                    <span>{modal.company} · {modal.wilaya}</span>
                                </div>
                                <button className="off-modal-close" onClick={() => setModal(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Badges */}
                            <div className="off-modal-badges">
                                <span className={`sc-badge ${statusConfig[modal.status].badgeClass}`}>
                                    {statusConfig[modal.status].icon} {statusConfig[modal.status].label}
                                </span>
                                <span className="domain">{modal.domain}</span>
                                <span className="off-mpill"><Clock size={12} />{modal.duration}</span>
                                <span className="off-mpill">{modal.type}</span>
                                <span className="off-mpill"><Calendar size={12} />Applied {modal.appliedDate}</span>
                            </div>

                            {/* Note (review/rejected) */}
                            {modal.note && (
                                <div className={`app-modal-note ${modal.status}`}>
                                    {modal.status === 'rejected'
                                        ? <XCircle size={16} />
                                        : <AlertCircle size={16} />
                                    }
                                    <p>{modal.note}</p>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="off-modal-section">
                                <h3>Application Timeline</h3>
                                <div className="app-timeline">
                                    {modal.timeline.map((ev, idx) => (
                                        <div
                                            key={idx}
                                            className={`app-tl-step ${ev.done ? 'done' : 'todo'}`}
                                        >
                                            <div className="app-tl-dot">
                                                {ev.done
                                                    ? <CheckCircle2 size={16} />
                                                    : <div className="app-tl-empty-dot" />
                                                }
                                            </div>
                                            {idx < modal.timeline.length - 1 && (
                                                <div className={`app-tl-line ${ev.done ? 'done' : ''}`} />
                                            )}
                                            <div className="app-tl-content">
                                                <span className="app-tl-label">{ev.label}</span>
                                                <span className="app-tl-date">{ev.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="off-modal-section">
                                <h3>Details</h3>
                                <div className="off-modal-details">
                                    <div className="off-mdetail">
                                        <span>Applied on</span>
                                        <strong>{modal.appliedDate}</strong>
                                    </div>
                                    <div className="off-mdetail">
                                        <span>Last update</span>
                                        <strong>{modal.lastUpdate}</strong>
                                    </div>
                                    <div className="off-mdetail">
                                        <span>Duration</span>
                                        <strong>{modal.duration}</strong>
                                    </div>
                                    <div className="off-mdetail">
                                        <span>Work type</span>
                                        <strong>{modal.type}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="off-modal-cta">
                                {modal.conventionReady ? (
                                    <button className="sc-btn-primary off-apply-full">
                                        <Download size={16} /> Download Convention
                                    </button>
                                ) : (
                                    <div className="app-no-convention">
                                        <FileText size={16} />
                                        {modal.status === 'validated'
                                            ? 'Internship validated by administration.'
                                            : modal.status === 'accepted'
                                              ? 'Convention is being prepared…'
                                              : 'Convention available once accepted'}
                                    </div>
                                )}
                                <button className="sc-btn-outline" onClick={() => setModal(null)}>
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </DashboardLayout>
    );
};

export default ApplicationsPage;