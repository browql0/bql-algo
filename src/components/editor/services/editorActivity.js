import { supabase } from '../../../lib/supabase';

export const updateLastActiveAt = (user) => {
  if (!user) return;
  supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', user.id)
    .then();
};
