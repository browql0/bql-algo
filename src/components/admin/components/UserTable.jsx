import React from 'react';
import { Trash2, ShieldBan } from 'lucide-react';

const UserTable = ({ users, onDelete, onBan }) => {
  return (
    <div className="user-table-container animate-fade-in">
      <div className="user-table-header">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>
          Tous les utilisateurs ({users.length})
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Score (XP)</th>
              <th>Niveau</th>
              <th>Progression</th>
              <th>Rôle</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => {
                const totalLessons = 59;
                const completed = user.total_lessons_completed || 0;
                const progressPct = Math.round((completed / totalLessons) * 100);

                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'white' }}>{user.full_name || 'Anonyme'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-accent)' }}>
                        {user.xp?.toLocaleString() || 0} XP
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                        Niv. {user.level || 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${progressPct}%`, 
                              height: '100%', 
                              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                              boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{progressPct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                        {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--admin-text-sub)' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'banned' ? 'banned' : 'active'}`}>
                        {user.status === 'banned' ? 'Banni' : 'Actif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className={`action-btn ${user.status === 'banned' ? 'active-status' : ''}`} 
                          title={user.status === 'banned' ? "Réactiver le compte" : "Bannir le compte"}
                          onClick={() => onBan && onBan(user.id)}
                          style={user.status === 'banned' ? { color: '#22c55e' } : {}}
                        >
                          <ShieldBan size={16} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Supprimer"
                          onClick={() => {
                            if (window.confirm("Supprimer définitivement cet utilisateur ?")) {
                              onDelete && onDelete(user.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-text-sub)' }}>
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
