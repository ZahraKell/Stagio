import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
    Search, X, ChevronRight, Filter,
    CheckCircle, Clock, XCircle, Eye,
    GraduationCap, Building2, Briefcase,
    CalendarDays, MapPin, Tag, FileText,
    AlertCircle, TrendingUp, Users, Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

type AppStatus = 'pending' | 'under_review' | 'accepted' | 'rejected';

interface Application {
    id: string;
    // Student info
    studentName: string;
    studentLevel: string;
    studentSpecialty: string;
    studentEmail: string;
    studentWilaya: string;
    // Offer info
    company: string;
    companyInitial: string;
    companyWilaya: string;
    role: string;
    domain: string;
    offerDuration: string;
    offerStart: string;
    // Application info
    status: AppStatus;
    submittedAt: string;
    updatedAt: string;
    coverNote: string;
    cvUploaded: boolean;
}

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════════════════════ */

const MOCK_APPLICATIONS: Application[] = [
    {
        id: 'APP-2026-041',
        studentName: 'Mounir Samir', studentLevel: 'L3', studentSpecialty: 'Informatique',
        studentEmail: 's.mounir@ufmc1.dz', studentWilaya: 'Constantine',
        company: 'Mobilis', companyInitial: 'M', companyWilaya: 'Constantine',
        role: 'Mobile Dev Intern', domain: 'Informatique',
        offerDuration: '3 mois', offerStart: 'Juin 2026',
        status: 'pending', submittedAt: '20 Avr 2026', updatedAt: '20 Avr 2026',
        coverNote: 'Je suis très motivé par cette offre car je développe des applications Flutter depuis 2 ans. J\'ai réalisé deux projets personnels disponibles sur GitHub.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-040',
        studentName: 'Rahmani Yasmine', studentLevel: 'M2', studentSpecialty: 'Sécurité',
        studentEmail: 'y.rahmani@ufmc1.dz', studentWilaya: 'Sétif',
        company: 'Algérie Télécom', companyInitial: 'A', companyWilaya: 'Sétif',
        role: 'Cybersecurity Intern', domain: 'Sécurité',
        offerDuration: '3 mois', offerStart: 'Juil 2026',
        status: 'accepted', submittedAt: '15 Avr 2026', updatedAt: '18 Avr 2026',
        coverNote: 'Mon mémoire de M2 porte sur la détection d\'intrusions avec des méthodes de machine learning. Je maîtrise les outils SIEM et les protocoles de sécurité réseau.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-039',
        studentName: 'Hadj Ali Rania', studentLevel: 'M1', studentSpecialty: 'Informatique',
        studentEmail: 'r.hadjali@ufmc1.dz', studentWilaya: 'Alger',
        company: 'Ooredoo Algeria', companyInitial: 'O', companyWilaya: 'Alger',
        role: 'Software Engineering Intern', domain: 'Informatique',
        offerDuration: '3 mois', offerStart: 'Mai 2026',
        status: 'under_review', submittedAt: '27 Avr 2026', updatedAt: '28 Avr 2026',
        coverNote: 'Passionnée par le développement fullstack, j\'ai travaillé sur plusieurs projets Django et React dans le cadre de mes cours. Je cherche à consolider mes compétences en environnement professionnel.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-038',
        studentName: 'Tebbal Omar', studentLevel: 'L3', studentSpecialty: 'Électronique',
        studentEmail: 'o.tebbal@ufmc1.dz', studentWilaya: 'Béjaïa',
        company: 'Cevital Group', companyInitial: 'C', companyWilaya: 'Béjaïa',
        role: 'Industrial Automation Intern', domain: 'Électronique',
        offerDuration: '2 mois', offerStart: 'Juin 2026',
        status: 'pending', submittedAt: '23 Avr 2026', updatedAt: '23 Avr 2026',
        coverNote: 'Je maîtrise la programmation des automates Siemens S7 et j\'ai suivi une formation en SCADA durant ma troisième année.',
        cvUploaded: false,
    },
    {
        id: 'APP-2026-037',
        studentName: 'Benali Ahmed', studentLevel: 'L3', studentSpecialty: 'Informatique',
        studentEmail: 'a.benali@ufmc1.dz', studentWilaya: 'Constantine',
        company: 'Mobilis', companyInitial: 'M', companyWilaya: 'Constantine',
        role: 'Mobile Dev Intern', domain: 'Informatique',
        offerDuration: '3 mois', offerStart: 'Juin 2026',
        status: 'rejected', submittedAt: '05 Avr 2026', updatedAt: '10 Avr 2026',
        coverNote: 'Étudiant en L3 Informatique, je souhaite acquérir une expérience pratique en développement mobile.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-036',
        studentName: 'Zeroual Imane', studentLevel: 'M1', studentSpecialty: 'Automatique',
        studentEmail: 'i.zeroual@ufmc1.dz', studentWilaya: 'Annaba',
        company: 'Sonatrach', companyInitial: 'S', companyWilaya: 'Hassi Messaoud',
        role: 'Control Systems Intern', domain: 'Automatique',
        offerDuration: '3 mois', offerStart: 'Juin 2026',
        status: 'accepted', submittedAt: '08 Avr 2026', updatedAt: '12 Avr 2026',
        coverNote: 'Spécialisée en systèmes de contrôle industriel, j\'ai réalisé mon projet de fin d\'année sur la régulation PID appliquée aux systèmes hydrauliques.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-035',
        studentName: 'Mounir Samir', studentLevel: 'L3', studentSpecialty: 'Informatique',
        studentEmail: 's.mounir@ufmc1.dz', studentWilaya: 'Constantine',
        company: 'Ooredoo Algeria', companyInitial: 'O', companyWilaya: 'Alger',
        role: 'IT Support Intern', domain: 'Informatique',
        offerDuration: '2 mois', offerStart: 'Juin 2026',
        status: 'rejected', submittedAt: '12 Avr 2026', updatedAt: '16 Avr 2026',
        coverNote: 'Je souhaite découvrir l\'environnement IT d\'un opérateur télécom majeur et développer mes compétences en support et infrastructure.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-034',
        studentName: 'Mansouri Sara', studentLevel: 'M2', studentSpecialty: 'Informatique',
        studentEmail: 's.mansouri@ufmc1.dz', studentWilaya: 'Constantine',
        company: 'Cevital Group', companyInitial: 'C', companyWilaya: 'Béjaïa',
        role: 'Data Engineer Intern', domain: 'Informatique',
        offerDuration: '3 mois', offerStart: 'Mar 2026',
        status: 'accepted', submittedAt: '02 Mar 2026', updatedAt: '05 Mar 2026',
        coverNote: 'Mon mémoire de master porte sur les pipelines de données temps réel avec Apache Kafka. Je maîtrise Python, SQL et les outils BI.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-033',
        studentName: 'Hadj Ali Rania', studentLevel: 'M1', studentSpecialty: 'Informatique',
        studentEmail: 'r.hadjali@ufmc1.dz', studentWilaya: 'Alger',
        company: 'Air Algérie', companyInitial: 'A', companyWilaya: 'Alger',
        role: 'IT Systems Intern', domain: 'Informatique',
        offerDuration: '3 mois', offerStart: 'Juin 2026',
        status: 'pending', submittedAt: '22 Avr 2026', updatedAt: '22 Avr 2026',
        coverNote: 'Je m\'intéresse aux systèmes d\'information critiques et à leur administration. L\'environnement d\'Air Algérie représente pour moi une opportunité unique.',
        cvUploaded: true,
    },
    {
        id: 'APP-2026-032',
        studentName: 'Kerboua Lyna', studentLevel: 'M1', studentSpecialty: 'Réseaux',
        studentEmail: 'l.kerboua@ufmc1.dz', studentWilaya: 'Sétif',
        company: 'Sonatrach', companyInitial: 'S', companyWilaya: 'Hassi Messaoud',
        role: 'Network Engineering Intern', domain: 'Télécom',
        offerDuration: '3 mois', offerStart: 'Mai 2026',
        status: 'accepted', submittedAt: '01 Avr 2026', updatedAt: '04 Avr 2026',
        coverNote: 'Certifiée CCNA, je cherche à approfondir mes compétences sur les infrastructures réseau industrielles et les protocoles utilisés dans les environnements pétroliers.',
        cvUploaded: true,
    },
];

