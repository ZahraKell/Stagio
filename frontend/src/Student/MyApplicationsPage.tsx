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

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */
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
    note?: string;
}

interface ConventionRow {
    id: number;
    status: string;
    application_id: number;
    student_signed: boolean;
    company_signed: boolean;
    admin_validated: boolean;
    offer_title?: string;
    company_name?: string;
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

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
function initialsCompany(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return `${p[0][0] ?? ''}${p[1][0] ?? ''}`.toUpperCase();
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function mapBackendStatus(backend: string): AppStatus {
    if (backend === 'reviewed') return 'review';
    if (backend === 'refused')  return 'rejected';
    if (backend === 'accepted') return 'accepted';
    if (backend === 'validated') return 'validated';
    return 'pending';
}

function buildTimeline(status: AppStatus, appliedIso: string): TimelineEvent[] {
    const submitted = formatDate(appliedIso);
    const doneReview     = ['review','accepted','rejected','validated'].includes(status);
    const doneDecision   = ['accepted','rejected','validated'].includes(status);
    const doneConvention = ['accepted','validated'].includes(status);
    return [
        { date: submitted,                   label: 'Application submitted', done: true },
        { date: doneReview ? submitted : '—',     label: 'Under review',       done: doneReview },
        { date: doneDecision ? submitted : '—',   label: status === 'rejected' ? 'Not selected' : 'Decision', done: doneDecision },
        { date: doneConvention ? submitted : '—', label: 'Convention workflow', done: doneConvention },
    ];
}

function mapRow(row: ApiMyApplicationRow): Application {
    const company    = row.offer_company_name || 'Company';
    const appliedIso = row.application_date ?? new Date().toISOString();
    const status     = mapBackendStatus(row.status ?? 'pending');
    return {
        id:              row.id,
        title:           row.offer_title || `Offer #${row.offer}`,
        company,
        logo:            initialsCompany(company),
        wilaya:          row.offer_location || '—',
        domain:          '—',
        duration:        '—',
        type:            '—',
        appliedDate:     formatDate(appliedIso),
        lastUpdate:      formatDate(appliedIso),
        status,
        conventionReady: ['accepted','validated'].includes(status),
        timeline:        buildTimeline(status, appliedIso),
    };
}

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG
   ══════════════════════════════════════════════════════════ */
const statusConfig: Record<AppStatus, {
    label: string; badgeClass: string; icon: React.ReactNode; color: string;
}> = {
    pending:  { label: 'Pending',   badgeClass: 'sc-badge-pending',  icon: <Clock size={14} />,        color: 'var(--sc-warn)' },
    review:   { label: 'In Review', badgeClass: 'sc-badge-review',   icon: <AlertCircle size={14} />,  color: 'var(--sc-purple)' },
    accepted: { label: 'Accepted',  badgeClass: 'sc-badge-accepted', icon: <CheckCircle2 size={14} />, color: 'var(--sc-green)' },
    rejected: { label: 'Rejected',  badgeClass: 'sc-badge-rejected', icon: <XCircle size={14} />,      color: 'var(--sc-red)' },
    validated:{ label: 'Validated', badgeClass: 'sc-badge-validated',icon: <CheckCircle2 size={14} />, color: 'var(--sc-green)' },
};

const tabs: { key: AppStatus | 'all'; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'review',   label: 'In Review' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'validated',label: 'Validated' },
    { key: 'rejected', label: 'Rejected' },
];

/* ══════════════════════════════════════════════════════════
   STUDENT CONVENTION SIGNING POPUP
   Mirrors the company ConventionPopup exactly
   ══════════════════════════════════════════════════════════ */
function StudentConventionPopup({
    convention,
    application,
    onClose,
    onSigned,
}: {
    convention: ConventionRow;
    application: Application;
    onClose: () => void;
    onSigned: () => void;
}) {
    const [agreed,  setAgreed]  = useState(false);
    const [signing, setSigning] = useState(false);
    const [error,   setError]   = useState('');
    const [done,    setDone]    = useState(false);

    const handleSign = async () => {
        if (!agreed) return;
        setSigning(true);
        setError('');
        try {
            await api.post(`conventions/${convention.id}/sign/`, {});
            setDone(true);
            setTimeout(onSigned, 1800);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            setError(msg || 'Erreur lors de la signature.');
            setSigning(false);
        }
    };

    return (
        <div
            className="conv-overlay"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="conv-popup">
                {/* Header */}
                <div className="conv-head">
                    <div className="conv-head-icon">📋</div>
                    <div>
                        <h3>Convention de Stage</h3>
                        <p>CONV-{String(convention.id).padStart(4, '0')}</p>
                    </div>
                    {!done && (
                        <button className="conv-close" onClick={onClose}>✕</button>
                    )}
                </div>

                {done ? (
                    <div className="conv-success">
                        <div className="conv-success-icon">✅</div>
                        <h3>Convention signée !</h3>
                        <p>
                            Votre signature a été enregistrée. L'entreprise recevra
                            une notification pour signer à son tour.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="conv-body">
                            {/* Summary */}
                            <div className="conv-summary">
                                <div className="conv-summary-item">
                                    <span>Stagiaire</span>
                                    <strong>{application.company !== '—' ? '' : ''}{application.title}</strong>
                                </div>
                                <div className="conv-summary-item">
                                    <span>Entreprise</span>
                                    <strong>{application.company}</strong>
                                </div>
                                <div className="conv-summary-item">
                                    <span>Réf. Convention</span>
                                    <strong>CONV-{String(convention.id).padStart(4, '0')}</strong>
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="conv-explainer">
                                <div className="conv-explainer-icon">ℹ️</div>
                                <p>
                                    En signant cette convention, vous confirmez votre accord
                                    pour effectuer le stage <strong>« {application.title} »</strong>
                                    {' '}chez <strong>{application.company}</strong>.
                                    Cette signature électronique a valeur juridique équivalente
                                    à une signature manuscrite.
                                </p>
                            </div>

                            {/* Signature chain — student signs first */}
                            <div className="conv-chain">
                                <div className="conv-chain-step conv-chain-current">
                                    <span className="conv-chain-dot conv-chain-pulse" />
                                    <span>Votre signature</span>
                                </div>
                                <div className="conv-chain-line" />
                                <div className="conv-chain-step conv-chain-waiting">
                                    <span className="conv-chain-dot conv-chain-empty" />
                                    <span>Signature entreprise</span>
                                </div>
                                <div className="conv-chain-line" />
                                <div className="conv-chain-step conv-chain-waiting">
                                    <span className="conv-chain-dot conv-chain-empty" />
                                    <span>Validation admin</span>
                                </div>
                            </div>

                            {/* Checkbox */}
                            <label className="conv-agree">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={e => setAgreed(e.target.checked)}
                                />
                                <span className="conv-check-box" />
                                <span>
                                    Je certifie avoir lu la convention et j'accepte ses termes
                                    en tant que stagiaire.
                                </span>
                            </label>

                            {error && <div className="conv-error">{error}</div>}
                        </div>

                        <div className="conv-footer">
                            <button className="conv-btn-cancel" onClick={onClose}>
                                Plus tard
                            </button>
                            <button
                                className={`conv-btn-sign ${agreed ? 'conv-btn-sign-ready' : ''}`}
                                disabled={!agreed || signing}
                                onClick={() => void handleSign()}
                            >
                                {signing
                                    ? 'Signature en cours…'
                                    : agreed
                                        ? '✍️  Je signe la convention'
                                        : 'Cochez la case pour signer'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   CONVENTION STATUS BADGE (shown on each accepted row)
   ══════════════════════════════════════════════════════════ */
function ConventionStatusBadge({ conv }: { conv: ConventionRow }) {
    if (!conv.student_signed) {
        return (
            <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#fef3c7', color: '#92400e', fontWeight: 600,
            }}>
                ✍️ En attente de votre signature
            </span>
        );
    }
    if (!conv.company_signed) {
        return (
            <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#eff6ff', color: '#1e40af', fontWeight: 600,
            }}>
                📄 En attente de la signature entreprise
            </span>
        );
    }
    if (!conv.admin_validated) {
        return (
            <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#f5f3ff', color: '#5b21b6', fontWeight: 600,
            }}>
                🏛️ En attente de validation admin
            </span>
        );
    }
    return (
        <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: '#f0fdf4', color: '#14532d', fontWeight: 600,
        }}>
            ✅ Convention validée
        </span>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
const ApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [conventions,  setConventions]  = useState<ConventionRow[]>([]);
    const [activeTab, setActiveTab]       = useState<AppStatus | 'all'>('all');
    const [modal,     setModal]           = useState<Application | null>(null);
    const [signTarget, setSignTarget]     = useState<{ conv: ConventionRow; app: Application } | null>(null);

    /* ── Load applications + conventions ── */
    const loadAll = async () => {
        try {
            const res = await api.get<{ error?: boolean; data?: ApiMyApplicationRow[] }>(
                'applications/my-applications/'
            );
            const rows = res.data?.error ? [] : res.data?.data ?? [];
            setApplications(rows.map(mapRow));
        } catch {
            toast.error('Could not load applications.');
        }

        try {
            const cRes = await api.get<{ error?: boolean; data?: ConventionRow[] }>(
                'conventions/mine/'
            );
            setConventions(cRes.data?.error ? [] : cRes.data?.data ?? []);
        } catch {
            // conventions may not exist yet — silent
        }
    };

    useEffect(() => { void loadAll(); }, []);

    /* ── Derived state ── */
    const filtered = useMemo(() =>
        activeTab === 'all'
            ? applications
            : applications.filter(a => a.status === activeTab),
        [activeTab, applications]
    );

    const counts = useMemo(() => ({
        all:       applications.length,
        pending:   applications.filter(a => a.status === 'pending').length,
        review:    applications.filter(a => a.status === 'review').length,
        accepted:  applications.filter(a => a.status === 'accepted').length,
        validated: applications.filter(a => a.status === 'validated').length,
        rejected:  applications.filter(a => a.status === 'rejected').length,
    }), [applications]);

    /* ── After student signs, reload conventions ── */
    const handleSigned = async () => {
        setSignTarget(null);
        await loadAll();
        toast.success('Convention signée !');
    };

    /* ── Render action buttons per application ── */
    const renderActions = (app: Application) => {
        const conv = conventions.find(c => c.application_id === app.id);

        if (app.status === 'accepted' && conv) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <ConventionStatusBadge conv={conv} />
                    {!conv.student_signed && (
                        <button
                            className="sc-btn-primary"
                            style={{ fontSize: 12, padding: '6px 14px' }}
                            onClick={() => setSignTarget({ conv, app })}
                        >
                            ✍️ Signer la convention
                        </button>
                    )}
                    {conv.admin_validated && (
                        <a
                            href={`http://127.0.0.1:8000/api/conventions/${conv.id}/download/`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <button className="sc-btn-download">
                                <Download size={13} /> Télécharger
                            </button>
                        </a>
                    )}
                </div>
            );
        }

        if (app.status === 'validated' && conv?.admin_validated) {
            return (
                <a
                    href={`http://127.0.0.1:8000/api/conventions/${conv.id}/download/`}
                    target="_blank"
                    rel="noreferrer"
                >
                    <button className="sc-btn-download">
                        <Download size={13} /> Convention
                    </button>
                </a>
            );
        }

        return null;
    };

    return (
        <DashboardLayout pageTitle="My Applications">

            {/* ── HERO ── */}
            <div className="page-hero applications-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>My Applications</h1>
                    <p>Track every application, monitor status updates, and sign your conventions</p>
                </div>
            </div>

            {/* ── STAT STRIP ── */}
            <div className="app-stat-strip">
                {[
                    { label: 'Total',     value: counts.all,       color: 'var(--sc-blue)' },
                    { label: 'Pending',   value: counts.pending,   color: 'var(--sc-warn)' },
                    { label: 'In Review', value: counts.review,    color: 'var(--sc-purple)' },
                    { label: 'Accepted',  value: counts.accepted,  color: 'var(--sc-green)' },
                    { label: 'Validated', value: counts.validated, color: 'var(--sc-green)' },
                    { label: 'Rejected',  value: counts.rejected,  color: 'var(--sc-red)' },
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
                        className={`app-tab${activeTab === t.key ? ' active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                        <span className="app-tab-count">{counts[t.key]}</span>
                    </button>
                ))}
            </div>

            {/* ── APPLICATION LIST ── */}
            <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                    <motion.div className="offers-empty" key="empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                                    <div className="app-row-bar" style={{ background: cfg.color }} />
                                    <div className="sc-offer-logo app-logo">{app.logo}</div>

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

                                    <div className="app-row-actions">
                                        {renderActions(app)}
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

            {/* ── DETAIL MODAL ── */}
            <AnimatePresence>
                {modal && (
                    <>
                        <motion.div className="off-modal-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setModal(null)} />
                        <motion.div
                            className="off-modal app-modal"
                            style={{ maxHeight: '88vh', overflowY: 'auto' }}
                            initial={{ opacity: 0, scale: 0.93, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 40 }}
                            transition={{ duration: 0.26, ease: 'easeOut' }}
                        >
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

                            <div className="off-modal-badges">
                                <span className={`sc-badge ${statusConfig[modal.status].badgeClass}`}>
                                    {statusConfig[modal.status].icon} {statusConfig[modal.status].label}
                                </span>
                                <span className="off-mpill"><Clock size={12} />{modal.duration}</span>
                                <span className="off-mpill"><Calendar size={12} />Applied {modal.appliedDate}</span>
                            </div>

                            {/* Convention status inside modal */}
                            {(() => {
                                const conv = conventions.find(c => c.application_id === modal.id);
                                if (!conv) return null;
                                return (
                                    <div style={{ padding: '0 24px 12px' }}>
                                        <ConventionStatusBadge conv={conv} />
                                    </div>
                                );
                            })()}

                            {modal.note && (
                                <div className={`app-modal-note ${modal.status}`}>
                                    {modal.status === 'rejected' ? <XCircle size={16} /> : <AlertCircle size={16} />}
                                    <p>{modal.note}</p>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="off-modal-section">
                                <h3>Application Timeline</h3>
                                <div className="app-timeline">
                                    {modal.timeline.map((ev, idx) => (
                                        <div key={idx} className={`app-tl-step${ev.done ? ' done' : ' todo'}`}>
                                            <div className="app-tl-dot">
                                                {ev.done
                                                    ? <CheckCircle2 size={16} />
                                                    : <div className="app-tl-empty-dot" />}
                                            </div>
                                            {idx < modal.timeline.length - 1 && (
                                                <div className={`app-tl-line${ev.done ? ' done' : ''}`} />
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
                                    <div className="off-mdetail"><span>Applied on</span><strong>{modal.appliedDate}</strong></div>
                                    <div className="off-mdetail"><span>Last update</span><strong>{modal.lastUpdate}</strong></div>
                                    <div className="off-mdetail"><span>Duration</span><strong>{modal.duration}</strong></div>
                                    <div className="off-mdetail"><span>Work type</span><strong>{modal.type}</strong></div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="off-modal-cta">
                                {(() => {
                                    const conv = conventions.find(c => c.application_id === modal.id);
                                    if (conv && !conv.student_signed) {
                                        return (
                                            <button
                                                className="sc-btn-primary off-apply-full"
                                                onClick={() => {
                                                    setModal(null);
                                                    setSignTarget({ conv, app: modal });
                                                }}
                                            >
                                                ✍️ Signer la convention
                                            </button>
                                        );
                                    }
                                    if (conv && conv.admin_validated) {
                                        return (
                                            <a
                                                href={`http://127.0.0.1:8000/api/conventions/${conv.id}/download/`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <button className="sc-btn-primary off-apply-full">
                                                    <Download size={16} /> Télécharger la convention
                                                </button>
                                            </a>
                                        );
                                    }
                                    if (conv) {
                                        return (
                                            <div className="app-no-convention">
                                                <FileText size={16} />
                                                {conv.company_signed
                                                    ? 'En attente de validation administration…'
                                                    : 'En attente de la signature entreprise…'}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="app-no-convention">
                                            <FileText size={16} />
                                            {modal.status === 'accepted'
                                                ? 'Convention en cours de préparation…'
                                                : 'Convention disponible une fois accepté'}
                                        </div>
                                    );
                                })()}
                                <button className="sc-btn-outline" onClick={() => setModal(null)}>
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── STUDENT CONVENTION SIGNING POPUP ── */}
            {signTarget && (
                <StudentConventionPopup
                    convention={signTarget.conv}
                    application={signTarget.app}
                    onClose={() => setSignTarget(null)}
                    onSigned={() => void handleSigned()}
                />
            )}

        </DashboardLayout>
    );
};

export default ApplicationsPage;