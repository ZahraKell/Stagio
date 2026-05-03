import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from './api';
import { getUserRole } from './auth';
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

/** Single offer object from Django `GET /api/offers/` */
type ApiOfferPayload = Record<string, unknown>;

function initialsFromCompany(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (p.length === 0) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return `${p[0][0] ?? ''}${p[1][0] ?? ''}`.toUpperCase();
}

function mapBackendInternshipType(t: unknown): Offer['type'] {
    const s = String(t || '').toUpperCase();
    if (s.includes('ALTERN')) return 'Hybride';
    return 'Présentiel';
}

function inferDurationMonthsFromString(dur: unknown): number {
    const m = String(dur || '').match(/(\d+)/);
    const n = m ? Number(m[1]) : 3;
    return Number.isFinite(n) ? n : 3;
}

function formatPosted(datePosted?: string): string {
    if (!datePosted) return '—';
    const d = new Date(datePosted);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function mapOfferFromApi(raw: ApiOfferPayload): Offer {
    const companyName = String(raw.company_name ?? 'Company');
    const dur = raw.duration ?? '—';
    const field = raw.field ? String(raw.field) : String(raw.company_sector ?? 'General');
    return {
        id: Number(raw.id),
        title: String(raw.title ?? ''),
        company: companyName,
        logo: initialsFromCompany(companyName),
        wilaya: String(raw.town ?? ''),
        domain: field,
        duration: String(dur),
        durationMonths: inferDurationMonthsFromString(dur),
        type: mapBackendInternshipType(raw.internship_type),
        posted: formatPosted(raw.date_posted as string | undefined),
        deadline: raw.deadline ? String(raw.deadline) : '—',
        description: String(raw.description ?? ''),
        spots: 1,
    };
}

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
                <span className={`sc-badge ${typeColor[offer.type] ?? 'sc-badge-review'}`}>{offer.type}</span>
                <span className={`domain ${domainColor[offer.domain] ?? 'dom-auto'}`}>{offer.domain}</span>
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
    const [loading, setLoading] = useState(true);
    const [allOffers, setAllOffers] = useState<Offer[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get<ApiOfferPayload[]>('offers/');
                const list = Array.isArray(res.data) ? res.data : [];
                const mapped = list.map((r) => mapOfferFromApi(r));
                if (!cancelled) setAllOffers(mapped);
            } catch {
                toast.error('Could not load offers from the server.');
                if (!cancelled) setAllOffers([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const role = getUserRole();
        if (role !== 'student' || !localStorage.getItem('access_token')) return;
        (async () => {
            try {
                const res = await api.get<{ error?: boolean; data?: Array<{ offer: number }> }>(
                    'applications/my-applications/'
                );
                const rows = res.data?.error === true ? [] : res.data?.data ?? [];
                const ids = rows
                    .map((row) => row.offer)
                    .filter((offerId): offerId is number => typeof offerId === 'number');
                setApplied(new Set(ids));
            } catch {
                /* ignore unread applications */
            }
        })();
    }, []);

    const wilayas = useMemo(
        () => ['All Wilayas', ...Array.from(new Set(allOffers.map((o) => o.wilaya).filter(Boolean))).sort()],
        [allOffers]
    );
    const domains = useMemo(
        () => ['All Domains', ...Array.from(new Set(allOffers.map((o) => o.domain).filter(Boolean))).sort()],
        [allOffers]
    );
    const durations = useMemo(
        () => ['All Durations', ...Array.from(new Set(allOffers.map((o) => o.duration).filter(Boolean))).sort()],
        [allOffers]
    );
    const types = useMemo(
        () => ['All Types', ...Array.from(new Set(allOffers.map((o) => o.type))).sort()],
        [allOffers]
    );

    const filtered = useMemo(() => allOffers.filter(o => {
        const q = search.toLowerCase();
        return (
            (o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q)) &&
            (wilaya === 'All Wilayas' || o.wilaya === wilaya) &&
            (domain === 'All Domains' || o.domain === domain) &&
            (duration === 'All Durations' || o.duration === duration) &&
            (type === 'All Types' || o.type === type)
        );
    }), [allOffers, search, wilaya, domain, duration, type]);

    const hasActive = search !== '' || wilaya !== 'All Wilayas' || domain !== 'All Domains' ||
        duration !== 'All Durations' || type !== 'All Types';

    const reset = () => {
        setSearch(''); setWilaya('All Wilayas'); setDomain('All Domains');
        setDuration('All Durations'); setType('All Types');
    };

    const handleApply = async (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (applied.has(id)) return;

        const role = getUserRole();
        if (role !== 'student') {
            toast.error('Sign in as a student to apply.');
            return;
        }
        try {
            await api.post('applications/', { offer: id, cover_letter: '' });
            setApplied((prev) => new Set([...prev, id]));
            toast.success('Application submitted.');
        } catch {
            toast.error('Could not submit application.');
        }
    };

    const grouped = useMemo(() => groupByDomain(filtered), [filtered]);
    const domainOrder = useMemo(() => Object.keys(grouped).sort((a, b) => a.localeCompare(b)), [grouped]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/offers/")
            .then(res => res.json())
            .then(data => console.log("DATA:", data))
            .catch(err => console.error("ERROR:", err));
    }, []);
    return (
        <div className="off-page-root">

            {loading && (
                <div className="off-page-body" style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b' }}>
                    Loading offers…
                </div>
            )}

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
                                <span className={`sc-badge ${typeColor[modal.type] ?? 'sc-badge-review'}`}>{modal.type}</span>
                                <span className={`domain ${domainColor[modal.domain] ?? 'dom-auto'}`}>{modal.domain}</span>
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
                                    <button
                                        type="button"
                                        className="sc-btn-primary off-apply-full"
                                        onClick={(e) => {
                                            void handleApply(modal.id, e);
                                        }}
                                    >
                                        Apply Now <ChevronRight size={16} />
                                    </button>
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