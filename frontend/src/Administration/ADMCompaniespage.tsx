import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { RefreshCw } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

interface CompanyRow {
  id: number;
  company_name: string;
  company_sector?: string;
  town?: string;
  company_website?: string;
  email?: string;
  is_approved?: boolean;
  is_rejected?: boolean;
}

function unwrapCompanies(res: { data: unknown }): CompanyRow[] {
  const body = res.data as { data?: CompanyRow[] };
  return body?.data ?? [];
}

const ADMCompaniesPage: React.FC = () => {
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("administration/companies/");
      setRows(unwrapCompanies(res));
    } catch {
      toast.error("Could not load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <DashboardLayout pageTitle="Companies">
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
                <th>Company</th>
                <th>Sector</th>
                <th>Town</th>
                <th>Email</th>
                <th>Approved</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="fw-medium">{c.company_name}</td>
                  <td>{c.company_sector || "—"}</td>
                  <td>{c.town || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.is_approved ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-muted" style={{ padding: 16 }}>
              No companies linked to applications from your students yet.
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ADMCompaniesPage;
