import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Trash2, Clock } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const ErasureQueuePage: React.FC = () => {
  const [erasureRequests, setErasureRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/compliance/erasure-requests');
      setErasureRequests(data.data || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load erasure requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcessErasure = async (id: string, name: string) => {
    const reasonCode = prompt(`Mandatory audit reason for purging data for workspace '${name}':`);
    if (!reasonCode) return;

    try {
      await adminFetch(`/api/admin/compliance/erasure-requests/${id}/process`, {
        method: 'PATCH',
        body: JSON.stringify({ reasonCode }),
      });
      alert(`Data erasure completed for workspace '${name}'.`);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Erasure processing failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Data Subject Erasure Queue (GDPR & DPDP 2023)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Cross-workspace data deletion requests with mandatory 30-day SLA compliance countdown
          </p>
        </div>
        <button onClick={fetchRequests} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh Queue
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
              <th style={{ padding: '14px 16px' }}>Requested At</th>
              <th style={{ padding: '14px 16px' }}>Days Elapsed</th>
              <th style={{ padding: '14px 16px' }}>SLA Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading erasure queue...</td>
              </tr>
            ) : erasureRequests.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No pending data erasure requests found.</td>
              </tr>
            ) : (
              erasureRequests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{r.workspaceName}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--admin-text-muted)' }}>{new Date(r.requestedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px' }}>{r.daysElapsed} days</td>
                  <td style={{ padding: '14px 16px' }}>
                    {r.isSlaBreached ? (
                      <span className="badge badge-red"><AlertCircle size={12} /> SLA BREACHED</span>
                    ) : (
                      <span className="badge badge-amber"><Clock size={12} /> {r.slaDaysRemaining} Days Left</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button onClick={() => handleProcessErasure(r.id, r.workspaceName)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--color-red-600)', color: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <Trash2 size={12} /> Purge Workspace Data
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
