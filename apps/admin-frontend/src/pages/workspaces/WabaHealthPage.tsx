import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const WabaHealthPage: React.FC = () => {
  const [wabas, setWabas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWabaHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/workspaces/waba-health');
      setWabas(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load WABA health records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWabaHealth();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Meta WABA Connection Health
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Monitor WhatsApp Business API connection status, quality ratings, and messaging limits across all workspaces
          </p>
        </div>
        <button
          onClick={fetchWabaHealth}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          <RefreshCw size={14} /> Refresh WABA Status
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--admin-card-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '14px 20px' }}>Workspace</th>
              <th style={{ padding: '14px 16px' }}>Phone Number ID</th>
              <th style={{ padding: '14px 16px' }}>WABA Account ID</th>
              <th style={{ padding: '14px 16px' }}>Quality Rating</th>
              <th style={{ padding: '14px 16px' }}>Messaging Tier</th>
              <th style={{ padding: '14px 20px' }}>Connection</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  Loading WABA connection status...
                </td>
              </tr>
            ) : wabas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  No active Meta WABA connections found.
                </td>
              </tr>
            ) : (
              wabas.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{w.workspaceName}</td>
                  <td style={{ padding: '14px 16px' }}><code>{w.phoneNumberId || 'N/A'}</code></td>
                  <td style={{ padding: '14px 16px' }}><code>{w.businessAccountId || 'N/A'}</code></td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${w.qualityRating === 'GREEN' ? 'badge-green' : w.qualityRating === 'YELLOW' ? 'badge-amber' : 'badge-red'}`}>
                      {w.qualityRating}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{w.messagingLimit}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {w.isConnected ? <span className="badge badge-green">HEALTHY</span> : <span className="badge badge-red">EXPIRED TOKEN</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
