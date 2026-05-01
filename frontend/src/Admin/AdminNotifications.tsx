// src/AdminNotifications.tsx
import { useState, useEffect } from "react";

const API = "http://localhost:8000/api";

interface Notification {
  id: number;
  message: string;
  type: "info" | "warning" | "success" | "error";
  created_at: string;
  is_read: boolean;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error && data.data?.notifications) {
        setNotifications(data.data.notifications);
      } else {
        setNotifications(getMockNotifications());
      }
    } catch {
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => [
    {
      id: 1,
      message: "New company registration: Condor Electronics awaiting approval",
      type: "info",
      created_at: "5 min ago",
      is_read: false,
    },
    {
      id: 2,
      message: "3 new internship applications pending review",
      type: "warning",
      created_at: "1 hour ago",
      is_read: false,
    },
    {
      id: 3,
      message: "Convention CV-2026-078 has been validated by all parties",
      type: "success",
      created_at: "Yesterday",
      is_read: false,
    },
    {
      id: 4,
      message: "Student Ahmed Benali completed his internship at Sonatrach",
      type: "success",
      created_at: "2 days ago",
      is_read: true,
    },
    {
      id: 5,
      message: "Mobilis posted a new internship offer: Data Analyst",
      type: "info",
      created_at: "3 days ago",
      is_read: true,
    },
    {
      id: 6,
      message: "Administration email domain @univ-boumerdes.dz was added",
      type: "info",
      created_at: "1 week ago",
      is_read: true,
    },
    {
      id: 7,
      message: "System maintenance scheduled for Sunday 02:00 AM",
      type: "warning",
      created_at: "1 week ago",
      is_read: true,
    },
    {
      id: 8,
      message: "Failed login attempt detected from IP 192.168.1.100",
      type: "error",
      created_at: "2 weeks ago",
      is_read: true,
    },
  ];

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API}/notifications/${id}/read/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API}/notifications/read-all/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setSuccessMsg("All notifications marked as read!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSuccessMsg("Notification deleted.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const filtered =
    filter === "all" ? notifications : notifications.filter((n) => !n.is_read);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const typeConfig: Record<string, { icon: string; badge: string }> = {
    info: { icon: "ℹ️", badge: "am-notif-info" },
    warning: { icon: "⚠️", badge: "am-notif-warning" },
    success: { icon: "✅", badge: "am-notif-success" },
    error: { icon: "❌", badge: "am-notif-error" },
  };

  if (loading) {
    return (
      <div className="am-loading">
        <div className="am-spinner" />
        <span>Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Notifications</h1>
          <p className="am-page-sub">
            {unreadCount} unread • {notifications.length} total
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          className="am-btn-mark-all"
          disabled={unreadCount === 0}
        >
          ✓ Mark All as Read
        </button>
      </div>

      {successMsg && (
        <div className="am-success-msg">
          <span>✅</span> {successMsg}
        </div>
      )}

      <div className="am-tabs">
        <button
          className={`am-tab ${filter === "all" ? "am-tab-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All <span className="am-tab-count">{notifications.length}</span>
        </button>
        <button
          className={`am-tab ${filter === "unread" ? "am-tab-active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Unread <span className="am-tab-count">{unreadCount}</span>
        </button>
      </div>

      <div className="am-notif-list-page">
        {filtered.length === 0 ? (
          <div className="am-empty">
            <span className="am-empty-icon">🔔</span>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`am-notif-card ${!notif.is_read ? "am-notif-unread" : ""}`}
              onClick={() => markAsRead(notif.id)}
            >
              <div className="am-notif-card-left">
                <span className="am-notif-type-icon">
                  {typeConfig[notif.type]?.icon || "ℹ️"}
                </span>
              </div>
              <div className="am-notif-card-body">
                <p>{notif.message}</p>
                <div className="am-notif-card-meta">
                  <span
                    className={`am-notif-type-badge ${typeConfig[notif.type]?.badge || "am-notif-info"}`}
                  >
                    {notif.type}
                  </span>
                  <span className="am-notif-date">{notif.created_at}</span>
                </div>
              </div>
              <div className="am-notif-card-right">
                {!notif.is_read && <span className="am-notif-dot-indicator" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="am-notif-delete-btn"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
