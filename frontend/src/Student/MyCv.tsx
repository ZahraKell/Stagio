// MyCv.tsx
import React, { useState, useCallback } from 'react';
import {
    User, GraduationCap, Briefcase, Code2, Globe,
    Heart, Users, Plus, Trash2, ChevronDown, ChevronUp,
    Eye, Edit3, Download, RotateCcw, Check
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

/* ================================================================
   TYPES
   ================================================================ */

interface Skill {
    id: string;
    name: string;
    level: number; // 1–6
}

interface Language {
    id: string;
    name: string;
    level: string;
}

interface Hobby {
    id: string;
    value: string;
}

interface EducationEntry {
    id: string;
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    description: string;
}

interface ExperienceEntry {
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
}

interface ReferenceEntry {
    id: string;
    name: string;
    position: string;
    email: string;
    phone: string;
}

interface PersonalInfo {
    firstName: string;
    lastName: string;
    dob: string;
    nationality: string;
    email: string;
    phone: string;
    address: string;
    linkedin: string;
    summary: string;
}

/* ================================================================
   CONSTANTS
   ================================================================ */

const SKILL_LEVEL_LABELS = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Inter.', 'Advanced', 'Expert'];

const LANG_LEVELS = [
    'Native',
    'A1 — Beginner',
    'A2 — Elementary',
    'B1 — Intermediate',
    'B2 — Upper-Intermediate',
    'C1 — Advanced',
    'C2 — Proficient',
];

const DEFAULT_PERSONAL: PersonalInfo = {
    firstName: 'Ahmed',
    lastName: 'Benali',
    dob: '2002-05-14',
    nationality: 'Algerian',
    email: 'ahmed.benali@etu.univ-constantine1.dz',
    phone: '+213 550 123 456',
    address: 'Sétif, Algeria',
    linkedin: 'linkedin.com/in/ahmed-benali',
    summary:
        'Final-year Computer Science student at Université Frères Mentouri Constantine 1, specializing in software engineering and data systems. Seeking a challenging internship to apply my skills in full-stack development and contribute to real-world projects in Algeria\'s growing tech sector.',
};

const DEFAULT_EDUCATION: EducationEntry[] = [
    {
        id: 'edu-1',
        degree: 'Licence (L3) Informatique',
        institution: 'Université Frères Mentouri Constantine 1',
        startDate: 'Sep 2021',
        endDate: 'Jun 2024',
        description: 'Coursework in algorithms, databases, web development, software engineering, and networks. Dean\'s list — average 15.2/20.',
    },
];

const DEFAULT_EXPERIENCE: ExperienceEntry[] = [
    {
        id: 'exp-1',
        title: 'Web Development Intern',
        company: 'Condor Electronics — Sétif',
        startDate: 'Jul 2023',
        endDate: 'Sep 2023',
        description: 'Developed internal dashboards using React and Node.js. Reduced report generation time by 40% through API optimizations. Collaborated with a 5-person engineering team.',
    },
];

const DEFAULT_SKILLS: Skill[] = [
    { id: 's1', name: 'JavaScript / React', level: 5 },
    { id: 's2', name: 'Python', level: 4 },
    { id: 's3', name: 'SQL & Databases', level: 4 },
    { id: 's4', name: 'Git & Linux', level: 3 },
    { id: 's5', name: 'C / C++', level: 3 },
];

const DEFAULT_LANGUAGES: Language[] = [
    { id: 'l1', name: 'Arabic', level: 'Native' },
    { id: 'l2', name: 'French', level: 'C1 — Advanced' },
    { id: 'l3', name: 'English', level: 'B2 — Upper-Intermediate' },
];

const DEFAULT_HOBBIES: Hobby[] = [
    { id: 'h1', value: 'Open Source' },
    { id: 'h2', value: 'Competitive Programming' },
    { id: 'h3', value: 'Chess' },
    { id: 'h4', value: 'Basketball' },
];

const DEFAULT_REFERENCES: ReferenceEntry[] = [
    {
        id: 'r1',
        name: 'Dr. Karim Mansouri',
        position: 'Head of Dept, CS — UFMC1',
        email: 'k.mansouri@univ-constantine1.dz',
        phone: '+213 31 000 111',
    },
];

/* ================================================================
   UTILITY
   ================================================================ */

const uid = () => Math.random().toString(36).slice(2, 9);

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

/* ── Collapsible Section Wrapper ─────────────────────────────── */
interface SectionWrapProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const SectionWrap: React.FC<SectionWrapProps> = ({ icon, title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="sc-cv-section-wrap">
            <button className="sc-cv-section-toggle" onClick={() => setOpen(o => !o)}>
                <div className="sc-cv-section-toggle-left">
                    <div className="sc-cv-sec-icon">{icon}</div>
                    {title}
                </div>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && <div className="sc-cv-section-body">{children}</div>}
        </div>
    );
};

