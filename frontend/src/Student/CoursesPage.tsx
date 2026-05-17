import React, { useEffect, useState } from "react";
import { Search, BookOpen, ExternalLink, Play } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api";
import toast from "react-hot-toast";

interface YTCourse {
  skill: string;
  title: string;
  channel: string;
  thumbnail: string;
  video_id: string;
  url: string;
}

interface DBCourse {
  id: number;
  title: string;
  description: string;
  link: string;
}

type CourseMode = "youtube" | "db";

function unwrapList<T>(res: { data: unknown }): T[] {
  const body = res.data as { data?: T[]; error?: boolean };
  if (body?.error === true) return [];
  return body?.data ?? [];
}

const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [ytCourses, setYtCourses] = useState<YTCourse[]>([]);
  const [dbCourses, setDbCourses] = useState<DBCourse[]>([]);
  const [mode, setMode] = useState<CourseMode>("youtube");
  const [loading, setLoading] = useState(true);
  const [noApiKey, setNoApiKey] = useState(false);
  const [noSkills, setNoSkills] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("courses/recommended/");
        const body = res.data as { error?: boolean; message?: string; data?: YTCourse[] };
        if (body?.message?.toLowerCase().includes("not configured")) {
          setNoApiKey(true);
        } else if (body?.message?.toLowerCase().includes("add skills")) {
          setNoSkills(true);
        }
        const list = body?.data ?? [];
        if (list.length > 0) {
          setYtCourses(list);
          setMode("youtube");
          setLoading(false);
          return;
        }
      } catch {
        // fall through to DB courses
      }

      try {
        const res = await api.get("courses/");
        setDbCourses(unwrapList<DBCourse>(res));
        setMode("db");
      } catch {
        toast.error("Could not load courses.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredYT = ytCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDB = dbCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const skills = [...new Set(filteredYT.map((c) => c.skill))];

  return (
    <DashboardLayout pageTitle="Courses">
      <div className="page-hero courses-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Learning Resources</h1>
          <p>
            {mode === "youtube"
              ? "Personalized course recommendations based on your CV skills."
              : "Courses provided by your institution."}
          </p>
        </div>
      </div>

      <div className="courses-container">
        <div className="filters-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search courses…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && <p style={{ padding: 16 }}>Loading courses…</p>}

        {!loading && noApiKey && (
          <div
            className="card"
            style={{
              margin: "16px 0",
              padding: 16,
              background: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <strong>⚠️ YouTube API not configured.</strong> Contact your administrator to
            enable course recommendations.
          </div>
        )}

        {!loading && noSkills && !noApiKey && (
          <div
            className="card"
            style={{
              margin: "16px 0",
              padding: 16,
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
            }}
          >
            <strong>💡 Add skills to your CV</strong> to get personalized YouTube course
            recommendations.
          </div>
        )}

        {!loading && mode === "youtube" && filteredYT.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {skills.map((skill) => (
              <div key={skill}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    paddingBottom: 8,
                    borderBottom: "2px solid #f57da9",
                  }}
                >
                  <Play size={16} color="#ef4444" fill="#ef4444" />
                  <h3
                    style={{
                      fontFamily: "Epilogue, sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {skill}
                  </h3>
                  <span
                    style={{
                      fontSize: 12,
                      background: "#f1f5f9",
                      padding: "2px 10px",
                      borderRadius: 20,
                      color: "#64748b",
                    }}
                  >
                    {filteredYT.filter((c) => c.skill === skill).length} videos
                  </span>
                </div>

                <div className="courses-grid">
                  {filteredYT
                    .filter((c) => c.skill === skill)
                    .map((course) => (
                      <a
                        key={course.video_id}
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          className="course-card"
                          style={{
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            height: "100%",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "translateY(-3px)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "translateY(0)")
                          }
                        >
                          {/* Thumbnail */}
                          <div
                            style={{
                              position: "relative",
                              overflow: "hidden",
                              borderRadius: "12px 12px 0 0",
                            }}
                          >
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              style={{
                                width: "100%",
                                height: 160,
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                background: "#ef4444",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 20,
                              }}
                            >
                              YouTube
                            </span>
                          </div>

                          {/* Card body */}
                          <div
                            className="course-details"
                            style={{ padding: "12px 14px 14px" }}
                          >
                            <h4
                              style={{
                                fontSize: 13.5,
                                fontWeight: 700,
                                lineHeight: 1.4,
                                marginBottom: 6,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {course.title}
                            </h4>
                            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                              📺 {course.channel}
                            </p>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#ef4444",
                              }}
                            >
                              <ExternalLink size={12} /> Watch on YouTube
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && mode === "db" && (
          <div className="courses-grid">
            {filteredDB.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-details">
                  <h4>
                    <BookOpen
                      size={16}
                      style={{
                        display: "inline",
                        marginRight: 6,
                        verticalAlign: "text-bottom",
                      }}
                    />
                    {course.title}
                  </h4>
                  {course.description && (
                    <p className="platform">{course.description}</p>
                  )}
                  <a
                    className="enroll-btn"
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink
                      size={14}
                      style={{ display: "inline", marginRight: 6 }}
                    />
                    Open link
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading &&
          filteredYT.length === 0 &&
          filteredDB.length === 0 &&
          !noApiKey &&
          !noSkills && <div className="no-results">No courses match your search.</div>}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;