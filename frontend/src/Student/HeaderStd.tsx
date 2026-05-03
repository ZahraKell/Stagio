import React from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';

interface HeaderStdProps {
    onMenuClick: () => void;
}

const HeaderStd: React.FC<HeaderStdProps> = ({ onMenuClick }) => {
    return (
        <header className="dashboard-header">
            <div className="header-left">
                <button className="menu-toggle" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
                <div className="search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search..." />
                </div>
            </div>
            <div className="header-actions">
                <button className="icon-btn"><Bell size={20} /></button>
                <div className="user-profile">
                    <User size={20} />
                    <span>Irham Muhammad Shidiq</span>
                </div>
            </div>
        </header>
    );
};

export default HeaderStd;