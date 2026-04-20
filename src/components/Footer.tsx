import React from 'react';
import { Link } from 'react-router-dom';
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="hs-footer">
      <div className="hs-footer-grid">
        <div className="hs-footer-brand">
          <Link to="/" className="hs-footer-logo">Stag<span style={{ color: "#F5C518" }}>.io</span></Link>
          <p>Connecting students with top companies across Algeria. Your future starts here.</p>
          <div className="social-media">
            <a href="#" aria-label="Facebook" className="social-icon fb"><FaFacebook /></a>
            <a href="#" aria-label="Twitter" className="social-icon tw"><FaTwitter /></a>
            <a href="#" aria-label="Instagram" className="social-icon ig"><FaInstagram /></a>
            <a href="#" aria-label="LinkedIn" className="social-icon li"><FaLinkedin /></a>
          </div>
        </div>

        <div className="hs-footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/internships">Internships</Link></li>
          </ul>
        </div>

        <div className="hs-footer-col">
          <h4>Resources</h4>
          <ul>
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>

        <div className="hs-footer-col">
          <h4>Work hours</h4>
          <p>8:30 AM - 4:00 PM, Sun - Thur<br />Call us at <a href="tel:+213556447890">213-55644-7890</a></p>
        </div>
      </div>
      <div className="hs-footer-bottom">
        <p>&copy; {new Date().getFullYear()} Stag.io. All rights reserved.</p>
        <div className="hs-footer-bottom-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/legal">Legal</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;