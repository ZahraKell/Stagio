import React, { useCallback, useEffect, useState } from "react";
import {
  GraduationCap,
  Briefcase,
  Code2,
  Globe,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  Download,
  Check,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api";
import toast from "react-hot-toast";

type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
type LangLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";

interface CvEducation {
  id: number;
  degree: string;
  institution: string;
  field: string;
  start_year: number;
  end_year: number | null;
  is_current: boolean;
  description: string;
}

interface CvExperience {
  id: number;
  job_title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
}

interface CvSkill {
  id: number;
  name: string;
  level: SkillLevel;
}

interface CvLanguage {
  id: number;
  name: string;
  level: LangLevel;
}

interface CvData {
  id: number;
  github: string;
  linkedin: string;
  portfolio: string;
  description: string;
  update_date: string;
  educations: CvEducation[];
  experiences: CvExperience[];
  skills: CvSkill[];
  languages: CvLanguage[];
}

interface ProfileStudent {
  student_number?: string;
  institution?: string;
  grade?: string;
  speciality?: string;
  field?: string;
}

interface ProfilePayload {
  full_name?: string;
  email?: string;
  town?: string;
  pnum?: string;
  student?: ProfileStudent | null;
}

interface ScorePayload {
  score: number;
  label: string;
  completed: string[];
  tips: string[];
}

function unwrapData<T>(res: { data: unknown }): T | null {
  const body = res.data as { data?: T; error?: boolean };
  if (body && typeof body === "object" && "data" in body) {
    return (body.data ?? null) as T | null;
  }
  return null;
}

/* ── Collapsible section ── */
function SectionWrap({
  icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
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
}

function CompletionBar({ pct }: { pct: number }) {
  return (
    <div className="sc-cv-completion">
      <span>{pct}%</span>
      <div className="sc-cv-comp-bar">
        <div className="sc-cv-comp-fill" style={{ width: `${pct}%` }} />
      </div>
      <span>Complete (server)</span>
    </div>
  );
}

/* ── A4 preview ── */
function EuroCvPreview({
  fullName,
  email,
  phone,
  town,
  summary,
  github,
  linkedin,
  portfolio,
  educations,
  experiences,
  skills,
  languages,
}: {
  fullName: string;
  email: string;
  phone: string;
  town: string;
  summary: string;
  github: string;
  linkedin: string;
  portfolio: string;
  educations: CvEducation[];
  experiences: CvExperience[];
  skills: CvSkill[];
  languages: CvLanguage[];
}) {
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="euro-cv">
      <div className="euro-cv-header">
        <div className="euro-cv-photo-wrap">
          <div className="euro-cv-photo-placeholder">{initials || "?"}</div>
        </div>
        <div className="euro-cv-header-info">
          <div className="euro-cv-name">{fullName || "Your name"}</div>
          <div className="euro-cv-contacts">
            {email && <span>✉ {email}</span>}
            {phone && <span>✆ {phone}</span>}
            {town && <span>📍 {town}</span>}
            {github && <span>🔗 GitHub: {github}</span>}
            {linkedin && <span>🔗 LinkedIn: {linkedin}</span>}
            {portfolio && <span>🔗 Portfolio: {portfolio}</span>}
          </div>
        </div>
      </div>

      <div className="euro-cv-body">
        <div className="euro-cv-left">
          {skills.length > 0 && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">Skills</div>
              {skills.map((sk) => (
                <div key={sk.id} className="euro-cv-lang-row">
                  <span className="euro-cv-lang-name">{sk.name}</span>
                  <span className="euro-cv-lang-level">{sk.level}</span>
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
        </div>
        <div className="euro-cv-right">
          {summary && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">Summary</div>
              <div className="euro-cv-summary">{summary}</div>
            </div>
          )}
          {educations.length > 0 && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">Education</div>
              {educations.map((e) => (
                <div key={e.id} className="euro-cv-entry">
                  <div className="euro-cv-entry-header">
                    <div>
                      <div className="euro-cv-entry-title">{e.degree}</div>
                      <div className="euro-cv-entry-sub">{e.institution}</div>
                    </div>
                    <span className="euro-cv-entry-date">
                      {e.start_year}
                      {e.is_current ? " – Present" : e.end_year ? ` – ${e.end_year}` : ""}
                    </span>
                  </div>
                  {e.description && <div className="euro-cv-entry-desc">{e.description}</div>}
                </div>
              ))}
            </div>
          )}
          {experiences.length > 0 && (
            <div className="euro-cv-block">
              <div className="euro-cv-block-title">Experience</div>
              {experiences.map((x) => (
                <div key={x.id} className="euro-cv-entry">
                  <div className="euro-cv-entry-header">
                    <div>
                      <div className="euro-cv-entry-title">{x.job_title}</div>
                      <div className="euro-cv-entry-sub">{x.company}</div>
                    </div>
                    <span className="euro-cv-entry-date">
                      {x.start_date}
                      {x.is_current ? " – Present" : x.end_date ? ` – ${x.end_date}` : ""}
                    </span>
                  </div>
                  {x.description && <div className="euro-cv-entry-desc">{x.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

let tempId = -1;
const nextTemp = () => tempId--;

export default function MyCv() {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [score, setScore] = useState<ScorePayload | null>(null);

  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [description, setDescription] = useState("");

  const [educations, setEducations] = useState<CvEducation[]>([]);
  const [experiences, setExperiences] = useState<CvExperience[]>([]);
  const [skills, setSkills] = useState<CvSkill[]>([]);
  const [languages, setLanguages] = useState<CvLanguage[]>([]);

  const [saving, setSaving] = useState(false);

  const applyCv = useCallback((cv: CvData | null) => {
    if (!cv) {
      setGithub("");
      setLinkedin("");
      setPortfolio("");
      setDescription("");
      setEducations([]);
      setExperiences([]);
      setSkills([]);
      setLanguages([]);
      return;
    }
    setGithub(cv.github || "");
    setLinkedin(cv.linkedin || "");
    setPortfolio(cv.portfolio || "");
    setDescription(cv.description || "");
    setEducations(cv.educations || []);
    setExperiences(cv.experiences || []);
    setSkills(cv.skills || []);
    setLanguages(cv.languages || []);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        api.get("auth/profile/"),
        api.get("auth/cv/"),
        api.get("auth/cv/score/"),
      ]);
      setProfile(unwrapData<ProfilePayload>(pRes));
      const cv = unwrapData<CvData | null>(cRes);
      applyCv(cv);
      setScore(unwrapData<ScorePayload>(sRes));
    } catch {
      toast.error("Could not load CV data.");
    } finally {
      setLoading(false);
    }
  }, [applyCv]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const fullName = profile?.full_name || "";
  const email = profile?.email || "";
  const phone = profile?.pnum || "";
  const town = profile?.town || "";

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await api.patch("auth/cv/update/", {
        github,
        linkedin,
        portfolio,
        description,
      });
      toast.success("CV summary saved.");
      await refreshAll();
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const addEducationLocal = () => {
    setEducations((list) => [
      ...list,
      {
        id: nextTemp(),
        degree: "",
        institution: "",
        field: "",
        start_year: new Date().getFullYear(),
        end_year: null,
        is_current: false,
        description: "",
      },
    ]);
  };

  const persistEducation = async (e: CvEducation) => {
    if (!e.degree.trim() || !e.institution.trim()) {
      toast.error("Degree and institution are required.");
      return;
    }
    try {
      if (e.id < 0) {
        const res = await api.post("auth/cv/education/", {
          degree: e.degree,
          institution: e.institution,
          field: e.field,
          start_year: e.start_year,
          end_year: e.is_current ? null : e.end_year,
          is_current: e.is_current,
          description: e.description,
        });
        const newId = (res.data as { data?: { id?: number } })?.data?.id;
        if (newId) {
          setEducations((list) => list.map((x) => (x.id === e.id ? { ...x, id: newId } : x)));
        }
        toast.success("Education added.");
      } else {
        await api.patch(`auth/cv/education/${e.id}/`, {
          degree: e.degree,
          institution: e.institution,
          field: e.field,
          start_year: e.start_year,
          end_year: e.end_year,
          is_current: e.is_current,
          description: e.description,
        });
        toast.success("Education updated.");
      }
      await refreshAll();
    } catch {
      toast.error("Could not save education.");
    }
  };

  const removeEducation = async (e: CvEducation) => {
    if (e.id < 0) {
      setEducations((list) => list.filter((x) => x.id !== e.id));
      return;
    }
    try {
      await api.delete(`auth/cv/education/${e.id}/delete/`);
      toast.success("Removed.");
      await refreshAll();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const addExperienceLocal = () => {
    setExperiences((list) => [
      ...list,
      {
        id: nextTemp(),
        job_title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: null,
        is_current: false,
        description: "",
      },
    ]);
  };

  const persistExperience = async (x: CvExperience) => {
    if (!x.job_title.trim() || !x.company.trim() || !x.start_date.trim()) {
      toast.error("Job title, company, and start date are required.");
      return;
    }
    try {
      if (x.id < 0) {
        const res = await api.post("auth/cv/experience/", {
          job_title: x.job_title,
          company: x.company,
          location: x.location,
          start_date: x.start_date,
          end_date: x.is_current ? null : x.end_date,
          is_current: x.is_current,
          description: x.description,
        });
        const newId = (res.data as { data?: { id?: number } })?.data?.id;
        if (newId) {
          setExperiences((list) => list.map((r) => (r.id === x.id ? { ...r, id: newId } : r)));
        }
        toast.success("Experience added.");
      } else {
        await api.patch(`auth/cv/experience/${x.id}/`, {
          job_title: x.job_title,
          company: x.company,
          location: x.location,
          start_date: x.start_date,
          end_date: x.end_date,
          is_current: x.is_current,
          description: x.description,
        });
        toast.success("Experience updated.");
      }
      await refreshAll();
    } catch {
      toast.error("Could not save experience.");
    }
  };

  const removeExperience = async (x: CvExperience) => {
    if (x.id < 0) {
      setExperiences((list) => list.filter((r) => r.id !== x.id));
      return;
    }
    try {
      await api.delete(`auth/cv/experience/${x.id}/delete/`);
      toast.success("Removed.");
      await refreshAll();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const addSkillLocal = () => {
    setSkills((list) => [...list, { id: nextTemp(), name: "", level: "intermediate" }]);
  };

  const persistSkill = async (s: CvSkill) => {
    if (!s.name.trim()) {
      toast.error("Skill name is required.");
      return;
    }
    try {
      if (s.id < 0) {
        await api.post("auth/cv/skill/", { name: s.name, level: s.level });
        toast.success("Skill added.");
      } else {
        await api.patch(`auth/cv/skill/${s.id}/`, { name: s.name, level: s.level });
        toast.success("Skill updated.");
      }
      await refreshAll();
    } catch {
      toast.error("Could not save skill.");
    }
  };

  const removeSkill = async (s: CvSkill) => {
    if (s.id < 0) {
      setSkills((list) => list.filter((x) => x.id !== s.id));
      return;
    }
    try {
      await api.delete(`auth/cv/skill/${s.id}/delete/`);
      await refreshAll();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const addLangLocal = () => {
    setLanguages((list) => [...list, { id: nextTemp(), name: "", level: "B1" }]);
  };

  const persistLanguage = async (l: CvLanguage) => {
    if (!l.name.trim()) {
      toast.error("Language name is required.");
      return;
    }
    try {
      if (l.id < 0) {
        await api.post("auth/cv/language/", { name: l.name, level: l.level });
        toast.success("Language added.");
      } else {
        await api.patch(`auth/cv/language/${l.id}/`, { name: l.name, level: l.level });
        toast.success("Language updated.");
      }
      await refreshAll();
    } catch {
      toast.error("Could not save language.");
    }
  };

  const removeLanguage = async (l: CvLanguage) => {
    if (l.id < 0) {
      setLanguages((list) => list.filter((x) => x.id !== l.id));
      return;
    }
    try {
      await api.delete(`auth/cv/language/${l.id}/delete/`);
      await refreshAll();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const pct = score?.score ?? 0;

  if (loading) {
    return (
      <DashboardLayout pageTitle="My CV">
        <p style={{ padding: 24 }}>Loading your CV…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="My CV">
      <div className="page-hero cv-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Digital CV</h1>
          <p>Data is loaded and saved on the server. Completion score comes from the backend.</p>
        </div>
      </div>

      {score && (
        <div className="card" style={{ margin: "16px 24px", padding: 16 }}>
          <strong>{score.label}</strong>
          {score.tips.length > 0 && (
            <ul style={{ margin: "8px 0 0 18px", fontSize: 14 }}>
              {score.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="sc-cv-topbar">
        <div className="sc-cv-tabs">
          <button type="button" className={`sc-cv-tab${tab === "edit" ? " active" : ""}`} onClick={() => setTab("edit")}>
            <Edit3 size={15} /> Edit
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
          <button type="button" className="sc-btn-primary" onClick={() => { setTab("preview"); setTimeout(() => window.print(), 300); }}>
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {tab === "edit" && (
        <div className="sc-cv-form">
          <SectionWrap icon={<LinkIcon size={16} />} title="Links & summary">
            <div className="sc-form-grid">
              <div className="sc-form-group">
                <label>GitHub</label>
                <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
              </div>
              <div className="sc-form-group">
                <label>LinkedIn</label>
                <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>
              <div className="sc-form-group">
                <label>Portfolio</label>
                <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
              </div>
              <div className="sc-form-group sc-col-full">
                <label>Summary</label>
                <textarea value={description} rows={4} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <button type="button" className="sc-btn-primary" disabled={saving} onClick={() => void saveGeneral()}>
              {saving ? "Saving…" : "Save summary & links"}
            </button>
          </SectionWrap>

          <SectionWrap icon={<GraduationCap size={16} />} title="Education">
            {educations.map((e, idx) => (
              <div key={e.id} className="sc-cv-entry-block">
                <div className="sc-cv-entry-block-header">
                  <span className="sc-cv-entry-num">Entry {idx + 1}</span>
                  <button type="button" className="sc-cv-del-btn" onClick={() => void removeEducation(e)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="sc-form-grid">
                  <div className="sc-form-group">
                    <label>Degree</label>
                    <input
                      value={e.degree}
                      onChange={(ev) =>
                        setEducations((list) => list.map((x) => (x.id === e.id ? { ...x, degree: ev.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>Institution</label>
                    <input
                      value={e.institution}
                      onChange={(ev) =>
                        setEducations((list) => list.map((x) => (x.id === e.id ? { ...x, institution: ev.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>Field</label>
                    <input
                      value={e.field}
                      onChange={(ev) =>
                        setEducations((list) => list.map((x) => (x.id === e.id ? { ...x, field: ev.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>Start year</label>
                    <input
                      type="number"
                      value={e.start_year}
                      onChange={(ev) =>
                        setEducations((list) =>
                          list.map((x) => (x.id === e.id ? { ...x, start_year: Number(ev.target.value) } : x))
                        )
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>End year</label>
                    <input
                      type="number"
                      disabled={e.is_current}
                      value={e.end_year ?? ""}
                      onChange={(ev) =>
                        setEducations((list) =>
                          list.map((x) =>
                            x.id === e.id ? { ...x, end_year: ev.target.value ? Number(ev.target.value) : null } : x
                          )
                        )
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={e.is_current}
                        onChange={(ev) =>
                          setEducations((list) =>
                            list.map((x) => (x.id === e.id ? { ...x, is_current: ev.target.checked, end_year: null } : x))
                          )
                        }
                      />{" "}
                      Current
                    </label>
                  </div>
                  <div className="sc-form-group sc-col-full">
                    <label>Description</label>
                    <textarea
                      value={e.description}
                      onChange={(ev) =>
                        setEducations((list) => list.map((x) => (x.id === e.id ? { ...x, description: ev.target.value } : x)))
                      }
                    />
                  </div>
                </div>
                <button type="button" className="sc-btn-outline" onClick={() => void persistEducation(e)}>
                  <Check size={14} /> Save entry
                </button>
              </div>
            ))}
            <button type="button" className="sc-cv-add-btn" onClick={addEducationLocal}>
              <Plus size={14} /> Add education
            </button>
          </SectionWrap>

          <SectionWrap icon={<Briefcase size={16} />} title="Experience">
            {experiences.map((x, idx) => (
              <div key={x.id} className="sc-cv-entry-block">
                <div className="sc-cv-entry-block-header">
                  <span className="sc-cv-entry-num">Entry {idx + 1}</span>
                  <button type="button" className="sc-cv-del-btn" onClick={() => void removeExperience(x)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="sc-form-grid">
                  <div className="sc-form-group">
                    <label>Job title</label>
                    <input
                      value={x.job_title}
                      onChange={(ev) =>
                        setExperiences((list) => list.map((r) => (r.id === x.id ? { ...r, job_title: ev.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>Company</label>
                    <input
                      value={x.company}
                      onChange={(ev) =>
                        setExperiences((list) => list.map((r) => (r.id === x.id ? { ...r, company: ev.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>Location</label>
                    <input
                      value={x.location}
                      onChange={(ev) =>
                        setExperiences((list) => list.map((r) => (r.id === x.id ? { ...r, location: ev.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>Start date (YYYY-MM-DD)</label>
                    <input
                      value={x.start_date}
                      onChange={(ev) =>
                        setExperiences((list) => list.map((r) => (r.id === x.id ? { ...r, start_date: ev.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>End date</label>
                    <input
                      disabled={x.is_current}
                      value={x.end_date ?? ""}
                      onChange={(ev) =>
                        setExperiences((list) =>
                          list.map((r) => (r.id === x.id ? { ...r, end_date: ev.target.value || null } : r))
                        )
                      }
                    />
                  </div>
                  <div className="sc-form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={x.is_current}
                        onChange={(ev) =>
                          setExperiences((list) =>
                            list.map((r) => (r.id === x.id ? { ...r, is_current: ev.target.checked, end_date: null } : r))
                          )
                        }
                      />{" "}
                      Current
                    </label>
                  </div>
                  <div className="sc-form-group sc-col-full">
                    <label>Description</label>
                    <textarea
                      value={x.description}
                      onChange={(ev) =>
                        setExperiences((list) => list.map((r) => (r.id === x.id ? { ...r, description: ev.target.value } : r)))
                      }
                    />
                  </div>
                </div>
                <button type="button" className="sc-btn-outline" onClick={() => void persistExperience(x)}>
                  <Check size={14} /> Save entry
                </button>
              </div>
            ))}
            <button type="button" className="sc-cv-add-btn" onClick={addExperienceLocal}>
              <Plus size={14} /> Add experience
            </button>
          </SectionWrap>

          <SectionWrap icon={<Code2 size={16} />} title="Skills">
            {skills.map((s) => (
              <div key={s.id} className="sc-skill-row-edit" style={{ marginBottom: 8 }}>
                <input
                  className="sc-skill-name-input"
                  value={s.name}
                  placeholder="Skill"
                  onChange={(e) =>
                    setSkills((list) => list.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                  }
                />
                <select
                  value={s.level}
                  onChange={(e) =>
                    setSkills((list) =>
                      list.map((x) => (x.id === s.id ? { ...x, level: e.target.value as SkillLevel } : x))
                    )
                  }
                  style={{ marginLeft: 8 }}
                >
                  {(["beginner", "intermediate", "advanced", "expert"] as const).map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
                <button type="button" className="sc-cv-del-btn" onClick={() => void removeSkill(s)}>
                  <Trash2 size={12} />
                </button>
                <button type="button" className="sc-btn-outline" style={{ marginLeft: 8 }} onClick={() => void persistSkill(s)}>
                  Save
                </button>
              </div>
            ))}
            <button type="button" className="sc-cv-add-btn" onClick={addSkillLocal}>
              <Plus size={14} /> Add skill
            </button>
          </SectionWrap>

          <SectionWrap icon={<Globe size={16} />} title="Languages">
            {languages.map((l) => (
              <div key={l.id} className="sc-skill-row-edit" style={{ marginBottom: 8 }}>
                <input
                  className="sc-skill-name-input"
                  value={l.name}
                  placeholder="Language"
                  onChange={(e) =>
                    setLanguages((list) => list.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)))
                  }
                />
                <select
                  value={l.level}
                  onChange={(e) =>
                    setLanguages((list) =>
                      list.map((x) => (x.id === l.id ? { ...x, level: e.target.value as LangLevel } : x))
                    )
                  }
                  style={{ marginLeft: 8 }}
                >
                  {(["A1", "A2", "B1", "B2", "C1", "C2", "native"] as const).map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
                <button type="button" className="sc-cv-del-btn" onClick={() => void removeLanguage(l)}>
                  <Trash2 size={12} />
                </button>
                <button type="button" className="sc-btn-outline" style={{ marginLeft: 8 }} onClick={() => void persistLanguage(l)}>
                  Save
                </button>
              </div>
            ))}
            <button type="button" className="sc-cv-add-btn" onClick={addLangLocal}>
              <Plus size={14} /> Add language
            </button>
          </SectionWrap>
        </div>
      )}

      {tab === "preview" && (
        <div className="sc-cv-preview-tab">
          <div className="sc-cv-preview-actions">
            <button type="button" className="sc-btn-outline" onClick={() => setTab("edit")}>
              <Edit3 size={14} /> Edit
            </button>
          </div>
          <div className="sc-cv-preview-container">
            <EuroCvPreview
              fullName={fullName}
              email={email}
              phone={phone}
              town={town}
              summary={description}
              github={github}
              linkedin={linkedin}
              portfolio={portfolio}
              educations={educations.filter((e) => e.id > 0)}
              experiences={experiences.filter((x) => x.id > 0)}
              skills={skills.filter((s) => s.id > 0)}
              languages={languages.filter((l) => l.id > 0)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
