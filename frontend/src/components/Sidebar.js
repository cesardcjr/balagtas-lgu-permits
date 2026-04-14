import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const NavItem = ({ to, icon, label, badge, onClick }) => {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/dashboard' && to !== '/admin' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="icon">{icon}</span>
      <span>{label}</span>
      {badge > 0 && <span className="badge">{badge}</span>}
    </Link>
  );
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const load = () => axios.get('/api/messages/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const userNav = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/apply', icon: '📝', label: 'Apply for Permit' },
    { to: '/my-permits', icon: '📋', label: 'My Applications' },
    { to: '/inbox', icon: '✉️', label: 'Messages', badge: unread },
  ];

  const adminNav = [
    { to: '/admin', icon: '📊', label: 'Dashboard' },
    { to: '/admin/permits', icon: '📋', label: 'All Applications' },
    { to: '/admin/inbox', icon: '✉️', label: 'Inbox', badge: unread },
  ];

  const navItems = user?.role === 'admin' ? adminNav : userNav;
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-logo">
          <div className="emblem">B</div>
          <span>Balagtas e-Permit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          {unread > 0 && <div className="mobile-unread-badge">{unread}</div>}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
        </div>
      </div>

      {/* Overlay */}
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={closeMobile} />

      {/* Sidebar */}
      <div className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-emblem">B</div>
          <div className="sidebar-logo-text">
            <h2>Municipality of Balagtas</h2>
            <p>e-Permit System</p>
          </div>
          <button className="sidebar-close-btn" onClick={closeMobile}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">{user?.role === 'admin' ? 'Administration' : 'Navigation'}</div>
          {navItems.map(item => (
            <NavItem key={item.to} {...item} onClick={closeMobile} />
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.fullName}</div>
              <div className="user-email">{user?.role === 'admin' ? '👑 Administrator' : user?.email}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={() => { logout(); closeMobile(); }}>🚪 Sign Out</button>
        </div>
      </div>
    </>
  );
}