/* ── Skill Dot Rating ────────────────────────────────────────── */
interface SkillDotProps {
    level: number;
    onChange: (level: number) => void;
}

const SkillDots: React.FC<SkillDotProps> = ({ level, onChange }) => (
    <div className="sc-skill-dots">
        {[1, 2, 3, 4, 5, 6].map(d => (
            <button
                key={d}
                className={`sc-skill-dot${d <= level ? ' filled' : ''}`}
                onClick={() => onChange(d)}
                title={SKILL_LEVEL_LABELS[d - 1]}
                type="button"
            />
        ))}
        <span className="sc-skill-level-label">{SKILL_LEVEL_LABELS[level - 1]}</span>
    </div>
);

/* ── Completion Bar ──────────────────────────────────────────── */
interface CompletionBarProps {
    pct: number;
}

const CompletionBar: React.FC<CompletionBarProps> = ({ pct }) => (
    <div className="sc-cv-completion">
        <span>{pct}%</span>
        <div className="sc-cv-comp-bar">
            <div className="sc-cv-comp-fill" style={{ width: `${pct}%` }} />
        </div>
        <span>Complete</span>
    </div>
);

/* ================================================================
   EURO CV PREVIEW (A4)
   ================================================================ */

interface EuroCvProps {
    personal: PersonalInfo;
    education: EducationEntry[];
    experience: ExperienceEntry[];
    skills: Skill[];
    languages: Language[];
    hobbies: Hobby[];
    references: ReferenceEntry[];
}

