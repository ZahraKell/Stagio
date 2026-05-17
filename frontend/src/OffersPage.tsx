import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from './api';
import { getUserRole } from './auth';
import {
    Search, MapPin, Clock, X,
    ChevronRight, Building2,
    Calendar, CheckCircle2, Filter,
    DollarSign, Layers, Tag, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TYPES ────────────────────────────────────────────────────────── */
interface Offer {
    id: number;
    title: string;
    company: string;
    logo: string;
    wilaya: string;
    domain: string;
    duration: string;
    type: string;
    posted: string;
    deadline: string;
    description: string;
    is_paid: boolean;
    salary: string | null;
    tech_stack: string | null;
    skills_text: string | null;
    internship_type: string;
    status: string;
}

type ApiOfferPayload = Record<string, unknown>;

/* ─── HELPERS ──────────────────────────────────────────────────────── */
function initialsFromCompany(name: string): string {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return `${p[0][0] ?? ''}${p[1][0] ?? ''}`.toUpperCase();
}

function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const OFFER_IMAGES = [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop',
];
const offerImg = (id: number) => OFFER_IMAGES[id % OFFER_IMAGES.length];

const TYPE_LABELS: Record<string, string> = {
    INTERNSHIP: 'Stage professionnel',
    ALTERNANCE: 'Alternance',
    FINAL_YEAR: 'PFE',
};

function mapOfferFromApi(raw: ApiOfferPayload): Offer {
    const company = String(raw.company_name ?? 'Company');
    return {
        id:              Number(raw.id),
        title:           String(raw.title ?? ''),
        company,
        logo:            initialsFromCompany(company),
        wilaya:          String(raw.town ?? ''),
        domain:          String(raw.field ?? ''),
        duration:        String(raw.duration ?? '—'),
        type:            TYPE_LABELS[String(raw.internship_type ?? '')] ?? String(raw.internship_type ?? '—'),
        posted:          formatDate(raw.date_posted as string),
        deadline:        raw.deadline ? formatDate(raw.deadline as string) : '—',
        description:     String(raw.description ?? ''),
        is_paid:         Boolean(raw.is_paid),
        salary:          raw.salary ? String(raw.salary) : null,
        tech_stack:      raw.tech_stack ? String(raw.tech_stack) : null,
        skills_text:     raw.skills ? String(raw.skills) : null,
        internship_type: String(raw.internship_type ?? ''),
        status:          String(raw.status ?? 'open'),
    };
}

function getSkillTags(offer: Offer): string[] {
    const raw = [offer.tech_stack, offer.skills_text].filter(Boolean).join(',');
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/* ─── OFFER CARD ────────────────────────────────────────────────────── */
function OfferCard({
    offer, index, applied, onOpen, onApply,
}: {
    offer: Offer;
    index: number;
    applied: boolean;
    onOpen: () => void;
    onApply: (e: React.MouseEvent) => void;
}) {
    const skills = getSkillTags(offer).slice(0, 3);
    const extra  = getSkillTags(offer).length - 3;

    return (
        <motion.div
            className="op-card"
            style={{ animationDelay: `${index * 55}ms`, cursor: 'pointer' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.04 }}
            onClick={onOpen}
        >
            <div className="op-card-img">
                <img src={offerImg(offer.id)} alt={offer.title} loading="lazy" />
                <div className="op-card-img-overlay" />
                <span className="op-pill op-pill-open">Ouverte</span>
                <span className="op-type-tag">{offer.type}</span>
            </div>

            <div className="op-card-body">
                <h3 className="op-card-title">{offer.title}</h3>
                <div className="op-card-meta">
                    <span className="op-meta-row"><Building2 size={12} /> {offer.company}</span>
                    <span className="op-meta-row"><MapPin size={12} /> {offer.wilaya || 'Non précisé'}</span>
                    <span className="op-meta-row"><Clock size={12} /> {offer.duration}</span>
                    <span className="op-meta-row">
                        <DollarSign size={12} /> {offer.is_paid ? (offer.salary || 'Rémunéré') : 'Non rémunéré'}
                    </span>
                </div>
                {skills.length > 0 && (
                    <div className="op-skills">
                        {skills.map(sk => <span key={sk} className="op-skill-tag">{sk}</span>)}
                        {extra > 0 && <span className="op-skill-more">+{extra}</span>}
                    </div>
                )}
                {offer.deadline !== '—' && (
                    <p className="op-deadline"><Calendar size={11} /> Clôture : {offer.deadline}</p>
                )}
            </div>

            <div className="op-card-footer">
                <button className="off-apply-btn" onClick={onOpen}>
                    Voir les détails <ChevronRight size={15} />
                </button>
                <div style={{ marginBottom: '1rem' }} />
                <button
                    className={`off-apply-btn${applied ? ' applied' : ''}`}
                    disabled={applied}
                    onClick={e => { e.stopPropagation(); onApply(e); }}
                    style={{ minWidth: 80, fontSize: 13 }}
                >
                    {applied ? <><CheckCircle2 size={13} /> Postulé</> : 'Postuler'}
                </button>
            </div>
        </motion.div>
    );
}

/* ─── DETAIL MODAL ──────────────────────────────────────────────────── */
function OfferDetailModal({
    offer, applied, onClose, onApply,
}: {
    offer: Offer;
    applied: boolean;
    onClose: () => void;
    onApply: () => void;
}) {
    const skills = getSkillTags(offer);

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 9998,
                }}
            />

            {/* Modal wrapper — plain div so Framer Motion can't override background/position */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    width: 'min(660px, 92vw)',
                    maxHeight: '88vh',
                    overflowY: 'auto',
                    borderRadius: 20,
                    background: '#ffffff',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 24 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                >
                    {/* Cover image */}
                    <div style={{ position: 'relative', height: 180, overflow: 'hidden', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
                        <img
                            src={offerImg(offer.id)}
                            alt={offer.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.5))',
                        }} />
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 12, right: 12,
                                width: 34, height: 34, borderRadius: 10,
                                background: 'rgba(0,0,0,0.45)', border: 'none',
                                color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <X size={18} />
                        </button>
                        <span style={{
                            position: 'absolute', bottom: 14, left: 16,
                            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
                            color: '#fff', fontSize: 11, fontWeight: 700,
                            padding: '4px 12px', borderRadius: 20,
                            border: '1px solid rgba(255,255,255,0.3)',
                        }}>
                            {offer.type}
                        </span>
                    </div>

                    {/* Offer header */}
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '18px 22px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        background: '#ffffff',
                    }}>
                        <div style={{
                            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                            background: 'linear-gradient(135deg, #b8893e, #8a6a2c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontFamily: 'Epilogue, sans-serif',
                            fontWeight: 800, fontSize: 15,
                        }}>
                            {offer.logo}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 3 }}>
                                {offer.title}
                            </h2>
                            <span style={{ fontSize: 13, color: '#64748b' }}>
                                {offer.company} · {offer.wilaya}
                            </span>
                        </div>
                    </div>

                    {/* Info grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        borderBottom: '1px solid #f1f5f9',
                        background: '#f8fafc',
                    }}>
                        {[
                            { icon: <Clock size={14} />,      label: 'Durée',        val: offer.duration },
                            { icon: <MapPin size={14} />,     label: 'Wilaya',       val: offer.wilaya || '—' },
                            { icon: <DollarSign size={14} />, label: 'Rémunération', val: offer.is_paid ? (offer.salary || 'Oui') : 'Non' },
                            { icon: <Layers size={14} />,     label: 'Domaine',      val: offer.domain || '—' },
                            { icon: <Calendar size={14} />,   label: 'Publié le',    val: offer.posted },
                            { icon: <Calendar size={14} />,   label: 'Clôture',      val: offer.deadline },
                        ].map((item, i) => (
                            <div key={item.label} style={{
                                padding: '12px 16px',
                                borderRight: i % 3 !== 2 ? '1px solid #f1f5f9' : 'none',
                                borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
                                background: '#f8fafc',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                    <span style={{ color: '#b8893e' }}>{item.icon}</span>
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                                        {item.label}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                        <h3 style={{
                            fontSize: 13, fontWeight: 700, marginBottom: 10,
                            display: 'flex', alignItems: 'center', gap: 6, color: '#0f172a',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                            <Tag size={13} /> Description du stage
                        </h3>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#334155', margin: 0 }}>
                            {offer.description || 'Aucune description fournie.'}
                        </p>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div style={{ padding: '14px 22px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                            <h3 style={{
                                fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#0f172a',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                Compétences requises
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {skills.map(sk => (
                                    <span key={sk} className="op-skill-tag" style={{ fontSize: 12 }}>{sk}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '16px 22px',
                        background: '#ffffff',
                        borderRadius: '0 0 20px 20px',
                    }}>
                        {applied ? (
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 14, fontWeight: 700, color: '#065f46',
                                background: '#d1fae5', padding: '11px 18px', borderRadius: 40,
                            }}>
                                <CheckCircle2 size={18} /> Vous avez déjà postulé à cette offre
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="sc-btn-primary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 24px', fontSize: 14 }}
                                onClick={onApply}
                            >
                                Postuler maintenant <ChevronRight size={16} />
                            </button>
                        )}
                        <button
                            className="sc-btn-outline"
                            onClick={onClose}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            Fermer
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────── */
export default function OffersPage() {
    const [allOffers, setAllOffers] = useState<Offer[]>([]);
    const [loading, setLoading]     = useState(true);
    const [applied, setApplied]     = useState<Set<number>>(new Set());
    const [modal, setModal]         = useState<Offer | null>(null);

    const [search,     setSearch]     = useState('');
    const [wilaya,     setWilaya]     = useState('');
    const [domain,     setDomain]     = useState('');
    const [tech,       setTech]       = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [duration,   setDuration]   = useState('');
    const [showFilt,   setShowFilt]   = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<ApiOfferPayload[]>('offers/');
                const list = Array.isArray(res.data) ? res.data : [];
                setAllOffers(list.map(mapOfferFromApi));
            } catch {
                toast.error('Impossible de charger les offres.');
                setAllOffers([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (getUserRole() !== 'student') return;
        (async () => {
            try {
                const res = await api.get<{ error?: boolean; data?: Array<{ offer: number }> }>(
                    'applications/my-applications/'
                );
                const rows = res.data?.error ? [] : res.data?.data ?? [];
                setApplied(new Set(rows.map(r => r.offer).filter((id): id is number => typeof id === 'number')));
            } catch { /* ignore */ }
        })();
    }, []);

    const wilayas = useMemo(
        () => ['', ...Array.from(new Set(allOffers.map(o => o.wilaya).filter(Boolean))).sort()],
        [allOffers]
    );
    const domains = useMemo(
        () => ['', ...Array.from(new Set(allOffers.map(o => o.domain).filter(Boolean))).sort()],
        [allOffers]
    );
    const durations = useMemo(
        () => ['', ...Array.from(new Set(allOffers.map(o => o.duration).filter(Boolean))).sort()],
        [allOffers]
    );

    const filtered = useMemo(() => allOffers.filter(o => {
        const q = search.toLowerCase();
        const techLower = tech.toLowerCase();
        const skills = [o.tech_stack, o.skills_text].filter(Boolean).join(',').toLowerCase();
        return (
            (!q || o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q)) &&
            (!wilaya || o.wilaya === wilaya) &&
            (!domain || o.domain === domain) &&
            (!tech || skills.includes(techLower)) &&
            (!typeFilter || o.internship_type === typeFilter) &&
            (!duration || o.duration.toLowerCase().includes(duration.toLowerCase()))
        );
    }), [allOffers, search, wilaya, domain, tech, typeFilter, duration]);

    const hasFilters = search || wilaya || domain || tech || typeFilter || duration;
    const reset = () => { setSearch(''); setWilaya(''); setDomain(''); setTech(''); setTypeFilter(''); setDuration(''); };

    const handleApply = async (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (applied.has(id)) return;
        if (getUserRole() !== 'student') {
            toast.error("Connectez-vous en tant qu'étudiant pour postuler.");
            return;
        }
        try {
            await api.post('applications/', { offer: id, cover_letter: '' });
            setApplied(prev => new Set([...prev, id]));
            toast.success('Candidature envoyée !');
        } catch {
            toast.error('Erreur lors de la candidature.');
        }
    };

    return (
        <div className="off-page-root">
            {/* HERO */}
            <div className="page-hero offers-hero off-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>Trouvez votre stage idéal 🎯</h1>
                    <p>Parcourez les offres vérifiées des meilleures entreprises algériennes</p>
                    <div className="off-hero-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher par titre ou entreprise…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="sc-clear-input" onClick={() => setSearch('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="off-page-body">
                {/* FILTER BAR */}
                <div className="off-filterbar">
                    <div className="off-filterbar-left">
                        <button
                            className={`off-filter-toggle${showFilt ? ' active' : ''}`}
                            onClick={() => setShowFilt(s => !s)}
                        >
                            <Filter size={14} /> Filtres
                            {hasFilters && <span className="off-filter-dot" />}
                        </button>
                        <AnimatePresence>
                            {showFilt && (
                                <motion.div
                                    className="off-dropdowns"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    <div className="off-select-wrap">
                                        <MapPin size={13} />
                                        <select value={wilaya} onChange={e => setWilaya(e.target.value)}>
                                            <option value="">Toutes les wilayas</option>
                                            {wilayas.filter(Boolean).map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                    </div>
                                    <div className="off-select-wrap">
                                        <Layers size={13} />
                                        <select value={domain} onChange={e => setDomain(e.target.value)}>
                                            <option value="">Tous les domaines</option>
                                            {domains.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="off-select-wrap">
                                        <Tag size={13} />
                                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                            <option value="">Tous les types</option>
                                            <option value="INTERNSHIP">Stage professionnel</option>
                                            <option value="ALTERNANCE">Alternance</option>
                                            <option value="FINAL_YEAR">PFE</option>
                                        </select>
                                    </div>
                                    <div className="off-select-wrap">
                                        <Clock size={13} />
                                        <select value={duration} onChange={e => setDuration(e.target.value)}>
                                            <option value="">Toute durée</option>
                                            {durations.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="off-filterbar-right">
                        {hasFilters && (
                            <button className="off-reset-btn" onClick={reset}>
                                <X size={13} /> Réinitialiser
                            </button>
                        )}
                        <span className="off-results-count">
                            <strong>{filtered.length}</strong> offre{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* ACTIVE PILLS */}
                {hasFilters && (
                    <div className="off-active-pills">
                        {search && <span className="off-pill">"{search}" <button onClick={() => setSearch('')}><X size={10} /></button></span>}
                        {wilaya && <span className="off-pill">{wilaya} <button onClick={() => setWilaya('')}><X size={10} /></button></span>}
                        {domain && <span className="off-pill">{domain} <button onClick={() => setDomain('')}><X size={10} /></button></span>}
                        {typeFilter && <span className="off-pill">{TYPE_LABELS[typeFilter] ?? typeFilter} <button onClick={() => setTypeFilter('')}><X size={10} /></button></span>}
                        {duration && <span className="off-pill">{duration} <button onClick={() => setDuration('')}><X size={10} /></button></span>}
                        {tech && <span className="off-pill">Tech: {tech} <button onClick={() => setTech('')}><X size={10} /></button></span>}
                    </div>
                )}

                {loading && (
                    <div className="op-loading">
                        <div className="op-spinner" />
                        <p>Chargement des offres…</p>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="op-empty">
                        <div className="op-empty-icon"><ExternalLink size={32} strokeWidth={1.5} /></div>
                        <h3>Aucune offre trouvée</h3>
                        <p>{hasFilters ? 'Modifiez vos filtres.' : 'Aucune offre disponible.'}</p>
                        {hasFilters && <button className="op-create-btn" onClick={reset}>Effacer les filtres</button>}
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="op-grid" style={{ marginTop: 24 }}>
                        {filtered.map((offer, i) => (
                            <OfferCard
                                key={offer.id}
                                offer={offer}
                                index={i}
                                applied={applied.has(offer.id)}
                                onOpen={() => setModal(offer)}
                                onApply={e => void handleApply(offer.id, e)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* DETAIL MODAL */}
            <AnimatePresence>
                {modal && (
                    <OfferDetailModal
                        key={modal.id}
                        offer={modal}
                        applied={applied.has(modal.id)}
                        onClose={() => setModal(null)}
                        onApply={() => void handleApply(modal.id).then(() => setModal(null))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}