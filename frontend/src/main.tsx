import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./HomePage";
import ContactPage from "./ContactPage";
import AboutPage from "./AboutPage";
import AuthPage from "./AuthPage";
import ForgotPasswordPage from "./ForgotPasswordPage";   // ← ADD THIS
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
import ADMReports from './Administration/ADMReports';
import PrivateRoute from "./PrivateRoute";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<><Header /><HomePage /><Footer /></>} />
        <Route path="/contact" element={<><Header /><ContactPage /><Footer /></>} />
        <Route path="/about" element={<><Header /><AboutPage /><Footer /></>} />
        <Route path="/offers" element={<><Header /><OffersPage /><Footer /></>} />
        <Route path="/FAQ" element={<><Header /><FAQpage /><Footer /></>} />
        <Route path="/Blog" element={<><Header /><Blogpage /><Footer /></>} />
        <Route path="/Companies" element={<><Header /><Companiespage /><Footer /></>} />
        <Route path="/Testimonials" element={<><Header /><Testimonialspage /><Footer /></>} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/login/roles" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />  {/* ← ADD THIS */}

        <Route path="/student" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/courses" element={<PrivateRoute role="student"><CoursesPage /></PrivateRoute>} />
        <Route path="/student/applications" element={<PrivateRoute role="student"><MyApplicationsPage /></PrivateRoute>} />
        <Route path="/student/cv" element={<PrivateRoute role="student"><MyCv /></PrivateRoute>} />
        <Route path="/student/profile" element={<PrivateRoute role="student"><Profile /></PrivateRoute>} />
        <Route path="/student/settings" element={<PrivateRoute role="student"><SettingsPage /></PrivateRoute>} />
        <Route path="/student/help" element={<PrivateRoute role="student"><HelpCenterPage /></PrivateRoute>} />

        <Route path="/company" element={<PrivateRoute role="company"><CompanyHome /></PrivateRoute>} />
        <Route path="/company/dashboard" element={<PrivateRoute role="company"><CompanyHome /></PrivateRoute>} />
        <Route path="/company/offers" element={<PrivateRoute role="company"><CompanyOffers /></PrivateRoute>} />
        <Route path="/company/offers/:id" element={<PrivateRoute role="company"><CompanyDetails /></PrivateRoute>} />
        <Route path="/company/offers/new" element={<PrivateRoute role="company"><CreateOffer /></PrivateRoute>} />
        <Route path="/company/interns" element={<PrivateRoute role="company"><MyInterns /></PrivateRoute>} />
        <Route path="/company/cvs" element={<PrivateRoute role="company"><DiscoverCVs /></PrivateRoute>} />
        <Route path="/company/profile" element={<PrivateRoute role="company"><CompanyProfile /></PrivateRoute>} />
        <Route path="/company/settings" element={<PrivateRoute role="company"><CompanySettings /></PrivateRoute>} />

        <Route path="/administration" element={<PrivateRoute role="administration"><ADMdashboard /></PrivateRoute>} />
        <Route path="/administration/profile" element={<PrivateRoute role="administration"><ADMProfile /></PrivateRoute>} />
        <Route path="/administration/offers" element={<PrivateRoute role="administration"><ADMOfferspage /></PrivateRoute>} />
        <Route path="/administration/conventions" element={<PrivateRoute role="administration"><ConventionsPage /></PrivateRoute>} />
        <Route path="/administration/students" element={<PrivateRoute role="administration"><ADMStudentpage /></PrivateRoute>} />
        <Route path="/administration/applications" element={<PrivateRoute role="administration"><ADMAplicationspage /></PrivateRoute>} />
        <Route path="/administration/companies" element={<PrivateRoute role="administration"><ADMCompaniesPage /></PrivateRoute>} />
        <Route path="/administration/settings" element={<PrivateRoute role="administration"><SettingsPage /></PrivateRoute>} />
        <Route path="/administration/reports" element={<PrivateRoute role="administration"><ADMReports /></PrivateRoute>} />
        <Route path="/administration/help" element={<PrivateRoute role="administration"><HelpCenterPage /></PrivateRoute>} />

        <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);