const EuroCv: React.FC<EuroCvProps> = ({
    personal, education, experience, skills, languages, hobbies, references,
}) => {
    const initials =
        (personal.firstName?.[0] ?? '') + (personal.lastName?.[0] ?? '');
    const fullName = `${personal.firstName} ${personal.lastName}`.trim();

    return (
        <div className="euro-cv">

            {/* Header */}
            <div className="euro-cv-header">
                <div className="euro-cv-photo-wrap">
                    <div className="euro-cv-photo-placeholder">{initials}</div>
                </div>
                <div className="euro-cv-header-info">
                    <div className="euro-cv-name">{fullName || 'Your Name'}</div>
                    <div className="euro-cv-contacts">
                        {personal.email && <span>✉ {personal.email}</span>}
                        {personal.phone && <span>✆ {personal.phone}</span>}
                        {personal.address && <span>📍 {personal.address}</span>}
                        {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
                    </div>
                    <div className="euro-cv-meta">
                        {personal.dob && `Date of Birth: ${personal.dob}`}
                        {personal.dob && personal.nationality && ' · '}
                        {personal.nationality && `Nationality: ${personal.nationality}`}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="euro-cv-body">

                {/* Left column */}
                <div className="euro-cv-left">

                    {skills.length > 0 && (
                        <div className="euro-cv-block">
                            <div className="euro-cv-block-title">Technical Skills</div>
                            {skills.map(sk => (
                                <div key={sk.id} className="euro-cv-skill-row">
                                    <div className="euro-cv-skill-name">{sk.name}</div>
                                    <div className="euro-cv-skill-bar">
                                        <div
                                            className="euro-cv-skill-fill"
                                            style={{ width: `${Math.round((sk.level / 6) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {languages.length > 0 && (
                        <div className="euro-cv-block">
                            <div className="euro-cv-block-title">Languages</div>
                            {languages.map(l => (
                                <div key={l.id} className="euro-cv-lang-row">
                                    <span className="euro-cv-lang-name">{l.name}</span>
                                    <span className="euro-cv-lang-level">{l.level}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {hobbies.length > 0 && (
                        <div className="euro-cv-block">
                            <div className="euro-cv-block-title">Interests</div>
                            <div className="euro-cv-hobbies">
                                {hobbies.map(h => (
                                    <span key={h.id} className="euro-cv-hobby-tag">{h.value}</span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right column */}
                <div className="euro-cv-right">

                    {personal.summary && (
                        <div className="euro-cv-block">
                            <div className="euro-cv-block-title">Professional Summary</div>
                            <div className="euro-cv-summary">{personal.summary}</div>
                        </div>
                    )}

                    {education.length > 0 && (
                        <div className="euro-cv-block">
                            <div className="euro-cv-block-title">Education</div>
                            {education.map(e => (
                                <div key={e.id} className="euro-cv-entry">
                                    <div className="euro-cv-entry-header">
                                        <div>
                                            <div className="euro-cv-entry-title">{e.degree}</div>
                                            <div className="euro-cv-entry-sub">{e.institution}</div>
                                        </div>
                                        {(e.startDate || e.endDate) && (
                                            <span className="euro-cv-entry-date">
                                                {e.startDate}{e.startDate && e.endDate ? ' – ' : ''}{e.endDate}
                                            </span>
                                        )}
                                    </div>
                                    {e.description && (
                                        <div className="euro-cv-entry-desc">{e.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {experience.length > 0 && (
                        <div className="euro-cv-block">
                            <div className="euro-cv-block-title">Work Experience</div>
                            {experience.map(e => (
                                <div key={e.id} className="euro-cv-entry">
                                    <div className="euro-cv-entry-header">
                                        <div>
                                            <div className="euro-cv-entry-title">{e.title}</div>
                                            <div className="euro-cv-entry-sub">{e.company}</div>
                                        </div>
                                        {(e.startDate || e.endDate) && (
                                            <span className="euro-cv-entry-date">
                                                {e.startDate}{e.startDate && e.endDate ? ' – ' : ''}{e.endDate}
                                            </span>
                                        )}
                                    </div>
                                    {e.description && (
                                        <div className="euro-cv-entry-desc">{e.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {references.length > 0 && (
                        <div className="euro-cv-block">
                            <div className="euro-cv-block-title">References</div>
                            <div className="euro-cv-refs-grid">
                                {references.map(r => (
                                    <div key={r.id}>
                                        <div className="euro-cv-ref-name">{r.name}</div>
                                        <div className="euro-cv-ref-pos">{r.position}</div>
                                        <div className="euro-cv-ref-contact">{r.email}</div>
                                        {r.phone && (
                                            <div className="euro-cv-ref-contact">{r.phone}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

type Tab = 'edit' | 'preview';

const MyCv: React.FC = () => {
    const [tab, setTab] = useState<Tab>('edit');
    const [saved, setSaved] = useState(false);

    // Form state
    const [personal, setPersonal] = useState<PersonalInfo>(DEFAULT_PERSONAL);
    const [education, setEducation] = useState<EducationEntry[]>(DEFAULT_EDUCATION);
    const [experience, setExperience] = useState<ExperienceEntry[]>(DEFAULT_EXPERIENCE);
    const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
    const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
    const [hobbies, setHobbies] = useState<Hobby[]>(DEFAULT_HOBBIES);
    const [references, setReferences] = useState<ReferenceEntry[]>(DEFAULT_REFERENCES);

    /* ── Completion calculation ──────────────────────────────── */
    const completion = useCallback((): number => {
        let filled = 0;
        const total = 7;
        if (personal.firstName && personal.lastName && personal.email && personal.phone) filled++;
        if (personal.summary.length > 20) filled++;
        if (education.length > 0 && education[0].degree) filled++;
        if (experience.length > 0 && experience[0].title) filled++;
        if (skills.length >= 3) filled++;
        if (languages.length >= 1) filled++;
        if (hobbies.length >= 2) filled++;
        return Math.round((filled / total) * 100);
    }, [personal, education, experience, skills, languages, hobbies]);

    /* ── Personal helpers ────────────────────────────────────── */
    const updatePersonal = (field: keyof PersonalInfo, value: string) =>
        setPersonal(p => ({ ...p, [field]: value }));

    /* ── Education helpers ───────────────────────────────────── */
    const addEducation = () =>
        setEducation(list => [...list, { id: uid(), degree: '', institution: '', startDate: '', endDate: '', description: '' }]);
    const removeEducation = (id: string) =>
        setEducation(list => list.filter(e => e.id !== id));
    const updateEducation = (id: string, field: keyof EducationEntry, value: string) =>
        setEducation(list => list.map(e => e.id === id ? { ...e, [field]: value } : e));

    /* ── Experience helpers ──────────────────────────────────── */
    const addExperience = () =>
        setExperience(list => [...list, { id: uid(), title: '', company: '', startDate: '', endDate: '', description: '' }]);
    const removeExperience = (id: string) =>
        setExperience(list => list.filter(e => e.id !== id));
    const updateExperience = (id: string, field: keyof ExperienceEntry, value: string) =>
        setExperience(list => list.map(e => e.id === id ? { ...e, [field]: value } : e));

    /* ── Skill helpers ───────────────────────────────────────── */
    const addSkill = () =>
        setSkills(list => [...list, { id: uid(), name: '', level: 3 }]);
    const removeSkill = (id: string) =>
        setSkills(list => list.filter(s => s.id !== id));
    const updateSkill = (id: string, field: keyof Skill, value: string | number) =>
        setSkills(list => list.map(s => s.id === id ? { ...s, [field]: value } : s));

    /* ── Language helpers ────────────────────────────────────── */
    const addLanguage = () =>
        setLanguages(list => [...list, { id: uid(), name: '', level: 'A1 — Beginner' }]);
    const removeLanguage = (id: string) =>
        setLanguages(list => list.filter(l => l.id !== id));
    const updateLanguage = (id: string, field: keyof Language, value: string) =>
        setLanguages(list => list.map(l => l.id === id ? { ...l, [field]: value } : l));

    /* ── Hobby helpers ───────────────────────────────────────── */
    const addHobby = () =>
        setHobbies(list => [...list, { id: uid(), value: '' }]);
    const removeHobby = (id: string) =>
        setHobbies(list => list.filter(h => h.id !== id));
    const updateHobby = (id: string, value: string) =>
        setHobbies(list => list.map(h => h.id === id ? { ...h, value } : h));

    /* ── Reference helpers ───────────────────────────────────── */
    const addReference = () =>
        setReferences(list => [...list, { id: uid(), name: '', position: '', email: '', phone: '' }]);
    const removeReference = (id: string) =>
        setReferences(list => list.filter(r => r.id !== id));
    const updateReference = (id: string, field: keyof ReferenceEntry, value: string) =>
        setReferences(list => list.map(r => r.id === id ? { ...r, [field]: value } : r));

    /* ── Reset ───────────────────────────────────────────────── */
    const resetToProfile = () => {
        setPersonal(DEFAULT_PERSONAL);
        setEducation(DEFAULT_EDUCATION);
        setExperience(DEFAULT_EXPERIENCE);
        setSkills(DEFAULT_SKILLS);
        setLanguages(DEFAULT_LANGUAGES);
        setHobbies(DEFAULT_HOBBIES);
        setReferences(DEFAULT_REFERENCES);
    };

    /* ── Save ────────────────────────────────────────────────── */
    const handleSave = () => {
        // In production: call your API / persist to backend
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    /* ── Export PDF ──────────────────────────────────────────── */
    const handleExportPdf = () => {
        setTab('preview');
        setTimeout(() => window.print(), 300);
    };

    const pct = completion();

    /* ================================================================
       RENDER
       ================================================================ */
    return (
        <DashboardLayout pageTitle="My CV">

            {/* Hero */}
            <div className="page-hero cv-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>Euro CV Builder</h1>
                    <p>Auto-filled from your profile · fully editable · export as PDF</p>
                </div>
            </div>

            {/* Top bar */}
            <div className="sc-cv-topbar">
                <div className="sc-cv-tabs">
                    <button
                        className={`sc-cv-tab${tab === 'edit' ? ' active' : ''}`}
                        onClick={() => setTab('edit')}
                    >
                        <Edit3 size={15} />
                        Edit CV
                    </button>
                    <button
                        className={`sc-cv-tab${tab === 'preview' ? ' active' : ''}`}
                        onClick={() => setTab('preview')}
                    >
                        <Eye size={15} />
                        Preview
                    </button>
                </div>

                <div className="sc-cv-topbar-right">
                    <CompletionBar pct={pct} />
                    <button className="sc-btn-primary" onClick={handleExportPdf}>
                        <Download size={14} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* ── EDIT TAB ──────────────────────────────────────── */}
            {tab === 'edit' && (
                <div className="sc-cv-form">

                    {/* PERSONAL INFO */}
                    <SectionWrap icon={<User size={16} />} title="Personal Information">
                        <div className="sc-form-grid">
                            <div className="sc-form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    value={personal.firstName}
                                    onChange={e => updatePersonal('firstName', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    value={personal.lastName}
                                    onChange={e => updatePersonal('lastName', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group">
                                <label>Date of Birth</label>
                                <input
                                    type="date"
                                    value={personal.dob}
                                    onChange={e => updatePersonal('dob', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group">
                                <label>Nationality</label>
                                <input
                                    type="text"
                                    value={personal.nationality}
                                    onChange={e => updatePersonal('nationality', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={personal.email}
                                    onChange={e => updatePersonal('email', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={personal.phone}
                                    onChange={e => updatePersonal('phone', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group">
                                <label>Address / City</label>
                                <input
                                    type="text"
                                    value={personal.address}
                                    onChange={e => updatePersonal('address', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group">
                                <label>LinkedIn</label>
                                <input
                                    type="text"
                                    value={personal.linkedin}
                                    placeholder="linkedin.com/in/your-profile"
                                    onChange={e => updatePersonal('linkedin', e.target.value)}
                                />
                            </div>
                            <div className="sc-form-group sc-col-full">
                                <label>Professional Summary</label>
                                <textarea
                                    value={personal.summary}
                                    rows={4}
                                    onChange={e => updatePersonal('summary', e.target.value)}
                                />
                            </div>
                        </div>
                    </SectionWrap>

                    {/* EDUCATION */}
                    <SectionWrap icon={<GraduationCap size={16} />} title="Education">
                        {education.map((e, idx) => (
                            <div key={e.id} className="sc-cv-entry-block">
                                <div className="sc-cv-entry-block-header">
                                    <span className="sc-cv-entry-num">Entry {idx + 1}</span>
                                    <button className="sc-cv-del-btn" onClick={() => removeEducation(e.id)} type="button">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="sc-form-grid">
                                    <div className="sc-form-group">
                                        <label>Degree / Qualification</label>
                                        <input
                                            type="text"
                                            value={e.degree}
                                            placeholder="e.g. Licence Informatique"
                                            onChange={ev => updateEducation(e.id, 'degree', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>Institution</label>
                                        <input
                                            type="text"
                                            value={e.institution}
                                            placeholder="University name"
                                            onChange={ev => updateEducation(e.id, 'institution', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="text"
                                            value={e.startDate}
                                            placeholder="Sep 2021"
                                            onChange={ev => updateEducation(e.id, 'startDate', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>End Date</label>
                                        <input
                                            type="text"
                                            value={e.endDate}
                                            placeholder="Jun 2024 or Present"
                                            onChange={ev => updateEducation(e.id, 'endDate', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group sc-col-full">
                                        <label>Description</label>
                                        <textarea
                                            value={e.description}
                                            placeholder="Courses, achievements, GPA…"
                                            onChange={ev => updateEducation(e.id, 'description', ev.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="sc-cv-add-btn" onClick={addEducation} type="button">
                            <Plus size={14} />
                            Add Education
                        </button>
                    </SectionWrap>

                    {/* EXPERIENCE */}
                    <SectionWrap icon={<Briefcase size={16} />} title="Work Experience">
                        {experience.map((e, idx) => (
                            <div key={e.id} className="sc-cv-entry-block">
                                <div className="sc-cv-entry-block-header">
                                    <span className="sc-cv-entry-num">Entry {idx + 1}</span>
                                    <button className="sc-cv-del-btn" onClick={() => removeExperience(e.id)} type="button">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="sc-form-grid">
                                    <div className="sc-form-group">
                                        <label>Job Title</label>
                                        <input
                                            type="text"
                                            value={e.title}
                                            placeholder="e.g. Software Engineer Intern"
                                            onChange={ev => updateExperience(e.id, 'title', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>Company / Organisation</label>
                                        <input
                                            type="text"
                                            value={e.company}
                                            placeholder="Company name, city"
                                            onChange={ev => updateExperience(e.id, 'company', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="text"
                                            value={e.startDate}
                                            placeholder="Jul 2023"
                                            onChange={ev => updateExperience(e.id, 'startDate', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>End Date</label>
                                        <input
                                            type="text"
                                            value={e.endDate}
                                            placeholder="Sep 2023 or Present"
                                            onChange={ev => updateExperience(e.id, 'endDate', ev.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group sc-col-full">
                                        <label>Description</label>
                                        <textarea
                                            value={e.description}
                                            placeholder="Key responsibilities and achievements…"
                                            onChange={ev => updateExperience(e.id, 'description', ev.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="sc-cv-add-btn" onClick={addExperience} type="button">
                            <Plus size={14} />
                            Add Experience
                        </button>
                    </SectionWrap>

                    {/* SKILLS */}
                    <SectionWrap icon={<Code2 size={16} />} title="Skills">
                        <div className="sc-skills-grid" style={{ marginTop: 12, marginBottom: 8 }}>
                            {skills.map(sk => (
                                <div key={sk.id} className="sc-skill-row-edit">
                                    <input
                                        className="sc-skill-name-input"
                                        type="text"
                                        value={sk.name}
                                        placeholder="Skill name"
                                        onChange={e => updateSkill(sk.id, 'name', e.target.value)}
                                    />
                                    <SkillDots
                                        level={sk.level}
                                        onChange={l => updateSkill(sk.id, 'level', l)}
                                    />
                                    <button
                                        className="sc-cv-del-btn"
                                        onClick={() => removeSkill(sk.id)}
                                        type="button"
                                        style={{ marginLeft: 4 }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="sc-cv-add-btn" onClick={addSkill} type="button">
                            <Plus size={14} />
                            Add Skill
                        </button>
                    </SectionWrap>

                    {/* LANGUAGES */}
                    <SectionWrap icon={<Globe size={16} />} title="Languages">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, marginBottom: 8 }}>
                            {languages.map(l => (
                                <div key={l.id} className="sc-skill-row-edit">
                                    <input
                                        className="sc-skill-name-input"
                                        type="text"
                                        value={l.name}
                                        placeholder="Language"
                                        onChange={e => updateLanguage(l.id, 'name', e.target.value)}
                                    />
                                    <select
                                        className="sc-lang-select"
                                        value={l.level}
                                        onChange={e => updateLanguage(l.id, 'level', e.target.value)}
                                        style={{
                                            flex: '0 0 180px',
                                            border: '1.5px solid #e2e8f0',
                                            borderRadius: 10,
                                            padding: '8px 10px',
                                            fontSize: 13,
                                            fontFamily: 'Inter, sans-serif',
                                            outline: 'none',
                                            background: '#f8fafc',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {LANG_LEVELS.map(lv => (
                                            <option key={lv} value={lv}>{lv}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="sc-cv-del-btn"
                                        onClick={() => removeLanguage(l.id)}
                                        type="button"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="sc-cv-add-btn" onClick={addLanguage} type="button">
                            <Plus size={14} />
                            Add Language
                        </button>
                    </SectionWrap>

                    {/* HOBBIES */}
                    <SectionWrap icon={<Heart size={16} />} title="Hobbies & Interests">
                        <div className="sc-hobbies-wrap">
                            {hobbies.map(h => (
                                <div key={h.id} className="sc-hobby-chip-edit">
                                    <input
                                        type="text"
                                        value={h.value}
                                        placeholder="Hobby"
                                        onChange={e => updateHobby(h.id, e.target.value)}
                                    />
                                    <button onClick={() => removeHobby(h.id)} type="button">✕</button>
                                </div>
                            ))}
                            <button className="sc-cv-add-btn sc-hobby-add" onClick={addHobby} type="button">
                                <Plus size={13} /> Add
                            </button>
                        </div>
                    </SectionWrap>

                    {/* REFERENCES */}
                    <SectionWrap icon={<Users size={16} />} title="References">
                        {references.map((r, idx) => (
                            <div key={r.id} className="sc-cv-entry-block">
                                <div className="sc-cv-entry-block-header">
                                    <span className="sc-cv-entry-num">Reference {idx + 1}</span>
                                    <button className="sc-cv-del-btn" onClick={() => removeReference(r.id)} type="button">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="sc-form-grid">
                                    <div className="sc-form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={r.name}
                                            placeholder="Dr. Jane Smith"
                                            onChange={e => updateReference(r.id, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>Position / Institution</label>
                                        <input
                                            type="text"
                                            value={r.position}
                                            placeholder="Prof. of CS — UFMC1"
                                            onChange={e => updateReference(r.id, 'position', e.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={r.email}
                                            placeholder="jane.smith@university.dz"
                                            onChange={e => updateReference(r.id, 'email', e.target.value)}
                                        />
                                    </div>
                                    <div className="sc-form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            value={r.phone}
                                            placeholder="+213 XX XXX XXXX"
                                            onChange={e => updateReference(r.id, 'phone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="sc-cv-add-btn" onClick={addReference} type="button">
                            <Plus size={14} />
                            Add Reference
                        </button>
                    </SectionWrap>

                    {/* Form actions */}
                    <div className="sc-cv-form-actions">
                        <button className="sc-btn-outline" onClick={resetToProfile} type="button">
                            <RotateCcw size={14} />
                            Reset to Profile
                        </button>
                        <button className="sc-btn-outline" onClick={() => setTab('preview')} type="button">
                            <Eye size={14} />
                            Preview CV
                        </button>
                        <button className="sc-btn-primary" onClick={handleSave} type="button">
                            {saved ? <Check size={14} /> : null}
                            {saved ? 'Saved!' : 'Save CV'}
                        </button>
                    </div>

                </div>
            )}

            {/* ── PREVIEW TAB ───────────────────────────────────── */}
            {tab === 'preview' && (
                <div className="sc-cv-preview-tab">
                    <div className="sc-cv-preview-actions">
                        <span style={{ fontSize: 13, color: 'var(--sc-muted)' }}>
                            A4 Preview — Euro CV Format
                        </span>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="sc-btn-outline" onClick={() => setTab('edit')} type="button">
                                <Edit3 size={14} />
                                Edit
                            </button>
                            <button className="sc-btn-primary" onClick={handleExportPdf} type="button">
                                <Download size={14} />
                                Download PDF
                            </button>
                        </div>
                    </div>

                    <div className="sc-cv-preview-container">
                        <EuroCv
                            personal={personal}
                            education={education}
                            experience={experience}
                            skills={skills}
                            languages={languages}
                            hobbies={hobbies}
                            references={references}
                        />
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
};

export default MyCv;