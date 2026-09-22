import React, { useState, useEffect } from 'react';
import { Key, RotateCw, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const KeyRotationPage: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/security/keys');
      setKeys(data.data || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load API key inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleRotateKey = async (keyName: string) => {
    const reasonCode = prompt(`Mandatory audit reason for rotating key '${keyName}':`);
    if (!reasonCode) return;

    try {
      await adminFetch('/api/admin/security/keys/rotate', {
        method: 'POST',
        body: JSON.stringify({ keyName, reasonCode }),
      });
      alert(`Key rotation initiated for '${keyName}'.`);
      fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Key rotation failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Platform API Key & Webhook Secret Rotation Manager
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Inventory of Meta WABA, Razorpay, Stripe, and internal encryption keys with staleness alerts
          </p>
        </div>
        <button onClick={fetchKeys} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh Inventory
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
              <th style={{ padding: '14px 20px' }}>Secret / Key Name</th>
              <th style={{ padding: '14px 16px' }}>Environment</th>
              <th style={{ padding: '14px 16px' }}>Provider</th>
              <th style={{ padding: '14px 16px' }}>Last Rotated</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading key inventory...</td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No secret keys configured.</td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.keyName} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700 }}><code>{k.keyName}</code></td>
                  <td style={{ padding: '14px 16px' }}><span className="badge badge-blue">{k.environment}</span></td>
                  <td style={{ padding: '14px 16px' }}>{k.provider}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--admin-text-muted)' }}>{k.lastRotatedDaysAgo} days ago</td>
                  <td style={{ padding: '14px 16px' }}>
                    {k.status === 'FRESH' ? (
                      <span className="badge badge-green">FRESH</span>
                    ) : (
                      <span className="badge badge-amber"><AlertTriangle size={12} /> STALE (&gt;90 DAYS)</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button onClick={() => handleRotateKey(k.keyName)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <RotateCw size={12} /> Rotate Key
                    </button>
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
