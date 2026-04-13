import React, { useEffect, useState, useCallback } from 'react';
import { Search, Download } from 'lucide-react';
import UserTable from '../components/UserTable';
import AdminService from '../../../lib/services/AdminService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AdminService.fetchUsers(1, 50, search);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    try {
      await AdminService.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  const handleBan = async (id) => {
    const userToUpdate = users.find(u => u.id === id);
    if (!userToUpdate) return;
    
    const newStatus = userToUpdate.status === 'banned' ? 'active' : 'banned';
    try {
      await AdminService.updateUserStatus(id, newStatus);
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Erreur lors du changement de statut.");
    }
  };

  const handleExport = () => {
    if (users.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Nom Complet,Email,Date Inscription,XP,Niveau,Leçons,Statut\n"
      + users.map(u => `${u.id},${u.full_name || 'Anonyme'},${u.email},${u.created_at},${u.xp || 0},${u.level || 1},${u.total_lessons_completed || 0},${u.status}`).join("\n");
      
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Gestion des Utilisateurs</h2>
        <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-sub)' }} />
          <input 
            type="text" 
            className="admin-search-input" 
            placeholder="Rechercher par email ou nom..." 
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}>
          <div className="loader"></div>
        </div>
      ) : (
        <UserTable users={users} onDelete={handleDelete} onBan={handleBan} />
      )}
    </div>
  );
};

export default AdminUsers;
