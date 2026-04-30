// src/AdminNotifications.tsx
import { useState } from "react";

interface Notification {
  id: number;
  message: string;
  type: "info" | "warning" | "success" | "error";
  date: string;
  read: boolean;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: "New company registration: Condor Electronics awaiting approval", type: "info", date: "5 min ago", read: false },
    { id: 2, message: "3 new internship applications pending review", type: "warning", date: "1 hour ago", read: false },
    { id: 3, message: "Convention CV-2026-078 has been validated by all parties", type: "success", date: "Yesterday", read: false },
    { id: 4, message: "Student Ahmed Benali completed his internship at Sonatrach", type: "success", date: "2 days ago", read: true },
    { id: 5, message: "Mobilis posted a new internship offer: Data Analyst", type: "info", date: "3 days ago", read: true },
    { id: 6, message: "Administration email domain @univ-boumerdes.dz was added", type: "info", date: "1 week ago", read: true },
    { id: 7, message: "System maintenance scheduled for Sunday 02:00 AM", type: "warning", date: "1 week ago", read: true },
    { id: 8, message: "Failed login attempt detected from IP 192.168.1.100", type: "error", date: "2 weeks ago", read: true },
  ]);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = filter === "all" 
    ? notifications 
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcon: Record<string, string> = {
    info: "ℹ️",
    warning: "⚠️",
    success: "✅",
    error: "❌",
  };

  const typeBadge: Record<string, string> = {
    info: "am-notif-info",
    warning: "am-notif-warning",
    success: "am-notif-success",
    error: "am-notif-error",
  };

  return (
    <div className="am-page-root">
      <div className="am-page-header">
        <div>
          <h1 className="am-page-title">Notifications</h1>
          <p className="am-page-sub">
            {unreadCount} unread • {notifications.length} total
          </p>
        </div>
        <button onClick={markAllAsRead} className="am-btn-mark-all" disabled={unreadCount === 0}>
          ✓ Mark All as Read
        </button>
      </div>

      <div className="am-tabs">
        <button className={`am-tab ${filter === "all" ? "am-tab-active" : ""}`} onClick={() => setFilter("all")}>
          All
          <span className="am-tab-count">{notifications.length}</span>
        </button>
        <button className={`am-tab ${filter === "unread" ? "am-tab-active" : ""}`} onClick={() => setFilter("unread")}>
          Unread
          <span className="am-tab-count">{unreadCount}</span>
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
          filtered.map(notif => (
            <div
              key={notif.id}
              className={`am-notif-card ${!notif.read ? "am-notif-unread" : ""}`}
              onClick={() => markAsRead(notif.id)}
            >
              <div className="am-notif-card-left">
                <span className="am-notif-type-icon">{typeIcon[notif.type]}</span>
              </div>
              <div className="am-notif-card-body">
                <p>{notif.message}</p>
                <div className="am-notif-card-meta">
                  <span className={`am-notif-type-badge ${typeBadge[notif.type]}`}>
                    {notif.type}
                  </span>
                  <span className="am-notif-date">{notif.date}</span>
                </div>
              </div>
              <div className="am-notif-card-right">
                {!notif.read && <span className="am-notif-dot-indicator" />}
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