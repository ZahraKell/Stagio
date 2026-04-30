import { useState, useEffect } from "react";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Header appears only after scrolling past the hero section (100vh)
            const heroHeight = window.innerHeight;
            setIsScrolled(window.scrollY > heroHeight - 80);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`hs-nav ${isScrolled ? "hs-nav-scrolled" : ""}`}>
            <div className="hs-nav-left">
                <a href="#" className="hs-logo">
                    Stag<span style={{ color: isScrolled ? "#000" : "#F5C518" }}>.io</span>
                </a>
                <ul className="hs-nav-links">
                    <li><a href="#" className="active">Étudiants</a></li>
                    <li><a href="/about">about</a></li>
                    <li><a href="/contact">Contact us</a></li>
                </ul>
            </div>
            <div className="hs-nav-right">
                <a href="#" className="hs-login">Connexion</a>
                <a href="#" className="hs-signup">Inscris-toi</a>
            </div>
        </nav>
    );
}