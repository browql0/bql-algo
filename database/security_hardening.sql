-- ============================================================
-- SECURITY HARDENING: roles, profile writes, and lesson secrets
-- Run this in Supabase SQL editor after database/migration_admin.sql
-- and database/seed_courses.sql.
-- ============================================================

-- 1. Admin checks must be server-side and role-based only.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. New users must never become admin because their email contains "admin".
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'Utilisateur BQL'
    ),
    'user'
  );
  RETURN NEW;
END;
$$;

-- If this helper exists, it must not be callable from the browser.
DO $$
BEGIN
  IF to_regprocedure('public.promote_to_admin(text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.promote_to_admin(TEXT) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 3. Users may update only harmless profile fields.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs modifient leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Users update own editable profile fields" ON public.profiles;
CREATE POLICY "Users update own editable profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url, last_active_at)
ON public.profiles
TO authenticated;

DROP POLICY IF EXISTS "Les admins voient tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 4. Lesson answers and hidden tests belong outside the public lesson surface.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.lesson_secrets (
  lesson_id UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  solution TEXT,
  expected_output TEXT,
  test_cases JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE private.lesson_secrets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lessons'
      AND column_name = 'solution'
  ) THEN
    EXECUTE $migrate$
      INSERT INTO private.lesson_secrets (lesson_id, solution, expected_output, test_cases)
      SELECT id, solution, expected_output, COALESCE(test_cases, '[]'::jsonb)
      FROM public.lessons
      WHERE solution IS NOT NULL
         OR expected_output IS NOT NULL
         OR (test_cases IS NOT NULL AND test_cases <> '[]'::jsonb)
      ON CONFLICT (lesson_id) DO UPDATE
      SET solution = EXCLUDED.solution,
          expected_output = EXCLUDED.expected_output,
          test_cases = EXCLUDED.test_cases,
          updated_at = NOW()
    $migrate$;
  END IF;
END $$;

-- Keep the lessons table readable, but remove browser access to answer fields.
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Les leçons sont visibles par tous" ON public.lessons;
DROP POLICY IF EXISTS "Public lessons safe read" ON public.lessons;
CREATE POLICY "Public lessons safe read"
ON public.lessons
FOR SELECT
USING (true);

REVOKE SELECT ON public.lessons FROM anon, authenticated;
GRANT SELECT (
  id,
  course_id,
  title,
  content,
  example_code,
  exercise,
  lesson_type,
  xp_value,
  "order",
  created_at
) ON public.lessons TO anon, authenticated;

-- The public lessons table must not keep answer material after migration.
ALTER TABLE public.lessons DROP COLUMN IF EXISTS solution;
ALTER TABLE public.lessons DROP COLUMN IF EXISTS expected_output;
ALTER TABLE public.lessons DROP COLUMN IF EXISTS test_cases;

-- No client should read or write private lesson secrets directly.
REVOKE ALL ON private.lesson_secrets FROM PUBLIC, anon, authenticated;

-- 5. Browser progress is allowed only for non-exercise lessons.
-- Exercise/challenge completion must be awarded by the trusted submission endpoint.
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insérer propre progression" ON public.user_progress;
DROP POLICY IF EXISTS "Mettre à jour propre progression" ON public.user_progress;
DROP POLICY IF EXISTS "Users insert own non-challenge progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users update own non-challenge progress" ON public.user_progress;

CREATE POLICY "Users insert own non-challenge progress"
ON public.user_progress
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.lessons
    WHERE lessons.id = lesson_id
      AND COALESCE(lessons.lesson_type, 'generic') NOT IN ('exercice', 'challenge')
  )
);

CREATE POLICY "Users update own non-challenge progress"
ON public.user_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.lessons
    WHERE lessons.id = lesson_id
      AND COALESCE(lessons.lesson_type, 'generic') NOT IN ('exercice', 'challenge')
  )
);

-- 6. Attempts are written by the submission endpoint. Admin reads stay role-based.
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateurs insèrent leurs essais" ON public.exercise_attempts;
DROP POLICY IF EXISTS "Admins voient tous les essais" ON public.exercise_attempts;
DROP POLICY IF EXISTS "Admins read all exercise attempts" ON public.exercise_attempts;
CREATE POLICY "Admins read all exercise attempts"
ON public.exercise_attempts
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Manual follow-up after running this migration:
-- audit existing rows where role = 'admin'. Older migrations may already have
-- promoted accounts whose email contained "admin".
