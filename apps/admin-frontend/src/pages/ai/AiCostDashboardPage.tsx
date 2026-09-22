import React, { useState, useEffect } from 'react';
import { Cpu, DollarSign, Zap, Shield, RefreshCw, Sliders } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const AiCostDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Spend Cap Modal State
  const [showCapModal, setShowCapModal] = useState(false);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState('');
  const [capAmount, setCapAmount] = useState('50');
  const [updatingCap, setUpdatingCap] = useState(false);

  const fetchAiCosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/ai/costs');
      setData(res.data || res);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI cost telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiCosts();
  }, []);

  const handleUpdateCap = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingCap(true);
    try {
      await adminFetch(`/api/admin/ai/caps/${targetWorkspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ monthlyCapUsd: parseFloat(capAmount) }),
      });
      alert(`Monthly AI Spend Cap set to $${capAmount} for workspace ${targetWorkspaceId}`);
      setShowCapModal(false);
      setTargetWorkspaceId('');
      fetchAiCosts();
    } catch (err: any) {
      alert(err.message || 'Failed to set AI spend cap');
    } finally {
      setUpdatingCap(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            AI Ops & Cost Telemetry
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Token usage, model spend breakdown, and workspace AI cap management
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCapModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-blue-600)',
              color: '#FFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Sliders size={14} /> Configure Spend Cap
          </button>
          <button
            onClick={fetchAiCosts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#FFF',
              border: '1px solid var(--admin-card-border)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Total 30-Day AI Spend</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-blue-600)' }}>
            ${(data?.summary?.totalCostUsd || 0).toFixed(4)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Claude 3.5 & Whisper combined</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Total Tokens Consumed</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-emerald-600)' }}>
            {(data?.summary?.totalTokens || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Prompt + Completion tokens</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Active AI Models</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>
            {data?.summary?.activeModelsCount || 0}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Claude / Whisper / Embeddings</span>
        </div>
      </div>

      {/* Feature & Model Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--admin-card-shadow)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Spend by AI Feature</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data?.featureBreakdown || []).map((f: any) => (
              <div key={f.feature} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{f.feature}</span>
                <div>
                  <span className="badge badge-blue" style={{ marginRight: '8px' }}>${f.costUsd}</span>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{f.eventCount} calls</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--admin-card-shadow)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Spend by AI Model</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data?.modelBreakdown || []).map((m: any) => (
              <div key={m.model} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
                <span style={{ fontWeight: 600 }}><code>{m.model}</code></span>
                <span className="badge badge-green">${m.costUsd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Consuming Workspaces */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--admin-card-shadow)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-card-border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Top Consuming Workspaces</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '12px 20px' }}>Workspace ID</th>
              <th style={{ padding: '12px 16px' }}>API Call Count</th>
              <th style={{ padding: '12px 20px' }}>Total Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading AI spend data...</td>
              </tr>
            ) : (data?.topConsumingWorkspaces || []).length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No AI usage events logged yet.</td>
              </tr>
            ) : (
              (data?.topConsumingWorkspaces || []).map((w: any) => (
                <tr key={w.workspaceId} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}><code>{w.workspaceId}</code></td>
                  <td style={{ padding: '12px 16px' }}>{w.requestCount} calls</td>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--color-blue-600)' }}>${w.costUsd}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Spend Cap Modal */}
      {showCapModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Configure Workspace AI Cap</h2>
            <form onSubmit={handleUpdateCap}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Workspace ID</label>
                <input type="text" required placeholder="Workspace ObjectId" value={targetWorkspaceId} onChange={(e) => setTargetWorkspaceId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Monthly Spend Cap (USD)</label>
                <input type="number" required placeholder="50" value={capAmount} onChange={(e) => setCapAmount(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCapModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--color-slate-300)', background: '#FFF' }}>Cancel</button>
                <button type="submit" disabled={updatingCap} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--color-blue-600)', color: '#FFF', fontWeight: 600 }}>{updatingCap ? 'Saving...' : 'Set Cap'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
