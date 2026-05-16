import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Search, X, ChevronRight, Filter,
  CheckCircle, Clock, XCircle, Building2,
  MapPin, Mail, Globe, RefreshCw,
  LayoutGrid, List, ShieldCheck, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import toast from "react-hot-toast";

/* ══════════════════════════════════════════════════════════════
   API TYPE
   ══════════════════════════════════════════════════════════════ */
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

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const logoColor = (id: number) => {
  const colors = ["#1a4f3a", "#1d4ed8", "#b45309", "#7c3aed", "#0f766e", "#be123c", "#075985", "#92400e"];
  return colors[id % colors.length];
};

type CompanyStatus = "approved" | "pending" | "rejected";

function approvalStatus(c: CompanyRow): CompanyStatus {
  if (c.is_approved) return "approved";
  if (c.is_rejected) return "rejected";
  return "pending";
}

const STATUS_CONFIG: Record<CompanyStatus, { label: string; cls: string; icon: React.ElementType }> = {
  approved: { label: "Approved", cls: "cos-approved", icon: CheckCircle },
  pending: { label: "Pending", cls: "cos-pending", icon: Clock },
  rejected: { label: "Rejected", cls: "cos-rejected", icon: XCircle },
};

const cleanUrl = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

/* ══════════════════════════════════════════════════════════════
   COMPANY CARD (list view)
   ══════════════════════════════════════════════════════════════ */
