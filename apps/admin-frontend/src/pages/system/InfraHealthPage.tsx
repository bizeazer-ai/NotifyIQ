import React, { useState, useEffect } from 'react';
import { Activity, Database, Cpu, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const InfraHealthPage: React.FC = () => {
  const [infra, setInfra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInfra = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/infra/health');
      setInfra(data.data || data);
    } catch (err: any) {
      setError(err.message || 'Failed to load infrastructure status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfra();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Infrastructure Health & Process Status
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            MongoDB Atlas, Utho Redis 7, Node.js process RSS/Heap memory, and server uptime
          </p>
        </div>
        <button onClick={fetchInfra} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh Health
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Process Memory & Uptime Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>System Uptime</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-blue-600)' }}>
            {Math.floor((infra?.uptimeSeconds || 0) / 3600)}h {Math.floor(((infra?.uptimeSeconds || 0) % 3600) / 60)}m
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Continuous operation</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Process RSS Memory</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-emerald-600)' }}>
            {infra?.processMemory?.rssMb || 0} MB
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Resident Set Size</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Heap Memory (Used / Total)</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>
            {infra?.processMemory?.heapUsedMb || 0} / {infra?.processMemory?.heapTotalMb || 0} MB
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Node.js V8 Engine Heap</span>
        </div>
      </div>

      {/* Services Status Panel */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--admin-card-shadow)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Service Dependencies</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(infra?.services || []).map((s: any) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="var(--color-emerald-600)" />
                <span style={{ fontWeight: 600 }}>{s.name}</span>
              </div>
              <span className="badge badge-green">{s.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
