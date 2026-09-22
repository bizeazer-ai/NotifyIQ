import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Search, RefreshCw } from 'lucide-react';
import { adminFetch, ADMIN_TOKEN_KEY } from '../../lib/api';

export const AuditViewerPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch(`/api/admin/compliance/audit-log?entity=${entityFilter}`);
      setLogs(data.data?.data || data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter]);

  const handleExportCsv = () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const url = `/api/admin/compliance/audit-log/export?entity=${entityFilter}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `admin_audit_log_${Date.now()}.csv`;
        link.click();
      })
      .catch(() => alert('Failed to download CSV export'));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Cross-Platform Audit Trail & Compliance Log
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Immutable 7-year audit records for regulatory compliance (DPDP 2023 / GDPR)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCsv} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-blue-600)', color: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={fetchAuditLogs} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
          <input
            type="text"
            placeholder="Filter by target entity (e.g. WORKSPACE, BILLING)..."
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--color-slate-200)', fontSize: '13px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--admin-card-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '14px 20px' }}>Admin Email</th>
              <th style={{ padding: '14px 16px' }}>Role</th>
              <th style={{ padding: '14px 16px' }}>Action</th>
              <th style={{ padding: '14px 16px' }}>Target Entity</th>
              <th style={{ padding: '14px 16px' }}>IP Address</th>
              <th style={{ padding: '14px 20px' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading audit records...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No audit log entries found matching criteria.</td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l._id || l.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{l.adminEmail}</td>
                  <td style={{ padding: '14px 16px' }}><span className="badge badge-blue">{l.role}</span></td>
                  <td style={{ padding: '14px 16px' }}><code>{l.action}</code></td>
                  <td style={{ padding: '14px 16px' }}>{l.targetEntity}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--admin-text-muted)' }}>{l.ipAddress || '127.0.0.1'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--admin-text-muted)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
