import React, { useState, useEffect, useRef } from 'react';
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isStatsVisible, setIsStatsVisible] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsStatsVisible(entry.isIntersecting);
            },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Thank you! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="contact-page">
            {/* Hero Section – background defined in CSS */}
            <div className={`contact-hero ${isStatsVisible ? 'fade-out' : ''}`}>
                <div className="contact-hero-overlay"></div>
                <div className="contact-hero-content">
                    <h1>Contact Us</h1>
                    <p>We'd love to hear from you. Get in touch with our team.</p>
                </div>
            </div>

            {/* Stats Section – background defined in CSS, with fade‑in effect */}
            <div
                ref={statsRef}
                className={`stats-bg-section ${isStatsVisible ? 'in-view' : ''}`}
            >
                <div className="stats-overlay"></div>
                <div className="stats-container-centered">
                    <div className="stat-card">
                        <div className="stat-number">3x</div>
                        <div className="stat-label">plus d'offres d'emploi</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">78%</div>
                        <div className="stat-label">d'augmentation de la satisfaction étudiante</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">65%</div>
                        <div className="stat-label">de hausse de l’engagement des étudiants</div>
                    </div>
                </div>
            </div>

            {/* Form + Contact Details (unchanged) */}
            <div className="form-contact-section">
                <div className="form-contact-container">
                    <div className="contact-form-wrapper">
                        <h2>Send us a message</h2>
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <label htmlFor="name">Your Name *</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address *</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="message">Message *</label>
                                <textarea id="message" name="message" rows={5} value={formData.message} onChange={handleChange} required></textarea>
                            </div>
                            <button type="submit" className="submit-btn">Send Message →</button>
                        </form>
                    </div>
                    <div className="contact-details-wrapper">
                        <h3>Contact Information</h3>
                        <ul className="contact-list">
                            <li>
                                <div className="contact-icon"><HiMail /></div>
                                <div className="contact-text">
                                    <strong>Email</strong>
                                    <a href="mailto:contact@stag.io">contact@stag.io</a>
                                </div>
                            </li>
                            <li>
                                <div className="contact-icon"><HiPhone /></div>
                                <div className="contact-text">
                                    <strong>Phone</strong>
                                    <a href="tel:+213556447890">+213 5XX XX XX XX</a>
                                </div>
                            </li>
                            <li>
                                <div className="contact-icon"><HiLocationMarker /></div>
                                <div className="contact-text">
                                    <strong>Address</strong>
                                    <span>123 Business Street, Algiers, Algeria</span>
                                </div>
                            </li>
                        </ul>
                        <div className="social-media">
                            <a href="#" aria-label="Facebook" className="social-icon fb"><FaFacebook /></a>
                            <a href="#" aria-label="Twitter" className="social-icon tw"><FaTwitter /></a>
                            <a href="#" aria-label="Instagram" className="social-icon ig"><FaInstagram /></a>
                            <a href="#" aria-label="LinkedIn" className="social-icon li"><FaLinkedin /></a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="map-section">
                <div className="map-container">
                    <iframe
                        title="Google Map"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3217.730124444533!2d6.56743137432273!3d36.24604927241022!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12f1655aaa0d63ab%3A0xa80cc72a9da3c77b!2sUniversite%20Constantine%202%20Abdelhamid%20Mehri!5e0!3m2!1sfr!2sdz!4v1776467805821!5m2!1sfr!2sdz"
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;