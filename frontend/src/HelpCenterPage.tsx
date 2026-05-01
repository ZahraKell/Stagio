import React, { useState, useMemo } from 'react';
import DashboardLayout from './components/DashboardLayout';
import {
    Search, BookOpen, FileText, MessageCircle, Mail,
    ExternalLink, Briefcase, User, Shield, CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TYPES ──────────────────────────────────────────────────── */
interface GuideItem { icon: React.ReactNode; title: string; desc: string; tag: string; }

/* ─── QUICK GUIDES (unchanged) ───────────────────────────────── */
const guides: GuideItem[] = [
    { icon: <User size={22} />, title: 'Set up your profile', desc: 'Complete your profile to improve your match score with companies.', tag: 'Beginner' },
    { icon: <Briefcase size={22} />, title: 'Apply for your first internship', desc: 'Step-by-step walkthrough from browsing offers to submitting your application.', tag: 'Beginner' },
    { icon: <FileText size={22} />, title: 'Build a strong Euro CV', desc: 'Tips on what to include in each section to stand out.', tag: 'Tips' },
    { icon: <Shield size={22} />, title: 'Understanding conventions', desc: 'Everything you need to know about the internship convention process.', tag: 'Admin' },
    { icon: <CheckCircle2 size={22} />, title: 'After acceptance: next steps', desc: 'What happens after your application is accepted and the convention is generated.', tag: 'Tips' },
    { icon: <BookOpen size={22} />, title: 'Privacy & your data', desc: 'How StageConnect handles your data and how to control your privacy.', tag: 'Privacy' },
];

const HelpCenterPage: React.FC = () => {
    const [contactSent, setContactSent] = useState(false);
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');

    const handleContact = () => {
        if (!subject.trim() || !message.trim()) return;
        setContactSent(true);
        setSubject('');
        setMessage('');
        setTimeout(() => setContactSent(false), 4000);
    };

    return (
        <DashboardLayout pageTitle="Help Center">

            {/* ── HERO (no search anymore, because FAQ was removed) ── */}
            <div className="page-hero hlp-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>How can we help you?</h1>
                    <p>Browse our guides or contact the StageConnect support team</p>
                </div>
            </div>

            {/* ── QUICK GUIDES ── */}
            <div className="sc-section">
                <div className="section-header">
                    <h2>Quick Guides</h2>
                </div>
                <div className="hlp-guides-grid">
                    {guides.map(g => (
                        <div className="hlp-guide-card" key={g.title}>
                            <div className="hlp-guide-icon">{g.icon}</div>
                            <div className="hlp-guide-body">
                                <div className="hlp-guide-top">
                                    <span className="hlp-guide-title">{g.title}</span>
                                    <span className={`hlp-guide-tag tag-${g.tag.toLowerCase()}`}>{g.tag}</span>
                                </div>
                                <p className="hlp-guide-desc">{g.desc}</p>
                            </div>
                            <ExternalLink size={14} className="hlp-guide-arrow" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CONTACT (unchanged) ── */}
            <div className="sc-section">
                <div className="section-header"><h2>Still need help?</h2></div>
                <div className="hlp-contact-layout">

                    {/* Contact channels */}
                    <div className="hlp-channels">
                        {[
                            { icon: <Mail size={20} />, title: 'Email Support', desc: 'support@stageconnect.dz', sub: 'Response within 24 h', color: 'var(--sc-blue)' },
                            { icon: <MessageCircle size={20} />, title: 'Live Chat', desc: 'Chat with our team', sub: 'Mon–Fri, 8 AM – 5 PM', color: 'var(--sc-pink)' },
                            { icon: <BookOpen size={20} />, title: 'Documentation', desc: 'docs.stageconnect.dz', sub: 'Full API & user docs', color: 'var(--sc-green)' },
                        ].map(c => (
                            <div className="hlp-channel-card" key={c.title}>
                                <div className="hlp-channel-icon" style={{ background: `${c.color}18`, color: c.color }}>
                                    {c.icon}
                                </div>
                                <div>
                                    <strong>{c.title}</strong>
                                    <p>{c.desc}</p>
                                    <span>{c.sub}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact form */}
                    <div className="hlp-contact-form card">
                        <h3>Send us a message</h3>

                        <AnimatePresence mode="wait">
                            {contactSent ? (
                                <motion.div
                                    className="hlp-sent-msg"
                                    key="sent"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <CheckCircle2 size={32} />
                                    <strong>Message sent!</strong>
                                    <p>We'll get back to you within 24 hours.</p>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="sc-form-group" style={{ marginBottom: 14 }}>
                                        <label>Subject</label>
                                        <input
                                            type="text"
                                            placeholder="Briefly describe your issue"
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group" style={{ marginBottom: 16 }}>
                                        <label>Message</label>
                                        <textarea
                                            placeholder="Describe your issue in detail…"
                                            rows={4}
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="sc-btn-primary"
                                        onClick={handleContact}
                                        style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                                    >
                                        Send Message
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

        </DashboardLayout>
    );
};

export default HelpCenterPage;