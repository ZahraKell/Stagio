import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Search, MapPin, Building2 } from "lucide-react";
import api from "../api";
import toast from "react-hot-toast";

interface OfferApi {
  id: number;
  company_name: string;
  company_town?: string;
  company_sector?: string;
  title: string;
  description: string;
  town: string;
  field?: string;
  duration?: string;
  status: string;
  date_posted?: string;
}

const ADMOfferspage: React.FC = () => {
  const [offers, setOffers] = useState<OfferApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("offers/");
        const data = res.data as OfferApi[];
        setOffers(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Could not load offers.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = offers.filter(
    (o) =>
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.town || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="Internship offers">
      <div className="off-toolbar">
        <div className="off-search" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={13} />
          <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p style={{ padding: 24 }}>Loading…</p>
      ) : (
        <div className="adm-table-wrap" style={{ marginTop: 16 }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Field</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="fw-medium">{o.title}</td>
                  <td>
                    <span className="adm-student-cell">
                      <Building2 size={14} style={{ marginRight: 6 }} />
                      {o.company_name}
                    </span>
                  </td>
                  <td>
                    <MapPin size={14} style={{ display: "inline", marginRight: 4 }} />
                    {o.town}
                  </td>
                  <td>{o.field || "—"}</td>
                  <td>
                    <span className="badge-domain">{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No offers.</p>}
        </div>
      )}

      <p className="text-muted small" style={{ padding: "16px 0" }}>
        Offer approval workflows are managed on the platform admin side. This page lists published offers from the API.
      </p>
    </DashboardLayout>
  );
};

export default ADMOfferspage;
