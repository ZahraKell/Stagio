import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const FAQS = [
    {
        category: "General",
        items: [
            {
                q: "What is Stag.io?",
                a: "Stag.io is the first Algerian platform entirely dedicated to connecting students and companies for internships. Free, intuitive and secure.",
            },
            {
                q: "Who can use the platform?",
                a: "Any Algerian student or recent graduate looking for an internship. Companies registered in Algeria can also post their offers.",
            },
            {
                q: "Is it free?",
                a: "Yes, the platform is 100% free for students. Companies get free access to post their first offers.",
            },
        ],
    },
    {
        category: "For students",
        items: [
            {
                q: "How do I apply to an offer?",
                a: "Browse the offers, find the one that matches your field and wilaya, then click \u201cApply\u201d. Your profile information will be sent directly to the company.",
            },
            {
                q: "Can I apply to several offers at the same time?",
                a: "Yes! You can apply to as many offers as you want. We recommend tailoring your CV for each position to increase your chances.",
            },
            {
                q: "How does the application deadline work?",
                a: "You must apply before the deadline shown on the offer page. Companies review applications on a rolling basis, so apply early!",
            },
        ],
    },
    {
        category: "For companies",
        items: [
            {
                q: "How do I post an internship offer?",
                a: "Click \u201cPost an offer\u201d in the navigation bar to create a company account. Once verified, you can start posting right away.",
            },
            {
                q: "How is my company verified?",
                a: "We verify all company accounts using the RC (Commercial Register) to guarantee a safe and reliable environment for students.",
            },
        ],
    },
    {
        category: "Technical",
        items: [
            {
                q: "Which browsers are supported?",
                a: "Stag.io is optimized for all modern browsers: Chrome, Edge, Safari and Firefox. The platform is also fully responsive on mobile.",
            },
            {
                q: "I have a problem with my account, what should I do?",
                a: "If you have trouble logging in or resetting your password, contact our support team through the Contact page.",
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
                    <span className="page-dark-hero-badge">Help & Support</span>
                    <h1>Frequently asked questions</h1>
                    <p>Everything you need to know to find your internship or recruit the best talent.</p>
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
                    <h3>Didn't find your answer?</h3>
                    <p>Our team is available to help you navigate the platform.</p>
                    <Link to="/contact">
                        <button className="cta-primary">Contact support</button>
                    </Link>
                </div>
            </div>
        </>
    );
}