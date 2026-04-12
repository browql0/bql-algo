import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// AuthContext — source de vérité unique pour l'état d'authentification
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  // `loading` est true jusqu'à ce que Supabase ait répondu au moins une fois.
  // Empêche tout flash de contenu protégé lors d'un refresh.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Récupérer la session existante au démarrage de l'app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Écouter tous les changements de session en temps réel
    //    (login, logout, token refresh, expiration)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // Si la session a été vérifiée au moins une fois, on ne reload plus
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Valeurs exposées dans tout l'arbre React
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook custom — usage : const { user, loading, isAuthenticated } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un <AuthProvider>');
  }
  return context;
};
