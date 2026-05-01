import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
    Search, X, ChevronRight, GraduationCap,
    MapPin, Mail, Phone, FileText, Briefcase,
    CheckCircle, Clock, XCircle, Filter,
    Download, Eye, BookOpen, Building2,
    CalendarDays, TrendingUp, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

type StudentStatus = 'searching' | 'in_internship' | 'completed' | 'not_started';
type Level = 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
type Specialty =
    | 'Informatique'
    | 'Réseaux'
    | 'Électronique'
    | 'Automatique'
    | 'Télécom'
    | 'Sécurité';

interface Application {
    company: string;
    role: string;
    status: 'pending' | 'accepted' | 'rejected';
    date: string;
}

interface Convention {
    id: string;
    company: string;
    status: string;
    startDate: string;
    endDate: string;
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    level: Level;
    specialty: Specialty;
    wilaya: string;
    registrationNo: string;
    status: StudentStatus;
    gpa: number;
    applications: Application[];
    convention: Convention | null;
    cvUploaded: boolean;
    enrolledSince: string;
}

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════════════════════ */

const MOCK_STUDENTS: Student[] = [
    {
        id: 'STU-001', firstName: 'Ahmed', lastName: 'Benali',
        email: 'a.benali@ufmc1.dz', phone: '0551 23 45 67',
        level: 'L3', specialty: 'Informatique', wilaya: 'Constantine',
        registrationNo: '2023/INF/0412', status: 'in_internship', gpa: 14.8,
        cvUploaded: true, enrolledSince: 'Sep 2023',
        applications: [
            { company: 'Condor Electronics', role: 'Embedded Systems Intern', status: 'accepted', date: '10 Avr 2026' },
            { company: 'Mobilis', role: 'Mobile Dev Intern', status: 'rejected', date: '05 Avr 2026' },
        ],
        convention: { id: 'CV-2026-081', company: 'Condor Electronics', status: 'stamped', startDate: '01 Juin 2026', endDate: '31 Juil 2026' },
    },
    {
        id: 'STU-002', firstName: 'Lyna', lastName: 'Kerboua',
        email: 'l.kerboua@ufmc1.dz', phone: '0661 98 76 54',
        level: 'M1', specialty: 'Réseaux', wilaya: 'Sétif',
        registrationNo: '2022/INF/0289', status: 'completed', gpa: 16.2,
        cvUploaded: true, enrolledSince: 'Sep 2022',
        applications: [
            { company: 'Sonatrach', role: 'Network Engineering Intern', status: 'accepted', date: '01 Avr 2026' },
        ],
        convention: { id: 'CV-2026-080', company: 'Sonatrach', status: 'complete', startDate: '15 Mai 2026', endDate: '15 Août 2026' },
    },
    {
        id: 'STU-003', firstName: 'Samir', lastName: 'Mounir',
        email: 's.mounir@ufmc1.dz', phone: '0771 55 33 11',
        level: 'L3', specialty: 'Informatique', wilaya: 'Constantine',
        registrationNo: '2023/INF/0387', status: 'searching', gpa: 13.5,
        cvUploaded: true, enrolledSince: 'Sep 2023',
        applications: [
            { company: 'Mobilis', role: 'Mobile Dev Intern', status: 'pending', date: '20 Avr 2026' },
            { company: 'Ooredoo Algeria', role: 'IT Support Intern', status: 'rejected', date: '12 Avr 2026' },
            { company: 'Algérie Télécom', role: 'Dev Intern', status: 'pending', date: '25 Avr 2026' },
        ],
        convention: null,
    },
    {
        id: 'STU-004', firstName: 'Yasmine', lastName: 'Rahmani',
        email: 'y.rahmani@ufmc1.dz', phone: '0551 77 44 22',
        level: 'M2', specialty: 'Sécurité', wilaya: 'Sétif',
        registrationNo: '2021/INF/0198', status: 'in_internship', gpa: 15.9,
        cvUploaded: true, enrolledSince: 'Sep 2021',
        applications: [
            { company: 'Algérie Télécom', role: 'Cybersecurity Intern', status: 'accepted', date: '15 Avr 2026' },
        ],
        convention: { id: 'CV-2026-078', company: 'Algérie Télécom', status: 'sent_student', startDate: '01 Juil 2026', endDate: '30 Sep 2026' },
    },
    {
        id: 'STU-005', firstName: 'Omar', lastName: 'Tebbal',
        email: 'o.tebbal@ufmc1.dz', phone: '0661 12 99 88',
        level: 'L3', specialty: 'Électronique', wilaya: 'Béjaïa',
        registrationNo: '2023/ELC/0045', status: 'searching', gpa: 12.7,
        cvUploaded: false, enrolledSince: 'Sep 2023',
        applications: [
            { company: 'Cevital Group', role: 'Industrial Automation Intern', status: 'pending', date: '23 Avr 2026' },
        ],
        convention: null,
    },
    {
        id: 'STU-006', firstName: 'Rania', lastName: 'Hadj Ali',
        email: 'r.hadjali@ufmc1.dz', phone: '0771 63 21 09',
        level: 'M1', specialty: 'Informatique', wilaya: 'Alger',
        registrationNo: '2022/INF/0301', status: 'searching', gpa: 14.1,
        cvUploaded: true, enrolledSince: 'Sep 2022',
        applications: [
            { company: 'Ooredoo Algeria', role: 'Software Engineering Intern', status: 'pending', date: '27 Avr 2026' },
            { company: 'Air Algérie', role: 'IT Systems Intern', status: 'pending', date: '22 Avr 2026' },
        ],
        convention: null,
    },
    {
        id: 'STU-007', firstName: 'Amine', lastName: 'Bensalem',
        email: 'a.bensalem@ufmc1.dz', phone: '0551 88 77 66',
        level: 'L3', specialty: 'Informatique', wilaya: 'Alger',
        registrationNo: '2023/INF/0451', status: 'not_started', gpa: 11.2,
        cvUploaded: false, enrolledSince: 'Sep 2023',
        applications: [],
        convention: null,
    },
    {
        id: 'STU-008', firstName: 'Imane', lastName: 'Zeroual',
        email: 'i.zeroual@ufmc1.dz', phone: '0661 34 56 78',
        level: 'M1', specialty: 'Automatique', wilaya: 'Annaba',
        registrationNo: '2022/AUT/0112', status: 'in_internship', gpa: 15.3,
        cvUploaded: true, enrolledSince: 'Sep 2022',
        applications: [
            { company: 'Sonatrach', role: 'Control Systems Intern', status: 'accepted', date: '08 Avr 2026' },
        ],
        convention: { id: 'CV-2026-074', company: 'Sonatrach', status: 'signed_company', startDate: '01 Juin 2026', endDate: '31 Août 2026' },
    },
    {
        id: 'STU-009', firstName: 'Karim', lastName: 'Ouali',
        email: 'k.ouali@ufmc1.dz', phone: '0771 90 12 34',
        level: 'L2', specialty: 'Télécom', wilaya: 'Oran',
        registrationNo: '2024/TEL/0033', status: 'not_started', gpa: 13.0,
        cvUploaded: false, enrolledSince: 'Sep 2024',
        applications: [],
        convention: null,
    },
    {
        id: 'STU-010', firstName: 'Sara', lastName: 'Mansouri',
        email: 's.mansouri@ufmc1.dz', phone: '0551 45 67 89',
        level: 'M2', specialty: 'Informatique', wilaya: 'Constantine',
        registrationNo: '2021/INF/0176', status: 'completed', gpa: 17.1,
        cvUploaded: true, enrolledSince: 'Sep 2021',
        applications: [
            { company: 'Cevital Group', role: 'Data Engineer Intern', status: 'accepted', date: '02 Mar 2026' },
        ],
        convention: { id: 'CV-2026-070', company: 'Cevital Group', status: 'complete', startDate: '01 Mar 2026', endDate: '31 Mai 2026' },
    },
];

