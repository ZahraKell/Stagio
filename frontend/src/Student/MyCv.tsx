// MyCv.tsx — full Euro CV builder with all fields + backend API
import React, { useCallback, useEffect, useState } from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Globe,
  Heart,
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  Download,
  Check,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api";
import toast from "react-hot-toast";

/* ================================================================
   TYPES
   ================================================================ */

type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
type LangLevel =
  | "native"
  | "A1 — Beginner"
  | "A2 — Elementary"
  | "B1 — Intermediate"
  | "B2 — Upper-Intermediate"
  | "C1 — Advanced"
  | "C2 — Proficient";

interface LocalSkill {
  id: string;
  name: string;
  level: number; // 1–6 dots
  serverId?: number;
}

interface LocalLanguage {
  id: string;
  name: string;
  level: LangLevel;
  serverId?: number;
}

interface LocalHobby {
  id: string;
  value: string;
}

interface LocalEducation {
  id: string;
  serverId?: number;
  degree: string;
  institution: string;
  field: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface LocalExperience {
  id: string;
  serverId?: number;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface LocalReference {
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
  github: string;
  portfolio: string;
  summary: string;
}

/* ── Backend shapes ── */
interface CvEducation {
  id: number; degree: string; institution: string; field: string;
  start_year: number; end_year: number | null; is_current: boolean; description: string;
}
interface CvExperience {
  id: number; job_title: string; company: string; location: string;
  start_date: string; end_date: string | null; is_current: boolean; description: string;
}
interface CvSkill { id: number; name: string; level: SkillLevel; }
interface CvLanguage { id: number; name: string; level: string; }
interface CvData {
  github: string; linkedin: string; portfolio: string; description: string;
  educations: CvEducation[]; experiences: CvExperience[];
  skills: CvSkill[]; languages: CvLanguage[];
}
interface ProfilePayload { full_name?: string; email?: string; town?: string; pnum?: string; }
interface ScorePayload { score: number; label: string; tips: string[]; }

/* ================================================================
   CONSTANTS
   ================================================================ */

const SKILL_LEVEL_LABELS = [
  "Beginner", "Elementary", "Intermediate", "Upper-Inter.", "Advanced", "Expert",
];

const LANG_LEVELS: LangLevel[] = [
  "native", "A1 — Beginner", "A2 — Elementary",
  "B1 — Intermediate", "B2 — Upper-Intermediate",
  "C1 — Advanced", "C2 — Proficient",
];

const SKILL_LEVEL_MAP: Record<SkillLevel, number> = {
  beginner: 1, intermediate: 3, advanced: 5, expert: 6,
};

const dotsToServer = (dots: number): SkillLevel => {
  if (dots <= 1) return "beginner";
  if (dots <= 3) return "intermediate";
  if (dots <= 5) return "advanced";
  return "expert";
};

const DEFAULT_PERSONAL: PersonalInfo = {
  firstName: "", lastName: "", dob: "", nationality: "",
  email: "", phone: "", address: "", linkedin: "",
  github: "", portfolio: "", summary: "",
};

/* ================================================================
   UTILITY
   ================================================================ */

const uid = () => Math.random().toString(36).slice(2, 9);

function unwrapData<T>(res: { data: unknown }): T | null {
  const body = res.data as { data?: T };
  if (body && typeof body === "object" && "data" in body) return (body.data ?? null) as T | null;
  return null;
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

const SectionWrap: React.FC<{
  icon: React.ReactNode; title: string; children: React.ReactNode; defaultOpen?: boolean;
}> = ({ icon, title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sc-cv-section-wrap">
      <button type="button" className="sc-cv-section-toggle" onClick={() => setOpen((o) => !o)}>
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

const SkillDots: React.FC<{ level: number; onChange: (l: number) => void }> = ({ level, onChange }) => (
  <div className="sc-skill-dots">
    {[1, 2, 3, 4, 5, 6].map((d) => (
      <button
        key={d} type="button"
        className={`sc-skill-dot${d <= level ? " filled" : ""}`}
        onClick={() => onChange(d)}
        title={SKILL_LEVEL_LABELS[d - 1]}
      />
    ))}
    <span className="sc-skill-level-label">{SKILL_LEVEL_LABELS[level - 1]}</span>
  </div>
);

const CompletionBar: React.FC<{ pct: number }> = ({ pct }) => (
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

const EuroCv: React.FC<{
  personal: PersonalInfo;
  education: LocalEducation[];
  experience: LocalExperience[];
  skills: LocalSkill[];
  languages: LocalLanguage[];
  hobbies: LocalHobby[];
  references: LocalReference[];
}> = ({ personal, education, experience, skills, languages, hobbies, references }) => {
  const initials = (personal.firstName?.[0] ?? "") + (personal.lastName?.[0] ?? "");
  const fullName = `${personal.firstName} ${personal.lastName}`.trim();

  return (
    <div className="euro-cv">
      <div className="euro-cv-header">
        <div className="euro-cv-photo-wrap">
          <div className="euro-cv-photo-placeholder">{initials || "?"}</div>
        </div>
        <div className="euro-cv-header-info">
          <div className="euro-cv-name">{fullName || "Your Name"}</div>
          <div className="euro-cv-contacts">
            {personal.email && <span>✉ {personal.email}</span>}
            {personal.phone && <span>✆ {personal.phone}</span>}
            {personal.address && <span>📍 {personal.address}</span>}
            {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
            {personal.github && <span>🔗 {personal.github}</span>}
            {personal.portfolio && <span>🌐 {personal.portfolio}</span>}
          </div>
          <div className="euro-cv-meta">
            {personal.dob && `Date of Birth: ${personal.dob}`}
            {personal.dob && personal.nationality && " · "}
            {personal.nationality && `Nationality: ${personal.nationality}`}
          </div>
        </div>
      </div>

      <div className="euro-cv-body">
        <div className="euro-cv-left">
          {skills.length > 0 && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">Technical Skills</div>
              {skills.map((sk) => (
                <div key={sk.id} className="euro-cv-skill-row">
                  <div className="euro-cv-skill-name">{sk.name}</div>
                  <div className="euro-cv-skill-bar">
                    <div className="euro-cv-skill-fill" style={{ width: `${Math.round((sk.level / 6) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {languages.length > 0 && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">Languages</div>
              {languages.map((l) => (
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
                {hobbies.map((h) => (
                  <span key={h.id} className="euro-cv-hobby-tag">{h.value}</span>
                ))}
              </div>
            </div>
          )}
        </div>

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
              {education.map((e) => (
                <div key={e.id} className="euro-cv-entry">
                  <div className="euro-cv-entry-header">
                    <div>
                      <div className="euro-cv-entry-title">{e.degree}</div>
                      <div className="euro-cv-entry-sub">{e.institution}</div>
                    </div>
                    {(e.startDate || e.endDate) && (
                      <span className="euro-cv-entry-date">
                        {e.startDate}{e.startDate && (e.endDate || e.isCurrent) ? " – " : ""}
                        {e.isCurrent ? "Present" : e.endDate}
                      </span>
                    )}
                  </div>
                  {e.description && <div className="euro-cv-entry-desc">{e.description}</div>}
                </div>
              ))}
            </div>
          )}
          {experience.length > 0 && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">Work Experience</div>
              {experience.map((e) => (
                <div key={e.id} className="euro-cv-entry">
                  <div className="euro-cv-entry-header">
                    <div>
                      <div className="euro-cv-entry-title">{e.title}</div>
                      <div className="euro-cv-entry-sub">{e.company}</div>
                    </div>
                    {(e.startDate || e.endDate) && (
                      <span className="euro-cv-entry-date">
                        {e.startDate}{e.startDate && (e.endDate || e.isCurrent) ? " – " : ""}
                        {e.isCurrent ? "Present" : e.endDate}
                      </span>
                    )}
                  </div>
                  {e.description && <div className="euro-cv-entry-desc">{e.description}</div>}
                </div>
              ))}
            </div>
          )}
          {references.length > 0 && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">References</div>
              <div className="euro-cv-refs-grid">
                {references.map((r) => (
                  <div key={r.id}>
                    <div className="euro-cv-ref-name">{r.name}</div>
                    <div className="euro-cv-ref-pos">{r.position}</div>
                    <div className="euro-cv-ref-contact">{r.email}</div>
                    {r.phone && <div className="euro-cv-ref-contact">{r.phone}</div>}
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

const MyCv: React.FC = () => {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [score, setScore] = useState<ScorePayload | null>(null);

  const [personal, setPersonal] = useState<PersonalInfo>(DEFAULT_PERSONAL);
  const [education, setEducation] = useState<LocalEducation[]>([]);
  const [experience, setExperience] = useState<LocalExperience[]>([]);
  const [skills, setSkills] = useState<LocalSkill[]>([]);
  const [languages, setLanguages] = useState<LocalLanguage[]>([]);
  const [hobbies, setHobbies] = useState<LocalHobby[]>([]);
  const [references, setReferences] = useState<LocalReference[]>([]);

  const updatePersonal = (field: keyof PersonalInfo, value: string) =>
    setPersonal((p) => ({ ...p, [field]: value }));

  /* ── Load from backend ───────────────────────────────────── */
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const pRes = await api.get("auth/profile/");
      const profile = unwrapData<ProfilePayload>(pRes);
      if (profile) {
        const parts = (profile.full_name || "").split(" ");
        setPersonal((prev) => ({
          ...prev,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: profile.email || prev.email,
          phone: profile.pnum || prev.phone,
          address: profile.town || prev.address,
        }));
      }
    } catch { toast.error("Could not load profile."); }

    try {
      const cRes = await api.get("auth/cv/");
      const cv = unwrapData<CvData | null>(cRes);
      if (cv) {
        setPersonal((prev) => ({
          ...prev,
          linkedin: cv.linkedin || prev.linkedin,
          github: cv.github || prev.github,
          portfolio: cv.portfolio || prev.portfolio,
          summary: cv.description || prev.summary,
        }));
        setEducation((cv.educations || []).map((e) => ({
          id: uid(), serverId: e.id,
          degree: e.degree, institution: e.institution, field: e.field,
          startDate: String(e.start_year), endDate: e.end_year ? String(e.end_year) : "",
          isCurrent: e.is_current, description: e.description,
        })));
        setExperience((cv.experiences || []).map((x) => ({
          id: uid(), serverId: x.id,
          title: x.job_title, company: x.company, location: x.location,
          startDate: x.start_date, endDate: x.end_date || "",
          isCurrent: x.is_current, description: x.description,
        })));
        setSkills((cv.skills || []).map((s) => ({
          id: uid(), serverId: s.id, name: s.name,
          level: SKILL_LEVEL_MAP[s.level] ?? 3,
        })));
        setLanguages((cv.languages || []).map((l) => ({
          id: uid(), serverId: l.id, name: l.name,
          level: (l.level as LangLevel) || "B1 — Intermediate",
        })));
      }
    } catch { /* CV might not exist yet */ }

    try {
      const sRes = await api.get("auth/cv/score/");
      setScore(unwrapData<ScorePayload>(sRes));
    } catch { /* not critical */ }

    setLoading(false);
  }, []);

  useEffect(() => { void refreshAll(); }, [refreshAll]);

  /* ── Completion ──────────────────────────────────────────── */
  const completion = (): number => {
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
  };

  const pct = score?.score ?? completion();

  /* ── Save CV ─────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("auth/cv/update/", {
        github: personal.github, linkedin: personal.linkedin,
        portfolio: personal.portfolio, description: personal.summary,
      });

      for (const e of education) {
        const payload = {
          degree: e.degree, institution: e.institution, field: e.field,
          start_year: Number(e.startDate) || new Date().getFullYear(),
          end_year: e.isCurrent ? null : (Number(e.endDate) || null),
          is_current: e.isCurrent, description: e.description,
        };
        if (e.serverId) await api.patch(`auth/cv/education/${e.serverId}/`, payload);
        else if (e.degree.trim() && e.institution.trim()) await api.post("auth/cv/education/", payload);
      }

      for (const x of experience) {
        const payload = {
          job_title: x.title, company: x.company, location: x.location,
          start_date: x.startDate, end_date: x.isCurrent ? null : (x.endDate || null),
          is_current: x.isCurrent, description: x.description,
        };
        if (x.serverId) await api.patch(`auth/cv/experience/${x.serverId}/`, payload);
        else if (x.title.trim() && x.company.trim() && x.startDate.trim()) await api.post("auth/cv/experience/", payload);
      }

      for (const s of skills) {
        const payload = { name: s.name, level: dotsToServer(s.level) };
        if (s.serverId) await api.patch(`auth/cv/skill/${s.serverId}/`, payload);
        else if (s.name.trim()) await api.post("auth/cv/skill/", payload);
      }

      for (const l of languages) {
        const payload = { name: l.name, level: l.level };
        if (l.serverId) await api.patch(`auth/cv/language/${l.serverId}/`, payload);
        else if (l.name.trim()) await api.post("auth/cv/language/", payload);
      }

      toast.success("CV saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await refreshAll();
    } catch {
      toast.error("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetToProfile = () => void refreshAll();

  const handleExportPdf = () => {
    setTab("preview");
    setTimeout(() => window.print(), 300);
  };

  /* ── Education ───────────────────────────────────────────── */
  const addEducation = () =>
    setEducation((l) => [...l, { id: uid(), degree: "", institution: "", field: "", startDate: "", endDate: "", isCurrent: false, description: "" }]);

  const removeEducation = async (e: LocalEducation) => {
    if (e.serverId) {
      try { await api.delete(`auth/cv/education/${e.serverId}/delete/`); }
      catch { toast.error("Delete failed."); return; }
    }
    setEducation((l) => l.filter((x) => x.id !== e.id));
  };

  const updateEducation = (id: string, field: keyof LocalEducation, value: string | boolean) =>
    setEducation((l) => l.map((e) => e.id === id ? { ...e, [field]: value } : e));

  /* ── Experience ──────────────────────────────────────────── */
  const addExperience = () =>
    setExperience((l) => [...l, { id: uid(), title: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }]);

  const removeExperience = async (x: LocalExperience) => {
    if (x.serverId) {
      try { await api.delete(`auth/cv/experience/${x.serverId}/delete/`); }
      catch { toast.error("Delete failed."); return; }
    }
    setExperience((l) => l.filter((r) => r.id !== x.id));
  };

  const updateExperience = (id: string, field: keyof LocalExperience, value: string | boolean) =>
    setExperience((l) => l.map((e) => e.id === id ? { ...e, [field]: value } : e));

  /* ── Skills ──────────────────────────────────────────────── */
  const addSkill = () =>
    setSkills((l) => [...l, { id: uid(), name: "", level: 3 }]);

  const removeSkill = async (s: LocalSkill) => {
    if (s.serverId) {
      try { await api.delete(`auth/cv/skill/${s.serverId}/delete/`); }
      catch { toast.error("Delete failed."); return; }
    }
    setSkills((l) => l.filter((x) => x.id !== s.id));
  };

  const updateSkill = (id: string, field: keyof LocalSkill, value: string | number) =>
    setSkills((l) => l.map((s) => s.id === id ? { ...s, [field]: value } : s));

  /* ── Languages ───────────────────────────────────────────── */
  const addLanguage = () =>
    setLanguages((l) => [...l, { id: uid(), name: "", level: "B1 — Intermediate" }]);

  const removeLanguage = async (lang: LocalLanguage) => {
    if (lang.serverId) {
      try { await api.delete(`auth/cv/language/${lang.serverId}/delete/`); }
      catch { toast.error("Delete failed."); return; }
    }
    setLanguages((l) => l.filter((x) => x.id !== lang.id));
  };

  const updateLanguage = (id: string, field: keyof LocalLanguage, value: string) =>
    setLanguages((l) => l.map((x) => x.id === id ? { ...x, [field]: value } : x));

  /* ── Hobbies ─────────────────────────────────────────────── */
  const addHobby = () => setHobbies((l) => [...l, { id: uid(), value: "" }]);
  const removeHobby = (id: string) => setHobbies((l) => l.filter((h) => h.id !== id));
  const updateHobby = (id: string, value: string) =>
    setHobbies((l) => l.map((h) => h.id === id ? { ...h, value } : h));

  /* ── References ──────────────────────────────────────────── */
  const addReference = () => setReferences((l) => [...l, { id: uid(), name: "", position: "", email: "", phone: "" }]);
  const removeReference = (id: string) => setReferences((l) => l.filter((r) => r.id !== id));
  const updateReference = (id: string, field: keyof LocalReference, value: string) =>
    setReferences((l) => l.map((r) => r.id === id ? { ...r, [field]: value } : r));

  /* ================================================================
     RENDER
     ================================================================ */
  if (loading) {
    return (
      <DashboardLayout pageTitle="My CV">
        <p style={{ padding: 24, color: "var(--sc-muted)" }}>Loading your CV…</p>
      </DashboardLayout>
    );
  }

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

      {/* Score tips */}
      {score && score.tips.length > 0 && (
        <div className="card" style={{ margin: "16px 0 0", padding: 16 }}>
          <strong>{score.label}</strong>
          <ul style={{ margin: "8px 0 0 18px", fontSize: 13, color: "var(--sc-muted)" }}>
            {score.tips.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      {/* Top bar */}
      <div className="sc-cv-topbar">
        <div className="sc-cv-tabs">
          <button type="button" className={`sc-cv-tab${tab === "edit" ? " active" : ""}`} onClick={() => setTab("edit")}>
            <Edit3 size={15} /> Edit CV
          </button>
          <button type="button" className={`sc-cv-tab${tab === "preview" ? " active" : ""}`} onClick={() => setTab("preview")}>
            <Eye size={15} /> Preview
          </button>
        </div>
        <div className="sc-cv-topbar-right">
          <CompletionBar pct={pct} />
          <button type="button" className="sc-btn-outline" onClick={() => void refreshAll()}>
            <RefreshCw size={14} /> Reload
          </button>
          <button type="button" className="sc-btn-primary" onClick={handleExportPdf}>
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── EDIT TAB ──────────────────────────────────────────── */}
      {tab === "edit" && (
        <div className="sc-cv-form">

          {/* PERSONAL INFO */}
          <SectionWrap icon={<User size={16} />} title="Personal Information">
            <div className="sc-form-grid">
              <div className="sc-form-group">
                <label>First Name</label>
                <input type="text" value={personal.firstName} onChange={(e) => updatePersonal("firstName", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Last Name</label>
                <input type="text" value={personal.lastName} onChange={(e) => updatePersonal("lastName", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Date of Birth</label>
                <input type="date" value={personal.dob} onChange={(e) => updatePersonal("dob", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Nationality</label>
                <input type="text" value={personal.nationality} onChange={(e) => updatePersonal("nationality", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Email</label>
                <input type="email" value={personal.email} onChange={(e) => updatePersonal("email", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Phone</label>
                <input type="tel" value={personal.phone} onChange={(e) => updatePersonal("phone", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Address / City</label>
                <input type="text" value={personal.address} onChange={(e) => updatePersonal("address", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>LinkedIn</label>
                <input type="text" value={personal.linkedin} placeholder="linkedin.com/in/your-profile" onChange={(e) => updatePersonal("linkedin", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>GitHub</label>
                <input type="text" value={personal.github} placeholder="github.com/username" onChange={(e) => updatePersonal("github", e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Portfolio</label>
                <input type="text" value={personal.portfolio} placeholder="yourportfolio.com" onChange={(e) => updatePersonal("portfolio", e.target.value)} />
              </div>
              <div className="sc-form-group sc-col-full">
                <label>Professional Summary</label>
                <textarea value={personal.summary} rows={4} onChange={(e) => updatePersonal("summary", e.target.value)} />
              </div>
            </div>
          </SectionWrap>

          {/* EDUCATION */}
          <SectionWrap icon={<GraduationCap size={16} />} title="Education">
            {education.map((e, idx) => (
              <div key={e.id} className="sc-cv-entry-block">
                <div className="sc-cv-entry-block-header">
                  <span className="sc-cv-entry-num">Entry {idx + 1}</span>
                  <button type="button" className="sc-cv-del-btn" onClick={() => void removeEducation(e)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="sc-form-grid">
                  <div className="sc-form-group">
                    <label>Degree / Qualification</label>
                    <input type="text" value={e.degree} placeholder="e.g. Licence Informatique"
                      onChange={(ev) => updateEducation(e.id, "degree", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Institution</label>
                    <input type="text" value={e.institution} placeholder="University name"
                      onChange={(ev) => updateEducation(e.id, "institution", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Start Date</label>
                    <input type="text" value={e.startDate} placeholder="Sep 2021"
                      onChange={(ev) => updateEducation(e.id, "startDate", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>End Date</label>
                    <input type="text" value={e.endDate} placeholder="Jun 2024 or Present"
                      disabled={e.isCurrent}
                      onChange={(ev) => updateEducation(e.id, "endDate", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label className="sc-checkbox-label">
                      <input type="checkbox" checked={e.isCurrent}
                        onChange={(ev) => {
                          updateEducation(e.id, "isCurrent", ev.target.checked);
                          if (ev.target.checked) updateEducation(e.id, "endDate", "");
                        }} />
                      Currently studying here
                    </label>
                  </div>
                  <div className="sc-form-group sc-col-full">
                    <label>Description</label>
                    <textarea value={e.description} placeholder="Courses, achievements, GPA…"
                      onChange={(ev) => updateEducation(e.id, "description", ev.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="sc-cv-add-btn" onClick={addEducation}>
              <Plus size={14} /> Add Education
            </button>
          </SectionWrap>

          {/* EXPERIENCE */}
          <SectionWrap icon={<Briefcase size={16} />} title="Work Experience">
            {experience.map((e, idx) => (
              <div key={e.id} className="sc-cv-entry-block">
                <div className="sc-cv-entry-block-header">
                  <span className="sc-cv-entry-num">Entry {idx + 1}</span>
                  <button type="button" className="sc-cv-del-btn" onClick={() => void removeExperience(e)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="sc-form-grid">
                  <div className="sc-form-group">
                    <label>Job Title</label>
                    <input type="text" value={e.title} placeholder="e.g. Software Engineer Intern"
                      onChange={(ev) => updateExperience(e.id, "title", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Company / Organisation</label>
                    <input type="text" value={e.company} placeholder="Company name, city"
                      onChange={(ev) => updateExperience(e.id, "company", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Location</label>
                    <input type="text" value={e.location} placeholder="City, Country"
                      onChange={(ev) => updateExperience(e.id, "location", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Start Date</label>
                    <input type="text" value={e.startDate} placeholder="Jul 2023"
                      onChange={(ev) => updateExperience(e.id, "startDate", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>End Date</label>
                    <input type="text" value={e.endDate} placeholder="Sep 2023 or Present"
                      disabled={e.isCurrent}
                      onChange={(ev) => updateExperience(e.id, "endDate", ev.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label className="sc-checkbox-label">
                      <input type="checkbox" checked={e.isCurrent}
                        onChange={(ev) => {
                          updateExperience(e.id, "isCurrent", ev.target.checked);
                          if (ev.target.checked) updateExperience(e.id, "endDate", "");
                        }} />
                      Currently working here
                    </label>
                  </div>
                  <div className="sc-form-group sc-col-full">
                    <label>Description</label>
                    <textarea value={e.description} placeholder="Key responsibilities and achievements…"
                      onChange={(ev) => updateExperience(e.id, "description", ev.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="sc-cv-add-btn" onClick={addExperience}>
              <Plus size={14} /> Add Experience
            </button>
          </SectionWrap>

          {/* SKILLS */}
          <SectionWrap icon={<Code2 size={16} />} title="Skills">
            <div className="sc-skills-grid" style={{ marginTop: 12, marginBottom: 8 }}>
              {skills.map((sk) => (
                <div key={sk.id} className="sc-skill-row-edit">
                  <input
                    className="sc-skill-name-input"
                    type="text" value={sk.name} placeholder="Skill name"
                    onChange={(e) => updateSkill(sk.id, "name", e.target.value)}
                  />
                  <SkillDots level={sk.level} onChange={(l) => updateSkill(sk.id, "level", l)} />
                  <button type="button" className="sc-cv-del-btn" style={{ marginLeft: 4 }} onClick={() => void removeSkill(sk)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="sc-cv-add-btn" onClick={addSkill}>
              <Plus size={14} /> Add Skill
            </button>
          </SectionWrap>

          {/* LANGUAGES */}
          <SectionWrap icon={<Globe size={16} />} title="Languages">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, marginBottom: 8 }}>
              {languages.map((l) => (
                <div key={l.id} className="sc-skill-row-edit">
                  <input
                    className="sc-skill-name-input"
                    type="text" value={l.name} placeholder="Language"
                    onChange={(e) => updateLanguage(l.id, "name", e.target.value)}
                  />
                  <select
                    className="sc-lang-select" value={l.level}
                    onChange={(e) => updateLanguage(l.id, "level", e.target.value)}
                  >
                    {LANG_LEVELS.map((lv) => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                  <button type="button" className="sc-cv-del-btn" onClick={() => void removeLanguage(l)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="sc-cv-add-btn" onClick={addLanguage}>
              <Plus size={14} /> Add Language
            </button>
          </SectionWrap>

          {/* HOBBIES */}
          <SectionWrap icon={<Heart size={16} />} title="Hobbies & Interests">
            <div className="sc-hobbies-wrap">
              {hobbies.map((h) => (
                <div key={h.id} className="sc-hobby-chip-edit">
                  <input type="text" value={h.value} placeholder="Hobby"
                    onChange={(e) => updateHobby(h.id, e.target.value)} />
                  <button type="button" onClick={() => removeHobby(h.id)}>✕</button>
                </div>
              ))}
              <button type="button" className="sc-cv-add-btn sc-hobby-add" onClick={addHobby}>
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
                  <button type="button" className="sc-cv-del-btn" onClick={() => removeReference(r.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="sc-form-grid">
                  <div className="sc-form-group">
                    <label>Full Name</label>
                    <input type="text" value={r.name} placeholder="Dr. Jane Smith"
                      onChange={(e) => updateReference(r.id, "name", e.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Position / Institution</label>
                    <input type="text" value={r.position} placeholder="Prof. of CS — UFMC1"
                      onChange={(e) => updateReference(r.id, "position", e.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Email</label>
                    <input type="email" value={r.email} placeholder="jane.smith@university.dz"
                      onChange={(e) => updateReference(r.id, "email", e.target.value)} />
                  </div>
                  <div className="sc-form-group">
                    <label>Phone</label>
                    <input type="tel" value={r.phone} placeholder="+213 XX XXX XXXX"
                      onChange={(e) => updateReference(r.id, "phone", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="sc-cv-add-btn" onClick={addReference}>
              <Plus size={14} /> Add Reference
            </button>
          </SectionWrap>

          {/* Form actions */}
          <div className="sc-cv-form-actions">
            <button type="button" className="sc-btn-outline" onClick={resetToProfile}>
              <RotateCcw size={14} /> Reset to Profile
            </button>
            <button type="button" className="sc-btn-outline" onClick={() => setTab("preview")}>
              <Eye size={14} /> Preview CV
            </button>
            <button type="button" className="sc-btn-primary" disabled={saving} onClick={() => void handleSave()}>
              {saved ? <><Check size={14} /> Saved!</> : saving ? "Saving…" : "Save CV"}
            </button>
          </div>

        </div>
      )}

      {/* ── PREVIEW TAB ───────────────────────────────────────── */}
      {tab === "preview" && (
        <div className="sc-cv-preview-tab">
          <div className="sc-cv-preview-actions">
            <span style={{ fontSize: 13, color: "var(--sc-muted)" }}>
              A4 Preview — Euro CV Format
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="sc-btn-outline" onClick={() => setTab("edit")}>
                <Edit3 size={14} /> Edit
              </button>
              <button type="button" className="sc-btn-primary" onClick={handleExportPdf}>
                <Download size={14} /> Download PDF
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