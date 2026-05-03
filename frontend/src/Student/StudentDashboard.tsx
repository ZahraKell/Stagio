import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api';
import { ChevronRight, MapPin, Building, Clock, Download } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const cvSteps = [
  { label: 'Personal Info', done: true },
  { label: 'Education', done: true },
  { label: 'Experience', done: true },
  { label: 'Skills', done: false },
  { label: 'Languages', done: false },
  { label: 'References', done: false },
];

const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

type DashboardOfferPreview = {
  id: number;
  initials: string;
  title: string;
  company: string;
  wilaya: string;
  duration: string;
  domain: string;
};

type DashboardApplicationPreview = {
  id: number;
  company: string;
  domain: string;
  wilaya: string;
  status: string;
};

// ── CALENDAR ──────────────────────────────────────────────────────────────
const SimpleCalendar: React.FC = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const first = new Date(year, month, 1).getDay(); // 0=Sun
  const days = new Date(year, month + 1, 0).getDate();
  const eventDays = [5, 12, 18, today, 30];
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const monthName = now.toLocaleString('en-US', { month: 'long' });

  return (
    <div className="sc-calendar">
      <div className="sc-cal-header">
        <span>{monthName} {year}</span>
      </div>
      <div className="sc-cal-weekdays">
        {weekdays.map(w => <div key={w}>{w}</div>)}
      </div>
      <div className="sc-cal-days">
        {cells.map((d, i) => (
          <div
            key={i}
            className={`sc-cal-day ${d === today ? 'today' : ''} ${d && eventDays.includes(d) ? 'has-event' : ''}`}
          >
            {d ?? ''}
          </div>
        ))}
      </div>
      <div className="sc-cal-legend">
        <div className="sc-deadline-row">
          <span>Condor Electronics deadline</span>
          <span className="dl-danger">Apr 30</span>
        </div>
        <div className="sc-deadline-row">
          <span>Mobilis application closes</span>
          <span className="dl-warn">May 5</span>
        </div>
      </div>
    </div>
  );
};