/* ══════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<StudentStatus, {
    label: string; cls: string; icon: React.ElementType;
}> = {
    searching: { label: 'Searching', cls: 'ss-searching', icon: Search },
    in_internship: { label: 'In Internship', cls: 'ss-active', icon: Briefcase },
    completed: { label: 'Completed', cls: 'ss-completed', icon: CheckCircle },
    not_started: { label: 'Not Started', cls: 'ss-not-started', icon: Clock },
};

const APP_STATUS: Record<string, { cls: string; icon: React.ElementType }> = {
    accepted: { cls: 'app-accepted', icon: CheckCircle },
    pending: { cls: 'app-pending', icon: Clock },
    rejected: { cls: 'app-rejected', icon: XCircle },
};

const LEVELS: Level[] = ['L1', 'L2', 'L3', 'M1', 'M2'];
const SPECIALTIES: Specialty[] = ['Informatique', 'Réseaux', 'Électronique', 'Automatique', 'Télécom', 'Sécurité'];
const STATUSES: StudentStatus[] = ['searching', 'in_internship', 'completed', 'not_started'];

const TABS = ['All', 'Searching', 'In Internship', 'Completed', 'Not Started'] as const;
type Tab = typeof TABS[number];

const tabStatusMap: Record<Tab, StudentStatus | null> = {
    'All': null,
    'Searching': 'searching',
    'In Internship': 'in_internship',
    'Completed': 'completed',
    'Not Started': 'not_started',
};

const specialtyColor: Record<string, string> = {
    'Informatique': 'dom-info',
    'Réseaux': 'dom-tel',
    'Électronique': 'dom-elec',
    'Automatique': 'dom-auto',
    'Télécom': 'dom-tel',
    'Sécurité': 'dom-sec',
};

const initials = (s: Student) =>
    `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();

const avatarColor = (id: string) => {
    const colors = ['#1a4f3a', '#1d4ed8', '#7c3aed', '#0f766e', '#b45309', '#be123c'];
    const idx = id.charCodeAt(id.length - 1) % colors.length;
    return colors[idx];
};

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════ */

