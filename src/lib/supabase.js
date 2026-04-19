import { createClient } from '@supabase/supabase-js';

const isE2EMode = import.meta.env.VITE_E2E === 'true';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if ((!supabaseUrl || !supabaseAnonKey) && !isE2EMode) {
  throw new Error('Configuration Supabase manquante: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis.');
}

export const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseAnonKey || 'e2e-anon-key',
);
