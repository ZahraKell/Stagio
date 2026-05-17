import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CompanyLayout from "../components/CompanyLayout";
import api from "../api";
import toast from "react-hot-toast";

// ”€”€ TYPES ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
export interface Offer {
  id:              number;
  title:           string;
  town:            string;
  duration:        string;
  internship_type: string;
  is_paid:         boolean;
  salary:          string | null;
  tech_stack:      string | null;
  skills:          string | null;
  field:           string | null;
  status:          string;
  date_posted:     string;
  deadline:        string | null;
  description:     string;
}

// ”€”€ TYPE LABEL MAP ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
const TYPE_LABELS: Record<string, string> = {
  INTERNSHIP: "Stage professionnel",
  ALTERNANCE: "Alternance",
  FINAL_YEAR: "PFE",
};

// ”€”€ OFFER IMAGE — deterministic from offer id ”€”€”€”€”€”€”€”€”€”€”€”€”€”€
// Uses free Unsplash photos with internship/office themes
const OFFER_IMAGES = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&auto=format&fit=crop",
];
const offerImg = (id: number) => OFFER_IMAGES[id % OFFER_IMAGES.length];

// ”€”€ STATUS PILL ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open:   { label: "Ouverte",  cls: "op-pill-open"   },
    closed: { label: "Fermée",   cls: "op-pill-closed" },
    filled: { label: "Pourvue",  cls: "op-pill-filled" },
  };
  const s = map[status] ?? { label: status, cls: "op-pill-open" };
  return <span className={`op-pill ${s.cls}`}>{s.label}</span>;
}

// ”€”€ SINGLE OFFER CARD ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const navigate = useNavigate();
  const skills   = (offer.tech_stack || offer.skills || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div
      className="op-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Cover image */}
      <div className="op-card-img">
        <img src={offerImg(offer.id)} alt={offer.title} loading="lazy" />
        <div className="op-card-img-overlay" />
        <StatusPill status={offer.status} />
        <span className="op-type-tag">
          {TYPE_LABELS[offer.internship_type] ?? offer.internship_type}
        </span>
      </div>

      {/* Body */}
      <div className="op-card-body">
        <h3 className="op-card-title">{offer.title}</h3>

        <div className="op-card-meta">
          <span className="op-meta-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {offer.town || "Non précisé"}
          </span>
          <span className="op-meta-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {offer.duration || "Durée variable"}
          </span>
          <span className="op-meta-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            {offer.is_paid ? (offer.salary || "Rémunéré") : "Non rémunéré"}
          </span>
        </div>

        {/* Skills tags */}
        {skills.length > 0 && (
          <div className="op-skills">
            {skills.slice(0, 3).map(sk => (
              <span key={sk} className="op-skill-tag">{sk}</span>
            ))}
            {skills.length > 3 && (
              <span className="op-skill-more">+{skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Deadline */}
        {offer.deadline && (
          <p className="op-deadline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Clôture : {offer.deadline}
          </p>
        )}
      </div>

      {/* Footer — Details button */}
      <div className="op-card-footer">
        <button
          className="op-details-btn"
          onClick={() => navigate(`/company/offers/${offer.id}`)}
        >
          Voir les détails
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>
  );
}

// ”€”€ MAIN PAGE ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
export default function CompanyOffers() {
  const navigate = useNavigate();

  const [offers,   setOffers]   = useState<Offer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | "open" | "closed" | "filled">("all");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("offers/mine/");
        const list = Array.isArray(data) ? data : [];
        setOffers(list as Offer[]);
      } catch {
        setOffers([]);
        toast.error("Impossible de charger vos offres.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = filter === "all" ? offers : offers.filter(o => o.status === filter);

  const counts = {
    all:    offers.length,
    open:   offers.filter(o => o.status === "open").length,
    closed: offers.filter(o => o.status === "closed").length,
    filled: offers.filter(o => o.status === "filled").length,
  };

  return (
    <CompanyLayout>
      <div className="op-root">

        {/* ”€”€ PAGE HEADER ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <div className="op-page-header">
          <div>
            <h2 className="op-page-title">Mes Offres de Stage</h2>
            <p className="op-page-sub">
              Gérez vos offres et suivez les candidatures reçues
            </p>
          </div>
          <button
            className="op-create-btn"
            onClick={() => navigate("/company/offers/new")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Créer une offre
          </button>
        </div>

        {/* ”€”€ FILTER TABS ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        <div className="op-tabs">
          {(["all", "open", "closed", "filled"] as const).map(f => (
            <button
              key={f}
              className={`op-tab ${filter === f ? "op-tab-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Toutes" : f === "open" ? "Ouvertes" : f === "closed" ? "Fermées" : "Pourvues"}
              <span className="op-tab-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* ”€”€ LOADING ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        {loading && (
          <div className="op-loading">
            <div className="op-spinner" />
            <p>Chargement des offres…</p>
          </div>
        )}

        {/* ”€”€ EMPTY STATE ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        {!loading && filtered.length === 0 && (
          <div className="op-empty">
            <div className="op-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                <line x1="12" y1="12" x2="12" y2="16"/>
                <line x1="10" y1="14" x2="14" y2="14"/>
              </svg>
            </div>
            <h3>Aucune offre trouvée</h3>
            <p>
              {filter === "all"
                ? "Vous n'avez pas encore créé d'offre de stage."
                : `Vous n'avez aucune offre avec le statut "${filter}".`}
            </p>
            {filter === "all" && (
              <button
                className="op-create-btn"
                onClick={() => navigate("/company/offers/new")}
              >
                Créer ma première offre
              </button>
            )}
          </div>
        )}

        {/* ”€”€ OFFERS GRID ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
        {!loading && filtered.length > 0 && (
          <div className="op-grid">
            {filtered.map((offer, i) => (
              <OfferCard key={offer.id} offer={offer} index={i} />
            ))}

            {/* Add new offer card */}
            <button
              className="op-add-card"
              onClick={() => navigate("/company/offers/new")}
            >
              <div className="op-add-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span>Nouvelle offre</span>
            </button>
          </div>
        )}

      </div>
    </CompanyLayout>
  );
}
