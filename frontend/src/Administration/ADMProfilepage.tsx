import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { User, Mail, Phone, MapPin, Save, Shield } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

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

const ADMProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      await load();
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="My Profile">
        <p style={{ padding: 24 }}>Loading…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="My Profile">
      <div className="adp2-hero">
        <div className="adp2-hero-bg" />
        <div className="adp2-hero-inner">
          <div className="adp2-photo-wrap">
            <div className="adp2-photo">
              {fullName
                .split(/\s+/)
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?"}
            </div>
          </div>
          <div className="adp2-hero-text">
            <div className="adp2-name-row">
              <h1>{fullName || "—"}</h1>
              <div className="adp2-role-chip">
                <Shield size={12} /> {role}
              </div>
            </div>
            <p className="adp2-dept-line">University administration account</p>
          </div>
          <div className="adp2-hero-cta">
            <button type="button" className="adp2-save-main-btn" disabled={saving} onClick={() => void save()}>
              <Save size={15} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="adp2-main-grid">
        <div className="adp2-col-left">
          <div className="adp2-card">
            <div className="adp2-card-head">
              <h3>
                <User size={15} /> Contact
              </h3>
            </div>
            <div className="adp2-fields">
              <div className="adp2-field-row">
                <Mail size={14} />
                <label style={{ display: "block", width: "100%" }}>
                  Email
                  <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
              </div>
              <div className="adp2-field-row">
                <Phone size={14} />
                <label style={{ display: "block", width: "100%" }}>
                  Phone
                  <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={pnum} onChange={(e) => setPnum(e.target.value)} />
                </label>
              </div>
              <div className="adp2-field-row">
                <MapPin size={14} />
                <label style={{ display: "block", width: "100%" }}>
                  Town
                  <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={town} onChange={(e) => setTown(e.target.value)} />
                </label>
              </div>
              <div className="adp2-field-row">
                <User size={14} />
                <label style={{ display: "block", width: "100%" }}>
                  Full name
                  <input className="sc-inline-input" style={{ width: "100%", marginTop: 4 }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ADMProfilePage;
