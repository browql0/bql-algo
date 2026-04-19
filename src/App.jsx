import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import AuthLayout from './components/auth/AuthLayout';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import AdminRoute from './components/auth/AdminRoute';

const EditorLayout = lazy(() => import('./components/editor/EditorLayout'));
const CoursePage = lazy(() => import('./components/cours/CoursePage'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/admin/pages/AdminUsers'));
const AdminAnalytics = lazy(() => import('./components/admin/pages/AdminAnalytics'));
const AdminCourses = lazy(() => import('./components/admin/pages/AdminCourses'));
const AdminActivity = lazy(() => import('./components/admin/pages/AdminActivity'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));

const RouteFallback = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050816', color: '#e5e7eb' }}>
    Chargement...
  </div>
);

const App = () => {
  const navigate = useNavigate();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage onStart={() => navigate('/editor')} />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

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
          <Route path="courses" element={<AdminCourses />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="activity" element={<AdminActivity />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
