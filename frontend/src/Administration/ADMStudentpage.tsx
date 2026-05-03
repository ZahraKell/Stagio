import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Search, RefreshCw } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

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

const ADMStudentpage: React.FC = () => {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

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

  useEffect(() => {
    void load();
  }, []);

  const filtered = rows.filter(
    (s) =>
      s.full_name.toLowerCase().includes(q.toLowerCase()) ||
      s.email.toLowerCase().includes(q.toLowerCase()) ||
      (s.speciality || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="Students">
      <div className="off-toolbar" style={{ marginBottom: 16 }}>
        <div className="off-search" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" />
        </div>
        <button type="button" className="adm-action-btn approve sm" onClick={() => void load()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ padding: 24 }}>Loading…</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Speciality</th>
                <th>Institution</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="fw-medium">{s.full_name}</td>
                  <td>{s.email}</td>
                  <td>{s.speciality || "—"}</td>
                  <td>{s.institution || "—"}</td>
                  <td>{s.grade || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No students.</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ADMStudentpage;
