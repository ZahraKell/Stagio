import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Building, Clock, Download } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const recentApplications = [
  { id: 1, company: 'Ooredoo Algeria', domain: 'Telecoms', wilaya: 'Constantine', status: 'accepted' },
  { id: 2, company: 'Condor Electronics', domain: 'Electronics', wilaya: 'Bordj Bou Arr.', status: 'pending' },
  { id: 3, company: 'Sonatrach', domain: 'Energy / IT', wilaya: 'Alger', status: 'pending' },
  { id: 4, company: 'NCA Rouiba', domain: 'Industry', wilaya: 'Alger', status: 'rejected' },
];

const latestOffers = [
  { id: 1, initials: 'SO', title: 'Software Engineering Intern', company: 'Sonatrach', wilaya: 'Alger', duration: '6 months', domain: 'IT' },
  { id: 2, initials: 'MB', title: 'Network & Telecom Intern', company: 'Mobilis', wilaya: 'Constantine', duration: '3 months', domain: 'Telecom' },
  { id: 3, initials: 'SG', title: 'Data Analysis Intern', company: 'Sider Group', wilaya: 'Annaba', duration: '4 months', domain: 'Data' },
];

const cvSteps = [
  { label: 'Personal Info', done: true },
  { label: 'Education', done: true },
  { label: 'Experience', done: true },
  { label: 'Skills', done: false },
  { label: 'Languages', done: false },
  { label: 'References', done: false },
];

const CV_PERCENT = 65;
const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

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
const CvProgress: React.FC = () => {
  const offset = CIRCUMFERENCE - (CV_PERCENT / 100) * CIRCUMFERENCE;
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
          <span className="sc-prog-pct">{CV_PERCENT}%</span>
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
const StudentDashboard: React.FC = () => {
  return (
    <DashboardLayout pageTitle="Dashboard">

      {/* HERO */}
      <div className="page-hero dashboard-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Welcome back, Ahmed! 👋</h1>
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
          {latestOffers.map(offer => (
            <div key={offer.id} className="offer-card">
              <div className="sc-offer-top">
                <div className="sc-offer-logo">{offer.initials}</div>
                <span className="domain">{offer.domain}</span>
              </div>
              <div className="offer-details">
                <h4>{offer.title}</h4>
                <p className="company"><Building size={13} /> {offer.company}</p>
                <p className="location"><MapPin size={13} /> {offer.wilaya}</p>
                <p className="posted"><Clock size={13} /> {offer.duration}</p>
                <div className="offer-footer">
                  <button className="apply-btn">Apply Now</button>
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
          <div className="sc-stat-value">48</div>
          <div className="sc-stat-sub">+12 this week in your field</div>
        </div>
        <div className="sc-stat-card green">
          <div className="sc-stat-label">My Applications</div>
          <div className="sc-stat-value">5</div>
          <div className="sc-stat-sub">1 accepted · 3 pending · 1 rejected</div>
        </div>
        <div className="sc-stat-card purple">
          <div className="sc-stat-label">CV Completion</div>
          <div className="sc-stat-value">65%</div>
          <div className="sc-stat-sub">Add skills & languages</div>
        </div>
        <div className="sc-stat-card red">
          <div className="sc-stat-label">Deadlines This Week</div>
          <div className="sc-stat-value">2</div>
          <div className="sc-stat-sub">Next: Condor · Apr 30</div>
        </div>
      </div>

      {/* RECENT APPLICATIONS */}
      <div className="sc-section">
        <div className="section-header">
          <h2>Recent Applications</h2>
          <Link to="/applications" className="more-btn">View all <ChevronRight size={16} /></Link>
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
              {recentApplications.map(app => (
                <tr key={app.id}>
                  <td><strong>{app.company}</strong></td>
                  <td>{app.domain}</td>
                  <td>{app.wilaya}</td>
                  <td>
                    <span className={`sc-badge sc-badge-${app.status}`}>
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
            <Link to="/cv" className="more-btn">Edit CV <ChevronRight size={14} /></Link>
          </div>
          <CvProgress />
        </div>
      </div>

    </DashboardLayout>
  );
};

export default StudentDashboard;