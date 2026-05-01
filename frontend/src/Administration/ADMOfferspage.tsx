import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
    Search, Filter, Eye, CheckCircle, XCircle,
    MapPin, Building2, Clock, Tag, ChevronRight,
    AlertCircle, Download, X, Calendar, GraduationCap,
    Briefcase, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TYPES ─── */
interface Offer {
    id: string;
    company: string;
    companyInitial: string;
    role: string;
    domain: string;
    wilaya: string;
    duration: string;
    level: string;
    submitted: string;
    status: 'pending' | 'approved' | 'rejected';
    urgent: boolean;
    description: string;
    requirements: string[];
    slots: number;
    startDate: string;
    contactEmail: string;
}

/* ─── MOCK DATA ─── */
const allOffers: Offer[] = [
    {
        id: 'OF-2026-091', company: 'Sonatrach', companyInitial: 'S',
        role: 'Software Engineering Intern', domain: 'Informatique',
        wilaya: 'Hassi Messaoud', duration: '3 mois', level: 'L3 / M1',
        submitted: '28 Avr 2026', status: 'pending', urgent: true,
        slots: 2, startDate: 'Juin 2026', contactEmail: 'rh@sonatrach.dz',
        description: 'Participation au développement d\'applications internes de gestion de pipeline. Stack : Java Spring Boot, React, PostgreSQL. Encadrement par l\'équipe DSI.',
        requirements: ['Niveau L3 Informatique minimum', 'Maîtrise Java ou Python', 'Connaissance des bases de données relationnelles', 'Bonne communication en français et arabe'],
    },
    {
        id: 'OF-2026-090', company: 'Cevital Group', companyInitial: 'C',
        role: 'Industrial Automation Intern', domain: 'Électronique',
        wilaya: 'Béjaïa', duration: '2 mois', level: 'L3 / M1',
        submitted: '27 Avr 2026', status: 'pending', urgent: false,
        slots: 1, startDate: 'Juillet 2026', contactEmail: 'stages@cevital.com',
        description: 'Travaux d\'automatisation sur les lignes de production. Utilisation de PLCs Siemens S7 et SCADA WinCC. Projet lié à l\'optimisation énergétique.',
        requirements: ['L3 Électronique ou Automatique', 'Connaissance des automates programmables', 'Maîtrise d\'AutoCAD électrique', 'Disponibilité dès juillet'],
    },
    {
        id: 'OF-2026-089', company: 'Ooredoo Algeria', companyInitial: 'O',
        role: 'Network Engineering Intern', domain: 'Télécom',
        wilaya: 'Alger', duration: '4 mois', level: 'M1 / M2',
        submitted: '27 Avr 2026', status: 'pending', urgent: false,
        slots: 3, startDate: 'Mai 2026', contactEmail: 'hr@ooredoo.dz',
        description: 'Intégration dans l\'équipe réseau cœur (Core Network). Monitoring, configuration Cisco IOS-XR, participation aux campagnes 5G NR en cours.',
        requirements: ['M1 Télécommunications ou Réseaux', 'Cisco CCNA ou équivalent apprécié', 'Connaissance du réseau mobile (LTE/5G)', 'Anglais technique B2 minimum'],
    },
    {
        id: 'OF-2026-088', company: 'Mobilis', companyInitial: 'M',
        role: 'Mobile Dev Intern', domain: 'Informatique',
        wilaya: 'Constantine', duration: '3 mois', level: 'L3',
        submitted: '26 Avr 2026', status: 'pending', urgent: false,
        slots: 2, startDate: 'Juin 2026', contactEmail: 'stages@mobilis.dz',
        description: 'Développement de fonctionnalités sur l\'application Mobilis (Android / iOS). Équipe mobile composée de 6 développeurs. Méthodologie Agile Scrum.',
        requirements: ['L3 Informatique', 'Flutter ou React Native', 'Git obligatoire', 'Portfolio ou projets personnels appréciés'],
    },
    {
        id: 'OF-2026-087', company: 'Condor Electronics', companyInitial: 'C',
        role: 'Embedded Systems Intern', domain: 'Électronique',
        wilaya: 'Bordj Bou Arréridj', duration: '2 mois', level: 'L3',
        submitted: '25 Avr 2026', status: 'approved', urgent: false,
        slots: 1, startDate: 'Juin 2026', contactEmail: 'rh@condor.dz',
        description: 'Travaux sur les cartes électroniques des produits TV et électroménager. Tests de conformité, débogage, documentation technique.',
        requirements: ['L3 Électronique', 'C embarqué', 'Lecture de schémas électroniques', 'Rigoureux et méthodique'],
    },
    {
        id: 'OF-2026-086', company: 'Air Algérie', companyInitial: 'A',
        role: 'IT Systems Intern', domain: 'Informatique',
        wilaya: 'Alger', duration: '3 mois', level: 'M1',
        submitted: '24 Avr 2026', status: 'approved', urgent: false,
        slots: 2, startDate: 'Juin 2026', contactEmail: 'dsi@airalgerie.dz',
        description: 'Support et administration des systèmes d\'information de la compagnie. Environnement Windows Server, Active Directory, VMware.',
        requirements: ['M1 Informatique ou Réseaux', 'Windows Server / Linux', 'ITIL apprécié'],
    },
    {
        id: 'OF-2026-085', company: 'Algérie Télécom', companyInitial: 'A',
        role: 'Cybersecurity Intern', domain: 'Sécurité',
        wilaya: 'Sétif', duration: '3 mois', level: 'M2',
        submitted: '23 Avr 2026', status: 'rejected', urgent: false,
        slots: 1, startDate: 'Juin 2026', contactEmail: 'ssi@algerietelecom.dz',
        description: 'Offre rejetée : description insuffisante, aucune mention du tuteur industriel ni des moyens mis à disposition.',
        requirements: ['M2 Sécurité des Systèmes d\'Information', 'Pentest / SIEM', 'Habilitation de sécurité requise'],
    },
];

