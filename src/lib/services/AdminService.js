import { supabase } from '../supabase';

class AdminService {
  /**
   * Récupère la liste des utilisateurs réels depuis la table profiles.
   */
  static async fetchUsers(page = 1, limit = 10, search = '') {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  /**
   * Statistiques réelles agrégées.
   */
  static async getGlobalStats() {
    // 1. Total Utilisateurs
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    // 2. Utilisateurs actifs (dernières 24h)
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { count: activeToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('last_active_at', yesterday);

    // 3. Total Leçons complétées
    const { count: totalLessons } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    // 4. Somme XP (depuis profiles)
    const { data: xpData } = await supabase.from('profiles').select('xp');
    const xpGenerated = xpData?.reduce((acc, curr) => acc + (curr.xp || 0), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      activeToday: activeToday || 0,
      totalLessons: totalLessons || 0,
      xpGenerated: xpGenerated,
      completionRate: totalUsers ? Math.round((totalLessons / (totalUsers * 59)) * 100) : 0 // 59 est le nb total de leçons
    };
  }

  /**
   * Données réelles pour le graphique d'évolution (7 derniers jours).
   */
  static async getRegistrationsData() {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gt('created_at', new Date(Date.now() - 7 * 86400000).toISOString());

    if (error) return [];

    // Formater par jour
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const counts = {};
    
    // Initialiser les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      counts[days[d.getDay()]] = 0;
    }

    data.forEach(p => {
      const dayName = days[new Date(p.created_at).getDay()];
      if (counts[dayName] !== undefined) counts[dayName]++;
    });

    return Object.entries(counts).map(([date, users]) => ({ date, users }));
  }

  /**
   * Insights réels sur les exercices (Top échecs).
   */
  static async getExerciseInsights() {
    const { data, error } = await supabase
      .from('exercise_attempts')
      .select('lesson_id, success, lessons(title)');

    if (error || !data) return [];

    const stats = {};
    data.forEach(attempt => {
      const lid = attempt.lesson_id;
      if (!stats[lid]) stats[lid] = { title: attempt.lessons?.title || 'Inconnu', total: 0, failed: 0 };
      stats[lid].total++;
      if (!attempt.success) stats[lid].failed++;
    });

    return Object.values(stats)
      .map(s => ({ ...s, failRate: Math.round((s.failed / s.total) * 100) }))
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 5);
  }

  static async deleteUser(userId) {
    // Supprimer le profil (RLS gérera si l'admin a le droit)
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
    return true;
  }
  static async updateUserStatus(userId, status) {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    if (error) throw error;
    return true;
  }
}

export default AdminService;
