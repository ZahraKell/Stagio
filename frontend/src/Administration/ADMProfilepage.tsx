import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Edit3, Check, X, Camera, Shield, User,
  Mail, Phone, MapPin, Save, Lock, Building2,
  CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import toast from "react-hot-toast";

/* ══════════════════════════════════════════════════════════════
   API PAYLOAD
   ══════════════════════════════════════════════════════════════ */
interface ProfilePayload {
  full_name?: string;
  email?: string;
  town?: string;
  pnum?: string;
  role?: string;
  username?: string;
}

function unwrapProfile(res: { data: unknown }): ProfilePayload | null {
  const body = res.data as { data?: ProfilePayload };
  return body?.data ?? null;
}

/* ══════════════════════════════════════════════════════════════
   STATIC STRUCTURAL UI (not API data — same as old design)
   ══════════════════════════════════════════════════════════════ */
const permissions = [
  { label: "Validate Internship Offers", granted: true },
  { label: "Generate Conventions", granted: true },
  { label: "Manage Student Profiles", granted: true },
  { label: "View All Applications", granted: true },
  { label: "Export Data Reports", granted: true },
  { label: "Manage Company Accounts", granted: false },
  { label: "System Configuration", granted: false },
  { label: "Access Financial Records", granted: false },
];

/* ══════════════════════════════════════════════════════════════
   INLINE EDIT FIELD
   ══════════════════════════════════════════════════════════════ */
const EditField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}> = ({ value, onChange, multiline, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <div className="adp2-edit-active">
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={4}
            placeholder={placeholder}
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            placeholder={placeholder}
          />
        )}
        <div className="adp2-edit-btns">
          <button className="adp2-save-btn" onClick={save}><Check size={12} /> Save</button>
          <button className="adp2-cancel-btn" onClick={cancel}><X size={12} /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <span
      className="adp2-editable"
      onClick={() => { setEditing(true); setDraft(value); }}
      title="Click to edit"
    >
      {value || <em className="adp2-placeholder">{placeholder ?? "Click to add…"}</em>}
      <Edit3 size={11} className="adp2-edit-icon" />
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */
const ADMProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoHover, setPhotoHover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [town, setTown] = useState("");
  const [pnum, setPnum] = useState("");
  const [role, setRole] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("auth/profile/");
      const p = unwrapProfile(res);
      if (p) {
        setFullName(p.full_name || "");
        setEmail(p.email || "");
        setTown(p.town || "");
        setPnum(p.pnum || "");
        setRole(p.role || "");
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

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("auth/profile/", { full_name: fullName, email, town, pnum });
      toast.success("Profile saved.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
      await load();
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  if (loading) {
    return (
      <DashboardLayout pageTitle="My Profile">
        <p style={{ padding: 24 }}>Loading…</p>
      </DashboardLayout>
    );
  }

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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Camera size={22} />
                  <span>Change photo</span>
                </motion.div>
              )}
            </AnimatePresence>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} />
          </div>

          {/* Name + role + meta */}
          <div className="adp2-hero-text">
            <div className="adp2-name-row">
              <h1>{fullName || "—"}</h1>
              {role && (
                <div className="adp2-role-chip"><Shield size={12} />{role}</div>
              )}
            </div>
            <p className="adp2-dept-line">University administration account</p>
            <div className="adp2-hero-contacts">
              {email && <span><Mail size={13} />{email}</span>}
              {pnum && <span><Phone size={13} />{pnum}</span>}
              {town && <span><MapPin size={13} />{town}</span>}
            </div>
          </div>

          {/* Save button */}
          <div className="adp2-hero-cta">
            <button
              type="button"
              className="adp2-save-main-btn"
              disabled={saving}
              onClick={() => void save()}
            >
              <Save size={15} /> {saving ? "Saving…" : "Save Profile"}
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
                { icon: <User size={14} />, label: "Full Name", value: fullName, set: setFullName },
                { icon: <Mail size={14} />, label: "Email", value: email, set: setEmail },
                { icon: <Phone size={14} />, label: "Phone", value: pnum, set: setPnum },
                { icon: <MapPin size={14} />, label: "Town", value: town, set: setTown },
              ] as const).map((f) => (
                <div className="adp2-field-row" key={f.label}>
                  <div className="adp2-field-icon">{f.icon}</div>
                  <div className="adp2-field-body">
                    <span className="adp2-field-label">{f.label}</span>
                    <EditField value={f.value} onChange={(v) => f.set(v)} />
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
              <div className="adp2-field-row">
                <div className="adp2-field-icon"><Shield size={14} /></div>
                <div className="adp2-field-body">
                  <span className="adp2-field-label">Role</span>
                  <span className="adp2-editable" style={{ cursor: "default" }}>
                    {role || <em className="adp2-placeholder">—</em>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="adp2-col-right">

          {/* Permissions */}
          <div className="adp2-card">
            <div className="adp2-card-head">
              <h3><Lock size={15} /> Permissions & Access</h3>
              <span className="adp2-perm-note">Managed by system administrator</span>
            </div>
            <div className="adp2-perm-grid">
              {permissions.map((p) => (
                <div
                  key={p.label}
                  className={`adp2-perm-item ${p.granted ? "granted" : "denied"}`}
                >
                  {p.granted ? (
                    <CheckCircle2 size={15} className="adp2-perm-icon granted" />
                  ) : (
                    <XCircle size={15} className="adp2-perm-icon denied" />
                  )}
                  <span className="adp2-perm-label">{p.label}</span>
                  <span className={`adp2-perm-badge ${p.granted ? "ok" : "no"}`}>
                    {p.granted ? "Granted" : "Restricted"}
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
              <span className="adp2-strip-val">{role || "Administrator"}</span>
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
          <motion.div
            className="stg-toast"
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