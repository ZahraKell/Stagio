import React, { useEffect, useState } from "react";
import { Search, BookOpen, ExternalLink } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api";
import toast from "react-hot-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  link: string;
}

function unwrapList(res: { data: unknown }): Course[] {
  const body = res.data as { data?: Course[] };
  return body?.data ?? [];
}

const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("courses/");
        setCourses(unwrapList(res));
      } catch {
        toast.error("Could not load courses.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="Courses">
      <div className="page-hero courses-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Learning resources</h1>
          <p>Courses are provided by your institution via the API.</p>
        </div>
      </div>

      <div className="courses-container">
        <div className="filters-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 16 }}>Loading courses…</p>
        ) : (
          <div className="courses-grid">
            {filtered.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-details">
                  <h4>
                    <BookOpen size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
                    {course.title}
                  </h4>
                  {course.description && <p className="platform">{course.description}</p>}
                  <a className="enroll-btn" href={course.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} style={{ display: "inline", marginRight: 6 }} />
                    Open link
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && <div className="no-results">No courses match your search.</div>}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;
