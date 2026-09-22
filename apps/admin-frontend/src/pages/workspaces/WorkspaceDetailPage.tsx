import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, MessageSquare, Shield, Key, Ban, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const WorkspaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(`/api/admin/workspaces/${id}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workspace profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorkspace();
  }, [id]);

  const handleImpersonate = async () => {
    if (!data?.workspace) return;
    try {
      const res = await adminFetch(`/api/admin/workspaces/${id}/impersonate`, {
        method: 'POST',
        body: JSON.stringify({ reasonCode: '360 Support Investigation' }),
      });
      alert(`Impersonation Session Started!\nToken: ${res.data.impersonationToken.substring(0, 30)}...`);
    } catch (err: any) {
      alert(err.message || 'Impersonation failed');
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', color: 'var(--admin-text-muted)' }}>Loading 360° workspace profile...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: '32px', color: 'var(--color-red-600)' }}>
        <button onClick={() => navigate('/workspaces')} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-blue-600)' }}>
          <ArrowLeft size={16} /> Back to Workspaces
        </button>
        {error || 'Workspace not found'}
      </div>
    );
  }

  const { workspace, stats, owner, members } = data;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/workspaces')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-secondary)', fontSize: '13px', fontWeight: 600 }}
      >
        <ArrowLeft size={16} /> Back to Workspaces List
      </button>

      {/* Header Profile Card */}
      <div style={{
        backgroundColor: 'var(--admin-card-bg)',
        border: '1px solid var(--admin-card-border)',
        borderRadius: 'var(--admin-card-radius)',
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--admin-card-shadow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-blue-600)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
          }}>
            {workspace.name[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>{workspace.name}</h1>
              <span className="badge badge-blue">{workspace.plan.toUpperCase()}</span>
              {workspace.active ? <span className="badge badge-green">ACTIVE</span> : <span className="badge badge-red">SUSPENDED</span>}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>
              Slug: <code>/{workspace.slug}</code> • Currency: {workspace.currency} • Type: {workspace.type}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleImpersonate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-blue-600)',
              color: '#FFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Key size={16} /> Login as Workspace
          </button>
        </div>
      </div>

      {/* Grid Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Total Members</span>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{stats.totalMembers}</div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Owner: {owner?.email || 'N/A'}</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>24h Outbound Messages</span>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{stats.messageCount24h.toLocaleString()}</div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Total lifetime: {stats.totalMessages.toLocaleString()}</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>WABA Connection Status</span>
          <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: workspace.waba?.isConnected ? 'var(--color-emerald-600)' : 'var(--color-amber-500)' }}>
            {workspace.waba?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Limit: {workspace.waba?.messagingLimit || 'N/A'}</span>
        </div>
      </div>

      {/* Team Members List */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--admin-card-shadow)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Team Members ({members.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-card-border)', textAlign: 'left' }}>
              <th style={{ padding: '10px 0' }}>Name</th>
              <th style={{ padding: '10px 0' }}>Email</th>
              <th style={{ padding: '10px 0' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                <td style={{ padding: '12px 0', fontWeight: 600 }}>{m.name}</td>
                <td style={{ padding: '12px 0' }}>{m.email}</td>
                <td style={{ padding: '12px 0', textTransform: 'capitalize' }}>{m.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
