import React, { useEffect, useState, useRef } from "react";
import {
  Camera, Pencil, Check, X, User, Mail, Phone,
  GraduationCap, Hash, BookOpen, Calendar, Building2,
  Shield, CheckCircle, Save,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api";
import toast from "react-hot-toast";

// ── TYPES ──────────────────────────────────────────────────────────────────
interface StudentExtra {
  student_number?: string | null;
  average_mark?: number | null;
  speciality?: string;
  institution?: string;
  field?: string;
  grade?: string;
}

interface ProfileData {
  id?: number;
  username?: string;
  email?: string;
  full_name?: string;
  town?: string;
  pnum?: string;
  role?: string;
  student?: StudentExtra | null;
}

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const LMD_YEARS = ["L1", "L2", "L3", "M1", "M2"];
const CLASSIC_YEARS = [
  "1ère année",
  "2ème année",
  "3ème année",
  "4ème année",
  "5ème année",
];

// ── HELPERS ────────────────────────────────────────────────────────────────
function unwrapProfile(res: { data: unknown }): ProfileData | null {
  const body = res.data as { data?: ProfileData };
  return body?.data ?? null;
}

// ── INLINE FIELD ───────────────────────────────────────────────────────────
interface InlineFieldProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  type?: "text" | "email" | "tel" | "select";
  options?: string[];
  onSave: (val: string) => void;
  locked?: boolean;
  lockedMsg?: string;
}

