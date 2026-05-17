import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api";
import {
  ChevronRight,
  MapPin,
  Building,
  Clock,
  Download,
  Calendar,
  DollarSign,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";

const CIRCUMFERENCE = 2 * Math.PI * 40;

// ── TYPES ──────────────────────────────────────────────────────────────────
type ApiOffer = {
  id: number;
  title: string;
  company_name: string;
  town: string;
  duration: string;
  internship_type: string;
  is_paid: boolean;
  salary?: string | null;
  tech_stack?: string | null;
  skills?: string | null;
  field?: string | null;
  company_sector?: string | null;
  status: string;
  date_posted: string;
  deadline?: string | null;
  description?: string;
};

type DashboardApplicationPreview = {
  id: number;
  company: string;
  domain: string;
  wilaya: string;
  status: string;
};

const TYPE_LABELS: Record<string, string> = {
  INTERNSHIP: "Stage professionnel",
  ALTERNANCE: "Alternance",
  FINAL_YEAR: "PFE",
};

// Deterministic cover image from offer id — same palette as company side
const OFFER_IMAGES = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&auto=format&fit=crop",
];
const offerImg = (id: number) => OFFER_IMAGES[id % OFFER_IMAGES.length];

function initialsFromCompany(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[1][0] ?? ""}`.toUpperCase();
}

// ── OFFER CARD — matches company dashboard style ───────────────────────────
const OfferCard: React.FC<{ offer: ApiOffer }> = ({ offer }) => {
  const skills = (offer.tech_stack || offer.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const typeLabel =
    TYPE_LABELS[offer.internship_type] ?? offer.internship_type ?? "Stage";

  return (
    <div className="op-card" style={{ animationDelay: "0ms" }}>
      {/* Cover image */}
      <div className="op-card-img">
        <img src={offerImg(offer.id)} alt={offer.title} loading="lazy" />
        <div className="op-card-img-overlay" />
        <span className="op-pill op-pill-open">Ouverte</span>
        <span className="op-type-tag">{typeLabel}</span>
      </div>

      {/* Body */}
      <div className="op-card-body">
        <h3 className="op-card-title">{offer.title}</h3>
        <div className="op-card-meta">
          <span className="op-meta-row">
            <Building size={13} /> {offer.company_name || "—"}
          </span>
          <span className="op-meta-row">
            <MapPin size={13} /> {offer.town || "—"}
          </span>
          <span className="op-meta-row">
            <Clock size={13} /> {offer.duration || "—"}
          </span>
          <span className="op-meta-row">
            <DollarSign size={13} />
            {offer.is_paid ? offer.salary || "Rémunéré" : "Non rémunéré"}
          </span>
        </div>

        {skills.length > 0 && (
          <div className="op-skills">
            {skills.slice(0, 3).map((sk) => (
              <span key={sk} className="op-skill-tag">
                {sk}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="op-skill-more">+{skills.length - 3}</span>
            )}
          </div>
        )}

        {offer.deadline && (
          <p className="op-deadline">
            <Calendar size={13} /> Clôture : {offer.deadline}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="op-card-footer">
        <Link to="/offers" className="op-details-btn">
          Voir l'offre
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ width: 14, height: 14 }}
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

// ── SIMPLE CALENDAR ────────────────────────────────────────────────────────
const SimpleCalendar: React.FC = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const eventDays = [5, 12, 18, today];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const monthName = now.toLocaleString("en-US", { month: "long" });

  return (
    <div className="sc-calendar">
      <div className="sc-cal-header">
        <span>
          {monthName} {year}
        </span>
      </div>
      <div className="sc-cal-weekdays">
        {weekdays.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="sc-cal-days">
        {cells.map((d, i) => (
          <div
            key={i}
            className={`sc-cal-day ${d === today ? "today" : ""} ${d && eventDays.includes(d) ? "has-event" : ""}`}
          >
            {d ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── CV PROGRESS ────────────────────────────────────────────────────────────
const cvStepLabels = [
  "Personal Info",
  "Education",
  "Experience",
  "Skills",
  "Languages",
  "References",
];

const CvProgress: React.FC<{ percent: number }> = ({ percent }) => {
  const safe = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, percent))
    : 0;
  const offset = CIRCUMFERENCE - (safe / 100) * CIRCUMFERENCE;
  const doneCount = Math.round((safe / 100) * cvStepLabels.length);

  return (
    <div className="sc-cv-progress">
      <div className="sc-prog-circle-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e2d9f3"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#a855f7"
            strokeWidth="10"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="sc-prog-center">
          <span className="sc-prog-pct">{safe}%</span>
          <span className="sc-prog-label">done</span>
        </div>
      </div>
      <div className="sc-cv-steps">
        {cvStepLabels.map((label, i) => (
          <div
            key={label}
            className={`sc-cv-step ${i < doneCount ? "done" : "todo"}`}
          >
            <span className="sc-step-dot" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
const StudentDashboard: React.FC = () => {
  const [welcomeName, setWelcomeName] = useState("Student");
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [applicationsPreview, setApplicationsPreview] = useState<
    DashboardApplicationPreview[]
  >([]);
  const [statsOffers, setStatsOffers] = useState(0);
  const [statsAppsTotal, setStatsAppsTotal] = useState(0);
  const [statsAppsSubtitle, setStatsAppsSubtitle] = useState("");
  const [cvScore, setCvScore] = useState(0);
  const [deadlineHint, setDeadlineHint] = useState("Watch offer deadlines");
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Read name from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        const u = JSON.parse(raw) as { full_name?: string };
        const n = u.full_name?.trim();
        if (n) setWelcomeName(n.split(" ")[0] ?? "Student");
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch offers, CV score, applications
  useEffect(() => {
    (async () => {
      // ── Offers ───────────────────────────────────────────────────────────
      try {
        const res = await api.get<ApiOffer[]>("offers/");
        const list: ApiOffer[] = Array.isArray(res.data) ? res.data : [];
        const open = list.filter((o) => o.status === "open");
        setStatsOffers(open.length);
        setOffers(
          [...open]
            .sort(
              (a, b) =>
                new Date(b.date_posted).getTime() -
                new Date(a.date_posted).getTime(),
            )
            .slice(0, 3),
        ); // show latest 3

        const soon = [...open]
          .filter((o) => o.deadline)
          .sort(
            (a, b) =>
              new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
          )[0];
        if (soon?.deadline) {
          const d = new Date(soon.deadline);
          if (!Number.isNaN(d.getTime())) {
            setDeadlineHint(
              `Next deadline: ${d.toLocaleDateString()} (${soon.title})`,
            );
          }
        }
      } catch {
        toast.error("Could not load offers.");
      } finally {
        setLoadingOffers(false);
      }

      // ── CV Score ─────────────────────────────────────────────────────────
      try {
        const cvRes = await api.get<{ data?: { score?: number } }>(
          "auth/cv/score/",
        );
        const score = cvRes.data?.data?.score;
        setCvScore(typeof score === "number" ? score : 0);
      } catch {
        setCvScore(0);
      }

      // ── My Applications ───────────────────────────────────────────────────
      try {
        const appsRes = await api.get<{
          error?: boolean;
          data?: Array<Record<string, unknown>>;
        }>("applications/my-applications/");
        const rows =
          appsRes.data?.error === true ? [] : (appsRes.data?.data ?? []);
        setStatsAppsTotal(rows.length);

        type SC = Partial<Record<string, number>>;
        const tally: SC = rows.reduce((acc: SC, r) => {
          const key =
            typeof r.status === "string" ? r.status.toLowerCase() : "pending";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
        setStatsAppsSubtitle(
          `${tally.pending ?? 0} pending · ${tally.reviewed ?? 0} reviewed · ` +
            `${tally.accepted ?? 0} accepted · ${tally.validated ?? 0} validated · ` +
            `${tally.refused ?? 0} refused`,
        );

        setApplicationsPreview(
          rows.slice(0, 4).map((r) => ({
            id: Number(r.id),
            company: String(r.offer_company_name ?? ""),
            domain: "",
            wilaya: String(r.offer_location ?? ""),
            status:
              typeof r.status === "string" ? r.status.toLowerCase() : "pending",
          })),
        );
      } catch {
        setStatsAppsSubtitle("Apply from the offers catalogue");
      }
    })();
  }, []);

  const appStatSummary = useMemo(
    () => `${statsOffers} published offers · ${deadlineHint}`,
    [statsOffers, deadlineHint],
  );

  return (
    <DashboardLayout pageTitle="Dashboard">
      {/* HERO */}
      <div className="page-hero dashboard-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Welcome back, {welcomeName}! 👋</h1>
          <p>
            Track your internship journey, discover new opportunities, and build
            your future.
          </p>
        </div>
      </div>

      {/* LATEST OFFERS — company-style cards */}
      <div className="sc-section">
        <div className="section-header">
          <h2>Latest Internship Offers</h2>
          <Link to="/offers" className="more-btn">
            Browse all <ChevronRight size={16} />
          </Link>
        </div>

        {loadingOffers ? (
          <div
            style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}
          >
            Loading offers…
          </div>
        ) : offers.length === 0 ? (
          <div
            style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}
          >
            No open offers at the moment.
          </div>
        ) : (
          /* Reuse the exact same op-grid / op-card classes from CompanyOffers */
          <div
            className="op-grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="sc-stats-grid">
        <div className="sc-stat-card blue">
          <div className="sc-stat-label">Available Offers</div>
          <div className="sc-stat-value">{statsOffers}</div>
          <div className="sc-stat-sub">{appStatSummary}</div>
        </div>
        <div className="sc-stat-card green">
          <div className="sc-stat-label">My Applications</div>
          <div className="sc-stat-value">{statsAppsTotal}</div>
          <div className="sc-stat-sub">
            {statsAppsSubtitle || "Apply from the offers catalogue"}
          </div>
        </div>
        <div className="sc-stat-card purple">
          <div className="sc-stat-label">CV Completion</div>
          <div className="sc-stat-value">{cvScore}%</div>
          <div className="sc-stat-sub">Based on your CV profile</div>
        </div>
        <div className="sc-stat-card red">
          <div className="sc-stat-label">Deadlines</div>
          <div className="sc-stat-value">—</div>
          <div className="sc-stat-sub">{deadlineHint}</div>
        </div>
      </div>

      {/* RECENT APPLICATIONS */}
      <div className="sc-section">
        <div className="section-header">
          <h2>Recent Applications</h2>
          <Link to="/student/applications" className="more-btn">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        <div className="card">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Wilaya</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applicationsPreview.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: "1.5rem",
                    }}
                  >
                    No applications yet.
                  </td>
                </tr>
              ) : (
                applicationsPreview.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.company || "—"}</strong>
                    </td>
                    <td>{app.wilaya || "—"}</td>
                    <td>
                      <span
                        className={`sc-badge sc-badge-${app.status === "validated" ? "validated" : app.status === "accepted" ? "accepted" : app.status}`}
                      >
                        {app.status.charAt(0).toUpperCase() +
                          app.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {app.status === "accepted" && (
                        <button className="sc-btn-download">
                          <Download size={13} /> Convention
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CALENDAR + CV PROGRESS */}
      <div className="dashboard-row two-columns">
        <div className="card calendar-card">
          <h3>Upcoming Events</h3>
          <SimpleCalendar />
        </div>
        <div className="card">
          <div className="sc-card-header">
            <h3>CV Completion</h3>
            <Link to="/student/cv" className="more-btn">
              Edit CV <ChevronRight size={14} />
            </Link>
          </div>
          <CvProgress percent={cvScore} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