/* ══════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<AppStatus, {
    label: string; cls: string; icon: React.ElementType; dotCls: string;
}> = {
    pending: { label: 'Pending', cls: 'as-pending', icon: Clock, dotCls: 'dot-amber' },
    under_review: { label: 'Under Review', cls: 'as-review', icon: Eye, dotCls: 'dot-blue' },
    accepted: { label: 'Accepted', cls: 'as-accepted', icon: CheckCircle, dotCls: 'dot-green' },
    rejected: { label: 'Rejected', cls: 'as-rejected', icon: XCircle, dotCls: 'dot-red' },
};

const TABS = ['All', 'Pending', 'Under Review', 'Accepted', 'Rejected'] as const;
type Tab = typeof TABS[number];

const tabStatusMap: Record<Tab, AppStatus | null> = {
    'All': null,
    'Pending': 'pending',
    'Under Review': 'under_review',
    'Accepted': 'accepted',
    'Rejected': 'rejected',
};

const DOMAINS = ['All Domains', 'Informatique', 'Électronique', 'Télécom', 'Sécurité', 'Automatique'];

const domainColor: Record<string, string> = {
    'Informatique': 'dom-info',
    'Électronique': 'dom-elec',
    'Télécom': 'dom-tel',
    'Sécurité': 'dom-sec',
    'Automatique': 'dom-auto',
};

const companyLogoColor = (initial: string): string => {
    const map: Record<string, string> = {
        S: '#1a4f3a', M: '#1d4ed8', O: '#7c3aed',
        A: '#0f766e', C: '#b45309',
    };
    return map[initial] ?? '#6b6860';
};

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════ */

