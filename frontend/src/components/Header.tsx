import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const heroHeight = window.innerHeight;
            setIsScrolled(window.scrollY > heroHeight - 80);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`hs-nav ${isScrolled ? "hs-nav-scrolled" : ""}`}>
            <div className="hs-nav-left">
                <Link to="/" className="hs-logo">
                    Stag<span style={{ color: isScrolled ? "#000" : "#F5C518" }}>.io</span>
                </Link>
                <ul className="hs-nav-links">
                    <li><Link to="/offers">Offers</Link></li>
                    <li><Link to="/Testimonials">Stories</Link></li>
                    <li><Link to="/FAQ">FAQ</Link></li>
                    <li><Link to="/Companies">Companies</Link></li>
                    <li><Link to="/Blog">Blog</Link></li>
                    <li><Link to="/about">À propos</Link></li>
                    <li><Link to="/contact">Contact us</Link></li>
                </ul>
            </div>
            <div className="hs-nav-right">
                <Link to="/login" className="hs-login-btn">
                    <LogIn size={16} />
                    <span>Login</span>
                </Link>
            </div>
        </nav>
    );
}