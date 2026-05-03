import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const FAQS = [
    {
        category: "Général",
        items: [
            {
                q: "Qu'est-ce que Stag.io ?",
                a: "Stag.io est la première plateforme algérienne entièrement dédiée à la mise en relation des étudiants et des entreprises pour les stages. Gratuite, intuitive et sécurisée.",
            },
            {
                q: "Qui peut utiliser la plateforme ?",
                a: "Tout étudiant ou jeune diplômé algérien à la recherche d'un stage. Les entreprises immatriculées en Algérie peuvent également publier leurs offres.",
            },
            {
                q: "Est-ce que c'est gratuit ?",
                a: "Oui, la plateforme est 100 % gratuite pour les étudiants. Les entreprises bénéficient d'un accès gratuit pour publier leurs premières offres.",
            },
        ],
    },
    {
        category: "Pour les étudiants",
        items: [
            {
                q: "Comment postuler à une offre ?",
                a: "Parcourez les offres, trouvez celle qui correspond à votre domaine et à votre wilaya, puis cliquez sur « Postuler ». Vos informations de profil seront transmises directement à l'entreprise.",
            },
            {
                q: "Puis-je postuler à plusieurs offres en même temps ?",
                a: "Oui ! Vous pouvez postuler à autant d'offres que vous souhaitez. Nous recommandons d'adapter votre CV pour chaque poste afin d'augmenter vos chances.",
            },
            {
                q: "Comment fonctionne la date limite de candidature ?",
                a: "Vous devez postuler avant la date limite indiquée sur la fiche de l'offre. Les entreprises examinent les candidatures au fil de l'eau, donc postulez tôt !",
            },
        ],
    },
    {
        category: "Pour les entreprises",
        items: [
            {
                q: "Comment publier une offre de stage ?",
                a: "Cliquez sur « Publier une offre » dans la barre de navigation pour créer un compte entreprise. Une fois vérifié, vous pouvez commencer à publier immédiatement.",
            },
            {
                q: "Comment mon entreprise est-elle vérifiée ?",
                a: "Nous vérifions tous les comptes entreprise à l'aide du RC (Registre de Commerce) pour garantir un environnement sûr et fiable pour les étudiants.",
            },
        ],
    },
    {
        category: "Technique",
        items: [
            {
                q: "Quels navigateurs sont supportés ?",
                a: "Stag.io est optimisé pour tous les navigateurs modernes : Chrome, Edge, Safari et Firefox. La plateforme est également entièrement responsive sur mobile.",
            },
            {
                q: "J'ai un problème avec mon compte, que faire ?",
                a: "Si vous avez des difficultés à vous connecter ou à réinitialiser votre mot de passe, contactez notre équipe de support via la page Contact.",
            },
        ],
    },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="faq-item">
            <button
                className={`faq-item-btn ${open ? "open" : ""}`}
                onClick={() => setOpen(!open)}
            >
                <span>{q}</span>
                <span className="faq-icon">
                    <ChevronDown size={16} color={open ? "#000" : "#5B4A38"} />
                </span>
            </button>
            {open && <div className="faq-item-answer">{a}</div>}
        </div>
    );
}

export default function FAQPage() {
    return (
        <>
            <div className="page-dark-hero">
                <div className="page-dark-hero-overlay" />
                <div className="page-dark-hero-content">
                    <span className="page-dark-hero-badge">Aide & Support</span>
                    <h1>Questions fréquentes</h1>
                    <p>Tout ce que vous devez savoir pour trouver votre stage ou recruter les meilleurs talents.</p>
                </div>
            </div>

            <div className="faq-section">
                {FAQS.map((cat, idx) => (
                    <div key={idx} className="faq-category">
                        <div className="faq-category-label">{cat.category}</div>
                        {cat.items.map((item, i) => (
                            <AccordionItem key={i} q={item.q} a={item.a} />
                        ))}
                    </div>
                ))}

                <div className="faq-cta-box">
                    <h3>Vous n'avez pas trouvé votre réponse ?</h3>
                    <p>Notre équipe est disponible pour vous aider à naviguer sur la plateforme.</p>
                    <Link to="/contact">
                        <button className="cta-primary">Contacter le support</button>
                    </Link>
                </div>
            </div>
        </>
    );
}
