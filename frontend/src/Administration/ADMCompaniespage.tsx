import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
    Search, X, ChevronRight, Filter,
    CheckCircle, Clock, XCircle, Building2,
    MapPin, Mail, Phone, Globe, Briefcase,
    FileText, Users, Star, CalendarDays,
    TrendingUp, AlertCircle, ShieldCheck,
    LayoutGrid, List,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CompanyStatus = 'approved' | 'pending' | 'rejected' | 'suspended';

interface CompanyOffer {
    id: string;
    role: string;
    status: 'approved' | 'pending' | 'rejected';
    postedAt: string;
    applications: number;
}

interface CompanyConvention {
    id: string;
    student: string;
    status: string;
    year: string;
}

interface Company {
    id: string;
    name: string;
    initial: string;
    sector: string;
    wilaya: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    contactPerson: string;
    contactTitle: string;
    status: CompanyStatus;
    registeredAt: string;
    approvedAt: string | null;
    totalOffers: number;
    activeOffers: number;
    totalConventions: number;
    totalApplications: number;
    rating: number; // 1–5 internal university rating
    offers: CompanyOffer[];
    conventions: CompanyConvention[];
    description: string;
    verified: boolean;
}

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════════════════════ */

const MOCK_COMPANIES: Company[] = [
    {
        id: 'CO-001', name: 'Sonatrach', initial: 'S',
        sector: 'Énergie & Pétrole', wilaya: 'Alger',
        address: 'Djenane El Malik, Hydra, Alger',
        email: 'rh@sonatrach.dz', phone: '021 54 60 00',
        website: 'sonatrach.dz', contactPerson: 'Bouhali Karim',
        contactTitle: 'Directeur RH', status: 'approved',
        registeredAt: 'Jan 2024', approvedAt: 'Jan 2024',
        totalOffers: 12, activeOffers: 3, totalConventions: 9,
        totalApplications: 87, rating: 5, verified: true,
        description: 'Société nationale des hydrocarbures, premier groupe industriel africain. Partenaire universitaire privilégié depuis 2024, accueille des stagiaires en informatique, automatique et génie des procédés.',
        offers: [
            { id: 'OF-2026-092', role: 'Software Engineering Intern', status: 'approved', postedAt: '20 Avr 2026', applications: 14 },
            { id: 'OF-2026-085', role: 'Network Engineering Intern', status: 'approved', postedAt: '10 Avr 2026', applications: 9 },
            { id: 'OF-2026-080', role: 'Control Systems Intern', status: 'pending', postedAt: '28 Avr 2026', applications: 2 },
        ],
        conventions: [
            { id: 'CV-2026-080', student: 'Kerboua Lyna', status: 'complete', year: '2026' },
            { id: 'CV-2026-074', student: 'Zeroual Imane', status: 'signed_company', year: '2026' },
            { id: 'CV-2026-032', student: 'Ouali Karim', status: 'complete', year: '2025' },
        ],
    },
    {
        id: 'CO-002', name: 'Mobilis', initial: 'M',
        sector: 'Télécommunications', wilaya: 'Alger',
        address: '1 Rue Kaddour Rahim, Hussein-Dey, Alger',
        email: 'stages@mobilis.dz', phone: '021 23 30 00',
        website: 'mobilis.dz', contactPerson: 'Amara Sihem',
        contactTitle: 'Responsable Relations Universités', status: 'approved',
        registeredAt: 'Mar 2024', approvedAt: 'Mar 2024',
        totalOffers: 8, activeOffers: 2, totalConventions: 5,
        totalApplications: 43, rating: 4, verified: true,
        description: 'Opérateur télécom national, filiale d\'Algérie Télécom. Accueille des stagiaires en développement mobile, réseaux et marketing digital. Environnement jeune et dynamique.',
        offers: [
            { id: 'OF-2026-088', role: 'Mobile Dev Intern', status: 'approved', postedAt: '26 Avr 2026', applications: 11 },
            { id: 'OF-2026-079', role: 'DevOps Intern', status: 'approved', postedAt: '15 Avr 2026', applications: 5 },
        ],
        conventions: [
            { id: 'CV-2026-079', student: 'Mounir Samir', status: 'signed_student', year: '2026' },
            { id: 'CV-2025-041', student: 'Messad Walid', status: 'complete', year: '2025' },
        ],
    },
    {
        id: 'CO-003', name: 'Condor Electronics', initial: 'C',
        sector: 'Industrie Électronique', wilaya: 'Bordj Bou Arréridj',
        address: 'Zone Industrielle, Bordj Bou Arréridj',
        email: 'rh@condor.dz', phone: '035 68 71 00',
        website: 'condor.dz', contactPerson: 'Benmohamed Anis',
        contactTitle: 'Chef du Service RH', status: 'approved',
        registeredAt: 'Fév 2024', approvedAt: 'Fév 2024',
        totalOffers: 6, activeOffers: 1, totalConventions: 4,
        totalApplications: 28, rating: 4, verified: true,
        description: 'Premier groupe électronique algérien. Fabricant de téléviseurs, électroménager et smartphones. Les stagiaires participent aux équipes R&D, production et contrôle qualité.',
        offers: [
            { id: 'OF-2026-087', role: 'Embedded Systems Intern', status: 'approved', postedAt: '25 Avr 2026', applications: 6 },
        ],
        conventions: [
            { id: 'CV-2026-081', student: 'Benali Ahmed', status: 'stamped', year: '2026' },
            { id: 'CV-2025-038', student: 'Lahcen Riad', status: 'complete', year: '2025' },
        ],
    },
    {
        id: 'CO-004', name: 'Ooredoo Algeria', initial: 'O',
        sector: 'Télécommunications', wilaya: 'Alger',
        address: 'Bâtiment Orascom, Chemin des Glycines, Alger',
        email: 'hr@ooredoo.dz', phone: '021 71 10 00',
        website: 'ooredoo.dz', contactPerson: 'Cherif Nadia',
        contactTitle: 'HR Business Partner', status: 'approved',
        registeredAt: 'Avr 2024', approvedAt: 'Avr 2024',
        totalOffers: 5, activeOffers: 1, totalConventions: 3,
        totalApplications: 31, rating: 4, verified: true,
        description: 'Opérateur télécom international présent en Algérie. Accueille des stagiaires en réseaux, cybersécurité et développement logiciel. Environnement international, encadrement professionnel.',
        offers: [
            { id: 'OF-2026-089', role: 'Network Engineering Intern', status: 'approved', postedAt: '27 Avr 2026', applications: 8 },
        ],
        conventions: [
            { id: 'CV-2025-052', student: 'Benkhelif Omar', status: 'complete', year: '2025' },
        ],
    },
    {
        id: 'CO-005', name: 'Cevital Group', initial: 'C',
        sector: 'Agroalimentaire & Industrie', wilaya: 'Béjaïa',
        address: 'Port de Béjaïa, Béjaïa',
        email: 'stages@cevital.com', phone: '034 11 90 00',
        website: 'cevital.com', contactPerson: 'Idir Sonia',
        contactTitle: 'Responsable Ressources Humaines', status: 'pending',
        registeredAt: '28 Avr 2026', approvedAt: null,
        totalOffers: 2, activeOffers: 0, totalConventions: 0,
        totalApplications: 3, rating: 0, verified: false,
        description: 'Premier groupe privé algérien, actif dans l\'agroalimentaire, l\'immobilier et l\'industrie. Candidature récente — en attente de validation par l\'administration universitaire.',
        offers: [
            { id: 'OF-2026-090', role: 'Industrial Automation Intern', status: 'pending', postedAt: '28 Avr 2026', applications: 3 },
        ],
        conventions: [],
    },
    {
        id: 'CO-006', name: 'Algérie Télécom', initial: 'A',
        sector: 'Télécommunications', wilaya: 'Alger',
        address: '1 Rue Docteur Saâdane, Alger-Centre',
        email: 'dsi@algerietelecom.dz', phone: '021 73 10 00',
        website: 'algerietelecom.dz', contactPerson: 'Meziane Fouad',
        contactTitle: 'Directeur DSI', status: 'approved',
        registeredAt: 'Jan 2024', approvedAt: 'Jan 2024',
        totalOffers: 7, activeOffers: 1, totalConventions: 5,
        totalApplications: 39, rating: 3, verified: true,
        description: 'Opérateur national historique des télécommunications. Infrastructure nationale couvrant réseau fixe, ADSL et fibre optique. Accueille des stagiaires en réseaux, sécurité et systèmes.',
        offers: [
            { id: 'OF-2026-078', role: 'Cybersecurity Intern', status: 'approved', postedAt: '24 Avr 2026', applications: 7 },
        ],
        conventions: [
            { id: 'CV-2026-078', student: 'Rahmani Yasmine', status: 'sent_student', year: '2026' },
            { id: 'CV-2025-044', student: 'Hadjab Meriem', status: 'complete', year: '2025' },
        ],
    },
    {
        id: 'CO-007', name: 'Air Algérie', initial: 'A',
        sector: 'Transport Aérien', wilaya: 'Alger',
        address: 'Aéroport Houari Boumediene, Dar El Beïda, Alger',
        email: 'dsi@airalgerie.dz', phone: '021 50 25 00',
        website: 'airalgerie.dz', contactPerson: 'Boudjelal Hocine',
        contactTitle: 'Responsable Informatique', status: 'approved',
        registeredAt: 'Jun 2024', approvedAt: 'Jun 2024',
        totalOffers: 4, activeOffers: 1, totalConventions: 2,
        totalApplications: 18, rating: 3, verified: true,
        description: 'Compagnie aérienne nationale algérienne. Accueille des stagiaires en informatique, systèmes embarqués et maintenance. Environnement technique exigeant avec des standards internationaux.',
        offers: [
            { id: 'OF-2026-086', role: 'IT Systems Intern', status: 'approved', postedAt: '24 Avr 2026', applications: 5 },
        ],
        conventions: [
            { id: 'CV-2025-031', student: 'Bensalem Amine', status: 'complete', year: '2025' },
        ],
    },
    {
        id: 'CO-008', name: 'Transbois Algérie', initial: 'T',
        sector: 'Logistique', wilaya: 'Sétif',
        address: 'Zone d\'Activité, Sétif',
        email: 'rh@transbois.dz', phone: '036 84 12 00',
        website: 'transbois.dz', contactPerson: 'Hamidi Rachid',
        contactTitle: 'Gérant', status: 'pending',
        registeredAt: '27 Avr 2026', approvedAt: null,
        totalOffers: 1, activeOffers: 0, totalConventions: 0,
        totalApplications: 0, rating: 0, verified: false,
        description: 'Entreprise de logistique et transport basée à Sétif. Première demande de partenariat — dossier en cours d\'examen.',
        offers: [],
        conventions: [],
    },
];

