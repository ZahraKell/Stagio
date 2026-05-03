import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import DashboardLayout from '../components/DashboardLayout';
import {
    Download, Eye, Search, X,
    CheckCircle, AlertTriangle,
    FileText, Stamp, PenLine, Building2,
    GraduationCap, CalendarDays, ChevronRight,
    RefreshCw, Send, Paperclip, Loader2, XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

type ConvStatus =
    | 'generated'
    | 'sent_student'
    | 'signed_student'
    | 'signed_company'
    | 'stamped'
    | 'complete'
    | 'expired';

interface Convention {
    id: string;
    student: string;
    studentLevel: string;
    studentEmail: string;
    company: string;
    companyWilaya: string;
    role: string;
    domain: string;
    startDate: string;
    endDate: string;
    duration: string;
    status: ConvStatus;
    generatedAt: string;
    lastUpdate: string;
    articleCount: number;
    supervisorName: string;
    supervisorTitle: string;
    /** Present when backed by Django `Convention` pk (pending admin workflow). */
    apiId?: number;
}

/** Row from GET /api/conventions/pending-admin/ */
type PendingConventionApiRow = {
    id: number;
    student_name: string;
    student_email: string;
    company_name: string;
    offer_title: string;
    offer_town: string;
    created_at: string;
    updated_at: string;
};

/** Map Django pending conventions into the drawer/list shape used here. UI uses legacy mock ConvStatus semantics. */
function mapPendingConventionRow(row: PendingConventionApiRow): Convention {
    return {
        id: `CV-${String(row.id).padStart(4, '0')}`,
        apiId: row.id,
        student: row.student_name,
        studentLevel: '—',
        studentEmail: row.student_email,
        company: row.company_name,
        companyWilaya: row.offer_town,
        role: row.offer_title,
        domain: '',
        startDate: '—',
        endDate: '—',
        duration: '',
        /** Company signed → waiting administration (`PENDING_ADMIN` on backend). */
        status: 'signed_company',
        generatedAt: row.created_at,
        lastUpdate: row.updated_at,
        articleCount: 0,
        supervisorName: '',
        supervisorTitle: '',
    };
}


const STATUS_CONFIG: Record<ConvStatus, {
    label: string; shortLabel: string; cls: string;
    icon: React.ElementType; step: number;
}> = {
    generated: { label: 'Generated', shortLabel: 'Generated', cls: 'cs-generated', icon: FileText, step: 1 },
    sent_student: { label: 'Sent to Student', shortLabel: 'Sent', cls: 'cs-sent', icon: Send, step: 2 },
    signed_student: { label: 'Signed by Student', shortLabel: 'Stud. Signed', cls: 'cs-signed-s', icon: PenLine, step: 3 },
    signed_company: { label: 'Signed by Company', shortLabel: 'Co. Signed', cls: 'cs-signed-c', icon: Building2, step: 4 },
    stamped: { label: 'Stamped by University', shortLabel: 'Stamped', cls: 'cs-stamped', icon: Stamp, step: 5 },
    complete: { label: 'Complete', shortLabel: 'Complete', cls: 'cs-complete', icon: CheckCircle, step: 6 },
    expired: { label: 'Expired', shortLabel: 'Expired', cls: 'cs-expired', icon: XCircle, step: 0 },
};

const PIPELINE: ConvStatus[] = [
    'generated', 'sent_student', 'signed_student', 'signed_company', 'stamped', 'complete',
];

const TABS = ['All', 'Active', 'Complete', 'Expired'] as const;
type Tab = typeof TABS[number];

const tabMatch = (tab: Tab, status: ConvStatus): boolean => {
    if (tab === 'All') return true;
    if (tab === 'Complete') return status === 'complete';
    if (tab === 'Expired') return status === 'expired';
    return status !== 'complete' && status !== 'expired';
};

const domainColor: Record<string, string> = {
    'Informatique': 'dom-info',
    'Électronique': 'dom-elec',
    'Télécom': 'dom-tel',
    'Sécurité': 'dom-sec',
};

const nextStepLabel = (status: ConvStatus): string | null => {
    const idx = PIPELINE.indexOf(status);
    if (idx === -1 || idx >= PIPELINE.length - 1) return null;
    return STATUS_CONFIG[PIPELINE[idx + 1]].label;
};


/* ── Mini pipeline dots shown on each card ── */
const MiniPipeline: React.FC<{ status: ConvStatus }> = ({ status }) => {
    const currentStep = STATUS_CONFIG[status].step;
    return (
        <div className="cv-mini-pipeline">
            {PIPELINE.map((_, si) => (
                <div
                    key={si}
                    className={`cv-pip-dot
                        ${si < currentStep ? 'done' : ''}
                        ${si === currentStep - 1 ? 'current' : ''}`}
                />
            ))}
        </div>
    );
};

/* ── Full pipeline tracker inside drawer ── */
const PipelineTracker: React.FC<{ status: ConvStatus }> = ({ status }) => {
    const currentStep = STATUS_CONFIG[status].step;
    const isExpired = status === 'expired';
    return (
        <div className="cv-pipeline">
            {PIPELINE.map((s, si) => {
                const cfg = STATUS_CONFIG[s];
                const isDone = si < currentStep && !isExpired;
                const isCurr = si === currentStep - 1 && !isExpired;
                return (
                    <div key={s} className={`cv-pipe-step ${isDone ? 'done' : ''} ${isCurr ? 'current' : ''} ${isExpired ? 'expired' : ''}`}>
                        <div className="cv-pipe-node">
                            {isDone ? <CheckCircle size={13} /> : <cfg.icon size={13} />}
                        </div>
                        <span>{cfg.shortLabel}</span>
                        {si < PIPELINE.length - 1 && (
                            <div className={`cv-pipe-line ${isDone ? 'done' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

/* ── Single convention card row ── */
const ConventionCard: React.FC<{
    convention: Convention;
    selected: boolean;
    index: number;
    onClick: () => void;
    onPreview: () => void;
    onDownload: () => void;
}> = ({ convention: c, selected, index, onClick, onPreview, onDownload }) => {
    const cfg = STATUS_CONFIG[c.status];
    return (
        <motion.div
            className={`cv-card ${selected ? 'selected' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={onClick}
        >
            <div className="cv-card-left">
                <span className="cv-card-id">{c.id}</span>
                <div className="cv-card-parties">
                    <span className="cv-party"><GraduationCap size={12} />{c.student}</span>
                    <span className="cv-arrow">→</span>
                    <span className="cv-party"><Building2 size={12} />{c.company}</span>
                </div>
                <div className="cv-card-meta">
                    <span><CalendarDays size={11} />{c.startDate} – {c.endDate}</span>
                    <span className={`off-domain-tag ${domainColor[c.domain] || ''}`} style={{ fontSize: 11 }}>
                        {c.domain}
                    </span>
                </div>
            </div>

            {c.status !== 'expired' && <MiniPipeline status={c.status} />}

            <div className="cv-card-right">
                <span className={`cv-status-badge ${cfg.cls}`}>
                    <cfg.icon size={11} />
                    {cfg.shortLabel}
                </span>
                <div className="cv-card-actions">
                    <button className="adm-action-icon" title="Preview PDF"
                        onClick={e => { e.stopPropagation(); onPreview(); }}>
                        <Eye size={13} />
                    </button>
                    <button className="adm-action-icon" title="Download PDF"
                        onClick={e => { e.stopPropagation(); onDownload(); }}>
                        <Download size={13} />
                    </button>
                </div>
                <ChevronRight size={13} className="off-chevron" />
            </div>
        </motion.div>
    );
};

/* ── Detail drawer ── */
const ConventionDrawer: React.FC<{
    convention: Convention;
    onClose: () => void;
    onAdvance: () => void;
    advancing: boolean;
}> = ({ convention: c, onClose, onAdvance, advancing }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const next = nextStepLabel(c.status);
    const canAdvance = c.status !== 'complete' && c.status !== 'expired';

    // Reset confirm whenever a different convention is opened
    React.useEffect(() => { setConfirmOpen(false); }, [c.id]);

    return (
        <motion.aside
            className="cv-drawer"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            {/* Head */}
            <div className="cv-drawer-head">
                <div>
                    <span className="cv-drawer-id">{c.id}</span>
                    <h2 className="cv-drawer-title">{c.role}</h2>
                </div>
                <button className="off-drawer-close" onClick={onClose}><X size={16} /></button>
            </div>

            {/* Pipeline */}
            <PipelineTracker status={c.status} />

            {/* Expired warning */}
            {c.status === 'expired' && (
                <div className="cv-expired-banner">
                    <AlertTriangle size={14} />
                    This convention has expired. A new one must be generated.
                </div>
            )}

            {/* Parties */}
            <div className="cv-drawer-parties">
                <div className="cv-party-card">
                    <GraduationCap size={14} />
                    <div>
                        <span className="cv-party-role">Student</span>
                        <span className="cv-party-name">{c.student}</span>
                        <span className="cv-party-sub">{c.studentLevel}</span>
                        <a href={`mailto:${c.studentEmail}`} className="cv-party-email">{c.studentEmail}</a>
                    </div>
                </div>
                <div className="cv-party-card">
                    <Building2 size={14} />
                    <div>
                        <span className="cv-party-role">Company</span>
                        <span className="cv-party-name">{c.company}</span>
                        <span className="cv-party-sub">{c.companyWilaya}</span>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="cv-drawer-details">
                {[
                    { label: 'Start Date', value: c.startDate },
                    { label: 'End Date', value: c.endDate },
                    { label: 'Duration', value: c.duration },
                    { label: 'Articles', value: `${c.articleCount} articles` },
                    { label: 'Supervisor', value: c.supervisorName },
                    { label: 'Last Update', value: c.lastUpdate },
                ].map(d => (
                    <div key={d.label} className="cv-detail-row">
                        <span className="cv-detail-label">{d.label}</span>
                        <span className="cv-detail-value">{d.value}</span>
                    </div>
                ))}
            </div>

            {/* PDF actions */}
            <div className="cv-pdf-actions">
                <button className="cv-pdf-btn preview">    <Eye size={14} />       Preview PDF  </button>
                <button className="cv-pdf-btn download">   <Download size={14} />  Download PDF </button>
                <button className="cv-pdf-btn regenerate"> <RefreshCw size={14} /> Regenerate   </button>
            </div>

            {/* Advance status */}
            {canAdvance && (
                <div className="cv-advance-section">
                    {!confirmOpen ? (
                        <button className="cv-advance-btn" onClick={() => setConfirmOpen(true)}>
                            <ChevronRight size={14} />
                            Mark as: <strong>{next}</strong>
                        </button>
                    ) : (
                        <div className="cv-confirm-row">
                            <span>Confirm status update?</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="adm-action-btn approve sm"
                                    onClick={onAdvance}
                                    disabled={advancing}
                                >
                                    {advancing ? <Loader2 size={12} className="spin" /> : 'Confirm'}
                                </button>
                                <button
                                    className="adm-action-btn reject sm"
                                    onClick={() => setConfirmOpen(false)}
                                    disabled={advancing}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Attachments */}
            <div className="cv-attachments">
                <span className="cv-attach-label"><Paperclip size={12} /> Attachments</span>
                <div className="cv-attach-list">
                    <div className="cv-attach-item">
                        <FileText size={13} /><span>{c.id}_convention.pdf</span><Download size={12} />
                    </div>
                    {c.status === 'complete' && (
                        <div className="cv-attach-item">
                            <FileText size={13} /><span>{c.id}_signed_final.pdf</span><Download size={12} />
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
};


const ConventionsPage: React.FC = () => {
    const [conventions, setConventions] = useState<Convention[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('Active');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Convention | null>(null);
    const [advancing, setAdvancing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get<{ error?: boolean; data?: PendingConventionApiRow[] }>(
                    'conventions/pending-admin/'
                );
                const rows =
                    res.data?.error === true ? [] : (res.data?.data as PendingConventionApiRow[] | undefined) ?? [];
                if (!cancelled) setConventions(rows.map(mapPendingConventionRow));
            } catch {
                if (!cancelled) {
                    toast.error('Could not load pending conventions.');
                    setConventions([]);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    /* ── Filtered list ── */
    const filtered = useMemo(() =>
        conventions.filter(c => {
            const tMatch = tabMatch(activeTab, c.status);
            const sMatch =
                c.student.toLowerCase().includes(search.toLowerCase()) ||
                c.company.toLowerCase().includes(search.toLowerCase()) ||
                c.id.toLowerCase().includes(search.toLowerCase());
            return tMatch && sMatch;
        }),
        [conventions, activeTab, search]
    );

    const tabCount = (tab: Tab) => conventions.filter(c => tabMatch(tab, c.status)).length;

    /* ── Advance pipeline status ── */
    const handleAdvance = async () => {
        if (!selected) return;

        const apiPk = typeof selected.apiId === 'number' ? selected.apiId : null;
        if (apiPk == null) {
            toast.error('This convention row is missing a server id.');
            return;
        }

        setAdvancing(true);
        try {
            await api.post(`conventions/${apiPk}/sign/`);
            toast.success('Convention validated by administration.');
            setConventions((prev) => prev.filter((c) => c.id !== selected.id));
            setSelected(null);
        } catch {
            toast.error('Unable to validate convention.');
        } finally {
            setAdvancing(false);
        }
    };

    // Keep drawer in sync after status update
    React.useEffect(() => {
        if (!selected) return;
        const updated = conventions.find(c => c.id === selected.id);
        if (updated) setSelected(updated);
    }, [conventions]);

    return (
        <DashboardLayout pageTitle="Conventions"
        >
            {/* ── Status summary strip ── */}
            <div className="cv-summary-strip">
                {(Object.keys(STATUS_CONFIG) as ConvStatus[])
                    .filter(s => s !== 'expired')
                    .map(s => {
                        const cfg = STATUS_CONFIG[s];
                        const count = conventions.filter(c => c.status === s).length;
                        return (
                            <div key={s} className={`cv-summary-item ${cfg.cls}`}>
                                <cfg.icon size={14} />
                                <span className="cv-summary-count">{count}</span>
                                <span className="cv-summary-label">{cfg.shortLabel}</span>
                            </div>
                        );
                    })}
            </div>

            {/* ── Toolbar ── */}
            <div className="cv-toolbar">
                <div className="off-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`off-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            <span className="off-tab-count">{tabCount(tab)}</span>
                        </button>
                    ))}
                </div>
                <div className="off-search" style={{ minWidth: 230 }}>
                    <Search size={13} />
                    <input
                        type="text"
                        placeholder="Search student, company, ID…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="off-clear">
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main split ── */}
            <div className={`cv-layout ${selected ? 'with-drawer' : ''}`}>

                {/* List */}
                <div className="cv-list">
                    {filtered.length === 0 ? (
                        <div className="off-empty">
                            <FileText size={32} />
                            <p>No conventions match your filters.</p>
                        </div>
                    ) : (
                        filtered.map((c, i) => (
                            <ConventionCard
                                key={c.id}
                                convention={c}
                                selected={selected?.id === c.id}
                                index={i}
                                onClick={() => setSelected(c)}
                                onPreview={() => alert(`Preview PDF: ${c.id}`)}
                                onDownload={() => alert(`Download PDF: ${c.id}`)}
                            />
                        ))
                    )}
                </div>

                {/* Drawer */}
                <AnimatePresence>
                    {selected && (
                        <ConventionDrawer
                            key={selected.id}
                            convention={selected}
                            onClose={() => setSelected(null)}
                            onAdvance={handleAdvance}
                            advancing={advancing}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default ConventionsPage;