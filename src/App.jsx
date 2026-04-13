import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import EditorLayout from './components/editor/EditorLayout';
import AuthLayout from './components/auth/AuthLayout';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import CoursePage from './components/cours/CoursePage';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/pages/AdminDashboard';
import AdminUsers from './components/admin/pages/AdminUsers';
import AdminAnalytics from './components/admin/pages/AdminAnalytics';
const App = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* ── Routes publiques ─────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage onStart={() => navigate('/editor')} />} />

      {/* Login & SignUp : si l'user est déjà connecté, redirige vers /editor */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
      </Route>

      {/* ── Routes privées ────────────────────────────────────────────── */}
      {/* L'éditeur est totalement protégé — accès impossible sans session */}
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <EditorLayout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cours"
        element={
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        }
      />

      {/* ── Routes Administrateur ───────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* ── Fallback : toute URL inconnue → accueil ─────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