/* ══════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<CompanyStatus, {
    label: string; cls: string; icon: React.ElementType;
}> = {
    approved: { label: 'Approved', cls: 'cos-approved', icon: CheckCircle },
    pending: { label: 'Pending', cls: 'cos-pending', icon: Clock },
    rejected: { label: 'Rejected', cls: 'cos-rejected', icon: XCircle },
    suspended: { label: 'Suspended', cls: 'cos-suspended', icon: AlertCircle },
};

const OFFER_STATUS: Record<string, { cls: string }> = {
    approved: { cls: 'app-accepted' },
    pending: { cls: 'app-pending' },
    rejected: { cls: 'app-rejected' },
};

const TABS = ['All', 'Approved', 'Pending', 'Rejected', 'Suspended'] as const;
type Tab = typeof TABS[number];

const tabStatusMap: Record<Tab, CompanyStatus | null> = {
    'All': null, 'Approved': 'approved', 'Pending': 'pending',
    'Rejected': 'rejected', 'Suspended': 'suspended',
};

const SECTORS = [
    'All Sectors', 'Énergie & Pétrole', 'Télécommunications',
    'Industrie Électronique', 'Agroalimentaire & Industrie',
    'Transport Aérien', 'Logistique',
];

const LOGO_COLORS: Record<string, string> = {
    'CO-001': '#1a4f3a', 'CO-002': '#1d4ed8', 'CO-003': '#b45309',
    'CO-004': '#7c3aed', 'CO-005': '#0f766e', 'CO-006': '#be123c',
    'CO-007': '#075985', 'CO-008': '#92400e',
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="co-stars">
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                size={11}
                className={i <= rating ? 'star-filled' : 'star-empty'}
            />
        ))}
    </div>
);

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════ */

