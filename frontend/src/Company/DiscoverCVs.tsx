// src/pages/company/DiscoverCVs.tsx
import { useState, useEffect, useMemo } from "react";
import CompanyLayout from "../components/CompanyLayout";

// ── TYPES ──────────────────────────────────────────────────
interface Skill {
  id: number;
  name: string;
  level: string;
}
interface Language {
  id: number;
  name: string;
  level: string;
}
interface Education {
  id: number;
  degree: string;
  institution: string;
  field: string | null;
  start_year: number;
  end_year: number | null;
  is_current: boolean;
}
interface Experience {
  id: number;
  job_title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}
interface StudentCV {
  student_id: number;
  full_name: string;
  email: string;
  institution: string | null;
  grade: string | null;
  speciality: string | null;
  cv_score: number;
  github: string | null;
  linkedin: string | null;
  description: string | null;
  skills: Skill[];
  languages: Language[];
  educations: Education[];
  experiences: Experience[];
}

// ── LEVEL LABEL MAP ────────────────────────────────────────
const SKILL_LEVEL: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};
const LANG_LEVEL: Record<string, string> = {
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
  native: "Natif",
};

// ── SCORE COLOR ────────────────────────────────────────────
const scoreColor = (s: number) =>
  s >= 80 ? "#22c55e" : s >= 55 ? "#f59e0b" : "#ef4444";

