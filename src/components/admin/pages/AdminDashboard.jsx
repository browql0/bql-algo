import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers,
  Plus,
  RefreshCw,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import AdminService from '../../../lib/services/AdminService';

const fmt = (value) => Number(value || 0).toLocaleString();

function EmptyState({ children }) {
  return <div className="admin-empty-state">{children}</div>;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10, 12, 26, 0.97)',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  borderRadius: '10px',
  color: '#f0f2fc',
  fontSize: '0.82rem',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setSnapshot(await AdminService.getDashboardSnapshot());
    } catch (err) {
      console.error('Erreur Dashboard:', err);
      setError(err.message || 'Impossible de charger le dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => <div className="admin-skeleton-card" key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-alert-card">
          <h2>Dashboard indisponible</h2>
          <p>{error}</p>
          <p>Vérifiez que la migration <code>database/progress_xp_dashboard.sql</code> a été exécutée.</p>
          <button type="button" className="btn-secondary" onClick={() => loadData()}>Réessayer</button>
        </div>
      </div>
    );
  }

  const stats                = snapshot?.stats || {};
  const difficultChallenges  = snapshot?.difficultChallenges || [];
  const completedLessons     = snapshot?.mostCompletedLessons || [];
  const recentActivity       = snapshot?.recentActivity || [];
  const progressByLevel      = snapshot?.progressByLevel || [];
  const successRate          = Number(stats.challengeSuccessRate || 0);

  return (
    <div className="admin-page animate-fade-in">
      {/* ── Heading ── */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Données réelles</span>
          <h2>Vue d'ensemble opérationnelle</h2>
          <p>XP, progression, validations et activité proviennent de Supabase et du validateur serveur.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="admin-health-pill">
            <Activity size={16} />
            Source DB active
          </div>
          <button
            type="button"
            className={`admin-refresh-btn${refreshing ? ' spinning' : ''}`}
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} />
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="admin-grid admin-grid-compact">
        <StatCard
          title="Utilisateurs"
          value={fmt(stats.totalUsers)}
          icon={<Users size={20} />}
          trendValue={`${fmt(stats.activeToday)} actifs (24h)`}
        />
        <StatCard
          title="Cours publiés"
          value={fmt(stats.totalCourses)}
          icon={<Layers size={20} />}
          trendValue={`${fmt(stats.totalLessons)} leçons`}
        />
        <StatCard
          title="XP distribuée"
          value={fmt(stats.totalXpEarned)}
          icon={<Trophy size={20} />}
          trendValue={stats.totalUsers > 0 ? `~${Math.round(stats.totalXpEarned / stats.totalUsers)} XP / apprenant` : 'via xp_events'}
          variant="success"
        />
        <StatCard
          title="Progression moyenne"
          value={`${stats.averageProgress || 0}%`}
          icon={<BookOpen size={20} />}
          trendValue={`${fmt(stats.completedLessons)} complétion(s)`}
          variant={
            (stats.averageProgress || 0) >= 60 ? 'success'
            : (stats.averageProgress || 0) >= 30 ? undefined
            : 'warning'
          }
        />
        <StatCard
          title="Tentatives challenge"
          value={fmt(stats.challengeAttempts)}
          icon={<Target size={20} />}
          trendValue={`${stats.challengeSuccessRate || 0}% de réussite`}
          variant={successRate >= 60 ? 'success' : successRate >= 40 ? undefined : 'warning'}
        />
        <StatCard
          title="Challenges validés"
          value={fmt(stats.challengesCompleted)}
          icon={<CheckCircle2 size={20} />}
          trendValue={`${fmt(stats.coursesCompleted)} cours terminés`}
          variant="success"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="admin-panel" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-panel-header">
          <h3><Layers size={18} /> Actions rapides</h3>
          <span>Raccourcis fréquents</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', padding: '0.25rem 0' }}>
          <button className="btn-primary-gradient" onClick={() => navigate('/admin/courses')}>
            <Plus size={15} /> Nouvelle leçon
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/courses')}>
            <Plus size={15} /> Nouveau challenge
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/users')}>
            <Users size={15} /> Gérer les utilisateurs
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/analytics')}>
            <BarChart3 size={15} /> Voir les analytics
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/activity')}>
            <Activity size={15} /> Journal d&apos;activité
          </button>
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="admin-dashboard-layout">
        <ChartCard title="Inscriptions des 7 derniers jours">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={snapshot.registrations || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--admin-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--admin-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="users" stroke="var(--admin-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Progression par niveau">
          {progressByLevel.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressByLevel} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="level" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Progression']} />
                <Bar dataKey="completion_rate" radius={[6, 6, 0, 0]}>
                  {progressByLevel.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        (entry.completion_rate || 0) >= 70 ? '#22c55e'
                        : (entry.completion_rate || 0) >= 40 ? '#3b82f6'
                        : '#f59e0b'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState>Aucune progression enregistrée.</EmptyState>
          )}
        </ChartCard>
      </div>

      {/* ── Difficult challenges & most completed ── */}
      <div className="admin-dashboard-layout">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3><BarChart3 size={18} /> Challenges les plus difficiles</h3>
            <span>{difficultChallenges.length} éléments</span>
          </div>
          <div className="admin-list">
            {difficultChallenges.length > 0 ? difficultChallenges.map((item) => (
              <div className="admin-list-row" key={item.lesson_id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{fmt(item.failed)} échecs sur {fmt(item.total)} tentatives</span>
                </div>
                <b className="danger-text">{item.fail_rate || 0}%</b>
              </div>
            )) : <EmptyState>Pas encore assez de tentatives.</EmptyState>}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3><CheckCircle2 size={18} /> Leçons les plus terminées</h3>
            <span>Top progression</span>
          </div>
          <div className="admin-list">
            {completedLessons.length > 0 ? completedLessons.map((item) => (
              <div className="admin-list-row" key={item.lesson_id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>Niveau {item.level}</span>
                </div>
                <b>{fmt(item.completed_count)}</b>
              </div>
            )) : <EmptyState>Aucune completion enregistrée.</EmptyState>}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h3><Clock3 size={18} /> Activité récente</h3>
          <span>Derniers événements DB</span>
        </div>
        <div className="admin-activity-list">
          {recentActivity.length > 0 ? recentActivity.map((item, index) => (
            <div className="admin-activity-item" key={`${item.created_at}-${index}`}>
              <div className={`activity-dot ${item.type === 'xp' ? 'success' : item.success ? 'success' : 'danger'}`}>
                {item.type === 'xp' ? <Zap size={13} /> : <Target size={13} />}
              </div>
              <div>
                <strong>{item.full_name || item.email || 'Utilisateur inconnu'}</strong>
                <span>
                  {item.type === 'xp'
                    ? `a gagné ${item.amount} XP sur ${item.lesson_title || 'une leçon'}`
                    : `${item.success ? 'a réussi' : 'a échoué'} ${item.lesson_title || 'un challenge'}`}
                </span>
              </div>
              <time>{new Date(item.created_at).toLocaleString()}</time>
            </div>
          )) : <EmptyState>Aucune activité récente.</EmptyState>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
