// src/CompanySettings.tsx
import { useNavigate } from "react-router-dom";
import SettingsLayout from "../components/SettingsLayout";

export default function CompanySettings() {
  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  return (
    <SettingsLayout
      role="company"
      userData={userData}
      onLogout={handleLogout}
    />
  );
}
