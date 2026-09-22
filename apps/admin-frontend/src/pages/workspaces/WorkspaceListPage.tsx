import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ExternalLink, ShieldAlert, CheckCircle, Ban, Eye, Key } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const WorkspaceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorkspaces = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('plan', planFilter);
      params.append('page', meta?.page ? meta?.page?.toString() : "1");

      const data = await adminFetch(`/api/admin/workspaces?${params.toString()}`);
      debugger
      setWorkspaces(data.data || []);
      setMeta(data.meta || {});
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [search, statusFilter, planFilter, meta.page]);

  const handleImpersonate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to login-as workspace '${name}'? This session will be audited.`)) {
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/workspaces/${id}/impersonate`, {
        method: 'POST',
        body: JSON.stringify({ reasonCode: 'Support Investigation' }),
      });
      alert(`Impersonation Token generated for ${name}! Redirecting...`);

      // Redirect to the tenant frontend (assuming it runs on port 3001)
      const tenantUrl = import.meta.env.VITE_TENANT_APP_URL || `http://${window.location.hostname}:5173`;
      const redirectUrl = `${tenantUrl}/auth/admin-impersonation?token=${res.data.impersonationToken}&redirect=/admin/dashboard`;

      window.location.href = redirectUrl;
    } catch (err: any) {
      alert(err.message || 'Impersonation failed');
    }
  };

  const handleToggleSuspend = async (id: string, name: string, isCurrentlyActive: boolean) => {
    const action = isCurrentlyActive ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} workspace '${name}'?`)) {
      return;
    }
    try {
      await adminFetch(`/api/admin/workspaces/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ reasonCode: `Admin manual ${action}` }),
      });
      fetchWorkspaces();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} workspace`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Tenant Workspaces
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Manage workspace lifecycle, plan quotas, suspensions, and support impersonation
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        backgroundColor: 'var(--admin-card-bg)',
        border: '1px solid var(--admin-card-border)',
        borderRadius: 'var(--admin-card-radius)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
          <input
            type="text"
            placeholder="Filter by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--color-slate-200)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-slate-200)',
              fontSize: '13px',
              backgroundColor: '#FFF',
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="false">Suspended Only</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-slate-200)',
              fontSize: '13px',
              backgroundColor: '#FFF',
            }}
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{
        backgroundColor: 'var(--admin-card-bg)',
        border: '1px solid var(--admin-card-border)',
        borderRadius: 'var(--admin-card-radius)',
        boxShadow: 'var(--admin-card-shadow)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Workspace</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Type</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Plan</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>WABA Connection</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Members</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--admin-text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  Loading workspaces...
                </td>
              </tr>
            ) : workspaces.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  No workspaces found matching filters.
                </td>
              </tr>
            ) : (
              workspaces.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                    <div>{w.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: 400 }}>/{w.slug}</div>
                  </td>
                  <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>{w.type}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-blue">{w.plan.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {w.active ? (
                      <span className="badge badge-green">ACTIVE</span>
                    ) : (
                      <span className="badge badge-red">SUSPENDED</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {w.hasWaba ? (
                      <span className="badge badge-green">CONNECTED ({w.wabaQuality})</span>
                    ) : (
                      <span className="badge badge-amber">NOT CONNECTED</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>{w.memberCount} users</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/workspaces/${w.id}`)}
                        title="360 View"
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', cursor: 'pointer' }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleImpersonate(w.id, w.name)}
                        title="Login As Workspace"
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', cursor: 'pointer', color: 'var(--color-blue-600)' }}
                      >
                        <Key size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(w.id, w.name, w.active)}
                        title={w.active ? 'Suspend Workspace' : 'Reactivate Workspace'}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-slate-200)',
                          background: '#FFF',
                          cursor: 'pointer',
                          color: w.active ? 'var(--color-red-600)' : 'var(--color-emerald-600)',
                        }}
                      >
                        <Ban size={14} />
                      </button>
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
