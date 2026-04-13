import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="loader"></div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est connecté et s'il est administrateur
  if (!user || user.isAdmin !== true) {
    // Redirige vers /editor (ou accueil) si pas admin
    return <Navigate to="/editor" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
