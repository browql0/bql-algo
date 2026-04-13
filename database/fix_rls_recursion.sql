-- ============================================================
-- CORRECTIF : INFINITE RECURSION RLS
-- À exécuter dans l'éditeur SQL de Supabase (Console)
-- ============================================================

-- 1. Créer une fonction de vérification d'admin "Security Definer"
-- Cela permet d'outrepasser le RLS pour vérifier le rôle sans créer de boucle.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Mise à jour des politiques de la table 'profiles'
DROP POLICY IF EXISTS "Les admins voient tous les profils" ON public.profiles;
CREATE POLICY "Les admins voient tous les profils" 
ON public.profiles FOR SELECT 
USING ( public.is_admin() );

-- 3. Mise à jour des politiques de la table 'exercise_attempts'
DROP POLICY IF EXISTS "Admins voient tous les essais" ON public.exercise_attempts;
CREATE POLICY "Admins voient tous les essais" 
ON public.exercise_attempts FOR SELECT 
USING ( public.is_admin() );

-- 4. (Utilitaire) S'assurer que votre profil est admin si ce n'est pas déjà le cas
-- Remplacez 'votre-email@exemple.com' par votre vrai email si besoin.
-- SELECT promote_to_admin('votre-email@exemple.com');