/* ── Application card row ── */
const ApplicationCard: React.FC<{
    app: Application;
    selected: boolean;
    index: number;
    onClick: () => void;
}> = ({ app: a, selected, index, onClick }) => {
    const cfg = STATUS_CONFIG[a.status];
    return (
        <motion.div
            className={`app-card ${selected ? 'selected' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            onClick={onClick}
        >
            {/* Company logo */}
            <div
                className="app-company-logo"
                style={{ background: companyLogoColor(a.companyInitial) }}
            >
                {a.companyInitial}
            </div>

            {/* Center info */}
            <div className="app-card-body">
                <div className="app-card-top">
                    <span className="app-card-role">{a.role}</span>
                    {!a.cvUploaded && (
                        <span className="app-no-cv-badge">
                            <AlertCircle size={10} /> No CV
                        </span>
                    )}
                </div>
                <div className="app-card-parties">
                    <span className="app-party student">
                        <GraduationCap size={11} />
                        {a.studentName}
                        <span className="app-party-sub">{a.studentLevel} · {a.studentSpecialty}</span>
                    </span>
                    <span className="app-party-arrow">→</span>
                    <span className="app-party company">
                        <Building2 size={11} />
                        {a.company}
                        <span className="app-party-sub">{a.companyWilaya}</span>
                    </span>
                </div>
                <div className="app-card-meta">
                    <span><Tag size={11} />
                        <span className={`off-domain-tag ${domainColor[a.domain] || ''}`} style={{ fontSize: 10 }}>
                            {a.domain}
                        </span>
                    </span>
                    <span><CalendarDays size={11} />{a.submittedAt}</span>
                    <span><MapPin size={11} />{a.studentWilaya}</span>
                </div>
            </div>

            {/* Right: status + id */}
            <div className="app-card-right">
                <span className="app-card-id">{a.id}</span>
                <span className={`app-status-badge ${cfg.cls}`}>
                    <cfg.icon size={10} />
                    {cfg.label}
                </span>
                <ChevronRight size={13} className="off-chevron" />
            </div>
        </motion.div>
    );
};

/* ── Detail drawer ── */
const ApplicationDrawer: React.FC<{
    app: Application;
    onClose: () => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onReview: (id: string) => void;
}> = ({ app: a, onClose, onAccept, onReject, onReview }) => {
    const cfg = STATUS_CONFIG[a.status];

    return (
        <motion.aside
            className="app-drawer"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            {/* Head */}
            <div className="app-drawer-head">
                <div
                    className="app-drawer-logo"
                    style={{ background: companyLogoColor(a.companyInitial) }}
                >
                    {a.companyInitial}
                </div>
                <div className="app-drawer-title">
                    <h2>{a.role}</h2>
                    <span>{a.company} · {a.companyWilaya}</span>
                </div>
                <button className="off-drawer-close" onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            {/* Status row */}
            <div className="app-drawer-status-row">
                <span className={`app-status-pill ${cfg.cls}`}>
                    <cfg.icon size={12} />
                    {cfg.label}
                </span>
                <span className="app-drawer-id">{a.id}</span>
            </div>

            {/* Parties */}
            <div className="app-drawer-parties">
                {/* Student */}
                <div className="app-party-block">
                    <div className="app-party-block-head">
                        <GraduationCap size={13} />
                        <span>Student</span>
                    </div>
                    <div className="app-party-block-body">
                        <span className="app-pb-name">{a.studentName}</span>
                        <span className="app-pb-sub">{a.studentLevel} · {a.studentSpecialty}</span>
                        <a href={`mailto:${a.studentEmail}`} className="app-pb-email">
                            <Mail size={11} /> {a.studentEmail}
                        </a>
                        <span className="app-pb-sub"><MapPin size={10} /> {a.studentWilaya}</span>
                    </div>
                </div>

                {/* Offer */}
                <div className="app-party-block">
                    <div className="app-party-block-head">
                        <Briefcase size={13} />
                        <span>Offer Details</span>
                    </div>
                    <div className="app-party-block-body">
                        <span className="app-pb-name">{a.role}</span>
                        <span className="app-pb-sub">{a.company}</span>
                        <span className="app-pb-sub"><CalendarDays size={10} /> {a.offerDuration} · {a.offerStart}</span>
                        <span className="app-pb-sub"><MapPin size={10} /> {a.companyWilaya}</span>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="app-timeline">
                <div className="app-timeline-item">
                    <div className="app-tl-dot tl-submitted" />
                    <div>
                        <span className="app-tl-label">Submitted</span>
                        <span className="app-tl-date">{a.submittedAt}</span>
                    </div>
                </div>
                {a.status !== 'pending' && (
                    <div className="app-timeline-item">
                        <div className={`app-tl-dot tl-${a.status}`} />
                        <div>
                            <span className="app-tl-label">{cfg.label}</span>
                            <span className="app-tl-date">{a.updatedAt}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Cover note */}
            <div className="app-drawer-section">
                <h3><FileText size={12} /> Cover Note</h3>
                <p>{a.coverNote}</p>
            </div>

            {/* CV status */}
            <div className="app-drawer-section">
                <h3><FileText size={12} /> CV</h3>
                {a.cvUploaded ? (
                    <div className="app-cv-row">
                        <span className="app-cv-name">
                            <CheckCircle size={13} style={{ color: 'var(--green)' }} />
                            {a.studentName.replace(' ', '_').toLowerCase()}_cv.pdf
                        </span>
                        <button className="adm-action-icon" title="Download CV">
                            <TrendingUp size={13} />
                        </button>
                    </div>
                ) : (
                    <div className="app-cv-missing">
                        <AlertCircle size={13} />
                        No CV uploaded by student
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="app-drawer-actions">
                {a.status === 'pending' && (
                    <button className="app-action-btn review" onClick={() => onReview(a.id)}>
                        <Eye size={14} /> Mark Under Review
                    </button>
                )}
                {(a.status === 'pending' || a.status === 'under_review') && (
                    <>
                        <button className="app-action-btn accept" onClick={() => onAccept(a.id)}>
                            <CheckCircle size={14} /> Accept Application
                        </button>
                        <button className="app-action-btn reject" onClick={() => onReject(a.id)}>
                            <XCircle size={14} /> Reject Application
                        </button>
                    </>
                )}
                {(a.status === 'accepted' || a.status === 'rejected') && (
                    <div className={`app-final-state ${a.status === 'accepted' ? 'state-accepted' : 'state-rejected'}`}>
                        {a.status === 'accepted'
                            ? <><CheckCircle size={15} /> Application accepted — convention can be generated</>
                            : <><XCircle size={15} /> Application has been rejected</>
                        }
                    </div>
                )}
            </div>
        </motion.aside>
    );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */

const ADMApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
    const [activeTab, setActiveTab] = useState<Tab>('All');
    const [search, setSearch] = useState('');
    const [domainFilter, setDomainFilter] = useState('All Domains');
    const [selected, setSelected] = useState<Application | null>(null);

    /* ── Filter ── */
    const filtered = useMemo(() => {
        const tabStatus = tabStatusMap[activeTab];
        return applications.filter(a => {
            const tMatch = !tabStatus || a.status === tabStatus;
            const dMatch = domainFilter === 'All Domains' || a.domain === domainFilter;
            const sMatch =
                a.studentName.toLowerCase().includes(search.toLowerCase()) ||
                a.company.toLowerCase().includes(search.toLowerCase()) ||
                a.role.toLowerCase().includes(search.toLowerCase()) ||
                a.id.toLowerCase().includes(search.toLowerCase());
            return tMatch && dMatch && sMatch;
        });
    }, [applications, activeTab, domainFilter, search]);

    const tabCount = (tab: Tab) => {
        const s = tabStatusMap[tab];
        return !s ? applications.length : applications.filter(a => a.status === s).length;
    };

    /* ── Summary counts ── */
    const counts = useMemo(() => ({
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        under_review: applications.filter(a => a.status === 'under_review').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }), [applications]);

    /* ── Actions (swap setTimeout → real API call later) ── */
    const updateStatus = (id: string, status: AppStatus) => {
        setApplications(prev =>
            prev.map(a => a.id === id ? { ...a, status, updatedAt: '28 Avr 2026' } : a)
        );
        setSelected(prev => prev?.id === id ? { ...prev, status, updatedAt: '28 Avr 2026' } : prev);
    };

    const handleAccept = (id: string) => updateStatus(id, 'accepted');
    const handleReject = (id: string) => updateStatus(id, 'rejected');
    const handleReview = (id: string) => updateStatus(id, 'under_review');

    return (
        <DashboardLayout pageTitle="Applications"
        >
            {/* ── Summary strip ── */}
            <div className="app-summary-strip">
                {[
                    { label: 'Total', val: counts.total, icon: Users, cls: 'sum-total' },
                    { label: 'Pending', val: counts.pending, icon: Clock, cls: 'sum-amber' },
                    { label: 'Under Review', val: counts.under_review, icon: Eye, cls: 'sum-blue' },
                    { label: 'Accepted', val: counts.accepted, icon: CheckCircle, cls: 'sum-green' },
                    { label: 'Rejected', val: counts.rejected, icon: XCircle, cls: 'sum-red' },
                ].map(s => (
                    <div key={s.label} className={`app-sum-card ${s.cls}`}>
                        <s.icon size={15} />
                        <span className="app-sum-val">{s.val}</span>
                        <span className="app-sum-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="app-toolbar">
                <div className="off-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`off-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            <span className={`off-tab-count ${tab === 'Pending' ? 'count-amber' :
                                tab === 'Under Review' ? 'count-blue' :
                                    tab === 'Rejected' ? 'count-red' : ''
                                }`}>
                                {tabCount(tab)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="app-filters">
                    <div className="off-search" style={{ minWidth: 210 }}>
                        <Search size={13} />
                        <input
                            type="text"
                            placeholder="Search student, company, role…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="off-clear">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <div className="off-selects">
                        <Filter size={13} className="filter-icon" />
                        <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
                            {DOMAINS.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Results bar ── */}
            <div className="stu-results-bar">
                <span>{filtered.length} application{filtered.length !== 1 ? 's' : ''} found</span>
                {(search || domainFilter !== 'All Domains') && (
                    <button className="stu-clear-all" onClick={() => {
                        setSearch(''); setDomainFilter('All Domains');
                    }}>
                        <X size={11} /> Clear filters
                    </button>
                )}
            </div>

            {/* ── Main split ── */}
            <div className={`app-layout ${selected ? 'with-drawer' : ''}`}>

                {/* List */}
                <div className="app-list">
                    {filtered.length === 0 ? (
                        <div className="off-empty">
                            <FileText size={32} />
                            <p>No applications match your filters.</p>
                        </div>
                    ) : (
                        filtered.map((a, i) => (
                            <ApplicationCard
                                key={a.id}
                                app={a}
                                selected={selected?.id === a.id}
                                index={i}
                                onClick={() => setSelected(a)}
                            />
                        ))
                    )}
                </div>

                {/* Drawer */}
                <AnimatePresence>
                    {selected && (
                        <ApplicationDrawer
                            key={selected.id}
                            app={selected}
                            onClose={() => setSelected(null)}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onReview={handleReview}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default ADMApplicationsPage;