// ── MOCK DATA ──────────────────────────────────────────────
const MOCK: StudentCV[] = [
  {
    student_id: 1,
    full_name: "Sara Meziane",
    email: "sara.m@usthb.edu.dz",
    institution: "USTHB",
    grade: "Master 2",
    speciality: "Génie Logiciel",
    cv_score: 91,
    github: "github.com/sara-dev",
    linkedin: null,
    description:
      "Passionnée par le développement backend et la data science. Cherche un PFE stimulant.",
    skills: [
      { id: 1, name: "Python", level: "advanced" },
      { id: 2, name: "Django", level: "advanced" },
      { id: 3, name: "PostgreSQL", level: "intermediate" },
      { id: 4, name: "React", level: "intermediate" },
      { id: 5, name: "Docker", level: "beginner" },
    ],
    languages: [
      { id: 1, name: "Arabe", level: "native" },
      { id: 2, name: "Français", level: "C1" },
      { id: 3, name: "Anglais", level: "B2" },
    ],
    educations: [
      {
        id: 1,
        degree: "Master Génie Logiciel",
        institution: "USTHB",
        field: "Informatique",
        start_year: 2024,
        end_year: null,
        is_current: true,
      },
      {
        id: 2,
        degree: "Licence Informatique",
        institution: "USTHB",
        field: "Informatique",
        start_year: 2021,
        end_year: 2024,
        is_current: false,
      },
    ],
    experiences: [
      {
        id: 1,
        job_title: "Développeuse Django",
        company: "Djezzy",
        location: "Alger",
        start_date: "2024-06-01",
        end_date: "2024-08-31",
        is_current: false,
        description:
          "Développement d'APIs REST pour le système de facturation.",
      },
    ],
  },
  {
    student_id: 2,
    full_name: "Ali Benali",
    email: "ali.benali@esi.edu.dz",
    institution: "ESI Alger",
    grade: "Master 1",
    speciality: "Systèmes Intelligents",
    cv_score: 82,
    github: "github.com/ali-benali",
    linkedin: "linkedin.com/in/ali-benali",
    description:
      "Développeur fullstack passionné par l'IA et le machine learning.",
    skills: [
      { id: 1, name: "Python", level: "expert" },
      { id: 2, name: "TensorFlow", level: "intermediate" },
      { id: 3, name: "FastAPI", level: "advanced" },
      { id: 4, name: "JavaScript", level: "intermediate" },
    ],
    languages: [
      { id: 1, name: "Arabe", level: "native" },
      { id: 2, name: "Anglais", level: "C1" },
      { id: 3, name: "Français", level: "B1" },
    ],
    educations: [
      {
        id: 1,
        degree: "Master Systèmes Intelligents",
        institution: "ESI Alger",
        field: "IA",
        start_year: 2023,
        end_year: null,
        is_current: true,
      },
    ],
    experiences: [],
  },
  {
    student_id: 3,
    full_name: "Nadia Hamdi",
    email: "nadia.h@univ-alger.edu.dz",
    institution: "Université d'Alger",
    grade: "Licence 3",
    speciality: "Informatique",
    cv_score: 65,
    github: null,
    linkedin: null,
    description:
      "Étudiante en L3 Informatique, à la recherche d'un stage de découverte.",
    skills: [
      { id: 1, name: "Java", level: "intermediate" },
      { id: 2, name: "SQL", level: "beginner" },
      { id: 3, name: "HTML", level: "intermediate" },
    ],
    languages: [
      { id: 1, name: "Arabe", level: "native" },
      { id: 2, name: "Français", level: "B2" },
    ],
    educations: [
      {
        id: 1,
        degree: "Licence Informatique",
        institution: "Université d'Alger",
        field: "Informatique",
        start_year: 2021,
        end_year: null,
        is_current: true,
      },
    ],
    experiences: [],
  },
  {
    student_id: 4,
    full_name: "Karim Lounis",
    email: "k.lounis@ummto.edu.dz",
    institution: "UMMTO",
    grade: "Master 2",
    speciality: "Réseaux et Sécurité",
    cv_score: 78,
    github: "github.com/k-lounis",
    linkedin: "linkedin.com/in/karim-lounis",
    description:
      "Spécialisé en cybersécurité et réseaux. Maîtrise des protocoles et outils de sécurité.",
    skills: [
      { id: 1, name: "Linux", level: "advanced" },
      { id: 2, name: "Wireshark", level: "advanced" },
      { id: 3, name: "Python", level: "intermediate" },
      { id: 4, name: "Cisco", level: "intermediate" },
      { id: 5, name: "Kali Linux", level: "advanced" },
    ],
    languages: [
      { id: 1, name: "Arabe", level: "native" },
      { id: 2, name: "Anglais", level: "B2" },
      { id: 3, name: "Français", level: "C1" },
    ],
    educations: [
      {
        id: 1,
        degree: "Master Réseaux",
        institution: "UMMTO",
        field: "Sécurité",
        start_year: 2023,
        end_year: null,
        is_current: true,
      },
    ],
    experiences: [
      {
        id: 1,
        job_title: "Stagiaire Sécurité",
        company: "Algérie Telecom",
        location: "Tizi Ouzou",
        start_date: "2023-07-01",
        end_date: "2023-09-30",
        is_current: false,
        description: "Audit de sécurité des systèmes internes.",
      },
    ],
  },
  {
    student_id: 5,
    full_name: "Meriem Aït Yahia",
    email: "m.ait@ummto.edu.dz",
    institution: "UMMTO",
    grade: "Licence 3",
    speciality: "Informatique",
    cv_score: 55,
    github: null,
    linkedin: null,
    description: "En cours de licence, motivée et prête à apprendre.",
    skills: [
      { id: 1, name: "C++", level: "beginner" },
      { id: 2, name: "HTML", level: "intermediate" },
    ],
    languages: [
      { id: 1, name: "Arabe", level: "native" },
      { id: 2, name: "Français", level: "B1" },
    ],
    educations: [
      {
        id: 1,
        degree: "Licence Informatique",
        institution: "UMMTO",
        field: "Info",
        start_year: 2021,
        end_year: null,
        is_current: true,
      },
    ],
    experiences: [],
  },
  {
    student_id: 6,
    full_name: "Youcef Ould Saïd",
    email: "y.ould@esi.edu.dz",
    institution: "ESI Alger",
    grade: "Master 2",
    speciality: "Base de données",
    cv_score: 88,
    github: "github.com/youcef-dev",
    linkedin: "linkedin.com/in/youcef-ould",
    description:
      "Expert en bases de données et systèmes distribués. Cherche un PFE en data engineering.",
    skills: [
      { id: 1, name: "PostgreSQL", level: "expert" },
      { id: 2, name: "MongoDB", level: "advanced" },
      { id: 3, name: "Python", level: "advanced" },
      { id: 4, name: "Spark", level: "intermediate" },
      { id: 5, name: "Kafka", level: "beginner" },
      { id: 6, name: "Django", level: "intermediate" },
    ],
    languages: [
      { id: 1, name: "Arabe", level: "native" },
      { id: 2, name: "Anglais", level: "C1" },
      { id: 3, name: "Français", level: "B2" },
    ],
    educations: [
      {
        id: 1,
        degree: "Master Base de Données",
        institution: "ESI Alger",
        field: "Data",
        start_year: 2023,
        end_year: null,
        is_current: true,
      },
    ],
    experiences: [
      {
        id: 1,
        job_title: "Data Engineer Intern",
        company: "Sonatrach",
        location: "Alger",
        start_date: "2024-02-01",
        end_date: "2024-07-31",
        is_current: false,
        description: "Pipeline ETL pour les données de production.",
      },
    ],
  },
];

