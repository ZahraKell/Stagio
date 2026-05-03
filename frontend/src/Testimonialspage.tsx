import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const TESTIMONIALS = [
    {
        id: 1,
        name: "Ryad Mahrez",
        university: "USTHB",
        company: "Yassir",
        role: "Stagiaire Backend Engineering",
        quote: "Stag.io a rendu ma recherche de stage incroyablement simple. J'ai postulé à 3 offres et j'avais des entretiens programmés en moins d'une semaine. Ce stage chez Yassir a complètement changé ma trajectoire professionnelle.",
        initials: "RM",
        color: "#1a1a2e",
    },
    {
        id: 2,
        name: "Sarah Benali",
        university: "ESI Alger",
        company: "Ooredoo",
        role: "Stagiaire Data Science",
        quote: "J'avais du mal à trouver des opportunités pertinentes en Data Science. Le système de filtres m'a aidée à trouver exactement ce que je cherchais. L'interface est très bien pensée et facile à utiliser.",
        initials: "SB",
        color: "#5C1F2E",
    },
    {
        id: 3,
        name: "Karim Ziani",
        university: "Université de Béjaïa",
        company: "Cevital",
        role: "Stagiaire Support IT",
        quote: "Ce que j'apprécie, c'est que les entreprises répondent vraiment. Stag.io vérifie les entreprises, donc je savais que les offres étaient sérieuses. J'ai fini par recevoir une offre en CDI après mon stage de 3 mois.",
        initials: "KZ",
        color: "#2A4A2A",
    },
    {
        id: 4,
        name: "Lina Khelifi",
        university: "Université Constantine 2",
        company: "Sonatrach",
        role: "Stagiaire Développement Logiciel",
        quote: "La plateforme donne confiance. Elle ne ressemble pas à un portail gouvernemental ennuyeux. Je recommande vivement de compléter son profil — cela rend la candidature ultra-rapide.",
        initials: "LK",
        color: "#B8893E",
    },
    {
        id: 5,
        name: "Amine Toumi",
        university: "Université de Sétif 1",
        company: "Mobilis",
        role: "Stagiaire Réseaux",
        quote: "J'ai trouvé un stage hybride, ce qui est rare en Algérie. Les filtres de Stag.io m'ont permis de chercher spécifiquement des postes distants/hybrides. Ça m'a économisé des heures de navigation sur LinkedIn.",
        initials: "AT",
        color: "#0f3460",
    },
    {
        id: 6,
        name: "Fatima Zahra",
        university: "Université d'Oran",
        company: "Djezzy",
        role: "Stagiaire UX Design",
        quote: "En tant que designer, j'apprécie une bonne UX, et cette plateforme l'a. La fonction de suivi des candidatures m'a aidée à rester sereine pendant la période d'attente. Expérience 10/10.",
        initials: "FZ",
        color: "#4E2A6A",
    },
];

const STATS = [
    { num: "2 400+", label: "Étudiants placés" },
    { num: "94%", label: "Taux de satisfaction" },
    { num: "180+", label: "Entreprises partenaires" },
    { num: "48h", label: "Délai de réponse moyen" },
];

export default function TestimonialsPage() {
    return (
        <>
            <div className="page-dark-hero">
                <div className="page-dark-hero-overlay" />
                <div className="page-dark-hero-content">
                    <span className="page-dark-hero-badge">Témoignages</span>
                    <h1>Ils ont réussi grâce à Stag.io</h1>
                    <p>Des étudiants comme vous ont trouvé leur stage idéal et transformé leur carrière. Voici leurs histoires.</p>
                </div>
            </div>

            <div className="testimonials-section">
                <div className="testimonials-stats-dark">
                    {STATS.map((s, i) => (
                        <div key={i} className="ts-stat-item">
                            <div className="ts-stat-num">{s.num}</div>
                            <div className="ts-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="testimonials-grid-v2">
                    {TESTIMONIALS.map((t) => (
                        <div key={t.id} className="testimonial-card-v2">
                            <div className="ts-stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill="#F5C518" color="#F5C518" />
                                ))}
                            </div>
                            <p className="ts-quote">"{t.quote}"</p>
                            <div className="ts-author">
                                <div className="ts-avatar" style={{ background: t.color }}>
                                    {t.initials}
                                </div>
                                <div>
                                    <div className="ts-name">{t.name}</div>
                                    <div className="ts-role">{t.role}</div>
                                    <div className="ts-company">@ {t.company}</div>
                                    <div className="ts-university">{t.university}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="testimonials-cta">
                    <h2>Prêt à commencer votre aventure ?</h2>
                    <div className="testimonials-cta-btns">
                        <Link to="/offers">
                            <button className="ts-btn-primary">Découvrir les offres</button>
                        </Link>
                        <Link to="/contact">
                            <button className="ts-btn-outline">Nous contacter</button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
