import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './HomePage';
import Companiespage from './Companiespage';
import FAQpage from './FAQPage';
import Blogpage from './Blogpage';
import Testimonialspage from './Testimonialspage';
import ContactPage from './ContactPage';
import SettingsPage from './Settingpage';
import AboutPage from './AboutPage';
import LoginPage from './LoginPage';
import StudentDashboard from './Student/StudentDashboard';
import OffersPage from './OffersPage';
import MyApplicationsPage from './Student/MyApplicationsPage';
import CoursesPage from './Student/CoursesPage';
import HelpCenterPage from './HelpCenterPage';
import Profile from './Student/Profile';
import MyCv from './Student/MyCv';
import './index.css';

// Admin imports
import ADMdashboard from './Administration/ADMdashboard';
import ADMOfferspage from './Administration/ADMOfferspage';
import ConventionsPage from './Administration/ADMConventionspage';
import ADMStudentpage from './Administration/ADMStudentpage';
import ADMAplicationspage from './Administration/ADMAplicationspage';
import ADMCompaniesPage from './Administration/ADMCompaniespage';
import ADMProfile from './Administration/ADMProfilepage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>

        {/* Public pages with global header/footer */}
        <Route path="/" element={<><Header /><HomePage /><Footer /></>} />
        <Route path="/contact" element={<><Header /><ContactPage /><Footer /></>} />
        <Route path="/about" element={<><Header /><AboutPage /><Footer /></>} />
        <Route path="/offers" element={<><Header /><OffersPage /><Footer /></>} />
        <Route path="/FAQ" element={<><Header /><FAQpage /><Footer /></>} />
        <Route path="/Blog" element={<><Header /><Blogpage /><Footer /></>} />
        <Route path="/Companies" element={<><Header /><Companiespage /><Footer /></>} />
        <Route path="/Testimonials" element={<><Header /><Testimonialspage /><Footer /></>} />

        {/* Student dashboard pages (they have their own layout) */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/My Applications" element={<MyApplicationsPage />} />
        <Route path="/my-cv" element={<MyCv />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Settingpage" element={<SettingsPage />} />
        <Route path="/HelpCenterPage" element={<HelpCenterPage />} />

        {/* Administration pages */}
        <Route path="/admin" element={<ADMdashboard />} />
        <Route path="/admin/profile" element={<ADMProfile />} />
        <Route path="/admin/offers" element={<ADMOfferspage />} />
        <Route path="/admin/conventions" element={<ConventionsPage />} />
        <Route path="/admin/students" element={<ADMStudentpage />} />
        <Route path="/admin/applications" element={<ADMAplicationspage />} />
        <Route path="/admin/companies" element={<ADMCompaniesPage />} />

        {/* Admin settings & help (reuse student pages – they use DashboardLayout which may not be admin‑styled) */}
        {/* For now, simply adding routes. Later you can create AdminSettingsPage, AdminHelpPage if needed. */}
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route path="/admin/help" element={<HelpCenterPage />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);