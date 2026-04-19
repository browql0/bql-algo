import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { e2eUser, isE2EMode } from '../lib/e2eFixtures';
import { AuthContext } from './AuthContextCore';

// -----------------------------------------------------------------------------
// AuthContext ? source de vérité unique pour l'état d'authentification
// -----------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => (isE2EMode ?e2eUser : null));
  // `loading` est true jusqu'à ce que Supabase ait répondu au moins une fois.
  // Empêche tout flash de contenu protégé lors d'un refresh.
  const [loading, setLoading] = useState(() => !isE2EMode);

  useEffect(() => {
    if (isE2EMode) {
      return undefined;
    }

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

      if (error) {
        console.warn('Impossible de charger le profil utilisateur:', error.message);
      }

      const isAdminReal = profile?.role === 'admin';

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
    signOut: () => (isE2EMode ?Promise.resolve() : supabase.auth.signOut()),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


