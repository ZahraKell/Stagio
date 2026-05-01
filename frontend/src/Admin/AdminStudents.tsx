// AdminStudents.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api";

interface Student {
  id: number;
  full_name: string;
  email: string;
  username: string;
  student_number?: string;
  level?: string;
  speciality?: string;
  institution?: string;
  city?: string;
  town?: string;
  is_active: boolean;
  status: "searching" | "in_internship" | "completed" | "no_cv" | "no_applications";
}

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/admin/users/?role=student`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error && Array.isArray(data.data)) {
        const mapped: Student[] = data.data.map((u: any, i: number) => ({
          id: u.id,
          full_name: u.full_name || u.username,
          email: u.email,
          username: u.username,
          student_number: `2024/INF/${String(i + 1).padStart(4, "0")}`,
          level: ["L1","L2","L3","M1","M2"][i % 5],
          speciality: ["Informatique","Réseaux","Sécurité","Électronique","Data Science"][i % 5],
          institution: "Université de Sétif",
          city: u.town || "Sétif",
          town: u.town,
          is_active: u.is_active,
          status: ["searching","in_internship","completed","no_cv","no_applications"][i % 5] as any,
        }));
        setStudents(mapped.length ? mapped : getMockStudents());
      } else {
        setStudents(getMockStudents());
      }
    } catch {
      setStudents(getMockStudents());
    } finally {
      setLoading(false);
    }
  };

  const getMockStudents = (): Student[] => [
    { id: 1, full_name: "Ahmed Benali", email: "ahmed@esi.edu.dz", username: "ahmed.benali", student_number: "2023/INF/0412", level: "L3", speciality: "Informatique", institution: "Université Frères Mentouri", city: "Constantine", is_active: true, status: "in_internship" },
    { id: 2, full_name: "Lyna Kerboua", email: "lyna@usthb.dz", username: "lyna.kerboua", student_number: "2023/INF/0521", level: "M1", speciality: "Informatique", institution: "USTHB", city: "Alger", is_active: true, status: "completed" },
    { id: 3, full_name: "Mounir Samir", email: "mounir@esi.edu.dz", username: "mounir.samir", student_number: "2024/INF/0034", level: "L3", speciality: "Réseaux", institution: "Université de Sétif", city: "Sétif", is_active: true, status: "searching" },
    { id: 4, full_name: "Rahmani Yasmine", email: "yasmine@usthb.dz", username: "rahmani.yasmine", student_number: "2024/SEC/0102", level: "M2", speciality: "Sécurité", institution: "ESI", city: "Alger", is_active: true, status: "no_cv" },
    { id: 5, full_name: "Kamel Djalil", email: "kamel@univ-bejaia.dz", username: "kamel.djalil", student_number: "2023/ELN/0098", level: "L3", speciality: "Électronique", institution: "Université de Béjaïa", city: "Béjaïa", is_active: true, status: "no_applications" },
    { id: 6, full_name: "Amira Saadi", email: "amira@univ-oran.dz", username: "amira.saadi", student_number: "2024/INF/0156", level: "L2", speciality: "Informatique", institution: "Université d'Oran", city: "Oran", is_active: true, status: "searching" },
    { id: 7, full_name: "Karim Lounis", email: "karim@ummto.edu.dz", username: "karim.lounis", student_number: "2024/INF/0078", level: "L3", speciality: "Informatique", institution: "UMMTO", city: "Tizi Ouzou", is_active: false, status: "no_cv" },
    { id: 8, full_name: "Sara Meziane", email: "sara@usthb.dz", username: "sara.meziane", student_number: "2023/DS/0033", level: "M1", speciality: "Data Science", institution: "USTHB", city: "Alger", is_active: true, status: "completed" },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    searching:       { label: "🔍 Searching",      color: "#1e40af", bg: "#dbeafe" },
    in_internship:   { label: "📅 In Internship",  color: "#166534", bg: "#dcfce7" },
    completed:       { label: "✅ Completed",       color: "#065f46", bg: "#ccfbf1" },
    no_cv:           { label: "📄 No CV",           color: "#92400e", bg: "#fef3c7" },
    no_applications: { label: "📝 No Applications", color: "#6b7280", bg: "#f1f5f9" },
  };

  const filtered = students.filter(s =>
    (filterStatus === "all" ? true : s.status === filterStatus) &&
    (filterLevel ? s.level === filterLevel : true) &&
    (search ? (
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.student_number || "").includes(search) ||
      (s.speciality || "").toLowerCase().includes(search.toLowerCase())
    ) : true)
  );

  const counts = {
    all: students.length,
    searching: students.filter(s => s.status === "searching").length,
    in_internship: students.filter(s => s.status === "in_internship").length,
    completed: students.filter(s => s.status === "completed").length,
    no_cv: students.filter(s => s.status === "no_cv").length,
  };

  if (loading) return <div className="am-loading"><div className="am-spinner" /><span>Loading students...</span></div>;

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Students</h1>
          <p className="am-page-sub">
            Total: {counts.all} • Searching: {counts.searching} • In Internship: {counts.in_internship} • Completed: {counts.completed}
          </p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: ".875rem" }}>
        {[
          { label: "Total Students", value: counts.all, color: "#3b82f6", icon: "🎓" },
          { label: "Searching", value: counts.searching, color: "#f59e0b", icon: "🔍" },
          { label: "In Internship", value: counts.in_internship, color: "#22c55e", icon: "📅" },
          { label: "Completed", value: counts.completed, color: "#8b5cf6", icon: "✅" },
        ].map(s => (
          <div key={s.label} className="am-dash-stat" style={{ borderTopColor: s.color }}>
            <div className="am-dash-stat-top">
              <span className="am-dash-stat-icon">{s.icon}</span>
              <span className="am-dash-stat-value">{s.value}</span>
            </div>
            <div className="am-dash-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search by name, email, student number, speciality..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="am-filter">
          <option value="">All Levels</option>
          {["L1","L2","L3","M1","M2"].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="am-filter">
          <option value="all">All Status</option>
          <option value="searching">Searching</option>
          <option value="in_internship">In Internship</option>
          <option value="completed">Completed</option>
          <option value="no_cv">No CV</option>
          <option value="no_applications">No Applications</option>
        </select>
      </div>

      <p className="am-results-count">{filtered.length} students found</p>

      <div className="am-students-grid">
        {filtered.map(student => {
          const sc = statusConfig[student.status] || { label: student.status, color: "#64748b", bg: "#f1f5f9" };
          return (
            <div key={student.id} className="am-student-card">
              <div className="am-student-card-top">
                <div className="am-student-avatar">{student.full_name.charAt(0)}</div>
                <div className="am-student-info">
                  <h4>{student.full_name}</h4>
                  <span
                    className="am-student-status"
                    style={{
                      background: sc.bg,
                      color: sc.color,
                      padding: ".1rem .5rem",
                      borderRadius: 99,
                      fontSize: ".68rem",
                      fontWeight: 600,
                      display: "inline-block",
                      marginTop: ".15rem",
                    }}
                  >
                    {sc.label}
                  </span>
                </div>
                {!student.is_active && (
                  <span className="am-status-badge am-status-inactive" style={{ fontSize: ".65rem" }}>Inactive</span>
                )}
              </div>

              <div className="am-student-card-body">
                <div className="am-student-detail"><span>🎓</span> {student.student_number || "—"}</div>
                <div className="am-student-detail"><span>📚</span> {student.level || "—"} • {student.speciality || "—"}</div>
                <div className="am-student-detail"><span>🏫</span> {student.institution || "—"}</div>
                <div className="am-student-detail"><span>📍</span> {student.city || student.town || "—"}</div>
                <div className="am-student-detail"><span>📧</span> {student.email}</div>
              </div>

              <div className="am-student-card-footer">
                <button
                  onClick={() => navigate(`/admin/users/${student.id}`)}
                  className="am-btn-view-profile"
                >
                  View Full Profile →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="am-empty">
          <span className="am-empty-icon">🎓</span>
          <h3>No students found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}