// ── CV DETAIL MODAL ────────────────────────────────────────
function CVDetailModal({
  student,
  onClose,
}: {
  student: StudentCV;
  onClose: () => void;
}) {
  const initial = student.full_name.charAt(0).toUpperCase();

  return (
    <div
      className="dc-detail-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dc-detail-modal">
        {/* Sticky header */}
        <div className="dc-modal-head">
          <div className="dc-modal-identity">
            <div className="dc-modal-av">{initial}</div>
            <div>
              <p className="dc-modal-name">{student.full_name}</p>
              <span className="dc-modal-email">{student.email}</span>
            </div>
          </div>
          <button className="dc-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="dc-modal-body">
          {/* Score + links */}
          <div className="dc-modal-score-row">
            <div
              className="dc-modal-score-circle"
              style={
                { "--sc": scoreColor(student.cv_score) } as React.CSSProperties
              }
            >
              <strong style={{ color: scoreColor(student.cv_score) }}>
                {student.cv_score}
              </strong>
              <span>%</span>
            </div>
            <div className="dc-modal-score-info">
              <p className="dc-modal-score-label">Score de complétude du CV</p>
              <div className="dc-modal-links">
                {student.github && (
                  <a
                    href={`https://${student.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dc-link-tag dc-link-github"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {student.linkedin && (
                  <a
                    href={`https://${student.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dc-link-tag dc-link-linkedin"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="dc-cv-section">
            <p className="dc-cv-section-title">Informations</p>
            <div className="dc-info-grid">
              <div className="dc-info-item">
                <span>Établissement</span>
                <strong>{student.institution || "—"}</strong>
              </div>
              <div className="dc-info-item">
                <span>Niveau</span>
                <strong>{student.grade || "—"}</strong>
              </div>
              <div className="dc-info-item">
                <span>Spécialité</span>
                <strong>{student.speciality || "—"}</strong>
              </div>
              <div className="dc-info-item">
                <span>Score CV</span>
                <strong style={{ color: scoreColor(student.cv_score) }}>
                  {student.cv_score}%
                </strong>
              </div>
            </div>
          </div>

          {/* About */}
          {student.description && (
            <div className="dc-cv-section">
              <p className="dc-cv-section-title">À propos</p>
              <p className="dc-cv-text">{student.description}</p>
            </div>
          )}

          {/* Skills */}
          <div className="dc-cv-section">
            <p className="dc-cv-section-title">
              Compétences ({student.skills.length})
            </p>
            {student.skills.length === 0 ? (
              <p className="dc-empty">Aucune compétence renseignée</p>
            ) : (
              <div className="dc-modal-skill-list">
                {student.skills.map((sk) => (
                  <div key={sk.id} className="dc-skill-chip">
                    <span>{sk.name}</span>
                    <span className="dc-skill-level">
                      {SKILL_LEVEL[sk.level] ?? sk.level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="dc-cv-section">
            <p className="dc-cv-section-title">Langues</p>
            {student.languages.length === 0 ? (
              <p className="dc-empty">Non renseigné</p>
            ) : (
              <div className="dc-lang-list">
                {student.languages.map((l) => (
                  <span key={l.id} className="dc-lang-tag">
                    {l.name} · {LANG_LEVEL[l.level] ?? l.level}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="dc-cv-section">
            <p className="dc-cv-section-title">
              Formation ({student.educations.length})
            </p>
            {student.educations.length === 0 ? (
              <p className="dc-empty">Non renseigné</p>
            ) : (
              student.educations.map((e) => (
                <div key={e.id} className="dc-edu-item">
                  <strong>{e.degree}</strong>
                  <span>
                    {e.institution}
                    {e.field ? ` · ${e.field}` : ""}
                    {" · "}
                    {e.start_year} —{" "}
                    {e.is_current ? "En cours" : (e.end_year ?? "")}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Experience */}
          <div className="dc-cv-section">
            <p className="dc-cv-section-title">
              Expériences ({student.experiences.length})
            </p>
            {student.experiences.length === 0 ? (
              <p className="dc-empty">Aucune expérience renseignée</p>
            ) : (
              student.experiences.map((x) => (
                <div key={x.id} className="dc-exp-item">
                  <strong>{x.job_title}</strong>
                  <span>
                    {x.company}
                    {x.location ? ` · ${x.location}` : ""}
                    {" · "}
                    {x.start_date.slice(0, 7)} —{" "}
                    {x.is_current
                      ? "En cours"
                      : (x.end_date?.slice(0, 7) ?? "")}
                  </span>
                  {x.description && <p>{x.description}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="dc-modal-footer">
          <button className="dc-close-modal-btn" onClick={onClose}>
            Fermer
          </button>
          <button
            className="dc-invite-btn"
            onClick={() => {
              alert(`Invitation envoyée à ${student.full_name} !`);
              onClose();
            }}
          >
            ✉️ Inviter à postuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function DiscoverCVs() {
  const token = localStorage.getItem("access_token");

  const [students, setStudents] = useState<StudentCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentCV | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [skill, setSkill] = useState("");
  const [minScore, setMinScore] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/users/students/cvs/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.error && d.data) setStudents(d.data);
        else throw new Error();
      })
      .catch(() => setStudents(MOCK))
      .finally(() => setLoading(false));
  }, [token]);

  // Collect unique grades for the dropdown
  const grades = useMemo(() => {
    const g = new Set(students.map((s) => s.grade).filter(Boolean) as string[]);
    return Array.from(g).sort();
  }, [students]);

  // Apply filters
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const nameMatch =
        !search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.institution ?? "").toLowerCase().includes(search.toLowerCase());
      const gradeMatch = !grade || s.grade === grade;
      const skillMatch =
        !skill ||
        s.skills.some((sk) =>
          sk.name.toLowerCase().includes(skill.toLowerCase()),
        );
      const scoreMatch = !minScore || s.cv_score >= Number(minScore);
      return nameMatch && gradeMatch && skillMatch && scoreMatch;
    });
  }, [students, search, grade, skill, minScore]);

  const clearFilters = () => {
    setSearch("");
    setGrade("");
    setSkill("");
    setMinScore("");
  };
  const hasFilters = search || grade || skill || minScore;

  return (
    <CompanyLayout>
      <div className="dc-root">
        {/* Page header */}
        <div className="dc-page-header">
          <div>
            <h2 className="dc-page-title">Découvrir les CVs</h2>
            <p className="dc-page-sub">
              Parcourez les profils étudiants et trouvez les talents qui
              correspondent à vos besoins
            </p>
          </div>
          <span className="dc-result-count">
            {filtered.length} profil{filtered.length !== 1 ? "s" : ""} trouvé
            {filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter bar */}
        <div className="dc-filters">
          {/* Search */}
          <div className="dc-filter-group dc-filter-search">
            <label>Recherche</label>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Nom, email, établissement…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grade */}
          <div className="dc-filter-group">
            <label>Niveau</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Tous les niveaux</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Skill */}
          <div className="dc-filter-group">
            <label>Compétence</label>
            <input
              type="text"
              placeholder="ex: Python, React…"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>

          {/* Min score */}
          <div className="dc-filter-group">
            <label>Score min.</label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
            >
              <option value="">Tous les scores</option>
              <option value="80">80% et plus</option>
              <option value="60">60% et plus</option>
              <option value="40">40% et plus</option>
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button className="dc-clear-btn" onClick={clearFilters}>
              ✕ Effacer
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="dc-loading">
            <div className="dc-spinner" />
            <p>Chargement des profils…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="dc-empty-state">
            <span className="dc-empty-state-icon">🔍</span>
            <h3>Aucun profil trouvé</h3>
            <p>
              {hasFilters
                ? "Essayez de modifier vos filtres pour voir plus de résultats."
                : "Aucun étudiant n'a encore créé son CV sur la plateforme."}
            </p>
            {hasFilters && (
              <button className="dc-clear-btn" onClick={clearFilters}>
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {/* CV Grid */}
        {!loading && filtered.length > 0 && (
          <div className="dc-grid">
            {filtered.map((s, i) => {
              const initial = s.full_name.charAt(0).toUpperCase();
              const topSkills = s.skills.slice(0, 3);
              const extra = s.skills.length - 3;
              const color = scoreColor(s.cv_score);

              // Highlight matched skills
              const matched = skill
                ? s.skills.filter((sk) =>
                    sk.name.toLowerCase().includes(skill.toLowerCase()),
                  )
                : [];

              return (
                <div
                  key={s.student_id}
                  className="dc-cv-card"
                  style={{ animationDelay: `${i * 55}ms` }}
                  onClick={() => setSelected(s)}
                >
                  {/* Top section */}
                  <div className="dc-cv-card-top">
                    <div className="dc-avatar">{initial}</div>
                    <p className="dc-student-name">{s.full_name}</p>
                    <div className="dc-student-meta">
                      <span>
                        {s.institution || "Établissement non précisé"}
                      </span>
                      {s.grade && <strong>{s.grade}</strong>}
                      {s.speciality && <span>{s.speciality}</span>}
                    </div>
                    {/* Score badge */}
                    <div
                      className="dc-score-badge"
                      style={{
                        background: `${color}18`,
                        color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ width: 12, height: 12 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      CV complet à {s.cv_score}%
                    </div>
                  </div>

                  {/* Body */}
                  <div className="dc-cv-card-body">
                    {/* Matched skills highlighted */}
                    {matched.length > 0 && (
                      <div className="dc-skill-list">
                        {matched.map((sk) => (
                          <span
                            key={sk.id}
                            className="dc-skill-tag dc-skill-tag-match"
                          >
                            ✓ {sk.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Top skills */}
                    <div className="dc-skill-list">
                      {topSkills
                        .filter((sk) => !matched.find((m) => m.id === sk.id))
                        .map((sk) => (
                          <span key={sk.id} className="dc-skill-tag">
                            {sk.name}
                          </span>
                        ))}
                      {extra > 0 && (
                        <span className="dc-skill-more">+{extra}</span>
                      )}
                    </div>

                    {/* Experience count */}
                    {s.experiences.length > 0 && (
                      <div className="dc-cv-info-row">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                        </svg>
                        {s.experiences.length} expérience
                        {s.experiences.length > 1 ? "s" : ""}
                      </div>
                    )}

                    {/* Links */}
                    {(s.github || s.linkedin) && (
                      <div className="dc-cv-info-row">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                        </svg>
                        {s.github && "GitHub"}
                        {s.github && s.linkedin && " · "}
                        {s.linkedin && "LinkedIn"}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="dc-cv-card-footer">
                    <button className="dc-view-btn">
                      Voir le profil complet →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CV Detail Modal */}
      {selected && (
        <CVDetailModal student={selected} onClose={() => setSelected(null)} />
      )}
    </CompanyLayout>
  );
}
