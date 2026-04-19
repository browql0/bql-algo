import React, { useEffect, useMemo, useState } from 'react';
import ChartCard from '../components/ChartCard';
import AdminService from '../../../lib/services/AdminService';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Target, TrendingDown, Zap } from 'lucide-react';

/* XP bucket helpers */
const XP_BUCKETS = [
  { label: '0 – 99',    min: 0,    max: 99    },
  { label: '100 – 499', min: 100,  max: 499   },
  { label: '500 – 999', min: 500,  max: 999   },
  { label: '1 000+',    min: 1000, max: Infinity },
];

function buildXpDistribution(users) {
  if (!Array.isArray(users) || users.length === 0) return [];
  const counts = XP_BUCKETS.map((b) => ({
    ...b,
    count: users.filter((u) => {
      const xp = Number(u.xp || 0);
      return xp >= b.min && xp <= b.max;
    }).length,
  }));
  const max = Math.max(...counts.map((b) => b.count), 1);
  return counts.map((b) => ({ ...b, pct: Math.round((b.count / max) * 100) }));
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(11, 14, 32, 0.95)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '8px',
  color: '#fff',
};

const AdminAnalytics = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const [snap, { data: userData }] = await Promise.all([
          AdminService.getDashboardSnapshot(),
          AdminService.fetchUsers(1, 200, ''),
        ]);
        setSnapshot(snap);
        setUsers(userData || []);
      } catch (err) {
        console.error('Erreur Analytics:', err);
        setError(err.message || 'Impossible de charger les analytics.');
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, []);

  const xpDistribution = useMemo(() => buildXpDistribution(users), [users]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton-grid">
          {Array.from({ length: 4 }).map((_, i) => <div className="admin-skeleton-card" key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-alert-card">
          <h2>Analytics indisponibles</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stats = snapshot?.stats || {};
  const difficult = snapshot?.difficultChallenges || [];
  const levels = snapshot?.progressByLevel || [];
  const hardest = difficult[0];

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Validation serveur</span>
          <h2>Analytics pédagogiques</h2>
          <p>Blocages, taux de réussite et distribution XP calculés depuis les données réelles.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-grid admin-grid-compact">
        <div className="stat-card critical">
          <div className="stat-header">
            <span>Challenge critique</span>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-value stat-value-small">{hardest?.title || 'Aucune donnée'}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--admin-text-sub)' }}>{hardest ? `${hardest.fail_rate}% d'échec` : 'En attente de tentatives'}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span>Taux de réussite global</span>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-value">{stats.challengeSuccessRate || 0}%</div>
          <div className="stat-footer"><span style={{ color: 'var(--admin-text-sub)' }}>{stats.challengeAttempts || 0} tentatives</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span>Challenges terminés</span>
            <Target size={20} />
          </div>
          <div className="stat-value">{(stats.challengesCompleted || 0).toLocaleString()}</div>
          <div className="stat-footer"><span style={{ color: 'var(--admin-text-sub)' }}>validations officielles</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span>XP distribuée totale</span>
            <Zap size={20} />
          </div>
          <div className="stat-value">{(stats.totalXpEarned || 0).toLocaleString()}</div>
          <div className="stat-footer"><span style={{ color: 'var(--admin-text-sub)' }}>via xp_events</span></div>
        </div>
      </div>

      {/* Failure rate bar chart */}
      <ChartCard
        title="Challenges avec le plus haut taux d'échec"
        subtitle={`${difficult.length} challenges analysés`}
      >
        {difficult.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={difficult} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="title" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={170} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="fail_rate" radius={[0, 6, 6, 0]} barSize={24}>
                {difficult.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={Number(entry.fail_rate) >= 70 ? '#ef4444' : Number(entry.fail_rate) >= 40 ? '#f59e0b' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="admin-empty-state">En attente de tentatives utilisateurs.</div>
        )}
      </ChartCard>

      {/* XP Distribution */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h3><Zap size={18} /> Distribution XP des apprenants</h3>
          <span>{users.length} profils analysés</span>
        </div>
        {xpDistribution.length > 0 ? (
          <div className="admin-xp-distribution">
            {xpDistribution.map((bucket) => (
              <div className="admin-xp-bucket" key={bucket.label}>
                <span>{bucket.label}</span>
                <div className="admin-xp-bar">
                  <div style={{ width: `${bucket.pct}%` }} />
                </div>
                <b>{bucket.count} apprenants</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state compact">Données insuffisantes pour la distribution XP.</div>
        )}
      </div>

      {/* Progress by level */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h3><TrendingDown size={18} /> Progression par niveau</h3>
          <span>Taux de complétion moyen</span>
        </div>
        <div className="admin-level-list">
          {levels.length > 0 ? levels.map((level) => (
            <div className="admin-level-row" key={level.level}>
              <div>
                <strong>Niveau {level.level}</strong>
                <span>{level.title}</span>
              </div>
              <div className="admin-level-meter">
                <div style={{ width: `${level.completion_rate || 0}%` }} />
              </div>
              <b>{level.completion_rate || 0}%</b>
            </div>
          )) : (
            <div className="admin-empty-state">Aucune donnée de progression disponible.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
