import React from 'react';
import { Link } from 'react-router-dom';
import soulef from "./assets/soulef.jpg";
import zahra from "./assets/zahra.jpg";

const AboutPage: React.FC = () => {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <div className="about-hero">
                <div className="about-hero-overlay"></div>
                <div className="about-hero-content">
                    <h1>About Us</h1>
                    <p>We connect students with the best career opportunities across Algeria.</p>
                </div>
            </div>

            {/* Mission & Vision */}
            <div className="mission-vision">
                <div className="mission-card">
                    <h3>Our Mission</h3>
                    <p>To empower students and recent graduates by providing a platform that bridges the gap between education and employment, fostering talent and driving economic growth.</p>
                </div>
                <div className="vision-card">
                    <h3>Our Vision</h3>
                    <p>To become the leading career network in Algeria, where every student finds their ideal opportunity and every company discovers exceptional talent.</p>
                </div>
            </div>

            {/* Stats Section (reuse similar style) */}
            <div className="about-stats">
                <div className="stats-container">
                    <div className="stat-item">
                        <div className="stat-number">15,000+</div>
                        <div className="stat-label">Students Helped</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">900+</div>
                        <div className="stat-label">Partner Companies</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">94%</div>
                        <div className="stat-label">Satisfaction Rate</div>
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div className="team-section">
                <h2>Meet Our Team</h2>
                <div className="team-grid">
                    <div className="team-card">
                        <img src={soulef} alt="Team member" />
                        <h4>Bendjamaa Soulef Hadil</h4>
                        <p>CEO & Founder <br />Developer</p>
                    </div>
                    <div className="team-card">
                        <img src={zahra} alt="Team member" />
                        <h4>Kellou Fatima Zahra</h4>
                        <p>CEO & Founder <br />Developer</p>
                    </div>

                </div>
            </div>

            {/* Call to Action */}
            <div className="about-cta">
                <h2>Ready to start your journey?</h2>
                <Link to="/contact" className="cta-button">Get in Touch</Link>
            </div>
        </div>
    );
};

export default AboutPage;