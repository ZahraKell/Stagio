import React, { useState } from 'react';
import { Search, Star, Filter, BookOpen } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

const allCourses = [
    { id: 1, title: 'React - The Complete Guide', platform: 'Udemy', rating: 4.8, image: 'https://picsum.photos/id/0/200/150', category: 'Web Development', level: 'Intermediate', duration: '40h' },
    { id: 2, title: 'Python for Data Science', platform: 'Coursera', rating: 4.7, image: 'https://picsum.photos/id/21/200/150', category: 'Data Science', level: 'Beginner', duration: '30h' },
    { id: 3, title: 'UI/UX Design Fundamentals', platform: 'Skillshare', rating: 4.6, image: 'https://picsum.photos/id/24/200/150', category: 'Design', level: 'Beginner', duration: '12h' },
    { id: 4, title: 'Node.js Backend Masterclass', platform: 'Udemy', rating: 4.9, image: 'https://picsum.photos/id/1/200/150', category: 'Web Development', level: 'Advanced', duration: '50h' },
    { id: 5, title: 'Machine Learning A-Z', platform: 'Coursera', rating: 4.8, image: 'https://picsum.photos/id/25/200/150', category: 'Data Science', level: 'Advanced', duration: '60h' },
    { id: 6, title: 'Figma for Beginners', platform: 'Skillshare', rating: 4.5, image: 'https://picsum.photos/id/26/200/150', category: 'Design', level: 'Beginner', duration: '8h' },
];

const CoursesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const categories = ['All', 'Web Development', 'Data Science', 'Design'];

    const filteredCourses = allCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleEnroll = (courseTitle: string) => {
        toast.success(`You have enrolled in "${courseTitle}"!`);
    };

    return (
        <DashboardLayout pageTitle="Courses">
            {/* Hero Section */}
            <div className="page-hero courses-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>Boost Your Skills</h1>
                    <p>Explore curated courses from top platforms and start learning today.</p>
                </div>
            </div>

            <div className="courses-container">
                <div className="filters-bar">
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <Filter size={16} />
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="courses-grid">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="course-card">
                            <img src={course.image} alt={course.title} className="course-image" />
                            <div className="course-details">
                                <h4>{course.title}</h4>
                                <p className="platform">{course.platform}</p>
                                <div className="rating">
                                    <Star size={14} fill="#f5b042" color="#f5b042" />
                                    <span>{course.rating}</span>
                                </div>
                                <div className="course-meta">
                                    <span className="category">{course.category}</span>
                                    <span className="level">{course.level}</span>
                                    <span className="duration">{course.duration}</span>
                                </div>
                                <button className="enroll-btn" onClick={() => handleEnroll(course.title)}>Enroll Now</button>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredCourses.length === 0 && <div className="no-results">No courses match your filters.</div>}
            </div>
        </DashboardLayout>
    );
};

export default CoursesPage;