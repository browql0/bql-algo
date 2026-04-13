-- ============================================================
-- MIGRATION : DASHBOARD ADMIN & TRACKING UTILISATEUR
-- À exécuter dans l'éditeur SQL de Supabase (Console)
-- ============================================================

-- 1. TABLE: profiles (Extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned')),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_lessons_completed INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation RLS sur profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
DROP POLICY IF EXISTS "Les utilisateurs voient leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs voient leur propre profil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les admins voient tous les profils" ON public.profiles;
CREATE POLICY "Les admins voient tous les profils" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Les utilisateurs modifient leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs modifient leur propre profil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. TABLE: exercise_attempts (Suivi de l'activité)
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    code_submitted TEXT,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation RLS sur exercise_attempts
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour exercise_attempts
DROP POLICY IF EXISTS "Utilisateurs voient leurs essais" ON public.exercise_attempts;
CREATE POLICY "Utilisateurs voient leurs essais" 
ON public.exercise_attempts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilisateurs insèrent leurs essais" ON public.exercise_attempts;
CREATE POLICY "Utilisateurs insèrent leurs essais" 
ON public.exercise_attempts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins voient tous les essais" ON public.exercise_attempts;
CREATE POLICY "Admins voient tous les essais" 
ON public.exercise_attempts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. TRIGGER : Création automatique de profil au SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Utilisateur BQL'),
    CASE 
      WHEN NEW.email LIKE '%admin%' THEN 'admin' 
      ELSE 'user' 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. FONCTION : Promouvoir un utilisateur en Admin (Utilitaire)
-- Usage: SELECT promote_to_admin('votre-email@exemple.com');
CREATE OR REPLACE FUNCTION promote_to_admin(target_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET role = 'admin' WHERE email = target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INITIALISATION (Optionnel: remplir profiles avec les users existants)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 
CASE WHEN email LIKE '%admin%' THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;