// ── PROGRESS CIRCLE ────────────────────────────────────────────────────────
const CvProgress: React.FC<{ percent: number }> = ({ percent }) => {
  const safe = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  const offset = CIRCUMFERENCE - (safe / 100) * CIRCUMFERENCE;
  return (
    <div className="sc-cv-progress">
      <div className="sc-prog-circle-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2d9f3" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40"
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
        {cvSteps.map(step => (
          <div key={step.label} className={`sc-cv-step ${step.done ? 'done' : 'todo'}`}>
            <span className="sc-step-dot" />
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
function initialsFromCompany(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ''}${p[1][0] ?? ''}`.toUpperCase();
}

const StudentDashboard: React.FC = () => {
  const [welcomeName, setWelcomeName] = useState('Student');
  const [offerPreviews, setOfferPreviews] = useState<DashboardOfferPreview[]>([]);
  const [applicationsPreview, setApplicationsPreview] = useState<DashboardApplicationPreview[]>([]);
  const [statsOffers, setStatsOffers] = useState(0);
  const [statsAppsTotal, setStatsAppsTotal] = useState(0);
  const [statsAppsSubtitle, setStatsAppsSubtitle] = useState('');
  const [cvScore, setCvScore] = useState(0);
  const [deadlineHint, setDeadlineHint] = useState('Watch offer deadlines');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_data');
      if (raw) {
        const u = JSON.parse(raw) as { full_name?: string };
        const n = u.full_name?.trim();
        if (n) setWelcomeName(n.split(' ')[0] ?? 'Student');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const offersRes = await api.get<Array<Record<string, unknown>>>('offers/');
        const list = Array.isArray(offersRes.data) ? offersRes.data : [];
        const openOffers = list.filter((o) => (o.status as string | undefined) !== 'closed');
        setStatsOffers(openOffers.length);
        const top = openOffers.slice(0, 3).map((o): DashboardOfferPreview => {
          const company = String(o.company_name ?? 'Company');
          return {
            id: Number(o.id),
            initials: initialsFromCompany(company),
            title: String(o.title ?? ''),
            company,
            wilaya: String(o.town ?? ''),
            duration: String(o.duration ?? '—'),
            domain: String((o.field as string | undefined) || (o.company_sector as string | undefined) || ''),
          };
        });
        setOfferPreviews(top);

        const soon = [...openOffers]
          .filter((o) => o.deadline)
          .sort(
            (a, b) =>
              new Date(String(a.deadline)).getTime() - new Date(String(b.deadline)).getTime()
          )[0];
        if (soon?.deadline) {
          const d = new Date(String(soon.deadline));
          if (!Number.isNaN(d.getTime())) {
            setDeadlineHint(`Next deadline: ${d.toLocaleDateString()} (${String(soon.title ?? '')})`);
          }
        }
      } catch {
        toast.error('Could not refresh offers.');
      }

      try {
        const cvRes = await api.get<{ data?: { score?: number } }>('auth/cv/score/');
        const score = cvRes.data?.data?.score;
        setCvScore(typeof score === 'number' ? score : 0);
      } catch {
        setCvScore(0);
      }

      try {
        const appsRes = await api.get<{ error?: boolean; data?: Array<Record<string, unknown>> }>(
          'applications/my-applications/'
        );
        const rows = appsRes.data?.error === true ? [] : appsRes.data?.data ?? [];
        const total = rows.length;
        setStatsAppsTotal(total);

        type StatusCount = Partial<Record<string, number>>;
        const tally: StatusCount = rows.reduce((acc: StatusCount, r) => {
          const key = typeof r.status === 'string' ? r.status.toLowerCase() : 'pending';
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
        setStatsAppsSubtitle(
          `${tally.pending ?? 0} pending · ${tally.reviewed ?? 0} reviewed · ${tally.accepted ?? 0} accepted · ${tally.validated ?? 0} validated · ${tally.refused ?? 0} refused`
        );

        const short = rows.slice(0, 4).map(
          (r): DashboardApplicationPreview => ({
            id: Number(r.id),
            company: String(r.offer_company_name ?? ''),
            domain: '',
            wilaya: String(r.offer_location ?? ''),
            status: typeof r.status === 'string' ? r.status.toLowerCase() : 'pending',
          })
        );
        setApplicationsPreview(short);
      } catch {
        setStatsAppsSubtitle('Sign in as a student to track applications.');
        setApplicationsPreview([]);
      }
    })();
  }, []);

  const appStatSummary = useMemo(() => `${statsOffers} published offers · ${deadlineHint}`, [statsOffers, deadlineHint]);

  return (
    <DashboardLayout pageTitle="Dashboard">

      {/* HERO */}
      <div className="page-hero dashboard-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Welcome back, {welcomeName}! 👋</h1>
          <p>Track your internship journey, discover new opportunities, and build your future.</p>
        </div>
      </div>

      {/* LATEST OFFERS */}
      <div className="sc-section">
        <div className="section-header">
          <h2>Latest Internship Offers</h2>
          <Link to="/offers" className="more-btn">Browse all <ChevronRight size={16} /></Link>
        </div>
        <div className="offers-grid">
          {offerPreviews.map((offer) => (
            <div key={offer.id} className="offer-card">
              <div className="sc-offer-top">
                <div className="sc-offer-logo">{offer.initials}</div>
                {offer.domain && <span className="domain">{offer.domain}</span>}
              </div>
              <div className="offer-details">
                <h4>{offer.title}</h4>
                <p className="company"><Building size={13} /> {offer.company}</p>
                <p className="location"><MapPin size={13} /> {offer.wilaya}</p>
                <p className="posted"><Clock size={13} /> {offer.duration}</p>
                <div className="offer-footer">
                  <Link to="/offers" className="apply-btn" style={{ textAlign: 'center', display: 'block' }}>
                    View offer
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          <div className="sc-stat-sub">{statsAppsSubtitle || 'Apply from the offers catalogue'}</div>
        </div>
        <div className="sc-stat-card purple">
          <div className="sc-stat-label">CV Completion</div>
          <div className="sc-stat-value">{cvScore}%</div>
          <div className="sc-stat-sub">Based on backend CV score endpoint</div>
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
          <Link to="/student/applications" className="more-btn">View all <ChevronRight size={16} /></Link>
        </div>
        <div className="card">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Domain</th>
                <th>Wilaya</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applicationsPreview.map((app) => (
                <tr key={app.id}>
                  <td><strong>{app.company}</strong></td>
                  <td>{app.domain || '—'}</td>
                  <td>{app.wilaya}</td>
                  <td>
                    <span className={`sc-badge sc-badge-${app.status === 'validated' ? 'validated' : app.status === 'accepted' ? 'accepted' : app.status}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {app.status === 'accepted' && (
                      <button className="sc-btn-download">
                        <Download size={13} /> Convention
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
            <Link to="/student/cv" className="more-btn">Edit CV <ChevronRight size={14} /></Link>
          </div>
          <CvProgress percent={cvScore} />
        </div>
      </div>

    </DashboardLayout>
  );
};

export default StudentDashboard;