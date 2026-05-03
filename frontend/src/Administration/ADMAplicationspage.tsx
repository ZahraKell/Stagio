import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { CheckCircle, RefreshCw } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

interface AppRow {
  id: number;
  offer_title: string;
  offer_location?: string;
  offer_company_name?: string;
  student_name: string;
  student_email: string;
  status: string;
  application_date: string;
}

function unwrapApps(res: { data: unknown }): AppRow[] {
  const body = res.data as { data?: AppRow[] };
  return body?.data ?? [];
}

const ADMAplicationspage: React.FC = () => {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("applications/administration/scope/applications/");
      setRows(unwrapApps(res));
    } catch {
      toast.error("Could not load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const validate = async (id: number) => {
    try {
      await api.put(`applications/${id}/validate/`, {});
      toast.success("Internship validated.");
      await load();
    } catch {
      toast.error("Validation failed (check application status and permissions).");
    }
  };

  return (
    <DashboardLayout pageTitle="Applications">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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
                <th>Student</th>
                <th>Offer</th>
                <th>Company</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="fw-medium">{a.student_name}</div>
                    <div className="text-muted small">{a.student_email}</div>
                  </td>
                  <td>{a.offer_title}</td>
                  <td>{a.offer_company_name}</td>
                  <td>
                    <span className={`app-status-badge as-${a.status === "accepted" ? "accepted" : "pending"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="text-muted">{a.application_date ? String(a.application_date).slice(0, 10) : "—"}</td>
                  <td>
                    {a.status === "accepted" && (
                      <button type="button" className="adm-action-btn approve sm" onClick={() => void validate(a.id)}>
                        <CheckCircle size={14} /> Validate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No applications in your scope.</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ADMAplicationspage;
