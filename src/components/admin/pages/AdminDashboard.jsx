import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Trophy, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import AdminService from '../../../lib/services/AdminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalLessons: 0,
    xpGenerated: 0,
    completionRate: 0
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [globalStats, registrations] = await Promise.all([
          AdminService.getGlobalStats(),
          AdminService.getRegistrationsData()
        ]);
        setStats(globalStats);
        setChartData(registrations);
      } catch (err) {
        console.error("Erreur Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Zap size={24} color="var(--admin-accent)" /> Vue d'ensemble du Système
      </h2>
      
      <div className="admin-grid">
        <StatCard 
          title="Utilisateurs Totaux" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users size={20} />} 
          trend="+12% ce mois"
        />
        <StatCard 
          title="Actifs (24h)" 
          value={stats.activeToday.toLocaleString()} 
          icon={<Zap size={20} />} 
          trend="En hausse"
        />
        <StatCard 
          title="Leçons Terminées" 
          value={stats.totalLessons.toLocaleString()} 
          icon={<BookOpen size={20} />} 
          trend={`${stats.completionRate}% de complétion`}
        />
        <StatCard 
          title="XP Totale BQL" 
          value={stats.xpGenerated.toLocaleString()} 
          icon={<Trophy size={20} />} 
          trend="Niveau Global : 8"
        />
      </div>

      <ChartCard title="Inscriptions (7 derniers jours)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--admin-accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--admin-accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(11, 14, 32, 0.9)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#fff' }}
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="var(--admin-accent)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorUsers)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

export default AdminDashboard;
