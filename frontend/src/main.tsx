import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import "@fortawesome/fontawesome-free/css/all.min.css";

// Company pages
//import CompanyHome   from "./pages/company/CompanyHome";
//import CompanyOffers from "./pages/company/CompanyOffers";

// ── Protected route ────────────────────────────────────────
function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("user_role");

  return <>{children}</>;
}

// ── Public layout — wraps only public pages ────────────────
function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ── PUBLIC PAGES — have Header + Footer ── */}
        <Route
          path="/"
          element={
            <PublicPage>
              <HomePage />
            </PublicPage>
          }
        />
        <Route
          path="/contact"
          element={
            <PublicPage>
              <ContactPage />
            </PublicPage>
          }
        />
        <Route
          path="/about"
          element={
            <PublicPage>
              <AboutPage />
            </PublicPage>
          }
        />

        {/* ── AUTH — NO Header or Footer ── */}
        <Route path="/auth" element={<AuthPage />} />

        {/* ── COMPANY ROUTES — protected, no Header/Footer ── */}
        <Route
          path="/company/dashboard"
          element={
            <ProtectedRoute role="company">
              <CompanyHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/offers"
          element={
            <ProtectedRoute role="company">
              <CompanyOffers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/offers/:id"
          element={
            <ProtectedRoute role="company">
              <CompanyDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/offers/new"
          element={
            <ProtectedRoute role="company">
              <CreateOffer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/interns"
          element={
            <ProtectedRoute role="company">
              <MyInterns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/cvs"
          element={
            <ProtectedRoute role="company">
              <DiscoverCVs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/profile"
          element={
            <ProtectedRoute role="company">
              <CompanyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/settings"
          element={
            <ProtectedRoute role="company">
              <CompanySettings />
            </ProtectedRoute>
          }
        />
        {/* ── ADMIN ROUTES — protected, no Header/Footer ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Internship Offers */}
          <Route path="offers" element={<AdminOffers />} />

          {/* Applications */}
          <Route path="applications" element={<AdminApplications />} />

          {/* Conventions */}
          <Route path="conventions" element={<AdminConventions />} />

          {/* Students */}
          <Route path="students" element={<AdminStudents />} />
          <Route path="students/:id" element={<AdminUserDetail />} />

          {/* Users Management */}
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />

          {/* Companies */}
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="companies/:id" element={<AdminUserDetail />} />

          {/* Administration Emails */}
          <Route path="emails" element={<AdminEmails />} />

          {/* Statistics */}
          <Route path="stats" element={<AdminStats />} />

          {/* Notifications */}
          <Route path="notifications" element={<AdminNotifications />} />

          {/* Settings */}
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Add more routes here as you build them */}

        {/* ── CATCH ALL ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
