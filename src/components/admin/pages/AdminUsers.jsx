import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import UserTable from '../components/UserTable';
import AdminService from '../../../lib/services/AdminService';

const PAGE_SIZE = 12;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('created_desc');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await AdminService.fetchUsers(1, 100, search);
      setUsers(data);
      setTotalUsers(count);
      setPage(1);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Impossible de charger les utilisateurs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const rows = users.filter((user) => {
      if (statusFilter === 'all') return true;
      return (user.status || 'active') === statusFilter;
    });

    return [...rows].sort((a, b) => {
      if (sortKey === 'xp_desc') return Number(b.xp || 0) - Number(a.xp || 0);
      if (sortKey === 'lessons_desc') return Number(b.total_lessons_completed || 0) - Number(a.total_lessons_completed || 0);
      if (sortKey === 'success_desc') return Number(b.success_rate || 0) - Number(a.success_rate || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [users, statusFilter, sortKey]);

  const maxPage = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id) => {
    try {
      await AdminService.deleteUser(id);
      setUsers((current) => current.filter((user) => user.id !== id));
      setTotalUsers((value) => Math.max(0, value - 1));
      setConfirmUser(null);
      showToast('Profil supprimé.');
    } catch (err) {
      showToast(err.message || "Erreur lors de la suppression de l'utilisateur.", 'error');
    }
  };

  const handleBan = async (id) => {
    const userToUpdate = users.find(u => u.id === id);
    if (!userToUpdate) return;

    const newStatus = userToUpdate.status === 'banned' ?'active' : 'banned';
    try {
      await AdminService.updateUserStatus(id, newStatus);
      setUsers(users.map(u => u.id === id ?{ ...u, status: newStatus } : u));
      showToast(newStatus === 'banned' ?'Utilisateur banni.' : 'Utilisateur réactivé.');
    } catch (err) {
      showToast(err.message || 'Erreur lors du changement de statut.', 'error');
    }
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8,"
      + "ID,Nom Complet,Email,Date Inscription,XP,Niveau,Leçons,Challenges,Tentatives,Reussite,Statut\n"
      + filteredUsers.map(u => `${u.id},${u.full_name || 'Anonyme'},${u.email},${u.created_at},${u.xp || 0},${u.level || 1},${u.total_lessons_completed || 0},${u.challenges_completed || 0},${u.attempts || 0},${u.success_rate || 0}%,${u.status}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "utilisateurs_bql.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-page">
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.message}</div>}

      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Base utilisateurs</span>
          <h2>Gestion des utilisateurs</h2>
          <p>{totalUsers.toLocaleString()} profils, progression et XP lus depuis Supabase.</p>
        </div>
        <button className="btn-secondary admin-touch-btn" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher par email ou nom..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select className="admin-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="banned">Bannis</option>
        </select>
        <select className="admin-select" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
          <option value="created_desc">Plus recents</option>
          <option value="xp_desc">XP decroissant</option>
          <option value="lessons_desc">Leçons terminees</option>
          <option value="success_desc">Taux reussite</option>
        </select>
      </div>

      {loading ?(
        <div className="admin-panel">
          <div className="admin-activity-list">
            {Array.from({ length: 8 }).map((_, index) => <div className="admin-skeleton-row" key={index} />)}
          </div>
        </div>
      ) : (
        <>
          <UserTable
            users={pagedUsers}
            totalUsers={filteredUsers.length}
            onDelete={(id) => setConfirmUser(users.find((user) => user.id === id))}
            onBan={handleBan}
          />
          <div className="admin-pagination">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Precedent</button>
            <span>Page {page} / {maxPage}</span>
            <button className="btn-secondary" disabled={page >= maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))}>Suivant</button>
          </div>
        </>
      )}

      {confirmUser && (
        <div className="admin-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="admin-confirm-card">
            <h3>Supprimer ce profil ?</h3>
            <p>
              Cette action retire le profil admin visible pour <strong>{confirmUser.email}</strong>. Elle ne doit etre utilisee que pour les comptes de test ou les doublons.
            </p>
            <div className="admin-confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmUser(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => handleDelete(confirmUser.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
