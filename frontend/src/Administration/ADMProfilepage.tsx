import React, { useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
    Edit3, Check, X, Camera, Shield, User,
    Mail, Phone, MapPin, Calendar, Star,
    Download, Save, Lock, Building2, Hash,
    ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TYPE ───────────────────────────────────────────────────── */
interface AdminProfile {
    firstName: string;
    lastName: string;
    title: string;         // Dr. / Mr. / Mrs.
    email: string;
    phone: string;
    office: string;
    department: string;
    faculty: string;
    university: string;
    role: string;
    employeeId: string;
    joinDate: string;
    bio: string;
}

/* ─── INITIAL DATA ───────────────────────────────────────────── */
const initialProfile: AdminProfile = {
    title: 'Dr.',
    firstName: 'Farida',
    lastName: 'Meziani',
    email: 'f.meziani@umc.edu.dz',
    phone: '+213 31 614 200',
    office: 'Bureau 204, Bâtiment des Sciences',
    department: 'Département d\'Informatique',
    faculty: 'Faculté des Sciences Exactes',
    university: 'Université des Frères Mentouri – Constantine 1',
    role: 'Responsable des Stages',
    employeeId: 'ADM-2019-0042',
    joinDate: 'September 2019',
    bio: 'Responsible for coordinating student internships, validating company offers, and generating internship conventions across the Department of Computer Science. Seven years of experience in academic-industry partnerships.',
};

/* ─── PERMISSIONS ────────────────────────────────────────────── */
const permissions = [
    { label: 'Validate Internship Offers', granted: true },
    { label: 'Generate Conventions', granted: true },
    { label: 'Manage Student Profiles', granted: true },
    { label: 'View All Applications', granted: true },
    { label: 'Export Data Reports', granted: true },
    { label: 'Manage Company Accounts', granted: false },
    { label: 'System Configuration', granted: false },
    { label: 'Access Financial Records', granted: false },
];

/* ─── INLINE EDIT FIELD ──────────────────────────────────────── */
const EditField: React.FC<{
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    placeholder?: string;
}> = ({ value, onChange, multiline, placeholder }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    const save = () => { onChange(draft); setEditing(false); };
    const cancel = () => { setDraft(value); setEditing(false); };

    if (editing) return (
        <div className="adp2-edit-active">
            {multiline
                ? <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus rows={4} placeholder={placeholder} />
                : <input value={draft} onChange={e => setDraft(e.target.value)} autoFocus placeholder={placeholder} />
            }
            <div className="adp2-edit-btns">
                <button className="adp2-save-btn" onClick={save}  ><Check size={12} /> Save</button>
                <button className="adp2-cancel-btn" onClick={cancel}><X size={12} /> Cancel</button>
            </div>
        </div>
    );

    return (
        <span className="adp2-editable" onClick={() => { setEditing(true); setDraft(value); }} title="Click to edit">
            {value || <em className="adp2-placeholder">{placeholder ?? 'Click to add…'}</em>}
            <Edit3 size={11} className="adp2-edit-icon" />
        </span>
    );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
const ADMProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<AdminProfile>(initialProfile);
    const [saved, setSaved] = useState(false);
    const [photoHover, setPhotoHover] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const upd = (k: keyof AdminProfile, v: string) =>
        setProfile(p => ({ ...p, [k]: v }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2800);
    };

    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;

    return (
        <DashboardLayout pageTitle="My Profile">

            {/* ── PROFILE HERO ── */}
            <div className="adp2-hero">
                <div className="adp2-hero-bg" />

                <div className="adp2-hero-inner">

                    {/* Photo */}
                    <div
                        className="adp2-photo-wrap"
                        onMouseEnter={() => setPhotoHover(true)}
                        onMouseLeave={() => setPhotoHover(false)}
                        onClick={() => fileRef.current?.click()}
                    >
                        <div className="adp2-photo">{initials}</div>
                        <AnimatePresence>
                            {photoHover && (
                                <motion.div
                                    className="adp2-photo-overlay"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                >
                                    <Camera size={22} />
                                    <span>Change photo</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />
                    </div>

                    {/* Name + role + meta */}
                    <div className="adp2-hero-text">
                        <div className="adp2-name-row">
                            <h1>{profile.title} {profile.firstName} {profile.lastName}</h1>
                            <div className="adp2-role-chip"><Shield size={12} />{profile.role}</div>
                        </div>
                        <p className="adp2-dept-line">
                            {profile.department} · {profile.faculty}
                        </p>
                        <div className="adp2-hero-contacts">
                            <span><Mail size={13} />{profile.email}</span>
                            <span><Phone size={13} />{profile.phone}</span>
                            <span><MapPin size={13} />{profile.office}</span>
                            <span><Calendar size={13} />Since {profile.joinDate}</span>
                            <span><Hash size={13} />{profile.employeeId}</span>
                        </div>
                    </div>

                    {/* Save button */}
                    <div className="adp2-hero-cta">
                        <button className="adp2-save-main-btn" onClick={handleSave}>
                            <Save size={15} /> Save Profile
                        </button>
                        <button className="adp2-export-btn">
                            <Download size={15} /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MAIN GRID ── */}
            <div className="adp2-main-grid">

                {/* ── LEFT COLUMN ── */}
                <div className="adp2-col-left">

                    {/* Personal Info */}
                    <div className="adp2-card">
                        <div className="adp2-card-head">
                            <h3><User size={15} /> Personal Information</h3>
                            <span className="adp2-edit-tip"><Edit3 size={11} /> Click any value to edit</span>
                        </div>

                        <div className="adp2-fields">
                            {([
                                { icon: <User size={14} />, label: 'Title', key: 'title' },
                                { icon: <User size={14} />, label: 'First Name', key: 'firstName' },
                                { icon: <User size={14} />, label: 'Last Name', key: 'lastName' },
                                { icon: <Mail size={14} />, label: 'Email', key: 'email' },
                                { icon: <Phone size={14} />, label: 'Phone', key: 'phone' },
                                { icon: <MapPin size={14} />, label: 'Office', key: 'office' },
                                { icon: <Hash size={14} />, label: 'Employee ID', key: 'employeeId' },
                                { icon: <Calendar size={14} />, label: 'Joined', key: 'joinDate' },
                            ] as const).map(f => (
                                <div className="adp2-field-row" key={f.key}>
                                    <div className="adp2-field-icon">{f.icon}</div>
                                    <div className="adp2-field-body">
                                        <span className="adp2-field-label">{f.label}</span>
                                        <EditField value={profile[f.key]} onChange={v => upd(f.key, v)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Institution Info */}
                    <div className="adp2-card">
                        <div className="adp2-card-head">
                            <h3><Building2 size={15} /> Institution</h3>
                        </div>
                        <div className="adp2-fields">
                            {([
                                { icon: <Building2 size={14} />, label: 'University', key: 'university' },
                                { icon: <Building2 size={14} />, label: 'Faculty', key: 'faculty' },
                                { icon: <Building2 size={14} />, label: 'Department', key: 'department' },
                                { icon: <Shield size={14} />, label: 'Role', key: 'role' },
                            ] as const).map(f => (
                                <div className="adp2-field-row" key={f.key}>
                                    <div className="adp2-field-icon">{f.icon}</div>
                                    <div className="adp2-field-body">
                                        <span className="adp2-field-label">{f.label}</span>
                                        <EditField value={profile[f.key]} onChange={v => upd(f.key, v)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="adp2-col-right">

                    {/* Biography */}
                    <div className="adp2-card">
                        <div className="adp2-card-head">
                            <h3><Star size={15} /> Biography</h3>
                        </div>
                        <div className="adp2-bio-wrap">
                            <EditField
                                value={profile.bio}
                                onChange={v => upd('bio', v)}
                                multiline
                                placeholder="Write a short professional bio…"
                            />
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="adp2-card">
                        <div className="adp2-card-head">
                            <h3><Lock size={15} /> Permissions & Access</h3>
                            <span className="adp2-perm-note">Managed by system administrator</span>
                        </div>
                        <div className="adp2-perm-grid">
                            {permissions.map(p => (
                                <div
                                    key={p.label}
                                    className={`adp2-perm-item ${p.granted ? 'granted' : 'denied'}`}
                                >
                                    {p.granted
                                        ? <CheckCircle2 size={15} className="adp2-perm-icon granted" />
                                        : <XCircle size={15} className="adp2-perm-icon denied" />
                                    }
                                    <span className="adp2-perm-label">{p.label}</span>
                                    <span className={`adp2-perm-badge ${p.granted ? 'ok' : 'no'}`}>
                                        {p.granted ? 'Granted' : 'Restricted'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Account details strip */}
                    <div className="adp2-card adp2-account-strip">
                        <div className="adp2-strip-item">
                            <span className="adp2-strip-label">Account Status</span>
                            <span className="adp2-strip-val green">● Active</span>
                        </div>
                        <div className="adp2-strip-divider" />
                        <div className="adp2-strip-item">
                            <span className="adp2-strip-label">Role Level</span>
                            <span className="adp2-strip-val">Administrator</span>
                        </div>
                        <div className="adp2-strip-divider" />
                        <div className="adp2-strip-item">
                            <span className="adp2-strip-label">Last Login</span>
                            <span className="adp2-strip-val">Today, 08:34</span>
                        </div>
                        <div className="adp2-strip-divider" />
                        <div className="adp2-strip-item">
                            <span className="adp2-strip-label">Password</span>
                            <button className="adp2-change-pass">Change <ChevronRight size={12} /></button>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── SAVED TOAST ── */}
            <AnimatePresence>
                {saved && (
                    <motion.div className="stg-toast"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <Check size={16} /> Profile saved successfully
                    </motion.div>
                )}
            </AnimatePresence>

        </DashboardLayout>
    );
};

export default ADMProfilePage;