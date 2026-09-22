import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const PromptReviewPage: React.FC = () => {
  const [flaggedEvents, setFlaggedEvents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFlaggedEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch(`/api/admin/ai/flagged?status=${statusFilter}`);
      setFlaggedEvents(data.data || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load flagged AI events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedEvents();
  }, [statusFilter]);

  const handleAction = async (id: string, actionStatus: 'dismissed' | 'warned' | 'restricted') => {
    const reasonCode = prompt(`Enter audit reason for marking event as '${actionStatus}':`);
    if (!reasonCode) return;

    try {
      await adminFetch(`/api/admin/ai/flagged/${id}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ actionStatus, reasonCode }),
      });
      alert(`Event marked as '${actionStatus}'`);
      fetchFlaggedEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to process flag action');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Prompt-Injection & Safety Review Queue
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Review flagged prompt injection attempts, toxic AI responses, and jailbreak queries
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', fontSize: '13px' }}
          >
            <option value="pending">Pending Review</option>
            <option value="dismissed">Dismissed</option>
            <option value="warned">Warned</option>
            <option value="restricted">Restricted</option>
            <option value="all">All Events</option>
          </select>
          <button onClick={fetchFlaggedEvents} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>
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
              <th style={{ padding: '14px 20px' }}>Workspace ID</th>
              <th style={{ padding: '14px 16px' }}>Feature / Model</th>
              <th style={{ padding: '14px 16px' }}>Flag Reason</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading review queue...</td>
              </tr>
            ) : flaggedEvents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No flagged AI prompts in review queue.</td>
              </tr>
            ) : (
              flaggedEvents.map((e) => (
                <tr key={e._id || e.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}><code>{e.workspaceId}</code></td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-blue">{e.feature}</span>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>{e.model}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-red-600)', fontWeight: 600 }}>
                    {e.flagReason || 'Suspected Prompt Injection'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${e.actionStatus === 'pending' ? 'badge-amber' : e.actionStatus === 'dismissed' ? 'badge-green' : 'badge-red'}`}>
                      {e.actionStatus.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleAction(e._id || e.id, 'dismissed')} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', fontSize: '12px', cursor: 'pointer' }}>Dismiss</button>
                      <button onClick={() => handleAction(e._id || e.id, 'warned')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'var(--color-amber-500)', color: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Warn</button>
                      <button onClick={() => handleAction(e._id || e.id, 'restricted')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'var(--color-red-600)', color: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Restrict</button>
                    </div>
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
