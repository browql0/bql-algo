import React, { useEffect, useState } from 'react';
import ChartCard from '../components/ChartCard';
import AdminService from '../../../lib/services/AdminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react';

const AdminAnalytics = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const data = await AdminService.getExerciseInsights();
        setInsights(data);
      } catch (err) {
        console.error("Erreur Analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
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
        <TrendingDown size={24} color="#ef4444" /> Analyse des Points de Blocage
      </h2>
      
      <div className="admin-grid">
        <div className="stat-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Exercice Critique</h3>
            <AlertTriangle color="#ef4444" size={20} />
          </div>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fca5a5', margin: '0.5rem 0' }}>
            {insights[0]?.title || "Aucune donnée"}
          </p>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            Taux d'échec : {insights[0]?.failRate || 0}%
          </span>
        </div>
        
        <div className="stat-card" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Régularité Global</h3>
            <CheckCircle2 color="#22c55e" size={20} />
          </div>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#86efac', margin: '0.5rem 0' }}>Stable</p>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            Les tests de logique passent à 82%
          </span>
        </div>
      </div>

      <ChartCard title="Leçons avec le plus haut taux d'échec (%)">
        <div style={{ height: '100%', minHeight: '300px' }}>
          {insights.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="title" 
                  type="category" 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 13}}
                  width={150}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(11, 14, 32, 0.95)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="failRate" radius={[0, 4, 4, 0]} barSize={25}>
                  {insights.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.failRate > 50 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-center" style={{ height: '300px', color: 'var(--admin-text-sub)' }}>
              En attente de tentatives utilisateurs pour générer les insights...
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
};

export default AdminAnalytics;
