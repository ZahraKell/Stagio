import { Link } from "react-router-dom";
import { GraduationCap, Shield } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="login-page">
            <div className="login-wrap">
                <div className="login-head">
                    <h1>Welcome to Stag.io</h1>
                    <p>Choose how you want to continue</p>
                </div>

                <div className="login-cards">
                    <Link to="/dashboard" className="login-card login-card-student">
                        <div className="login-card-icon">
                            <GraduationCap size={36} />
                        </div>
                        <h2>Student</h2>
                        <p>Browse offers, apply for internships, manage your CV</p>
                        <span className="login-card-cta">Continue as Student →</span>
                    </Link>

                    <Link to="/admin" className="login-card login-card-admin">
                        <div className="login-card-icon">
                            <Shield size={36} />
                        </div>
                        <h2>Administration</h2>
                        <p>Validate offers, manage students, sign conventions</p>
                        <span className="login-card-cta">Continue as Administrator →</span>
                    </Link>
                </div>

                <p className="login-foot">
                    Université Constantine 1 · Stag.io © 2026
                </p>
            </div>
        </div>
    );
}