const CompanyCard: React.FC<{
  company: CompanyRow;
  selected: boolean;
  index: number;
  onClick: () => void;
}> = ({ company: c, selected, index, onClick }) => {
  const status = approvalStatus(c);
  const cfg = STATUS_CONFIG[status];
  return (
    <motion.div
      className={`co-card ${selected ? "selected" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
    >
      <div className="co-card-logo" style={{ background: logoColor(c.id) }}>
        {initials(c.company_name)}
      </div>

      <div className="co-card-body">
        <div className="co-card-top">
          <span className="co-card-name">{c.company_name}</span>
          {c.is_approved && (
            <span className="co-verified-badge">
              <ShieldCheck size={10} /> Verified
            </span>
          )}
          <span className={`co-status-badge ${cfg.cls}`}>
            <cfg.icon size={10} /> {cfg.label}
          </span>
        </div>
        {c.company_sector && <span className="co-card-sector">{c.company_sector}</span>}
        <div className="co-card-meta">
          {c.town && <span><MapPin size={11} />{c.town}</span>}
          {c.email && <span><Mail size={11} />{c.email}</span>}
        </div>
      </div>

      <div className="co-card-right">
        <ChevronRight size={13} className="off-chevron" />
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPANY GRID CARD
   ══════════════════════════════════════════════════════════════ */
const CompanyGridCard: React.FC<{
  company: CompanyRow;
  selected: boolean;
  index: number;
  onClick: () => void;
}> = ({ company: c, selected, index, onClick }) => {
  const status = approvalStatus(c);
  const cfg = STATUS_CONFIG[status];
  return (
    <motion.div
      className={`co-grid-card ${selected ? "selected" : ""}`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
    >
      <div className="co-grid-top">
        <div className="co-grid-logo" style={{ background: logoColor(c.id) }}>
          {initials(c.company_name)}
        </div>
        <span className={`co-status-badge ${cfg.cls}`}>
          <cfg.icon size={10} /> {cfg.label}
        </span>
      </div>
      <div className="co-grid-name">
        {c.company_name}
        {c.is_approved && <ShieldCheck size={12} className="co-grid-verified" />}
      </div>
      {c.company_sector && <div className="co-grid-sector">{c.company_sector}</div>}
      <div className="co-grid-meta">
        {c.town && <span><MapPin size={10} />{c.town}</span>}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPANY DRAWER  (only fields the API returns)
   ══════════════════════════════════════════════════════════════ */
const CompanyDrawer: React.FC<{
  company: CompanyRow;
  onClose: () => void;
}> = ({ company: c, onClose }) => {
  const status = approvalStatus(c);
  const cfg = STATUS_CONFIG[status];

  const detailRows = [
    c.company_sector && { icon: Building2, label: "Sector", value: c.company_sector },
    c.town && { icon: MapPin, label: "Town", value: c.town },
    c.email && { icon: Mail, label: "Email", value: c.email },
    c.company_website && { icon: Globe, label: "Website", value: cleanUrl(c.company_website) },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <motion.aside
      className="co-drawer"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* Head */}
      <div className="co-drawer-head">
        <div className="co-drawer-logo" style={{ background: logoColor(c.id) }}>
          {initials(c.company_name)}
        </div>
        <div className="co-drawer-identity">
          <div className="co-drawer-name-row">
            <h2>{c.company_name}</h2>
            {c.is_approved && <ShieldCheck size={14} className="co-drawer-verified" />}
          </div>
          {c.company_sector && <span className="co-drawer-sector">{c.company_sector}</span>}
          <span className={`co-status-badge ${cfg.cls}`} style={{ marginTop: 4 }}>
            <cfg.icon size={10} /> {cfg.label}
          </span>
        </div>
        <button className="off-drawer-close" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Body */}
      <div className="co-drawer-body">
        <div className="co-contact-grid">
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

        {(c.email || c.company_website) && (
          <div className="co-drawer-actions">
            {c.email && (
              <a href={`mailto:${c.email}`} className="co-action-btn approve">
                <Mail size={14} /> Contact
              </a>
            )}
            {c.company_website && (
              <a
                href={c.company_website}
                target="_blank"
                rel="noreferrer"
                className="co-action-btn suspend"
              >
                <Globe size={14} /> Visit Website
              </a>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
const ADMCompaniesPage: React.FC = () => {
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [selected, setSelected] = useState<CompanyRow | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  /* ── API LOAD ── */
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

  useEffect(() => { void load(); }, []);

  const sectors = useMemo(
    () => [...new Set(rows.map((c) => c.company_sector).filter(Boolean))] as string[],
    [rows]
  );

  const filtered = rows.filter((c) => {
    const qMatch =
      c.company_name.toLowerCase().includes(q.toLowerCase()) ||
      (c.company_sector || "").toLowerCase().includes(q.toLowerCase()) ||
      (c.town || "").toLowerCase().includes(q.toLowerCase());
    const sMatch = sectorFilter === "All Sectors" || c.company_sector === sectorFilter;
    return qMatch && sMatch;
  });

  const counts = {
    total: rows.length,
    approved: rows.filter((c) => c.is_approved).length,
    pending: rows.filter((c) => !c.is_approved && !c.is_rejected).length,
    rejected: rows.filter((c) => c.is_rejected).length,
  };

  return (
    <DashboardLayout pageTitle="Companies">

      {/* ── Summary strip ── */}
      {!loading && (
        <div className="co-summary-strip">
          {[
            { label: "Total Partners", val: counts.total, icon: Building2, cls: "co-sum-total" },
            { label: "Approved", val: counts.approved, icon: CheckCircle, cls: "co-sum-approved" },
            { label: "Pending", val: counts.pending, icon: Clock, cls: "co-sum-pending" },
            { label: "Rejected", val: counts.rejected, icon: AlertCircle, cls: "co-sum-suspended" },
          ].map((s) => (
            <div key={s.label} className={`co-sum-card ${s.cls}`}>
              <s.icon size={15} />
              <span className="co-sum-val">{s.val}</span>
              <span className="co-sum-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="co-toolbar">
        <div className="co-filters">
          <div className="off-search" style={{ minWidth: 220 }}>
            <Search size={13} />
            <input
              type="text"
              placeholder="Search company, sector, town…"
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
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
              <option>All Sectors</option>
              {sectors.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* View toggle */}
          <div className="co-view-toggle">
            <button
              className={`co-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List size={15} />
            </button>
            <button
              className={`co-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
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
          <span>{filtered.length} compan{filtered.length !== 1 ? "ies" : "y"} found</span>
          {(q || sectorFilter !== "All Sectors") && (
            <button
              className="stu-clear-all"
              onClick={() => { setQ(""); setSectorFilter("All Sectors"); }}
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
          <span>Loading companies…</span>
        </div>
      )}

      {/* ── Main split ── */}
      {!loading && (
        <div className={`co-layout ${selected ? "with-drawer" : ""}`}>

          {viewMode === "list" ? (
            <div className="co-list">
              {filtered.length === 0 ? (
                <div className="off-empty">
                  <Building2 size={32} />
                  <p>{q ? "No companies match your filters." : "No companies yet."}</p>
                </div>
              ) : (
                filtered.map((c, i) => (
                  <CompanyCard
                    key={c.id}
                    company={c}
                    selected={selected?.id === c.id}
                    index={i}
                    onClick={() => setSelected(c)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="co-grid">
              {filtered.length === 0 ? (
                <div className="off-empty" style={{ gridColumn: "1/-1" }}>
                  <Building2 size={32} />
                  <p>{q ? "No companies match your filters." : "No companies yet."}</p>
                </div>
              ) : (
                filtered.map((c, i) => (
                  <CompanyGridCard
                    key={c.id}
                    company={c}
                    selected={selected?.id === c.id}
                    index={i}
                    onClick={() => setSelected(c)}
                  />
                ))
              )}
            </div>
          )}

          {/* Drawer */}
          <AnimatePresence>
            {selected && (
              <CompanyDrawer
                key={selected.id}
                company={selected}
                onClose={() => setSelected(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ADMCompaniesPage;