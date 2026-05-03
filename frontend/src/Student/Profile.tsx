import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, GraduationCap, BookOpen, Hash, Save } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api";
import toast from "react-hot-toast";

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

function unwrapProfile(res: { data: unknown }): ProfileData | null {
  const body = res.data as { data?: ProfileData };
  return body?.data ?? null;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [town, setTown] = useState("");
  const [pnum, setPnum] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [institution, setInstitution] = useState("");
  const [field, setField] = useState("");
  const [grade, setGrade] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [averageMark, setAverageMark] = useState("");

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
    } catch {
      toast.error("Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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
        grade,
      });
      toast.success("Profile updated.");
      await load();
    } catch {
      toast.error("Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Profile">
        <p style={{ padding: 24 }}>Loading…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Profile">
      <div className="page-hero profile-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Your profile</h1>
          <p>Fields map to GET/PATCH /api/auth/profile/ (and student nested fields on PATCH).</p>
        </div>
      </div>

      <div className="sc-profile-layout">
        <div className="sc-profile-right" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="card sc-profile-section">
            <div className="sc-section-head">
              <User size={18} color="var(--sc-pink)" />
              <h3>Account</h3>
            </div>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              Full name
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              Email
              <input
                className="sc-inline-input"
                style={{ width: "100%", marginTop: 4 }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              <MapPin size={14} style={{ display: "inline", marginRight: 4 }} />
              Town
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={town} onChange={(e) => setTown(e.target.value)} />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              <Phone size={14} style={{ display: "inline", marginRight: 4 }} />
              Phone
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={pnum} onChange={(e) => setPnum(e.target.value)} />
            </label>
          </div>

          <div className="card sc-profile-section">
            <div className="sc-section-head">
              <GraduationCap size={18} color="var(--sc-blue)" />
              <h3>Student record</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--sc-muted)", marginBottom: 12 }}>
              Student number and average are returned by the API; they are not editable here if your backend restricts updates.
            </p>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              <Hash size={14} style={{ display: "inline", marginRight: 4 }} />
              Student number (read-only)
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={studentNumber} readOnly disabled />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              Average mark (read-only)
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={averageMark} readOnly disabled />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              Speciality
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={speciality} onChange={(e) => setSpeciality(e.target.value)} />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              Institution
              <input
                className="sc-inline-input"
                style={{ width: "100%", marginTop: 4 }}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              <BookOpen size={14} style={{ display: "inline", marginRight: 4 }} />
              Field
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={field} onChange={(e) => setField(e.target.value)} />
            </label>
            <label className="sc-form-group" style={{ display: "block", marginBottom: 12 }}>
              Grade / level (e.g. L3, M1)
              <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={grade} onChange={(e) => setGrade(e.target.value)} />
            </label>
          </div>

          <button type="button" className="sc-btn-primary" style={{ marginTop: 16 }} disabled={saving} onClick={() => void save()}>
            <Save size={16} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
