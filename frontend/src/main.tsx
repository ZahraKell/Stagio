import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // ✅ added missing import
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./HomePage";
import ContactPage from "./ContactPage";
import AboutPage from "./AboutPage";
import AuthPage from "./AuthPage";
import CompanyHome from "./Company/CompanyHome";
import CompanyOffers from "./Company/CompanyOffers";
import CompanyDetails from "./Company/CompanyDetails";
import DiscoverCVs from "./Company/DiscoverCVs";
import CreateOffer from "./Company/CreateOffer";
import MyInterns from "./Company/MyInterns";
import CompanyProfile from "./Company/CompanyProfile";
import CompanySettings from "./Company/CompanySettings";
import AdminLayout from "./Admin/AdminLayout";
import AdminDashboard from "./Admin/AdminDashboard";
import AdminUsers from "./Admin/AdminUsers";
import AdminUserDetail from "./Admin/AdminUserDetail";
import AdminStudents from "./Admin/AdminStudents";
import AdminCompanies from "./Admin/AdminCompanies";
import AdminApplications from "./Admin/AdminApplications";
import AdminConventions from "./Admin/AdminConventions";
import AdminEmails from "./Admin/AdminEmails";
import AdminStats from "./Admin/AdminStats";
import AdminNotifications from "./Admin/AdminNotifications";
import AdminSettings from "./Admin/AdminSettings";
import AdminOffers from "./Admin/AdminOffers";
import "./index.css";
import Companiespage from './Companiespage';
import FAQpage from './FAQPage';
import Blogpage from './Blogpage';
import Testimonialspage from './Testimonialspage';
import SettingsPage from './Settingpage';
import LoginPage from './LoginPage';
import StudentDashboard from './Student/StudentDashboard';
import OffersPage from './OffersPage';
import MyApplicationsPage from './Student/MyApplicationsPage';
import CoursesPage from './Student/CoursesPage';
import HelpCenterPage from './HelpCenterPage';
import Profile from './Student/Profile';
import MyCv from './Student/MyCv';
import ADMdashboard from './Administration/ADMdashboard';
import ADMOfferspage from './Administration/ADMOfferspage';
import ConventionsPage from './Administration/ADMConventionspage';
import ADMStudentpage from './Administration/ADMStudentpage';
import ADMAplicationspage from './Administration/ADMAplicationspage';
import ADMCompaniesPage from './Administration/ADMCompaniespage';
import ADMProfile from './Administration/ADMProfilepage';

// Protected route placeholder (implement real logic)
function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("user_role");
  // Add proper validation later
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" />  {/* ✅ Toaster now correctly placed */}
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

        {/* Student dashboard pages (own layout) */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/My Applications" element={<MyApplicationsPage />} />
        <Route path="/my-cv" element={<MyCv />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Settingpage" element={<SettingsPage />} />
        <Route path="/HelpCenterPage" element={<HelpCenterPage />} />

        {/* Administrative pages (separate layout) */}
        <Route path="/admin" element={<ADMdashboard />} />
        <Route path="/admin/profile" element={<ADMProfile />} />
        <Route path="/admin/offers" element={<ADMOfferspage />} />
        <Route path="/admin/conventions" element={<ConventionsPage />} />
        <Route path="/admin/students" element={<ADMStudentpage />} />
        <Route path="/admin/applications" element={<ADMAplicationspage />} />
        <Route path="/admin/companies" element={<ADMCompaniesPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route path="/admin/help" element={<HelpCenterPage />} />

        {/* Authentication */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Company routes (protected) */}
        <Route path="/company/dashboard" element={<ProtectedRoute role="company"><CompanyHome /></ProtectedRoute>} />
        <Route path="/company/offers" element={<ProtectedRoute role="company"><CompanyOffers /></ProtectedRoute>} />
        <Route path="/company/offers/:id" element={<ProtectedRoute role="company"><CompanyDetails /></ProtectedRoute>} />
        <Route path="/company/offers/new" element={<ProtectedRoute role="company"><CreateOffer /></ProtectedRoute>} />
        <Route path="/company/interns" element={<ProtectedRoute role="company"><MyInterns /></ProtectedRoute>} />
        <Route path="/company/cvs" element={<ProtectedRoute role="company"><DiscoverCVs /></ProtectedRoute>} />
        <Route path="/company/profile" element={<ProtectedRoute role="company"><CompanyProfile /></ProtectedRoute>} />
        <Route path="/company/settings" element={<ProtectedRoute role="company"><CompanySettings /></ProtectedRoute>} />

        {/* Admin nested routes (protected) */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="conventions" element={<AdminConventions />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="students/:id" element={<AdminUserDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="companies/:id" element={<AdminUserDetail />} />
          <Route path="emails" element={<AdminEmails />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);