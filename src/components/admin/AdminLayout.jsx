import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import {
  Activity,
  BarChart3,
  BookOpen,
  Code2,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import './Admin.css';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, description: 'Vue globale' },
  { to: '/admin/users', label: 'Users', icon: Users, description: 'Comptes et progression' },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen, description: 'Cours et challenges' },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, description: 'Blocages pedagogiques' },
  { to: '/admin/activity', label: 'Activity', icon: Activity, description: 'Journal recent' },
];

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-body-override');
    return () => {
      document.body.classList.remove('admin-body-override');
    };
  }, []);

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => location.pathname.startsWith(item.to)) || NAV_ITEMS[0],
    [location.pathname],
  );

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const sidebar = (
    <aside className={`admin-sidebar ${mobileOpen ?'open' : ''}`}>
      <div className="admin-brand">
        <Code2 size={22} />
        <div>
          <span>BQL Admin</span>
          <small>Control panel</small>
        </div>
      </div>

      <nav className="admin-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `admin-nav-item ${isActive ?'active' : ''}`}
            >
              <Icon size={19} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <div className="admin-avatar">
            {user?.email ?user.email.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <strong>Admin</strong>
            <span>{user?.email || 'Compte administrateur'}</span>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Quitter
        </button>
      </div>
    </aside>
  );

  return (
    <div className="admin-layout">
      {mobileOpen && <button className="admin-mobile-backdrop" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}
      {sidebar}

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-mobile-menu-btn" onClick={() => setMobileOpen((value) => !value)} aria-label="Ouvrir le menu admin">
              {mobileOpen ?<X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <div className="admin-header-title">{activeItem.label}</div>
              <div className="admin-breadcrumb">Admin / {activeItem.description}</div>
            </div>
          </div>
          <div className="admin-header-actions">
            <div className="admin-profile">
              <div className="admin-avatar">
                {user?.email ?user.email.charAt(0).toUpperCase() : 'A'}
              </div>
              <span>{user?.email || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

