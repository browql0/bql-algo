import React from 'react';
import { Trash2, ShieldBan, Clock } from 'lucide-react';

/**
 * Format a UTC timestamp to a relative "X ago" label.
 */
function timeAgo(dateString) {
  if (!dateString) return null;
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "À l\u2019instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Il y a ${days} j`;
  return new Date(dateString).toLocaleDateString();
}

const UserTable = ({ users, totalUsers, onDelete, onBan }) => {
  return (
    <div className="user-table-container animate-fade-in">
      <div className="user-table-header">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>
          Utilisateurs ({users.length}/{totalUsers || users.length})
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>XP</th>
              <th>Niveau</th>
              <th>Leçons</th>
              <th>Challenges</th>
              <th>Réussite</th>
              <th>Dernière activité</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => {
                const completed  = Number(user.total_lessons_completed || 0);
                const attempts   = Number(user.attempts || 0);
                const successRate = Number(user.success_rate || 0);
                const lastActive = user.last_active || user.last_activity || null;
                const ago = timeAgo(lastActive);

                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'white' }}>{user.full_name || 'Anonyme'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                        {Number(user.xp || 0).toLocaleString()} XP
                      </div>
                    </td>
                    <td>
                      <span className="badge level">Niv. {user.level || 1}</span>
                    </td>
                    <td>{completed.toLocaleString()}</td>
                    <td>{Number(user.challenges_completed || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '110px' }}>
                        <div className="admin-mini-meter">
                          <div style={{ width: `${successRate}%` }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {attempts ? `${successRate}%` : '–'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {ago ? (
                        <div className="admin-last-active">
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} style={{ opacity: 0.6 }} />{ago}
                          </strong>
                          {lastActive && (
                            <small>{new Date(lastActive).toLocaleDateString()}</small>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.8rem' }}>–</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                        {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'banned' ? 'banned' : 'active'}`}>
                        {user.status === 'banned' ? 'Banni' : 'Actif'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--admin-text-sub)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '–'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className={`action-btn ${user.status === 'banned' ? 'active-status' : ''}`}
                          title={user.status === 'banned' ? 'Réactiver le compte' : 'Bannir le compte'}
                          onClick={() => onBan && onBan(user.id)}
                          style={user.status === 'banned' ? { color: '#22c55e' } : {}}
                        >
                          <ShieldBan size={15} />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Supprimer"
                          onClick={() => onDelete && onDelete(user.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-text-sub)' }}>
                  Aucun utilisateur ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
