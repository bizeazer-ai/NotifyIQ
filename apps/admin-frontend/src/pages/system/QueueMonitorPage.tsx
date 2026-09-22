import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const QueueMonitorPage: React.FC = () => {
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueues = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/queues/status');
      setQueueData(data.data || data);
    } catch (err: any) {
      setError(err.message || 'Failed to load queue telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const handleRetry = async (queueName: string) => {
    try {
      await adminFetch('/api/admin/queues/retry', {
        method: 'POST',
        body: JSON.stringify({ queueName }),
      });
      alert(`Retried failed jobs for queue '${queueName}'`);
      fetchQueues();
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    }
  };

  const handleClean = async (queueName: string) => {
    if (!window.confirm(`Are you sure you want to purge completed/failed jobs from queue '${queueName}'?`)) return;
    try {
      await adminFetch('/api/admin/queues/clean', {
        method: 'POST',
        body: JSON.stringify({ queueName }),
      });
      alert(`Purged jobs for queue '${queueName}'`);
      fetchQueues();
    } catch (err: any) {
      alert(err.message || 'Clean failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            BullMQ Message Queue Monitor
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Real-time queue depth, active worker threads, retry controls, and job purging
          </p>
        </div>
        <button onClick={fetchQueues} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh Depth
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Redis Cluster Status */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 size={24} color="var(--color-emerald-600)" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Redis Queue Host: {queueData?.cluster?.host}:{queueData?.cluster?.port}</h3>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Memory Usage: {queueData?.cluster?.memoryUsedMb} MB</span>
          </div>
        </div>
        <span className="badge badge-green">STATUS: {queueData?.cluster?.status?.toUpperCase()}</span>
      </div>

      {/* Queues List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {(queueData?.queues || []).map((q: any) => (
          <div key={q.name} style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--admin-card-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={20} color="var(--color-blue-600)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}><code>{q.name}</code></h3>
              </div>
              <span className="badge badge-green">{q.status.toUpperCase()}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'var(--color-slate-50)', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Waiting</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{q.depth.waiting}</div>
              </div>
              <div style={{ backgroundColor: 'var(--color-blue-50)', padding: '10px', borderRadius: '8px', color: 'var(--color-blue-600)' }}>
                <span style={{ fontSize: '11px' }}>Active</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{q.depth.active}</div>
              </div>
              <div style={{ backgroundColor: 'var(--color-emerald-50)', padding: '10px', borderRadius: '8px', color: 'var(--color-emerald-600)' }}>
                <span style={{ fontSize: '11px' }}>Completed</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{q.depth.completed}</div>
              </div>
              <div style={{ backgroundColor: 'var(--color-red-50)', padding: '10px', borderRadius: '8px', color: 'var(--color-red-600)' }}>
                <span style={{ fontSize: '11px' }}>Failed</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{q.depth.failed}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => handleRetry(q.name)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <RotateCcw size={12} /> Retry Failed
              </button>
              <button onClick={() => handleClean(q.name)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', fontSize: '12px', color: 'var(--color-red-600)', cursor: 'pointer' }}>
                <Trash2 size={12} /> Purge
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
