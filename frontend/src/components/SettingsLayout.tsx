// src/components/SettingsLayout.tsx
import { useState } from "react";

interface SettingsProps {
  role: "admin" | "company";
  userData?: {
    full_name?: string;
    email?: string;
    pnum?: string;
    company_name?: string;
    company_sector?: string;
    town?: string;
  };
  onSave?: (data: any) => void;
  onLogout?: () => void;
}

export default function SettingsLayout({ role, userData, onSave, onLogout }: SettingsProps) {
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
    if (onSave) onSave(settings);
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
          <p className="am-page-sub">Manage your {role === "admin" ? "admin" : "company"} account preferences</p>
        </div>
      </div>

      {successMsg && (
        <div className="am-success-msg"><span>✅</span> {successMsg}</div>
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
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="am-settings-section">
              <h3>Profile Information</h3>
              <div className="am-form-grid-2">
                {role === "company" ? (
                  <>
                    <div className="am-form-group">
                      <label>Company Name</label>
                      <input type="text" defaultValue={userData?.company_name || ""} />
                    </div>
                    <div className="am-form-group">
                      <label>Sector</label>
                      <input type="text" defaultValue={userData?.company_sector || ""} />
                    </div>
                    <div className="am-form-group">
                      <label>Contact Email</label>
                      <input type="email" defaultValue={userData?.email || ""} />
                    </div>
                    <div className="am-form-group">
                      <label>Phone</label>
                      <input type="tel" defaultValue={userData?.pnum || ""} />
                    </div>
                    <div className="am-form-group">
                      <label>City</label>
                      <input type="text" defaultValue={userData?.town || ""} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="am-form-group">
                      <label>Full Name</label>
                      <input type="text" defaultValue={userData?.full_name || "Admin"} />
                    </div>
                    <div className="am-form-group">
                      <label>Email</label>
                      <input type="email" defaultValue={userData?.email || "admin@stageconnect.dz"} />
                    </div>
                    <div className="am-form-group">
                      <label>Phone</label>
                      <input type="tel" defaultValue={userData?.pnum || ""} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="am-settings-section">
              <h3>Preferences</h3>
              <div className="am-settings-field">
                <label>Display Language</label>
                <select value={settings.displayLanguage} onChange={e => setSettings({ ...settings, displayLanguage: e.target.value })}>
                  <option>Français</option>
                  <option>English</option>
                  <option>العربية</option>
                </select>
              </div>
              <div className="am-settings-field">
                <label>Timezone</label>
                <select value={settings.timezone} onChange={e => setSettings({ ...settings, timezone: e.target.value })}>
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
                  <input type="checkbox" checked={settings.emailNotifications} onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })} />
                  <span className="am-toggle-slider" />
                </label>
              </div>
              <div className="am-settings-toggle">
                <div>
                  <strong>Push Notifications</strong>
                  <span>Receive push notifications in your browser</span>
                </div>
                <label className="am-toggle">
                  <input type="checkbox" checked={settings.pushNotifications} onChange={e => setSettings({ ...settings, pushNotifications: e.target.checked })} />
                  <span className="am-toggle-slider" />
                </label>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="am-settings-section">
              <h3>Privacy & Security</h3>
              <div className="am-settings-toggle">
                <div>
                  <strong>Two-Factor Authentication</strong>
                  <span>Add an extra layer of security to your account</span>
                </div>
                <label className="am-toggle">
                  <input type="checkbox" checked={settings.twoFactorAuth} onChange={e => setSettings({ ...settings, twoFactorAuth: e.target.checked })} />
                  <span className="am-toggle-slider" />
                </label>
              </div>
              <div className="am-settings-info-box">
                <span>🔒</span>
                <p>Your data is encrypted and stored securely. Only authorized {role === "admin" ? "administrators" : "personnel"} have access to this account.</p>
              </div>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === "help" && (
            <div className="am-settings-section">
              <h3>Help Center</h3>
              <div className="am-help-list">
                <a href="#" className="am-help-item">
                  <span>📖</span>
                  <div><strong>Documentation</strong><span>View the complete documentation</span></div>
                </a>
                <a href="#" className="am-help-item">
                  <span>📧</span>
                  <div><strong>Contact Support</strong><span>support@stageconnect.dz</span></div>
                </a>
                <a href="#" className="am-help-item">
                  <span>🐛</span>
                  <div><strong>Report a Bug</strong><span>Found an issue? Let us know</span></div>
                </a>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="am-danger-zone">
            <h3>⚠️ Danger Zone</h3>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
            <button className="am-btn-danger" onClick={onLogout}>Delete Account</button>
          </div>

          <div className="am-form-actions">
            <button onClick={handleSave} className="am-btn-save-settings">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}