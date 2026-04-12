import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — garde les routes privées (ex : /editor)
//
// Comportement :
//   • Pendant la vérification de session → affiche un écran de chargement
//     (évite le flash de contenu protégé)
//   • Utilisateur non connecté → redirige vers /login
//     et mémorise l'URL d'origine dans `state.from` pour rediriger après login
//   • Utilisateur connecté → affiche les enfants normalement
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Phase de vérification — on ne montre rien jusqu'à la réponse Supabase
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Non authentifié → redirection vers login avec mémorisation de la page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authentifié → afficher la page protégée
  return children;
};

export default ProtectedRoute;
