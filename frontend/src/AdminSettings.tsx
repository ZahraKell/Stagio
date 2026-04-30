// src/AdminSettings.tsx
import { useState } from "react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    displayLanguage: "Français",
    timezone: "Africa/Algiers (UTC+1)",
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: false,
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = () => {
    setSuccessMsg("Settings saved successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "settings", label: "Settings", icon: "⚙️" },
    { key: "privacy", label: "Privacy", icon: "🔒" },
    { key: "help", label: "Help Center", icon: "❓" },
  ];

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Account Settings</h1>
          <p className="am-page-sub">Manage your language, region and account preferences</p>
        </div>
      </div>

      {successMsg && (
        <div className="am-success-msg">
          <span>✅</span> {successMsg}
        </div>
      )}

      <div className="am-settings-layout">
        {/* Tabs */}
        <div className="am-settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`am-settings-tab ${activeTab === tab.key ? "am-settings-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="am-settings-content">
          {activeTab === "profile" && (
            <div className="am-settings-section">
              <h3>Profile Information</h3>
              <div className="am-form-grid-2">
                <div className="am-form-group">
                  <label>First Name</label>
                  <input type="text" defaultValue="Admin" />
                </div>
                <div className="am-form-group">
                  <label>Last Name</label>
                  <input type="text" defaultValue="User" />
                </div>
                <div className="am-form-group">
                  <label>Email</label>
                  <input type="email" defaultValue="admin@stageconnect.dz" />
                </div>
                <div className="am-form-group">
                  <label>Phone</label>
                  <input type="tel" defaultValue="+213 555 123456" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="am-settings-section">
              <h3>Preferences</h3>
              
              <div className="am-settings-field">
                <label>Display Language</label>
                <select
                  value={settings.displayLanguage}
                  onChange={e => setSettings({ ...settings, displayLanguage: e.target.value })}
                >
                  <option>Français</option>
                  <option>English</option>
                  <option>العربية</option>
                </select>
              </div>

              <div className="am-settings-field">
                <label>Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                >
                  <option>Africa/Algiers (UTC+1)</option>
                  <option>Europe/Paris (UTC+1)</option>
                  <option>Europe/London (UTC+0)</option>
                </select>
              </div>

              <h3 style={{ marginTop: "1.5rem" }}>Notifications</h3>

              <div className="am-settings-toggle">
                <div>
                  <strong>Email Notifications</strong>
                  <span>Receive email notifications for important updates</span>
                </div>
                <label className="am-toggle">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  />
                  <span className="am-toggle-slider" />
                </label>
              </div>

              <div className="am-settings-toggle">
                <div>
                  <strong>Push Notifications</strong>
                  <span>Receive push notifications in your browser</span>
                </div>
                <label className="am-toggle">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={e => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  />
                  <span className="am-toggle-slider" />
                </label>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="am-settings-section">
              <h3>Privacy & Security</h3>

              <div className="am-settings-toggle">
                <div>
                  <strong>Two-Factor Authentication</strong>
                  <span>Add an extra layer of security to your account</span>
                </div>
                <label className="am-toggle">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={e => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                  />
                  <span className="am-toggle-slider" />
                </label>
              </div>

              <div className="am-settings-info-box">
                <span>🔒</span>
                <p>Your data is encrypted and stored securely. Only authorized administrators have access to the admin panel.</p>
              </div>
            </div>
          )}

          {activeTab === "help" && (
            <div className="am-settings-section">
              <h3>Help Center</h3>
              <div className="am-help-list">
                <a href="#" className="am-help-item">
                  <span>📖</span>
                  <div>
                    <strong>Documentation</strong>
                    <span>View the complete admin documentation</span>
                  </div>
                </a>
                <a href="#" className="am-help-item">
                  <span>📧</span>
                  <div>
                    <strong>Contact Support</strong>
                    <span>support@stageconnect.dz</span>
                  </div>
                </a>
                <a href="#" className="am-help-item">
                  <span>🐛</span>
                  <div>
                    <strong>Report a Bug</strong>
                    <span>Found an issue? Let us know</span>
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="am-danger-zone">
            <h3>⚠️ Danger Zone</h3>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
            <button className="am-btn-danger">Delete Account</button>
          </div>

          <div className="am-form-actions">
            <button onClick={handleSave} className="am-btn-save-settings">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}