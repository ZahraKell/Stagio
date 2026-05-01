import React, { useState, useRef } from 'react';
import {
    Camera, Pencil, Check, X, User, Mail, Phone,
    GraduationCap, Hash, BookOpen, Calendar, Building2,
    Shield, CheckCircle
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

// ── TYPES ──────────────────────────────────────────────────────────────────
interface ProfileData {
    // Personal
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photo: string | null;

    // Academic
    university: string;
    field: string;
    system: 'LMD' | 'Classique';
    yearLMD: string;
    yearClassique: string;
    studentId: string;
    academicEmail: string;
}

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const UNIVERSITIES = [
    'Université Frères Mentouri – Constantine 1 (UFMC1)',
    'Université Abdelhamid Mehri – Constantine 2 (UFMC2)',
    'Université Salah Boubnider – Constantine 3',
    'Université Larbi Ben M\'hidi – Oum El Bouaghi',
    'Université Larbi Tébessi – Tébessa',
    'Université Mohamed Seddik Ben Yahia – Jijel',
    'Université 20 Août 1955 – Skikda',
    'Université Abderrahmane Mira – Béjaïa',
];

const FIELDS = [
    'Computer Science (Informatique)',
    'Software Engineering',
    'Networks & Telecommunications',
    'Electronics',
    'Electrical Engineering',
    'Civil Engineering',
    'Mathematics',
    'Physics',
    'Business & Management',
    'Marketing',
];

const LMD_YEARS = ['L1', 'L2', 'L3', 'M1', 'M2'];
const CLASSIC_YEARS = ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année'];

// ── INLINE FIELD ───────────────────────────────────────────────────────────
interface InlineFieldProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    type?: 'text' | 'email' | 'tel' | 'select';
    options?: string[];
    onSave: (val: string) => void;
    locked?: boolean;
    lockedMsg?: string;
}