const InlineField: React.FC<InlineFieldProps> = ({
  label,
  value,
  icon,
  type = "text",
  options = [],
  onSave,
  locked,
  lockedMsg,
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
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className={`sc-inline-field ${editing ? "editing" : ""} ${locked ? "locked" : ""}`}>
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
            {type === "select" ? (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                className="sc-inline-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="sc-inline-input"
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
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
            <span className={`sc-inline-display ${!value ? "placeholder" : ""}`}>
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

// ── YEAR SELECTOR ──────────────────────────────────────────────────────────
interface YearFieldProps {
  system: "LMD" | "Classique";
  valueLMD: string;
  valueClassique: string;
  onSaveLMD: (v: string) => void;
  onSaveClassique: (v: string) => void;
}

const YearField: React.FC<YearFieldProps> = ({
  system,
  valueLMD,
  valueClassique,
  onSaveLMD,
  onSaveClassique,
}) => {
  if (system === "LMD") {
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
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="sc-photo-wrap">
      <div className="sc-photo-circle" onClick={() => inputRef.current?.click()}>
        {photo ? (
          <img src={photo} alt="Profile" className="sc-photo-img" />
        ) : (
          <div className="sc-photo-initials">{initials || "AB"}</div>
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
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
};

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // personal
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [town, setTown] = useState("");
  const [pnum, setPnum] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  // academic
  const [speciality, setSpeciality] = useState("");
  const [institution, setInstitution] = useState("");
  const [field, setField] = useState("");
  const [grade, setGrade] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [averageMark, setAverageMark] = useState("");

  // ui
  const [system, setSystem] = useState<"LMD" | "Classique">("LMD");
  const [yearLMD, setYearLMD] = useState("L3");
  const [yearClassique, setYearClassique] = useState("3ème année");

  // ── API LOAD ──────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("auth/profile/");
      const p = unwrapProfile(res);
      if (!p) {
        toast.error("Invalid profile response.");
        return;
      }
      setFullName(p.full_name || "");
      setEmail(p.email || "");
      setTown(p.town || "");
      setPnum(p.pnum || "");
      const s = p.student;
      setSpeciality(s?.speciality || "");
      setInstitution(s?.institution || "");
      setField(s?.field || "");
      setGrade(s?.grade || "");
      setStudentNumber(s?.student_number != null ? String(s.student_number) : "");
      setAverageMark(s?.average_mark != null ? String(s.average_mark) : "");
      // sync grade into year slots
      if (s?.grade) {
        if (LMD_YEARS.includes(s.grade)) {
          setYearLMD(s.grade);
          setSystem("LMD");
        } else if (CLASSIC_YEARS.includes(s.grade)) {
          setYearClassique(s.grade);
          setSystem("Classique");
        }
      }
    } catch {
      toast.error("Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // ── API SAVE ──────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      await api.patch("auth/profile/", {
        full_name: fullName,
        email,
        town,
        pnum,
        speciality,
        institution,
        field,
        grade: system === "LMD" ? yearLMD : yearClassique,
      });
      toast.success("Profile updated.");
      await load();
    } catch {
      toast.error("Update failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── COMPLETION ────────────────────────────────────────────────────────
  const completionFields = [
    fullName, email, pnum, town, photo,
    field, institution, studentNumber,
  ];
  const completionPct = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  const displayName = fullName || "Student";
  const displaySub = [system === "LMD" ? yearLMD : yearClassique, field.split(" ")[0]]
    .filter(Boolean)
    .join(" · ");

  if (loading) {
    return (
      <DashboardLayout pageTitle="Profile">
        <p style={{ padding: 24 }}>Loading…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Profile">

      {/* HERO */}
      <div className="page-hero profile-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Your Profile 👤</h1>
          <p>Click any field to edit it — save when ready.</p>
        </div>
      </div>

      <div className="sc-profile-layout">

        {/* ── LEFT COLUMN ── */}
        <div className="sc-profile-left">

          {/* PHOTO + NAME CARD */}
          <div className="card sc-profile-id-card">
            <PhotoUpload photo={photo} name={displayName} onChange={setPhoto} />
            <div className="sc-profile-name">{displayName}</div>
            <div className="sc-profile-role">{displaySub}</div>
            {institution && (
              <div className="sc-profile-univ">{institution.split("–")[0].trim()}</div>
            )}

            {/* Completion bar */}
            <div className="sc-completion">
              <div className="sc-completion-header">
                <span>Profile Completion</span>
                <strong>{completionPct}%</strong>
              </div>
              <div className="sc-completion-bar">
                <div className="sc-completion-fill" style={{ width: `${completionPct}%` }} />
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
              {(["LMD", "Classique"] as const).map((sys) => (
                <button
                  key={sys}
                  className={`sc-system-btn ${system === sys ? "active" : ""}`}
                  onClick={() => setSystem(sys)}
                >
                  {sys === "LMD" ? "🎓 LMD" : "🏛️ Classique / Ingénieur"}
                </button>
              ))}
            </div>
            <p className="sc-system-hint">
              {system === "LMD"
                ? "Licence → Master → Doctorat system"
                : "Classical engineering curriculum (5 years)"}
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
            <InlineField label="Full Name" value={fullName} icon={<User size={15} />} onSave={setFullName} />
            <InlineField label="Email Address" value={email} icon={<Mail size={15} />} type="email" onSave={setEmail} />
            <InlineField label="Town" value={town} icon={<Phone size={15} />} onSave={setTown} />
            <InlineField label="Phone Number" value={pnum} icon={<Phone size={15} />} type="tel" onSave={setPnum} />
          </div>

          {/* ACADEMIC INFO */}
          <div className="card sc-profile-section">
            <div className="sc-section-head">
              <GraduationCap size={18} color="var(--sc-blue)" />
              <h3>Academic Information</h3>
            </div>
            <InlineField
              label="University / Institution"
              value={institution}
              icon={<Building2 size={15} />}
              onSave={setInstitution}
            />
            <InlineField
              label="Field of Study"
              value={field}
              icon={<BookOpen size={15} />}
              onSave={setField}
            />
            <InlineField
              label="Speciality"
              value={speciality}
              icon={<BookOpen size={15} />}
              onSave={setSpeciality}
            />
            <YearField
              system={system}
              valueLMD={yearLMD}
              valueClassique={yearClassique}
              onSaveLMD={setYearLMD}
              onSaveClassique={setYearClassique}
            />
            <InlineField
              label="Student Card ID"
              value={studentNumber}
              icon={<Hash size={15} />}
              onSave={setStudentNumber}
              locked
              lockedMsg="Verified by university"
            />
            <InlineField
              label="Average Mark"
              value={averageMark}
              icon={<GraduationCap size={15} />}
              onSave={setAverageMark}
              locked
              lockedMsg="Set by institution"
            />
          </div>

          {/* SAVE BUTTON */}
          <button
            type="button"
            className="sc-btn-primary"
            style={{ marginTop: 8 }}
            disabled={saving}
            onClick={() => void save()}
          >
            <Save size={16} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}