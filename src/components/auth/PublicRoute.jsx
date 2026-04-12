import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

// ─────────────────────────────────────────────────────────────────────────────
// PublicRoute — routes publiques uniquement (login, signup)
//
// Comportement :
//   • Pendant la vérification → affiche un écran de chargement
//   • Utilisateur déjà connecté → redirige vers /editor (ou la destination mémorisée)
//   • Utilisateur non connecté → affiche la page normalement
// ─────────────────────────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Déjà connecté → on ne laisse pas retourner sur /login ou /signup
  if (isAuthenticated) {
    // Si on a une destination mémorisée, l'utiliser. Sinon /editor par défaut.
    const from = location.state?.from?.pathname || '/editor';
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicRoute;