const InlineField: React.FC<InlineFieldProps> = ({
    label, value, icon, type = 'text', options = [], onSave, locked, lockedMsg
}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saved, setSaved] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

    const handleEdit = () => {
        if (locked) return;
        setDraft(value);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSave = () => {
        onSave(draft);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleCancel = () => {
        setDraft(value);
        setEditing(false);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    return (
        <div className={`sc-inline-field ${editing ? 'editing' : ''} ${locked ? 'locked' : ''}`}>
            <div className="sc-inline-label">
                <span className="sc-inline-icon">{icon}</span>
                {label}
                {locked && (
                    <span className="sc-locked-badge">
                        <Shield size={10} /> Verified
                    </span>
                )}
            </div>

            <div className="sc-inline-value-row">
                {editing ? (
                    <>
                        {type === 'select' ? (
                            <select
                                ref={inputRef as React.RefObject<HTMLSelectElement>}
                                className="sc-inline-input"
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                            >
                                {options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        ) : (
                            <input
                                ref={inputRef as React.RefObject<HTMLInputElement>}
                                className="sc-inline-input"
                                type={type}
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                onKeyDown={handleKey}
                            />
                        )}
                        <button className="sc-inline-action confirm" onClick={handleSave} title="Save">
                            <Check size={14} />
                        </button>
                        <button className="sc-inline-action cancel" onClick={handleCancel} title="Cancel">
                            <X size={14} />
                        </button>
                    </>
                ) : (
                    <>
                        <span className={`sc-inline-display ${!value ? 'placeholder' : ''}`}>
                            {value || `Add ${label.toLowerCase()}…`}
                        </span>
                        {saved && (
                            <span className="sc-saved-flash">
                                <CheckCircle size={13} /> Saved
                            </span>
                        )}
                        {!locked && (
                            <button className="sc-inline-edit-btn" onClick={handleEdit} title="Edit">
                                <Pencil size={13} />
                            </button>
                        )}
                        {locked && lockedMsg && (
                            <span className="sc-locked-hint">{lockedMsg}</span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ── YEAR SELECTOR (conditional on system) ─────────────────────────────────
interface YearFieldProps {
    system: 'LMD' | 'Classique';
    valueLMD: string;
    valueClassique: string;
    onSaveLMD: (v: string) => void;
    onSaveClassique: (v: string) => void;
}

const YearField: React.FC<YearFieldProps> = ({
    system, valueLMD, valueClassique, onSaveLMD, onSaveClassique
}) => {
    if (system === 'LMD') {
        return (
            <InlineField
                label="Academic Year (LMD)"
                value={valueLMD}
                icon={<Calendar size={15} />}
                type="select"
                options={LMD_YEARS}
                onSave={onSaveLMD}
            />
        );
    }
    return (
        <InlineField
            label="Academic Year (Classique)"
            value={valueClassique}
            icon={<Calendar size={15} />}
            type="select"
            options={CLASSIC_YEARS}
            onSave={onSaveClassique}
        />
    );
};

// ── PHOTO UPLOAD ───────────────────────────────────────────────────────────
interface PhotoUploadProps {
    photo: string | null;
    name: string;
    onChange: (dataUrl: string) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photo, name, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => onChange(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="sc-photo-wrap">
            <div className="sc-photo-circle" onClick={() => inputRef.current?.click()}>
                {photo ? (
                    <img src={photo} alt="Profile" className="sc-photo-img" />
                ) : (
                    <div className="sc-photo-initials">{initials || 'AB'}</div>
                )}
                <div className="sc-photo-overlay">
                    <Camera size={20} color="#fff" />
                    <span>Change photo</span>
                </div>
            </div>
            <button className="sc-photo-btn" onClick={() => inputRef.current?.click()}>
                <Camera size={14} /> Upload Photo
            </button>
            <p className="sc-photo-hint">JPG or PNG · Max 2 MB</p>
            <input
                ref={inputRef}
                type="file"
                accept="image/png, image/jpeg"
                style={{ display: 'none' }}
                onChange={handleFile}
            />
        </div>
    );
};

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
const Profile: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData>({
        firstName: 'Ahmed',
        lastName: 'Benali',
        email: 'ahmed.benali@gmail.com',
        phone: '+213 555 12 34 56',
        photo: null,
        university: 'Université Frères Mentouri – Constantine 1 (UFMC1)',
        field: 'Computer Science (Informatique)',
        system: 'LMD',
        yearLMD: 'L3',
        yearClassique: '3ème année',
        studentId: '202311045',
        academicEmail: 'a.benali@umc.edu.dz',
    });

    const update = (key: keyof ProfileData) => (val: string) =>
        setProfile(prev => ({ ...prev, [key]: val }));

    const fullName = `${profile.firstName} ${profile.lastName}`;

    const completionFields = [
        profile.firstName, profile.lastName, profile.email,
        profile.phone, profile.photo,
        profile.university, profile.field, profile.studentId, profile.academicEmail
    ];
    const completionPct = Math.round(
        (completionFields.filter(Boolean).length / completionFields.length) * 100
    );

    return (
        <DashboardLayout pageTitle="Profile">

            {/* HERO */}
            <div className="page-hero profile-hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>Your Profile 👤</h1>
                    <p>Click any field to edit it — your changes are saved instantly.</p>
                </div>
            </div>

            <div className="sc-profile-layout">

                {/* ── LEFT COLUMN ── */}
                <div className="sc-profile-left">

                    {/* PHOTO + NAME CARD */}
                    <div className="card sc-profile-id-card">
                        <PhotoUpload
                            photo={profile.photo}
                            name={fullName}
                            onChange={update('photo')}
                        />
                        <div className="sc-profile-name">{fullName}</div>
                        <div className="sc-profile-role">
                            {profile.system === 'LMD' ? profile.yearLMD : profile.yearClassique}
                            {' · '}
                            {profile.field.split(' ')[0]}
                        </div>
                        <div className="sc-profile-univ">{profile.university.split('–')[0].trim()}</div>

                        {/* Completion bar */}
                        <div className="sc-completion">
                            <div className="sc-completion-header">
                                <span>Profile Completion</span>
                                <strong>{completionPct}%</strong>
                            </div>
                            <div className="sc-completion-bar">
                                <div
                                    className="sc-completion-fill"
                                    style={{ width: `${completionPct}%` }}
                                />
                            </div>
                            {completionPct < 100 && (
                                <p className="sc-completion-hint">
                                    Complete your profile to improve your chances.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* SYSTEM SELECTOR */}
                    <div className="card">
                        <h3 style={{ marginBottom: 14 }}>Education System</h3>
                        <div className="sc-system-toggle">
                            {(['LMD', 'Classique'] as const).map(sys => (
                                <button
                                    key={sys}
                                    className={`sc-system-btn ${profile.system === sys ? 'active' : ''}`}
                                    onClick={() => setProfile(p => ({ ...p, system: sys }))}
                                >
                                    {sys === 'LMD' ? '🎓 LMD' : '🏛️ Classique / Ingénieur'}
                                </button>
                            ))}
                        </div>
                        <p className="sc-system-hint">
                            {profile.system === 'LMD'
                                ? 'Licence → Master → Doctorat system'
                                : 'Classical engineering curriculum (5 years)'}
                        </p>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="sc-profile-right">

                    {/* PERSONAL INFO */}
                    <div className="card sc-profile-section">
                        <div className="sc-section-head">
                            <User size={18} color="var(--sc-pink)" />
                            <h3>Personal Information</h3>
                        </div>

                        <InlineField
                            label="First Name"
                            value={profile.firstName}
                            icon={<User size={15} />}
                            onSave={update('firstName')}
                        />
                        <InlineField
                            label="Last Name"
                            value={profile.lastName}
                            icon={<User size={15} />}
                            onSave={update('lastName')}
                        />
                        <InlineField
                            label="Email Address"
                            value={profile.email}
                            icon={<Mail size={15} />}
                            type="email"
                            onSave={update('email')}
                        />
                        <InlineField
                            label="Phone Number"
                            value={profile.phone}
                            icon={<Phone size={15} />}
                            type="tel"
                            onSave={update('phone')}
                        />
                    </div>

                    {/* ACADEMIC INFO */}
                    <div className="card sc-profile-section">
                        <div className="sc-section-head">
                            <GraduationCap size={18} color="var(--sc-blue)" />
                            <h3>Academic Information</h3>
                        </div>

                        <InlineField
                            label="University"
                            value={profile.university}
                            icon={<Building2 size={15} />}
                            type="select"
                            options={UNIVERSITIES}
                            onSave={update('university')}
                        />
                        <InlineField
                            label="Field of Study"
                            value={profile.field}
                            icon={<BookOpen size={15} />}
                            type="select"
                            options={FIELDS}
                            onSave={update('field')}
                        />
                        <YearField
                            system={profile.system}
                            valueLMD={profile.yearLMD}
                            valueClassique={profile.yearClassique}
                            onSaveLMD={update('yearLMD')}
                            onSaveClassique={update('yearClassique')}
                        />
                        <InlineField
                            label="Student Card ID"
                            value={profile.studentId}
                            icon={<Hash size={15} />}
                            onSave={update('studentId')}
                            locked
                            lockedMsg="Verified by university"
                        />
                        <InlineField
                            label="Academic Email"
                            value={profile.academicEmail}
                            icon={<Mail size={15} />}
                            type="email"
                            onSave={update('academicEmail')}
                            locked
                            lockedMsg="Assigned by university"
                        />
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;