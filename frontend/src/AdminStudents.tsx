// src/AdminStudents.tsx
import { useState, useEffect } from "react";

interface Student {
  id: number;
  full_name: string;
  student_number: string;
  level: string;
  speciality: string;
  institution: string;
  city: string;
  status: "searching" | "in_internship" | "completed" | "no_cv" | "no_applications";
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterSpeciality, setFilterSpeciality] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/admin/users/?role=student", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudents(data.results || getMockStudents());
    } catch {
      setStudents(getMockStudents());
    } finally {
      setLoading(false);
    }
  };

  const getMockStudents = (): Student[] => [
    { id: 1, full_name: "Ahmed Benali", student_number: "2023/INF/0412", level: "L3", speciality: "Informatique", institution: "Université Frères Mentouri", city: "Constantine", status: "in_internship" },
    { id: 2, full_name: "Lyna Kerboua", student_number: "2023/INF/0521", level: "M1", speciality: "Informatique", institution: "USTHB", city: "Alger", status: "completed" },
    { id: 3, full_name: "Mounir Samir", student_number: "2024/INF/0034", level: "L3", speciality: "Réseaux", institution: "Université de Sétif", city: "Sétif", status: "searching" },
    { id: 4, full_name: "Rahmani Yasmine", student_number: "2024/SEC/0102", level: "M2", speciality: "Sécurité", institution: "ESI", city: "Alger", status: "no_cv" },
    { id: 5, full_name: "Kamel Djalil", student_number: "2023/ELN/0098", level: "L3", speciality: "Électronique", institution: "Université de Béjaïa", city: "Béjaïa", status: "no_applications" },
    { id: 6, full_name: "Amira Saadi", student_number: "2024/INF/0156", level: "L2", speciality: "Informatique", institution: "Université d'Oran", city: "Oran", status: "searching" },
  ];

  const statusLabels: Record<string, string> = {
    searching: "🔍 Searching",
    in_internship: "📅 In Internship",
    completed: "✅ Completed",
    no_cv: "📄 No CV",
    no_applications: "📝 No Applications",
  };

  const filteredStudents = students.filter(s =>
    (filterLevel ? s.level === filterLevel : true) &&
    (filterSpeciality ? s.speciality === filterSpeciality : true) &&
    (search ? s.full_name.toLowerCase().includes(search.toLowerCase()) || s.student_number.includes(search) : true)
  );

  if (loading) {
    return <div className="am-loading"><div className="am-spinner" /><span>Loading students...</span></div>;
  }

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Students</h1>
          <p className="am-page-sub">
            Total: {students.length} • Searching: {students.filter(s => s.status === "searching").length} •
            In Internship: {students.filter(s => s.status === "in_internship").length} •
            Completed: {students.filter(s => s.status === "completed").length}
          </p>
        </div>
      </div>

      <div className="am-filters-row">
        <div className="am-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="am-filter">
          <option value="">All Levels</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
          <option value="M1">M1</option>
          <option value="M2">M2</option>
        </select>
        <select value={filterSpeciality} onChange={e => setFilterSpeciality(e.target.value)} className="am-filter">
          <option value="">All Specialties</option>
          <option value="Informatique">Informatique</option>
          <option value="Réseaux">Réseaux</option>
          <option value="Sécurité">Sécurité</option>
          <option value="Électronique">Électronique</option>
        </select>
      </div>

      <p className="am-results-count">{filteredStudents.length} students found</p>

      <div className="am-students-grid">
        {filteredStudents.map(student => (
          <div key={student.id} className="am-student-card">
            <div className="am-student-card-top">
              <div className="am-student-avatar">{student.full_name.charAt(0)}</div>
              <div className="am-student-info">
                <h4>{student.full_name}</h4>
                <span className="am-student-status">{statusLabels[student.status]}</span>
              </div>
            </div>
            <div className="am-student-card-body">
              <div className="am-student-detail"><span>🎓</span> {student.student_number}</div>
              <div className="am-student-detail"><span>📚</span> {student.level} • {student.speciality}</div>
              <div className="am-student-detail"><span>🏫</span> {student.institution}</div>
              <div className="am-student-detail"><span>📍</span> {student.city}</div>
            </div>
            <div className="am-student-card-footer">
              <a href={`/admin/students/${student.id}`} className="am-btn-view-profile">View Profile →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}