/* ── Student avatar ── */
const Avatar: React.FC<{ student: Student; size?: 'sm' | 'md' | 'lg' }> = ({ student, size = 'md' }) => (
    <div
        className={`stu-avatar stu-avatar-${size}`}
        style={{ background: avatarColor(student.id) }}
    >
        {initials(student)}
    </div>
);

/* ── GPA bar ── */
const GpaBar: React.FC<{ gpa: number }> = ({ gpa }) => {
    const pct = (gpa / 20) * 100;
    const color = gpa >= 16 ? 'var(--green)' : gpa >= 13 ? 'var(--brand-mid)' : gpa >= 10 ? 'var(--amber)' : 'var(--red)';
    return (
        <div className="stu-gpa-wrap">
            <div className="stu-gpa-bar">
                <div className="stu-gpa-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="stu-gpa-val" style={{ color }}>{gpa.toFixed(1)}/20</span>
        </div>
    );
};

/* ── Student card row ── */
const StudentCard: React.FC<{
    student: Student;
    selected: boolean;
    index: number;
    onClick: () => void;
}> = ({ student: s, selected, index, onClick }) => {
    const cfg = STATUS_CONFIG[s.status];
    return (
        <motion.div
            className={`stu-card ${selected ? 'selected' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            onClick={onClick}
        >
            <Avatar student={s} size="md" />

            <div className="stu-card-body">
                <div className="stu-card-top">
                    <span className="stu-card-name">{s.firstName} {s.lastName}</span>
                    <span className={`stu-status-badge ${cfg.cls}`}>
                        <cfg.icon size={10} />
                        {cfg.label}
                    </span>
                </div>
                <span className="stu-card-reg">{s.registrationNo}</span>
                <div className="stu-card-meta">
                    <span><GraduationCap size={11} />{s.level} · {s.specialty}</span>
                    <span><MapPin size={11} />{s.wilaya}</span>
                    <span className={`off-domain-tag ${specialtyColor[s.specialty] || ''}`} style={{ fontSize: 10 }}>
                        {s.specialty}
                    </span>
                </div>
            </div>

            <div className="stu-card-right">
                <GpaBar gpa={s.gpa} />
                <div className="stu-card-counters">
                    <span title="Applications">
                        <FileText size={11} /> {s.applications.length}
                    </span>
                    {s.convention && (
                        <span title="Convention active" className="stu-has-conv">
                            <CheckCircle size={11} /> Convention
                        </span>
                    )}
                    {!s.cvUploaded && (
                        <span title="No CV uploaded" className="stu-no-cv">
                            <XCircle size={11} /> No CV
                        </span>
                    )}
                </div>
                <ChevronRight size={13} className="off-chevron" />
            </div>
        </motion.div>
    );
};

/* ── Student detail drawer ── */
const StudentDrawer: React.FC<{
    student: Student;
    onClose: () => void;
}> = ({ student: s, onClose }) => {
    const [drawerTab, setDrawerTab] = useState<'profile' | 'applications' | 'convention'>('profile');

    React.useEffect(() => { setDrawerTab('profile'); }, [s.id]);

    const cfg = STATUS_CONFIG[s.status];

    return (
        <motion.aside
            className="stu-drawer"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
        >
            {/* Head */}
            <div className="stu-drawer-head">
                <Avatar student={s} size="lg" />
                <div className="stu-drawer-identity">
                    <h2>{s.firstName} {s.lastName}</h2>
                    <span className="stu-drawer-reg">{s.registrationNo}</span>
                    <span className={`stu-status-badge ${cfg.cls}`} style={{ marginTop: 4 }}>
                        <cfg.icon size={10} /> {cfg.label}
                    </span>
                </div>
                <button className="off-drawer-close" onClick={onClose}><X size={16} /></button>
            </div>

            {/* Inner tabs */}
            <div className="stu-drawer-tabs">
                {(['profile', 'applications', 'convention'] as const).map(t => (
                    <button
                        key={t}
                        className={`stu-drawer-tab ${drawerTab === t ? 'active' : ''}`}
                        onClick={() => setDrawerTab(t)}
                    >
                        {t === 'profile' && <><BookOpen size={12} /> Profile</>}
                        {t === 'applications' && <><FileText size={12} /> Applications <span className="stu-dtab-count">{s.applications.length}</span></>}
                        {t === 'convention' && <><CheckCircle size={12} /> Convention</>}
                    </button>
                ))}
            </div>

            {/* ── Profile tab ── */}
            {drawerTab === 'profile' && (
                <div className="stu-drawer-body">
                    {/* Stats row */}
                    <div className="stu-stats-row">
                        <div className="stu-stat-pill">
                            <TrendingUp size={13} />
                            <div>
                                <span className="stu-stat-label">GPA</span>
                                <span className="stu-stat-val">{s.gpa}/20</span>
                            </div>
                        </div>
                        <div className="stu-stat-pill">
                            <FileText size={13} />
                            <div>
                                <span className="stu-stat-label">Applications</span>
                                <span className="stu-stat-val">{s.applications.length}</span>
                            </div>
                        </div>
                        <div className="stu-stat-pill">
                            <CalendarDays size={13} />
                            <div>
                                <span className="stu-stat-label">Enrolled</span>
                                <span className="stu-stat-val">{s.enrolledSince}</span>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="stu-detail-grid">
                        {[
                            { icon: GraduationCap, label: 'Level', value: `${s.level} · ${s.specialty}` },
                            { icon: MapPin, label: 'Wilaya', value: s.wilaya },
                            { icon: Mail, label: 'Email', value: s.email },
                            { icon: Phone, label: 'Phone', value: s.phone },
                            { icon: BookOpen, label: 'Specialty', value: s.specialty },
                            { icon: FileText, label: 'CV', value: s.cvUploaded ? 'Uploaded' : 'Not uploaded' },
                        ].map(d => (
                            <div key={d.label} className="stu-detail-row">
                                <span className="stu-detail-icon"><d.icon size={13} /></span>
                                <div>
                                    <span className="stu-detail-label">{d.label}</span>
                                    <span className={`stu-detail-value ${d.label === 'CV' && !s.cvUploaded ? 'stu-warn' : ''}`}>
                                        {d.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="stu-drawer-actions">
                        <button className="stu-action-btn primary">
                            <Mail size={14} /> Send Email
                        </button>
                        <button className="stu-action-btn secondary">
                            <Download size={14} /> Download CV
                        </button>
                        <button className="stu-action-btn secondary">
                            <Eye size={14} /> Full Profile
                        </button>
                    </div>
                </div>
            )}

            {/* ── Applications tab ── */}
            {drawerTab === 'applications' && (
                <div className="stu-drawer-body">
                    {s.applications.length === 0 ? (
                        <div className="stu-empty">
                            <FileText size={28} />
                            <p>No applications yet.</p>
                        </div>
                    ) : (
                        <div className="stu-app-list">
                            {s.applications.map((app, i) => {
                                const apc = APP_STATUS[app.status];
                                return (
                                    <div key={i} className="stu-app-item">
                                        <div className="stu-app-logo">
                                            {app.company[0]}
                                        </div>
                                        <div className="stu-app-info">
                                            <span className="stu-app-company">{app.company}</span>
                                            <span className="stu-app-role">{app.role}</span>
                                            <span className="stu-app-date">{app.date}</span>
                                        </div>
                                        <span className={`stu-app-status ${apc.cls}`}>
                                            <apc.icon size={11} />
                                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Convention tab ── */}
            {drawerTab === 'convention' && (
                <div className="stu-drawer-body">
                    {!s.convention ? (
                        <div className="stu-empty">
                            <CheckCircle size={28} />
                            <p>No convention generated yet.</p>
                            <span>A convention is created once an application is accepted.</span>
                        </div>
                    ) : (
                        <div className="stu-conv-detail">
                            <div className="stu-conv-header">
                                <span className="stu-conv-id">{s.convention.id}</span>
                                <span className="stu-conv-status">{s.convention.status.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="stu-conv-rows">
                                {[
                                    { icon: Building2, label: 'Company', value: s.convention.company },
                                    { icon: CalendarDays, label: 'Start', value: s.convention.startDate },
                                    { icon: CalendarDays, label: 'End', value: s.convention.endDate },
                                ].map(d => (
                                    <div key={d.label} className="stu-detail-row">
                                        <span className="stu-detail-icon"><d.icon size={13} /></span>
                                        <div>
                                            <span className="stu-detail-label">{d.label}</span>
                                            <span className="stu-detail-value">{d.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="stu-drawer-actions">
                                <button className="stu-action-btn primary">
                                    <Eye size={14} /> Preview PDF
                                </button>
                                <button className="stu-action-btn secondary">
                                    <Download size={14} /> Download PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.aside>
    );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */

const ADMStudentsPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('All');
    const [levelFilter, setLevelFilter] = useState('All Levels');
    const [specFilter, setSpecFilter] = useState('All Specialties');
    const [selected, setSelected] = useState<Student | null>(null);

    /* ── Filter ── */
    const filtered = useMemo(() => {
        const tabStatus = tabStatusMap[activeTab];
        return MOCK_STUDENTS.filter(s => {
            const tMatch = !tabStatus || s.status === tabStatus;
            const lMatch = levelFilter === 'All Levels' || s.level === levelFilter;
            const spMatch = specFilter === 'All Specialties' || s.specialty === specFilter;
            const sMatch =
                `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                s.registrationNo.toLowerCase().includes(search.toLowerCase()) ||
                s.email.toLowerCase().includes(search.toLowerCase()) ||
                s.wilaya.toLowerCase().includes(search.toLowerCase());
            return tMatch && lMatch && spMatch && sMatch;
        });
    }, [search, activeTab, levelFilter, specFilter]);

    const tabCount = (tab: Tab) => {
        const tabStatus = tabStatusMap[tab];
        return !tabStatus ? MOCK_STUDENTS.length : MOCK_STUDENTS.filter(s => s.status === tabStatus).length;
    };

    /* ── Summary counts ── */
    const summaryCounts = useMemo(() => ({
        total: MOCK_STUDENTS.length,
        searching: MOCK_STUDENTS.filter(s => s.status === 'searching').length,
        in_internship: MOCK_STUDENTS.filter(s => s.status === 'in_internship').length,
        completed: MOCK_STUDENTS.filter(s => s.status === 'completed').length,
        noCv: MOCK_STUDENTS.filter(s => !s.cvUploaded).length,
        noApps: MOCK_STUDENTS.filter(s => s.applications.length === 0).length,
    }), []);

    return (
        <DashboardLayout pageTitle="Students"
        >
            {/* ── Summary strip ── */}
            <div className="stu-summary-strip">
                <div className="stu-sum-card sum-total">
                    <Users size={16} />
                    <span className="stu-sum-val">{summaryCounts.total}</span>
                    <span className="stu-sum-label">Total Students</span>
                </div>
                <div className="stu-sum-card sum-searching">
                    <Search size={16} />
                    <span className="stu-sum-val">{summaryCounts.searching}</span>
                    <span className="stu-sum-label">Searching</span>
                </div>
                <div className="stu-sum-card sum-active">
                    <Briefcase size={16} />
                    <span className="stu-sum-val">{summaryCounts.in_internship}</span>
                    <span className="stu-sum-label">In Internship</span>
                </div>
                <div className="stu-sum-card sum-completed">
                    <CheckCircle size={16} />
                    <span className="stu-sum-val">{summaryCounts.completed}</span>
                    <span className="stu-sum-label">Completed</span>
                </div>
                <div className="stu-sum-card sum-warn">
                    <XCircle size={16} />
                    <span className="stu-sum-val">{summaryCounts.noCv}</span>
                    <span className="stu-sum-label">No CV</span>
                </div>
                <div className="stu-sum-card sum-warn">
                    <FileText size={16} />
                    <span className="stu-sum-val">{summaryCounts.noApps}</span>
                    <span className="stu-sum-label">No Applications</span>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="stu-toolbar">
                {/* Tabs */}
                <div className="off-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`off-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            <span className="off-tab-count">{tabCount(tab)}</span>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="stu-filters">
                    <div className="off-search" style={{ minWidth: 210 }}>
                        <Search size={13} />
                        <input
                            type="text"
                            placeholder="Search name, ID, wilaya…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="off-clear">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <div className="off-selects">
                        <Filter size={13} className="filter-icon" />
                        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
                            <option>All Levels</option>
                            {LEVELS.map(l => <option key={l}>{l}</option>)}
                        </select>
                        <select value={specFilter} onChange={e => setSpecFilter(e.target.value)}>
                            <option>All Specialties</option>
                            {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Results count ── */}
            <div className="stu-results-bar">
                <span>{filtered.length} student{filtered.length !== 1 ? 's' : ''} found</span>
                {(search || levelFilter !== 'All Levels' || specFilter !== 'All Specialties') && (
                    <button className="stu-clear-all" onClick={() => {
                        setSearch(''); setLevelFilter('All Levels'); setSpecFilter('All Specialties');
                    }}>
                        <X size={11} /> Clear filters
                    </button>
                )}
            </div>

            {/* ── Main split ── */}
            <div className={`stu-layout ${selected ? 'with-drawer' : ''}`}>

                {/* List */}
                <div className="stu-list">
                    {filtered.length === 0 ? (
                        <div className="off-empty">
                            <Users size={32} />
                            <p>No students match your filters.</p>
                        </div>
                    ) : (
                        filtered.map((s, i) => (
                            <StudentCard
                                key={s.id}
                                student={s}
                                selected={selected?.id === s.id}
                                index={i}
                                onClick={() => setSelected(s)}
                            />
                        ))
                    )}
                </div>

                {/* Drawer */}
                <AnimatePresence>
                    {selected && (
                        <StudentDrawer
                            key={selected.id}
                            student={selected}
                            onClose={() => setSelected(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default ADMStudentsPage;