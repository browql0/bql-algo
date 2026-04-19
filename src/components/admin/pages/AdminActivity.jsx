import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, RefreshCcw, Target, XCircle, Zap, CheckCircle2, BookOpen, Award } from 'lucide-react';
import AdminService from '../../../lib/services/AdminService';

const FILTERS = [
  { value: 'all', label: 'Toute activité' },
  { value: 'xp', label: 'Événements XP', icon: Zap },
  { value: 'attempt', label: 'Tentatives', icon: Target },
  { value: 'challenge_completion', label: 'Challenges validés', icon: CheckCircle2 },
  { value: 'lesson_completion', label: 'Leçons terminées', icon: BookOpen },
];

const labelForType = (item) => {
  if (item.type === 'xp') {
    return item.source === 'challenge_completion' ? 'Challenge validé' : 'XP leçon';
  }
  return item.success ? 'Tentative réussie' : 'Tentative échouée';
};

const AdminActivity = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (nextFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await AdminService.getActivityFeed(nextFilter, 75);
      setItems(data);
    } catch (err) {
      console.error('Erreur activite admin:', err);
      setError(err.message || "Impossible de charger l'activité.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const totals = useMemo(() => ({
    xp: items.filter((item) => item.type === 'xp').length,
    attempts: items.filter((item) => item.type === 'attempt').length,
    failed: items.filter((item) => item.type === 'attempt' && !item.success).length,
  }), [items]);

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Journal</span>
          <h2>Activité récente</h2>
          <p>Événements XP et tentatives officielles issus du backend.</p>
        </div>
        <button className="btn-secondary admin-touch-btn" onClick={() => load(filter)}>
          <RefreshCcw size={16} /> Actualiser
        </button>
      </div>

      <div className="admin-grid admin-grid-compact">
        <div className="stat-card">
          <div className="stat-header"><span>Événements XP</span><Zap size={20} /></div>
          <div className="stat-value">{totals.xp}</div>
          <div className="stat-footer"><span style={{ color: 'var(--admin-text-sub)' }}>dans le flux chargé</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Tentatives</span><Target size={20} /></div>
          <div className="stat-value">{totals.attempts}</div>
          <div className="stat-footer"><span style={{ color: 'var(--admin-text-sub)' }}>validations serveur</span></div>
        </div>
        <div className="stat-card critical">
          <div className="stat-header"><span>Échecs</span><XCircle size={20} /></div>
          <div className="stat-value">{totals.failed}</div>
          <div className="stat-footer"><span style={{ color: 'var(--admin-text-sub)' }}>à surveiller</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Taux de réussite</span><Award size={20} /></div>
          <div className="stat-value">
            {totals.attempts > 0 ? `${Math.round(((totals.attempts - totals.failed) / totals.attempts) * 100)}%` : '–'}
          </div>
          <div className="stat-footer"><span style={{ color: 'var(--admin-text-sub)' }}>dans ce flux</span></div>
        </div>
      </div>

      <div className="admin-panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div className="admin-filter-chips">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                type="button"
                className={`admin-chip ${filter === f.value ? 'active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {Icon && <Icon size={13} />} {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="admin-alert-card">
          <h2>Activité indisponible</h2>
          <p>{error}</p>
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h3><Clock3 size={18} /> Flux d&apos;activité</h3>
          <span>{items.length} événements</span>
        </div>

        {loading ? (
          <div className="admin-activity-list">
            {Array.from({ length: 8 }).map((_, index) => <div className="admin-skeleton-row" key={index} />)}
          </div>
        ) : (
          <div className="admin-activity-list">
            {items.map((item, index) => (
              <div className="admin-activity-item" key={`${item.created_at}-${index}`}>
                <div className={`activity-dot ${item.type === 'xp' || item.success ? 'success' : 'danger'}`}>
                  {item.type === 'xp' ? <Zap size={13} /> : <Target size={13} />}
                </div>
                <div>
                  <strong>{labelForType(item)}</strong>
                  <span>
                    {item.full_name || item.email || 'Utilisateur inconnu'} — {item.lesson_title || 'élément inconnu'}
                    {item.type === 'attempt' && Number(item.total || 0) > 0 ? ` (${item.passed}/${item.total})` : ''}
                    {item.type === 'xp' && item.amount ? ` (+${item.amount} XP)` : ''}
                  </span>
                </div>
                <time>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</time>
              </div>
            ))}
            {items.length === 0 && <div className="admin-empty-state">Aucun événement pour ce filtre.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivity;
