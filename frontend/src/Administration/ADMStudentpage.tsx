import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Search, X, ChevronRight, GraduationCap,
  MapPin, Mail, Phone, Filter,
  Users, RefreshCw, BookOpen, Hash, Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import toast from "react-hot-toast";

/* ══════════════════════════════════════════════════════════════
   API TYPE
   ══════════════════════════════════════════════════════════════ */
interface StudentRow {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  town?: string;
  student_number?: string | null;
  speciality?: string;
  institution?: string;
  field?: string;
  grade?: string;
}

function unwrapStudents(res: { data: unknown }): StudentRow[] {
  const body = res.data as { data?: StudentRow[] };
  return body?.data ?? [];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const avatarColor = (id: number) => {
  const colors = ["#1a4f3a", "#1d4ed8", "#7c3aed", "#0f766e", "#b45309", "#be123c"];
  return colors[id % colors.length];
};

const specialtyColor = (spec?: string): string => {
  const s = (spec || "").toLowerCase();
  if (s.includes("info")) return "dom-info";
  if (s.includes("rés") || s.includes("res") || s.includes("tél") || s.includes("tel")) return "dom-tel";
  if (s.includes("élec") || s.includes("elec")) return "dom-elec";
  if (s.includes("auto")) return "dom-auto";
  if (s.includes("sécu") || s.includes("secu")) return "dom-sec";
  return "dom-info";
};

/* ══════════════════════════════════════════════════════════════
   STUDENT CARD
   ══════════════════════════════════════════════════════════════ */
const StudentCard: React.FC<{
  student: StudentRow;
  selected: boolean;
  index: number;
  onClick: () => void;
}> = ({ student: s, selected, index, onClick }) => (
  <motion.div
    className={`stu-card ${selected ? "selected" : ""}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.035 }}
    onClick={onClick}
  >
    <div className="stu-avatar stu-avatar-md" style={{ background: avatarColor(s.id) }}>
      {initials(s.full_name)}
    </div>

    <div className="stu-card-body">
      <div className="stu-card-top">
        <span className="stu-card-name">{s.full_name}</span>
      </div>
      {s.student_number && <span className="stu-card-reg">{s.student_number}</span>}
      <div className="stu-card-meta">
        {s.speciality && (
          <span><GraduationCap size={11} />{s.speciality}</span>
        )}
        {s.town && <span><MapPin size={11} />{s.town}</span>}
        {s.speciality && (
          <span className={`off-domain-tag ${specialtyColor(s.speciality)}`} style={{ fontSize: 10 }}>
            {s.speciality}
          </span>
        )}
      </div>
    </div>

    <div className="stu-card-right">
      {s.grade && <span className="sp-grade-badge">{s.grade}</span>}
      <ChevronRight size={13} className="off-chevron" />
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════
   STUDENT DRAWER  (only fields the API returns)
   ══════════════════════════════════════════════════════════════ */
const StudentDrawer: React.FC<{
  student: StudentRow;
  onClose: () => void;
}> = ({ student: s, onClose }) => {
  const detailRows = [
    s.speciality && { icon: GraduationCap, label: "Speciality", value: s.speciality },
    s.field && { icon: BookOpen, label: "Field", value: s.field },
    s.institution && { icon: Building2, label: "Institution", value: s.institution },
    s.grade && { icon: Hash, label: "Grade", value: s.grade },
    s.student_number && { icon: Hash, label: "Student No.", value: s.student_number },
    { icon: Mail, label: "Email", value: s.email },
    s.phone && { icon: Phone, label: "Phone", value: s.phone },
    s.town && { icon: MapPin, label: "Town", value: s.town },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <motion.aside
      className="stu-drawer"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* Head */}
      <div className="stu-drawer-head">
        <div className="stu-avatar stu-avatar-lg" style={{ background: avatarColor(s.id) }}>
          {initials(s.full_name)}
        </div>
        <div className="stu-drawer-identity">
          <h2>{s.full_name}</h2>
          {s.student_number && <span className="stu-drawer-reg">{s.student_number}</span>}
        </div>
        <button className="off-drawer-close" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Body */}
      <div className="stu-drawer-body">
        <div className="stu-detail-grid">
          {detailRows.map((d) => (
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
          <a href={`mailto:${s.email}`} className="stu-action-btn primary">
            <Mail size={14} /> Send Email
          </a>
        </div>
      </div>
    </motion.aside>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
const ADMStudentpage: React.FC = () => {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [specFilter, setSpecFilter] = useState("All Specialties");
  const [selected, setSelected] = useState<StudentRow | null>(null);

  /* ── API LOAD ── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("administration/students/");
      setRows(unwrapStudents(res));
    } catch {
      toast.error("Could not load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const specialties = useMemo(
    () => [...new Set(rows.map((s) => s.speciality).filter(Boolean))] as string[],
    [rows]
  );

  const filtered = rows.filter((s) => {
    const qMatch =
      s.full_name.toLowerCase().includes(q.toLowerCase()) ||
      s.email.toLowerCase().includes(q.toLowerCase()) ||
      (s.speciality || "").toLowerCase().includes(q.toLowerCase());
    const spMatch = specFilter === "All Specialties" || s.speciality === specFilter;
    return qMatch && spMatch;
  });

  return (
    <DashboardLayout pageTitle="Students">

      {/* ── Summary strip ── */}
      {!loading && (
        <div className="stu-summary-strip">
          <div className="stu-sum-card sum-total">
            <Users size={16} />
            <span className="stu-sum-val">{rows.length}</span>
            <span className="stu-sum-label">Total Students</span>
          </div>
          <div className="stu-sum-card sum-active">
            <GraduationCap size={16} />
            <span className="stu-sum-val">{rows.filter((s) => s.grade).length}</span>
            <span className="stu-sum-label">With Grade Info</span>
          </div>
          <div className="stu-sum-card sum-completed">
            <Building2 size={16} />
            <span className="stu-sum-val">
              {[...new Set(rows.map((s) => s.institution).filter(Boolean))].length}
            </span>
            <span className="stu-sum-label">Institutions</span>
          </div>
          <div className="stu-sum-card sum-searching">
            <BookOpen size={16} />
            <span className="stu-sum-val">{specialties.length}</span>
            <span className="stu-sum-label">Specialities</span>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="stu-toolbar">
        <div className="stu-filters">
          <div className="off-search" style={{ minWidth: 220 }}>
            <Search size={13} />
            <input
              type="text"
              placeholder="Search by name, email or speciality…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button onClick={() => setQ("")} className="off-clear">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="off-selects">
            <Filter size={13} className="filter-icon" />
            <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)}>
              <option>All Specialties</option>
              {specialties.map((sp) => <option key={sp}>{sp}</option>)}
            </select>
          </div>
        </div>
        <button
          type="button"
          className="adm-action-btn approve sm"
          onClick={() => void load()}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Results bar ── */}
      {!loading && (
        <div className="stu-results-bar">
          <span>{filtered.length} student{filtered.length !== 1 ? "s" : ""} found</span>
          {(q || specFilter !== "All Specialties") && (
            <button
              className="stu-clear-all"
              onClick={() => { setQ(""); setSpecFilter("All Specialties"); }}
            >
              <X size={11} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div className="sp-loading">
          <div className="sp-spinner" />
          <span>Loading students…</span>
        </div>
      )}

      {/* ── Main split ── */}
      {!loading && (
        <div className={`stu-layout ${selected ? "with-drawer" : ""}`}>

          {/* List */}
          <div className="stu-list">
            {filtered.length === 0 ? (
              <div className="off-empty">
                <Users size={32} />
                <p>{q ? "No students match your filters." : "No students yet."}</p>
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
      )}
    </DashboardLayout>
  );
};

export default ADMStudentpage;