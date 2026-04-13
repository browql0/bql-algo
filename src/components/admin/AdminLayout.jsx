import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, Activity, LogOut, Code2 } from 'lucide-react';
import './Admin.css';

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Force l'injection de classe dark mode générique sur le body si nécessaire
  useEffect(() => {
    document.body.classList.add('admin-body-override');
    return () => {
      document.body.classList.remove('admin-body-override');
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Code2 size={24} color="#3b82f6" />
          <span>BQL Admin</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>Utilisateurs</span>
          </NavLink>
          <NavLink to="/admin/analytics" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={20} />
            <span>Statistiques</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Quitter
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-title">
            Tableau de Bord
          </div>
          <div className="admin-header-actions">
            <div className="admin-profile">
              <div className="admin-avatar">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-sub)' }}>
                {user?.email || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Content routing */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
