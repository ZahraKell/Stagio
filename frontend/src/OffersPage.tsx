import React, { useState, useMemo } from 'react';
import {
    Search, MapPin, Clock, Briefcase, X,
    SlidersHorizontal, ChevronRight, Building2,
    Calendar, Users, CheckCircle2, Filter, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TYPES ──────────────────────────────────────────────────── */
interface Offer {
    id: number;
    title: string;
    company: string;
    logo: string;
    wilaya: string;
    domain: string;
    duration: string;
    durationMonths: number;
    type: 'Présentiel' | 'Télétravail' | 'Hybride';
    posted: string;
    deadline: string;
    description: string;
    spots: number;
}

/* ─── MOCK DATA (all offers) ─────────────────────────────────── */
const allOffers: Offer[] = [
    {
        id: 1, title: 'Software Engineering Intern', company: 'Sonatrach',
        logo: 'SN', wilaya: 'Constantine', domain: 'Informatique',
        duration: '3 months', durationMonths: 3, type: 'Présentiel',
        posted: '2 days ago', deadline: 'May 15, 2026',
        description: 'Join our digital transformation team to develop internal tools using React and Django REST. You will collaborate with senior engineers to design scalable APIs, build interactive dashboards, and improve developer tooling across the organization.',
        spots: 3,
    },
    {
        id: 2, title: 'Network & Systems Intern', company: 'Mobilis',
        logo: 'MB', wilaya: 'Sétif', domain: 'Réseaux',
        duration: '2 months', durationMonths: 2, type: 'Hybride',
        posted: '1 day ago', deadline: 'May 10, 2026',
        description: 'Monitor and maintain telecom infrastructure across the Hauts Plateaux region. Assist in configuring routers, switches, and network monitoring systems. Participate in on-site interventions and write technical reports.',
        spots: 2,
    },
    {
        id: 3, title: 'Frontend Developer Intern', company: 'Condor Electronics',
        logo: 'CE', wilaya: 'Sétif', domain: 'Informatique',
        duration: '1 month', durationMonths: 1, type: 'Présentiel',
        posted: '5 days ago', deadline: 'Apr 30, 2026',
        description: 'Build responsive UI components for the consumer electronics e-commerce platform. Work with the design team to implement pixel-perfect interfaces in React, improve performance, and write unit tests.',
        spots: 1,
    },
    {
        id: 4, title: 'Data Analysis Intern', company: 'Ooredoo Algeria',
        logo: 'OR', wilaya: 'Annaba', domain: 'Data Science',
        duration: '6 months', durationMonths: 6, type: 'Présentiel',
        posted: '1 week ago', deadline: 'May 20, 2026',
        description: 'Analyse customer churn data and build predictive dashboards using Python & Power BI. You will work closely with the BI team to identify patterns, generate insights, and present findings to stakeholders.',
        spots: 2,
    },
    {
        id: 5, title: 'Cybersecurity Intern', company: 'Algérie Télécom',
        logo: 'AT', wilaya: 'Batna', domain: 'Cybersécurité',
        duration: '2 months', durationMonths: 2, type: 'Télétravail',
        posted: '3 days ago', deadline: 'May 12, 2026',
        description: 'Assist the SOC team in vulnerability assessments, log analysis, and security monitoring tasks. Help document incident response procedures and contribute to internal security awareness training.',
        spots: 1,
    },
    {
        id: 6, title: 'Embedded Systems Intern', company: 'ENIEM',
        logo: 'EN', wilaya: 'Tizi Ouzou', domain: 'Électronique',
        duration: '3 months', durationMonths: 3, type: 'Présentiel',
        posted: '4 days ago', deadline: 'May 5, 2026',
        description: 'Program STM32 microcontrollers for home appliance control systems. Assist in PCB testing, firmware debugging, and writing technical documentation for embedded modules.',
        spots: 2,
    },
    {
        id: 7, title: 'Backend Developer Intern', company: 'Yassir',
        logo: 'YS', wilaya: 'Alger', domain: 'Informatique',
        duration: '6 months', durationMonths: 6, type: 'Hybride',
        posted: 'Today', deadline: 'Jun 1, 2026',
        description: 'Work on scalable microservices powering the ride-hailing platform API in Node.js and Go. You will own small features end-to-end, write integration tests, and participate in code reviews.',
        spots: 4,
    },
    {
        id: 8, title: 'UI/UX Design Intern', company: 'Djezzy',
        logo: 'DJ', wilaya: 'Oran', domain: 'Design',
        duration: '2 months', durationMonths: 2, type: 'Hybride',
        posted: '2 days ago', deadline: 'May 8, 2026',
        description: 'Redesign the Djezzy mobile app onboarding flow based on user research findings. Create wireframes, prototypes, and conduct usability testing sessions with real users.',
        spots: 1,
    },
    {
        id: 9, title: 'Cloud Infrastructure Intern', company: 'Djezzy',
        logo: 'DJ', wilaya: 'Alger', domain: 'Informatique',
        duration: '4 months', durationMonths: 4, type: 'Hybride',
        posted: 'Today', deadline: 'May 25, 2026',
        description: 'Support the DevOps team in managing cloud infrastructure on AWS. Assist with CI/CD pipeline improvements, container orchestration using Kubernetes, and infrastructure monitoring.',
        spots: 2,
    },
    {
        id: 10, title: 'Marketing & Digital Intern', company: 'Ooredoo Algeria',
        logo: 'OR', wilaya: 'Constantine', domain: 'Marketing',
        duration: '2 months', durationMonths: 2, type: 'Présentiel',
        posted: '6 days ago', deadline: 'May 3, 2026',
        description: 'Manage social media campaigns, assist with content creation, and analyze digital marketing metrics. Collaborate with the brand team to produce engaging content for Algerian audiences.',
        spots: 1,
    },
];

/* ─── FILTER OPTIONS ─────────────────────────────────────────── */
const wilayas = ['All Wilayas', 'Alger', 'Annaba', 'Batna', 'Constantine', 'Oran', 'Sétif', 'Tizi Ouzou'];
const domains = ['All Domains', 'Informatique', 'Réseaux', 'Data Science', 'Cybersécurité', 'Électronique', 'Design', 'Marketing'];
const durations = ['All Durations', '1 month', '2 months', '3 months', '4 months', '6 months'];
const types = ['All Types', 'Présentiel', 'Télétravail', 'Hybride'];

const typeColor: Record<string, string> = {
    'Présentiel': 'sc-badge-accepted',
    'Télétravail': 'sc-badge-validated',
    'Hybride': 'sc-badge-review',
};

const domainColor: Record<string, string> = {
    'Informatique': 'dom-info',
    'Réseaux': 'dom-tel',
    'Data Science': 'dom-data',
    'Cybersécurité': 'dom-sec',
    'Électronique': 'dom-elec',
    'Design': 'dom-auto',
    'Marketing': 'dom-auto',
};

const groupByDomain = (offers: Offer[]) => {
    const groups: Record<string, Offer[]> = {};
    offers.forEach(offer => {
        if (!groups[offer.domain]) groups[offer.domain] = [];
        groups[offer.domain].push(offer);
    });
    return groups;
};

/* ─── OFFER CARD (grid item) ─────────────────────────────────── */
const OfferCard: React.FC<{
    offer: Offer;
    applied: boolean;
    onOpen: () => void;
    onApply: (e: React.MouseEvent) => void;
}> = ({ offer, applied, onOpen, onApply }) => (
    <motion.div
        className="off-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onOpen}
    >
        <div className="off-card-logo">{offer.logo}</div>
        <div className="off-card-header">
            <h4 className="off-card-title">{offer.title}</h4>
            <div className="off-card-badges">
                <span className={`sc-badge ${typeColor[offer.type]}`}>{offer.type}</span>
                <span className={`domain ${domainColor[offer.domain]}`}>{offer.domain}</span>
            </div>
        </div>
        <div className="off-card-company">
            <Building2 size={13} /> {offer.company} • <MapPin size={13} /> {offer.wilaya}
        </div>
        <div className="off-card-meta">
            <span><Clock size={12} /> {offer.duration}</span>
            <span><Users size={12} /> {offer.spots} spot{offer.spots > 1 ? 's' : ''}</span>
            <span><Calendar size={12} /> {offer.posted}</span>
        </div>
        <div className="off-card-footer">
            <div className="off-card-deadline">
                <span>Deadline</span>
                <strong>{offer.deadline}</strong>
            </div>
            <button
                className={`off-apply-btn ${applied ? 'applied' : ''}`}
                disabled={applied}
                onClick={onApply}
            >
                {applied ? <CheckCircle2 size={14} /> : 'Apply'}
            </button>
        </div>
    </motion.div>
);

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
const OffersPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [wilaya, setWilaya] = useState('All Wilayas');
    const [domain, setDomain] = useState('All Domains');
    const [duration, setDuration] = useState('All Durations');
    const [type, setType] = useState('All Types');
    const [modal, setModal] = useState<Offer | null>(null);
    const [applied, setApplied] = useState<Set<number>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    const filtered = useMemo(() => allOffers.filter(o => {
        const q = search.toLowerCase();
        return (
            (o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q)) &&
            (wilaya === 'All Wilayas' || o.wilaya === wilaya) &&
            (domain === 'All Domains' || o.domain === domain) &&
            (duration === 'All Durations' || o.duration === duration) &&
            (type === 'All Types' || o.type === type)
        );
    }), [search, wilaya, domain, duration, type]);

    const hasActive = search !== '' || wilaya !== 'All Wilayas' || domain !== 'All Domains' ||
        duration !== 'All Durations' || type !== 'All Types';

    const reset = () => {
        setSearch(''); setWilaya('All Wilayas'); setDomain('All Domains');
        setDuration('All Durations'); setType('All Types');
    };

    const handleApply = (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setApplied(prev => new Set([...prev, id]));
    };

    const grouped = useMemo(() => groupByDomain(filtered), [filtered]);
    const domainOrder = ['Informatique', 'Data Science', 'Cybersécurité', 'Réseaux', 'Électronique', 'Design', 'Marketing'];

    return (
        <div className="off-page-root">


            {/* Hero */}
            <div className="page-hero offers-hero off-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>Find Your Perfect Internship 🎯</h1>
                    <p>Browse verified offers from top Algerian companies — filtered for you</p>
                    <div className="off-hero-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by title or company…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button className="sc-clear-input" onClick={() => setSearch('')}><X size={14} /></button>}
                    </div>
                </div>
            </div>

            <div className="off-page-body">
                {/* Filter bar */}
                <div className="off-filterbar">
                    <div className="off-filterbar-left">
                        <button
                            className={`off-filter-toggle ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(s => !s)}
                        >
                            <Filter size={15} /> Filters
                            {hasActive && <span className="off-filter-dot" />}
                        </button>
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div className="off-dropdowns" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                    <div className="off-select-wrap"><MapPin size={13} /><select value={wilaya} onChange={e => setWilaya(e.target.value)}>{wilayas.map(w => <option key={w}>{w}</option>)}</select></div>
                                    <div className="off-select-wrap"><Briefcase size={13} /><select value={domain} onChange={e => setDomain(e.target.value)}>{domains.map(d => <option key={d}>{d}</option>)}</select></div>
                                    <div className="off-select-wrap"><Clock size={13} /><select value={duration} onChange={e => setDuration(e.target.value)}>{durations.map(d => <option key={d}>{d}</option>)}</select></div>
                                    <div className="off-select-wrap"><SlidersHorizontal size={13} /><select value={type} onChange={e => setType(e.target.value)}>{types.map(t => <option key={t}>{t}</option>)}</select></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="off-filterbar-right">
                        {hasActive && <button className="off-reset-btn" onClick={reset}><X size={13} /> Reset</button>}
                        <span className="off-results-count"><strong>{filtered.length}</strong> offer{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Active filter pills */}
                {hasActive && (
                    <div className="off-active-pills">
                        {search && <span className="off-pill">"{search}" <button onClick={() => setSearch('')}><X size={10} /></button></span>}
                        {wilaya !== 'All Wilayas' && <span className="off-pill">{wilaya} <button onClick={() => setWilaya('All Wilayas')}><X size={10} /></button></span>}
                        {domain !== 'All Domains' && <span className="off-pill">{domain} <button onClick={() => setDomain('All Domains')}><X size={10} /></button></span>}
                        {duration !== 'All Durations' && <span className="off-pill">{duration} <button onClick={() => setDuration('All Durations')}><X size={10} /></button></span>}
                        {type !== 'All Types' && <span className="off-pill">{type} <button onClick={() => setType('All Types')}><X size={10} /></button></span>}
                    </div>
                )}

                {/* Domain sections with grid */}
                {filtered.length === 0 ? (
                    <div className="off-empty"><Briefcase size={44} opacity={0.3} /><h3>No offers match your filters</h3><button className="sc-btn-outline" onClick={reset}>Clear Filters</button></div>
                ) : (
                    domainOrder.map(dom => {
                        const offersInDomain = grouped[dom];
                        if (!offersInDomain || offersInDomain.length === 0) return null;
                        return (
                            <div key={dom} className="off-domain-section">
                                <div className="off-section-header">
                                    <h2><Star size={18} /> {dom}</h2>
                                    <span className="off-section-count">{offersInDomain.length} offers</span>
                                </div>
                                <div className="off-grid">
                                    {offersInDomain.map(offer => (
                                        <OfferCard
                                            key={offer.id}
                                            offer={offer}
                                            applied={applied.has(offer.id)}
                                            onOpen={() => setModal(offer)}
                                            onApply={e => handleApply(offer.id, e)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {modal && (
                    <>
                        <motion.div
                            className="off-modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModal(null)}
                        />
                        <motion.div
                            className="off-modal"
                            initial={{ opacity: 0, scale: 0.93, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 40 }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                        >
                            <div className="off-modal-header">
                                <div className="off-modal-logo">{modal.logo}</div>
                                <div className="off-modal-title">
                                    <h2>{modal.title}</h2>
                                    <span>{modal.company}</span>
                                </div>
                                <button className="off-modal-close" onClick={() => setModal(null)}><X size={20} /></button>
                            </div>
                            <div className="off-modal-badges">
                                <span className={`sc-badge ${typeColor[modal.type]}`}>{modal.type}</span>
                                <span className={`domain ${domainColor[modal.domain]}`}>{modal.domain}</span>
                                <span className="off-mpill"><MapPin size={12} /> {modal.wilaya}</span>
                                <span className="off-mpill"><Clock size={12} /> {modal.duration}</span>
                                <span className="off-mpill"><Users size={12} /> {modal.spots} spot{modal.spots > 1 ? 's' : ''}</span>
                            </div>
                            <div className="off-modal-section">
                                <h3>About this internship</h3>
                                <p>{modal.description}</p>
                            </div>
                            <div className="off-modal-section">
                                <h3>Details</h3>
                                <div className="off-modal-details">
                                    <div className="off-mdetail"><span>Posted</span><strong>{modal.posted}</strong></div>
                                    <div className="off-mdetail"><span>Duration</span><strong>{modal.duration}</strong></div>
                                    <div className="off-mdetail"><span>Deadline</span><strong className="deadline-red">{modal.deadline}</strong></div>
                                    <div className="off-mdetail"><span>Open spots</span><strong>{modal.spots}</strong></div>
                                </div>
                            </div>
                            <div className="off-modal-cta">
                                {applied.has(modal.id) ? (
                                    <div className="off-applied-msg"><CheckCircle2 size={20} /> Application submitted successfully!</div>
                                ) : (
                                    <button className="sc-btn-primary off-apply-full" onClick={() => handleApply(modal.id)}>Apply Now <ChevronRight size={16} /></button>
                                )}
                                <button className="sc-btn-outline" onClick={() => setModal(null)}>Close</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


        </div>
    );
};

export default OffersPage;