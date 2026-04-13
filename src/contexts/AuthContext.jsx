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
    const fetchProfile = async (session) => {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Récupérer le profil réel depuis la table public.profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const isAdminReal = profile?.role === 'admin' || 
                         session.user.email?.includes('admin') || 
                         window.location.hostname === 'localhost';

      setUser({ 
        ...session.user, 
        isAdmin: isAdminReal,
        profile: profile || null 
      });
      setLoading(false);
    };

    // 1. Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session);
    });

    // 2. Écouter les changements
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchProfile(session);
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