const TABS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
type Tab = typeof TABS[number];

const DOMAINS = ['All Domains', 'Informatique', 'Électronique', 'Télécom', 'Sécurité'];
const WILAYAS = ['All Wilayas', 'Alger', 'Constantine', 'Sétif', 'Béjaïa', 'Hassi Messaoud', 'Bordj Bou Arréridj'];

const statusMap: Record<string, Tab> = {
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
};

const domainColors: Record<string, string> = {
    'Informatique': 'dom-info',
    'Électronique': 'dom-elec',
    'Télécom': 'dom-tel',
    'Sécurité': 'dom-sec',
};

/* ══════════════════════════════════════ */
const OffersPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('Pending');
    const [search, setSearch] = useState('');
    const [domainFilter, setDomainFilter] = useState('All Domains');
    const [wilayaFilter, setWilayaFilter] = useState('All Wilayas');
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [offers, setOffers] = useState<Offer[]>(allOffers);

    /* ── FILTER ── */
    const filtered = offers.filter(o => {
        const tabMatch = activeTab === 'All' || statusMap[o.status] === activeTab;
        const searchMatch =
            o.company.toLowerCase().includes(search.toLowerCase()) ||
            o.role.toLowerCase().includes(search.toLowerCase()) ||
            o.id.toLowerCase().includes(search.toLowerCase());
        const domainMatch = domainFilter === 'All Domains' || o.domain === domainFilter;
        const wilayaMatch = wilayaFilter === 'All Wilayas' || o.wilaya === wilayaFilter;
        return tabMatch && searchMatch && domainMatch && wilayaMatch;
    });

    const tabCount = (tab: Tab) =>
        tab === 'All' ? offers.length : offers.filter(o => statusMap[o.status] === tab).length;

    /* ── ACTIONS ── */
    const approve = (id: string) => {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'approved' } : o));
        if (selectedOffer?.id === id) setSelectedOffer(prev => prev ? { ...prev, status: 'approved' } : null);
    };
    const reject = (id: string) => {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
        if (selectedOffer?.id === id) setSelectedOffer(prev => prev ? { ...prev, status: 'rejected' } : null);
    };

    return (
        <DashboardLayout pageTitle="Internship Offers"
        >
            {/* ── TOOLBAR ── */}
            <div className="off-toolbar">
                {/* Tabs */}
                <div className="off-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`off-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            <span className={`off-tab-count ${tab === 'Pending' ? 'count-amber' : tab === 'Rejected' ? 'count-red' : ''}`}>
                                {tabCount(tab)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="off-filters">
                    <div className="off-search">
                        <Search size={13} />
                        <input
                            type="text"
                            placeholder="Search offers…"
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
                        <select value={wilayaFilter} onChange={e => setWilayaFilter(e.target.value)}>
                            {WILAYAS.map(w => <option key={w}>{w}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── MAIN AREA ── */}
            <div className={`off-layout ${selectedOffer ? 'with-drawer' : ''}`}>

                {/* ── OFFERS LIST ── */}
                <div className="off-list">
                    {filtered.length === 0 ? (
                        <div className="off-empty">
                            <Briefcase size={32} />
                            <p>No offers match your filters.</p>
                        </div>
                    ) : (
                        filtered.map((offer, i) => (
                            <motion.div
                                key={offer.id}
                                className={`off-card ${selectedOffer?.id === offer.id ? 'selected' : ''}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => setSelectedOffer(offer)}
                            >
                                {/* Left: company logo */}
                                <div className="off-card-logo">{offer.companyInitial}</div>

                                {/* Center: main info */}
                                <div className="off-card-body">
                                    <div className="off-card-top">
                                        <span className="off-card-role">{offer.role}</span>
                                        {offer.urgent && (
                                            <span className="off-urgent-badge">
                                                <AlertCircle size={10} /> Urgent
                                            </span>
                                        )}
                                        <span className={`off-status-dot status-${offer.status}`} />
                                    </div>
                                    <span className="off-card-company">{offer.company}</span>
                                    <div className="off-card-meta">
                                        <span><MapPin size={11} /> {offer.wilaya}</span>
                                        <span><Clock size={11} /> {offer.duration}</span>
                                        <span><GraduationCap size={11} /> {offer.level}</span>
                                        <span className={`off-domain-tag ${domainColors[offer.domain] || ''}`}>
                                            <Tag size={10} /> {offer.domain}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: date + actions */}
                                <div className="off-card-right">
                                    <span className="off-card-date">{offer.submitted}</span>
                                    {offer.status === 'pending' && (
                                        <div className="off-card-actions">
                                            <button
                                                className="adm-action-btn approve sm"
                                                onClick={e => { e.stopPropagation(); approve(offer.id); }}
                                            >
                                                <CheckCircle size={12} /> Approve
                                            </button>
                                            <button
                                                className="adm-action-btn reject sm"
                                                onClick={e => { e.stopPropagation(); reject(offer.id); }}
                                            >
                                                <XCircle size={12} /> Reject
                                            </button>
                                        </div>
                                    )}
                                    {offer.status !== 'pending' && (
                                        <span className={`off-status-label status-label-${offer.status}`}>
                                            {offer.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                        </span>
                                    )}
                                    <ChevronRight size={14} className="off-chevron" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* ── DETAIL DRAWER ── */}
                <AnimatePresence>
                    {selectedOffer && (
                        <motion.aside
                            className="off-drawer"
                            initial={{ opacity: 0, x: 32 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 32 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                        >
                            {/* Drawer header */}
                            <div className="off-drawer-head">
                                <div className="off-drawer-logo">{selectedOffer.companyInitial}</div>
                                <div className="off-drawer-title">
                                    <h2>{selectedOffer.role}</h2>
                                    <span>{selectedOffer.company}</span>
                                </div>
                                <button className="off-drawer-close" onClick={() => setSelectedOffer(null)}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Status pill */}
                            <div className="off-drawer-status-row">
                                <span className={`off-status-pill pill-${selectedOffer.status}`}>
                                    {selectedOffer.status === 'pending' && <Clock size={12} />}
                                    {selectedOffer.status === 'approved' && <CheckCircle size={12} />}
                                    {selectedOffer.status === 'rejected' && <XCircle size={12} />}
                                    {selectedOffer.status.charAt(0).toUpperCase() + selectedOffer.status.slice(1)}
                                </span>
                                <span className="off-drawer-id">{selectedOffer.id}</span>
                            </div>

                            {/* Meta grid */}
                            <div className="off-drawer-meta">
                                {[
                                    { icon: MapPin, label: 'Wilaya', value: selectedOffer.wilaya },
                                    { icon: Clock, label: 'Duration', value: selectedOffer.duration },
                                    { icon: GraduationCap, label: 'Level', value: selectedOffer.level },
                                    { icon: Calendar, label: 'Start', value: selectedOffer.startDate },
                                    { icon: Building2, label: 'Slots', value: `${selectedOffer.slots} position${selectedOffer.slots > 1 ? 's' : ''}` },
                                    { icon: Tag, label: 'Domain', value: selectedOffer.domain },
                                ].map(m => (
                                    <div key={m.label} className="off-meta-item">
                                        <span className="off-meta-icon"><m.icon size={13} /></span>
                                        <div>
                                            <span className="off-meta-label">{m.label}</span>
                                            <span className="off-meta-value">{m.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div className="off-drawer-section">
                                <h3>Description</h3>
                                <p>{selectedOffer.description}</p>
                            </div>

                            {/* Requirements */}
                            <div className="off-drawer-section">
                                <h3>Requirements</h3>
                                <ul className="off-req-list">
                                    {selectedOffer.requirements.map((r, i) => (
                                        <li key={i}><span className="off-req-dot" />{r}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Contact */}
                            <div className="off-drawer-section">
                                <h3>Company Contact</h3>
                                <a href={`mailto:${selectedOffer.contactEmail}`} className="off-contact-link">
                                    <FileText size={13} /> {selectedOffer.contactEmail}
                                </a>
                            </div>

                            {/* Actions */}
                            {selectedOffer.status === 'pending' && (
                                <div className="off-drawer-actions">
                                    <button
                                        className="off-drawer-btn approve"
                                        onClick={() => approve(selectedOffer.id)}
                                    >
                                        <CheckCircle size={15} /> Approve Offer
                                    </button>
                                    <button
                                        className="off-drawer-btn reject"
                                        onClick={() => reject(selectedOffer.id)}
                                    >
                                        <XCircle size={15} /> Reject Offer
                                    </button>
                                </div>
                            )}
                            {selectedOffer.status !== 'pending' && (
                                <div className="off-drawer-actions">
                                    <button className="off-drawer-btn download">
                                        <Download size={15} /> Export as PDF
                                    </button>
                                </div>
                            )}
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default OffersPage;