/* ── Company card (list view) ── */
const CompanyCard: React.FC<{
    company: Company;
    selected: boolean;
    index: number;
    onClick: () => void;
}> = ({ company: c, selected, index, onClick }) => {
    const cfg = STATUS_CONFIG[c.status];
    return (
        <motion.div
            className={`co-card ${selected ? 'selected' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={onClick}
        >
            {/* Logo */}
            <div className="co-card-logo" style={{ background: LOGO_COLORS[c.id] }}>
                {c.initial}
            </div>

            {/* Body */}
            <div className="co-card-body">
                <div className="co-card-top">
                    <span className="co-card-name">{c.name}</span>
                    {c.verified && (
                        <span className="co-verified-badge">
                            <ShieldCheck size={10} /> Verified
                        </span>
                    )}
                    <span className={`co-status-badge ${cfg.cls}`}>
                        <cfg.icon size={10} /> {cfg.label}
                    </span>
                </div>
                <span className="co-card-sector">{c.sector}</span>
                <div className="co-card-meta">
                    <span><MapPin size={11} />{c.wilaya}</span>
                    <span><Briefcase size={11} />{c.totalOffers} offers</span>
                    <span><FileText size={11} />{c.totalConventions} conventions</span>
                    <span><Users size={11} />{c.totalApplications} applications</span>
                </div>
            </div>

            {/* Right */}
            <div className="co-card-right">
                {c.rating > 0
                    ? <StarRating rating={c.rating} />
                    : <span className="co-no-rating">Not rated</span>
                }
                <span className="co-card-since">Since {c.registeredAt}</span>
                <ChevronRight size={13} className="off-chevron" />
            </div>
        </motion.div>
    );
};

/* ── Company grid card ── */
const CompanyGridCard: React.FC<{
    company: Company;
    selected: boolean;
    index: number;
    onClick: () => void;
}> = ({ company: c, selected, index, onClick }) => {
    const cfg = STATUS_CONFIG[c.status];
    return (
        <motion.div
            className={`co-grid-card ${selected ? 'selected' : ''}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
            onClick={onClick}
        >
            <div className="co-grid-top">
                <div className="co-grid-logo" style={{ background: LOGO_COLORS[c.id] }}>
                    {c.initial}
                </div>
                <span className={`co-status-badge ${cfg.cls}`}>
                    <cfg.icon size={10} /> {cfg.label}
                </span>
            </div>
            <div className="co-grid-name">
                {c.name}
                {c.verified && <ShieldCheck size={12} className="co-grid-verified" />}
            </div>
            <div className="co-grid-sector">{c.sector}</div>
            <div className="co-grid-meta">
                <span><MapPin size={10} />{c.wilaya}</span>
                {c.rating > 0 && <StarRating rating={c.rating} />}
            </div>
            <div className="co-grid-stats">
                <div className="co-grid-stat">
                    <span>{c.totalOffers}</span>
                    <span>Offers</span>
                </div>
                <div className="co-grid-stat">
                    <span>{c.totalConventions}</span>
                    <span>Conventions</span>
                </div>
                <div className="co-grid-stat">
                    <span>{c.totalApplications}</span>
                    <span>Applications</span>
                </div>
            </div>
        </motion.div>
    );
};

/* ── Company detail drawer ── */
const CompanyDrawer: React.FC<{
    company: Company;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onSuspend: (id: string) => void;
}> = ({ company: c, onClose, onApprove, onReject, onSuspend }) => {
    const [drawerTab, setDrawerTab] = useState<'profile' | 'offers' | 'conventions'>('profile');
    const cfg = STATUS_CONFIG[c.status];

    React.useEffect(() => { setDrawerTab('profile'); }, [c.id]);

    return (
        <motion.aside
            className="co-drawer"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            {/* Head */}
            <div className="co-drawer-head">
                <div className="co-drawer-logo" style={{ background: LOGO_COLORS[c.id] }}>
                    {c.initial}
                </div>
                <div className="co-drawer-identity">
                    <div className="co-drawer-name-row">
                        <h2>{c.name}</h2>
                        {c.verified && <ShieldCheck size={14} className="co-drawer-verified" />}
                    </div>
                    <span className="co-drawer-sector">{c.sector}</span>
                    <span className={`co-status-badge ${cfg.cls}`} style={{ marginTop: 4 }}>
                        <cfg.icon size={10} /> {cfg.label}
                    </span>
                </div>
                <button className="off-drawer-close" onClick={onClose}><X size={16} /></button>
            </div>

            {/* Inner tabs */}
            <div className="stu-drawer-tabs">
                {(['profile', 'offers', 'conventions'] as const).map(t => (
                    <button
                        key={t}
                        className={`stu-drawer-tab ${drawerTab === t ? 'active' : ''}`}
                        onClick={() => setDrawerTab(t)}
                    >
                        {t === 'profile' && <><Building2 size={12} /> Profile</>}
                        {t === 'offers' && <><Briefcase size={12} /> Offers <span className="stu-dtab-count">{c.offers.length}</span></>}
                        {t === 'conventions' && <><FileText size={12} /> Conventions <span className="stu-dtab-count">{c.conventions.length}</span></>}
                    </button>
                ))}
            </div>

            {/* ── Profile tab ── */}
            {drawerTab === 'profile' && (
                <div className="co-drawer-body">
                    {/* Stats */}
                    <div className="co-stats-grid">
                        {[
                            { icon: Briefcase, label: 'Total Offers', val: c.totalOffers },
                            { icon: TrendingUp, label: 'Active Offers', val: c.activeOffers },
                            { icon: FileText, label: 'Conventions', val: c.totalConventions },
                            { icon: Users, label: 'Applications', val: c.totalApplications },
                        ].map(s => (
                            <div key={s.label} className="co-stat-card">
                                <s.icon size={14} />
                                <span className="co-stat-val">{s.val}</span>
                                <span className="co-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Rating */}
                    {c.rating > 0 && (
                        <div className="co-rating-row">
                            <span className="co-rating-label">University Rating</span>
                            <div className="co-rating-stars">
                                <StarRating rating={c.rating} />
                                <span className="co-rating-val">{c.rating}/5</span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="co-description">
                        <p>{c.description}</p>
                    </div>

                    {/* Contact info */}
                    <div className="co-contact-grid">
                        {[
                            { icon: MapPin, label: 'Address', value: c.address },
                            { icon: Mail, label: 'Email', value: c.email },
                            { icon: Phone, label: 'Phone', value: c.phone },
                            { icon: Globe, label: 'Website', value: c.website },
                            { icon: Users, label: 'Contact', value: `${c.contactPerson} — ${c.contactTitle}` },
                            { icon: CalendarDays, label: 'Registered', value: c.registeredAt },
                            { icon: CheckCircle, label: 'Approved', value: c.approvedAt ?? '—' },
                        ].map(d => (
                            <div key={d.label} className="stu-detail-row">
                                <span className="stu-detail-icon"><d.icon size={13} /></span>
                                <div>
                                    <span className="stu-detail-label">{d.label}</span>
                                    <span className="stu-detail-value">{d.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="co-drawer-actions">
                        {c.status === 'pending' && (
                            <>
                                <button className="co-action-btn approve" onClick={() => onApprove(c.id)}>
                                    <CheckCircle size={14} /> Approve Partner
                                </button>
                                <button className="co-action-btn reject" onClick={() => onReject(c.id)}>
                                    <XCircle size={14} /> Reject
                                </button>
                            </>
                        )}
                        {c.status === 'approved' && (
                            <button className="co-action-btn suspend" onClick={() => onSuspend(c.id)}>
                                <AlertCircle size={14} /> Suspend Partnership
                            </button>
                        )}
                        {c.status === 'suspended' && (
                            <button className="co-action-btn approve" onClick={() => onApprove(c.id)}>
                                <CheckCircle size={14} /> Reactivate Partner
                            </button>
                        )}
                        {c.status === 'rejected' && (
                            <div className="co-final-rejected">
                                <XCircle size={14} /> Partnership request rejected
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Offers tab ── */}
            {drawerTab === 'offers' && (
                <div className="co-drawer-body">
                    {c.offers.length === 0 ? (
                        <div className="stu-empty">
                            <Briefcase size={28} />
                            <p>No offers posted yet.</p>
                        </div>
                    ) : (
                        <div className="co-offers-list">
                            {c.offers.map(o => (
                                <div key={o.id} className="co-offer-item">
                                    <div className="co-offer-info">
                                        <span className="co-offer-role">{o.role}</span>
                                        <span className="co-offer-id">{o.id}</span>
                                        <span className="co-offer-date"><CalendarDays size={10} />{o.postedAt}</span>
                                    </div>
                                    <div className="co-offer-right">
                                        <span className={`app-status-badge ${OFFER_STATUS[o.status].cls}`}>
                                            {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                                        </span>
                                        <span className="co-offer-apps">
                                            <Users size={10} /> {o.applications} applicants
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Conventions tab ── */}
            {drawerTab === 'conventions' && (
                <div className="co-drawer-body">
                    {c.conventions.length === 0 ? (
                        <div className="stu-empty">
                            <FileText size={28} />
                            <p>No conventions yet.</p>
                            <span>Conventions are created after applications are accepted.</span>
                        </div>
                    ) : (
                        <div className="co-conv-list">
                            {c.conventions.map(cv => (
                                <div key={cv.id} className="co-conv-item">
                                    <div className="co-conv-info">
                                        <span className="co-conv-id">{cv.id}</span>
                                        <span className="co-conv-student">
                                            <Users size={11} /> {cv.student}
                                        </span>
                                    </div>
                                    <div className="co-conv-right">
                                        <span className="co-conv-year">{cv.year}</span>
                                        <span className={`cv-status-badge ${cv.status === 'complete' ? 'cs-complete' :
                                            cv.status === 'stamped' ? 'cs-stamped' : 'cs-sent'
                                            }`} style={{ fontSize: 10 }}>
                                            {cv.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </motion.aside>
    );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */

const ADMCompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
    const [activeTab, setActiveTab] = useState<Tab>('All');
    const [search, setSearch] = useState('');
    const [sectorFilter, setSectorFilter] = useState('All Sectors');
    const [selected, setSelected] = useState<Company | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    /* ── Filter ── */
    const filtered = useMemo(() => {
        const tabStatus = tabStatusMap[activeTab];
        return companies.filter(c => {
            const tMatch = !tabStatus || c.status === tabStatus;
            const sMatch = sectorFilter === 'All Sectors' || c.sector === sectorFilter;
            const qMatch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.sector.toLowerCase().includes(search.toLowerCase()) ||
                c.wilaya.toLowerCase().includes(search.toLowerCase());
            return tMatch && sMatch && qMatch;
        });
    }, [companies, activeTab, sectorFilter, search]);

    const tabCount = (tab: Tab) => {
        const s = tabStatusMap[tab];
        return !s ? companies.length : companies.filter(c => c.status === s).length;
    };

    /* ── Summary counts ── */
    const counts = useMemo(() => ({
        total: companies.length,
        approved: companies.filter(c => c.status === 'approved').length,
        pending: companies.filter(c => c.status === 'pending').length,
        suspended: companies.filter(c => c.status === 'suspended').length,
        offers: companies.reduce((a, c) => a + c.totalOffers, 0),
        conventions: companies.reduce((a, c) => a + c.totalConventions, 0),
    }), [companies]);

    /* ── Actions ── */
    const updateStatus = (id: string, status: CompanyStatus) => {
        setCompanies(prev => prev.map(c =>
            c.id === id
                ? { ...c, status, approvedAt: status === 'approved' ? '28 Avr 2026' : c.approvedAt, verified: status === 'approved' ? true : c.verified }
                : c
        ));
        setSelected(prev => prev?.id === id
            ? { ...prev, status, approvedAt: status === 'approved' ? '28 Avr 2026' : prev.approvedAt, verified: status === 'approved' ? true : prev.verified }
            : prev
        );
    };

    const handleApprove = (id: string) => updateStatus(id, 'approved');
    const handleReject = (id: string) => updateStatus(id, 'rejected');
    const handleSuspend = (id: string) => updateStatus(id, 'suspended');

    // Keep drawer in sync
    React.useEffect(() => {
        if (!selected) return;
        const updated = companies.find(c => c.id === selected.id);
        if (updated) setSelected(updated);
    }, [companies]);

    return (
        <DashboardLayout pageTitle="Companies"
        >
            {/* ── Summary strip ── */}
            <div className="co-summary-strip">
                {[
                    { label: 'Total Partners', val: counts.total, icon: Building2, cls: 'co-sum-total' },
                    { label: 'Approved', val: counts.approved, icon: CheckCircle, cls: 'co-sum-approved' },
                    { label: 'Pending', val: counts.pending, icon: Clock, cls: 'co-sum-pending' },
                    { label: 'Suspended', val: counts.suspended, icon: AlertCircle, cls: 'co-sum-suspended' },
                    { label: 'Total Offers', val: counts.offers, icon: Briefcase, cls: 'co-sum-offers' },
                    { label: 'Conventions', val: counts.conventions, icon: FileText, cls: 'co-sum-conv' },
                ].map(s => (
                    <div key={s.label} className={`co-sum-card ${s.cls}`}>
                        <s.icon size={15} />
                        <span className="co-sum-val">{s.val}</span>
                        <span className="co-sum-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="co-toolbar">
                <div className="off-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`off-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            <span className={`off-tab-count ${tab === 'Pending' ? 'count-amber' :
                                tab === 'Rejected' ? 'count-red' :
                                    tab === 'Suspended' ? 'count-red' : ''
                                }`}>
                                {tabCount(tab)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="co-filters">
                    <div className="off-search" style={{ minWidth: 200 }}>
                        <Search size={13} />
                        <input
                            type="text"
                            placeholder="Search company, sector, wilaya…"
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
                        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
                            {SECTORS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    {/* View toggle */}
                    <div className="co-view-toggle">
                        <button
                            className={`co-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <List size={15} />
                        </button>
                        <button
                            className={`co-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            <LayoutGrid size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results bar */}
            <div className="stu-results-bar">
                <span>{filtered.length} compan{filtered.length !== 1 ? 'ies' : 'y'} found</span>
                {(search || sectorFilter !== 'All Sectors') && (
                    <button className="stu-clear-all" onClick={() => {
                        setSearch(''); setSectorFilter('All Sectors');
                    }}>
                        <X size={11} /> Clear filters
                    </button>
                )}
            </div>

            {/* ── Main split ── */}
            <div className={`co-layout ${selected ? 'with-drawer' : ''}`}>

                {/* List or Grid */}
                {viewMode === 'list' ? (
                    <div className="co-list">
                        {filtered.length === 0 ? (
                            <div className="off-empty">
                                <Building2 size={32} />
                                <p>No companies match your filters.</p>
                            </div>
                        ) : (
                            filtered.map((c, i) => (
                                <CompanyCard
                                    key={c.id}
                                    company={c}
                                    selected={selected?.id === c.id}
                                    index={i}
                                    onClick={() => setSelected(c)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="co-grid">
                        {filtered.length === 0 ? (
                            <div className="off-empty" style={{ gridColumn: '1/-1' }}>
                                <Building2 size={32} />
                                <p>No companies match your filters.</p>
                            </div>
                        ) : (
                            filtered.map((c, i) => (
                                <CompanyGridCard
                                    key={c.id}
                                    company={c}
                                    selected={selected?.id === c.id}
                                    index={i}
                                    onClick={() => setSelected(c)}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Drawer */}
                <AnimatePresence>
                    {selected && (
                        <CompanyDrawer
                            key={selected.id}
                            company={selected}
                            onClose={() => setSelected(null)}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onSuspend={handleSuspend}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default ADMCompaniesPage;