import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Star, Settings, LogOut, Sun, Moon, Monitor, ChevronRight, ChevronUp, Layers } from 'lucide-react';
import { api } from '../services/api';
import ServerKitLogo from './ServerKitLogo';
import { SIDEBAR_CATEGORIES, CATEGORY_LABELS, getVisibleItems } from './sidebarItems';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, resolvedTheme, setTheme, whiteLabel } = useTheme();
    const navigate = useNavigate();
    const [starAnimating, setStarAnimating] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [wpInstalled, setWpInstalled] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // Check if WordPress is installed
    useEffect(() => {
        api.getWordPressStatus()
            .then(data => setWpInstalled(!!data?.installed))
            .catch(() => setWpInstalled(false));
    }, []);

    useEffect(() => {
        if (whiteLabel.enabled) return;

        let playCount = 0;
        let timeoutId;

        const triggerAnimation = () => {
            setStarAnimating(true);
            setTimeout(() => setStarAnimating(false), 1500);
            playCount++;
        };

        const scheduleNext = () => {
            const multiplier = playCount + 1;
            const minMinutes = 8 * multiplier;
            const maxMinutes = 11 * multiplier;
            const delay = (Math.random() * (maxMinutes - minMinutes) + minMinutes) * 60 * 1000;

            timeoutId = setTimeout(() => {
                triggerAnimation();
                scheduleNext();
            }, delay);
        };

        const initialDelay = setTimeout(() => {
            triggerAnimation();
            scheduleNext();
        }, 60000);

        return () => {
            clearTimeout(initialDelay);
            clearTimeout(timeoutId);
        };
    }, [whiteLabel.enabled]);

    const conditions = { wpInstalled };

    const visibleItems = useMemo(
        () => getVisibleItems(user?.sidebar_config),
        [user?.sidebar_config]
    );

    // Group visible items by category
    const groupedItems = useMemo(() => {
        const groups = {};
        for (const cat of SIDEBAR_CATEGORIES) {
            const items = visibleItems.filter(item => item.category === cat);
            if (items.length > 0) {
                groups[cat] = items;
            }
        }
        return groups;
    }, [visibleItems]);

    const renderNavItem = (item) => (
        <React.Fragment key={item.id}>
            <NavLink
                to={item.route}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.end || false}
            >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                {item.label}
            </NavLink>
            {item.subItems?.map(sub => {
                if (sub.requiresCondition && !conditions[sub.requiresCondition]) return null;
                return (
                    <NavLink
                        key={sub.id}
                        to={sub.route}
                        className={({ isActive }) => `nav-item nav-sub-item ${isActive ? 'active' : ''}`}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            dangerouslySetInnerHTML={{ __html: sub.icon }}
                        />
                        {sub.label}
                    </NavLink>
                );
            })}
        </React.Fragment>
    );

    return (
        <aside className="sidebar">
            {whiteLabel.enabled ? (
                <div className="brand-section brand-section--custom">
                    {whiteLabel.mode === 'image_full' ? (
                        <div className="brand-custom-banner">
                            {whiteLabel.logoData ? (
                                <img src={whiteLabel.logoData} alt={whiteLabel.brandName || 'Brand'} />
                            ) : (
                                <Layers size={32} />
                            )}
                        </div>
                    ) : whiteLabel.mode === 'text_only' ? (
                        <span className="brand-custom-text">
                            {whiteLabel.brandName || 'Brand'}
                        </span>
                    ) : (
                        <>
                            <div className="brand-custom-logo">
                                {whiteLabel.logoData ? (
                                    <img src={whiteLabel.logoData} alt={whiteLabel.brandName || 'Brand'} />
                                ) : (
                                    <Layers size={20} />
                                )}
                            </div>
                            <span className="brand-custom-text">
                                {whiteLabel.brandName || 'Brand'}
                            </span>
                        </>
                    )}
                </div>
            ) : (
                <div className="brand-section">
                    <div className="brand-logo">
                        <ServerKitLogo width={42} height={42} />
                    </div>
                    <span className="brand-text">ServerKit</span>
                    <a
                        href="https://github.com/jhd3197/ServerKit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`brand-star ${starAnimating ? 'animating' : ''}`}
                        title="Star on GitHub"
                    >
                        <Star size={14} />
                        <span className="star-particles">
                            <span></span><span></span><span></span><span></span><span></span><span></span>
                        </span>
                        <span className="star-ring"></span>
                        <span className="star-ring ring-2"></span>
                        <span className="star-ring ring-3"></span>
                        <span className="star-tooltip">Star us!</span>
                    </a>
                </div>
            )}

            <div className="nav-scroll">
                {SIDEBAR_CATEGORIES.map(cat => {
                    const items = groupedItems[cat];
                    if (!items) return null;
                    return (
                        <React.Fragment key={cat}>
                            <div className="nav-category">{CATEGORY_LABELS[cat]}</div>
                            <nav className="nav">
                                {items.map(renderNavItem)}
                            </nav>
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="sidebar-footer" ref={menuRef}>
                {menuOpen && (
                    <div className="user-context-menu">
                        <div className="context-menu-section">
                            <div className="context-menu-label">Theme</div>
                            <div className="theme-switcher">
                                <button
                                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => setTheme('dark')}
                                    title="Dark"
                                >
                                    <Moon size={14} />
                                </button>
                                <button
                                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => setTheme('light')}
                                    title="Light"
                                >
                                    <Sun size={14} />
                                </button>
                                <button
                                    className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                                    onClick={() => setTheme('system')}
                                    title="System"
                                >
                                    <Monitor size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="context-menu-divider" />
                        <button
                            className="context-menu-item"
                            onClick={() => { navigate('/settings'); setMenuOpen(false); }}
                        >
                            <Settings size={15} />
                            Settings
                            <ChevronRight size={14} className="context-menu-arrow" />
                        </button>
                        <div className="context-menu-divider" />
                        <button className="context-menu-item danger" onClick={logout}>
                            <LogOut size={15} />
                            Log out
                        </button>
                    </div>
                )}
                <div className="user-mini" onClick={() => setMenuOpen(!menuOpen)}>
                    <div className="user-avatar">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-meta">
                        <span className="user-handle">{user?.username || 'User'}</span>
                        <span className="user-status">Online</span>
                    </div>
                    <ChevronUp size={14} className={`user-menu-arrow ${menuOpen ? 'open' : ''}`} />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
