import React, { useState, useEffect } from 'react';
import { Shield, Users, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const SecurityCenterPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [failedLogins, setFailedLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSecurityData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sessionsData, failedData] = await Promise.all([
        adminFetch('/api/admin/security/sessions'),
        adminFetch('/api/admin/security/failed-logins'),
      ]);
      setSessions(sessionsData.data || sessionsData || []);
      setFailedLogins(failedData.data || failedData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load security center metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleRevokeSession = async (id: string, email: string) => {
    if (!window.confirm(`Force terminate session for admin '${email}'?`)) return;
    try {
      await adminFetch(`/api/admin/security/sessions/${id}`, { method: 'DELETE' });
      alert('Session terminated.');
      fetchSecurityData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Security Center & Session Management
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Active admin session monitoring, force revocation, and failed login lockout tracking
          </p>
        </div>
        <button onClick={fetchSecurityData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh Security State
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Active Sessions Panel */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--admin-card-shadow)', marginBottom: '28px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-card-border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Active SuperAdmin Sessions</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '14px 20px' }}>SuperAdmin Email</th>
              <th style={{ padding: '14px 16px' }}>Role</th>
              <th style={{ padding: '14px 16px' }}>IP Address</th>
              <th style={{ padding: '14px 16px' }}>Last Activity</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading active sessions...</td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No active sessions recorded.</td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{s.adminEmail}</td>
                  <td style={{ padding: '14px 16px' }}><span className="badge badge-blue">{s.role}</span></td>
                  <td style={{ padding: '14px 16px', color: 'var(--admin-text-muted)' }}>{s.ipAddress}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--admin-text-muted)' }}>{new Date(s.lastActivityAt).toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button onClick={() => handleRevokeSession(s.id, s.adminEmail)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', color: 'var(--color-red-600)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <XCircle size={12} /> Force Terminate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Failed Logins & Lockouts */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--admin-card-shadow)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-card-border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Failed Logins & Lockout Audit</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '14px 20px' }}>SuperAdmin Email</th>
              <th style={{ padding: '14px 16px' }}>Failed Attempts</th>
              <th style={{ padding: '14px 16px' }}>Lockout Status</th>
              <th style={{ padding: '14px 20px' }}>Lockout Expires</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading lockout monitor...</td>
              </tr>
            ) : failedLogins.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No failed login attempts recorded. All admin accounts clear.</td>
              </tr>
            ) : (
              failedLogins.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{f.email}</td>
                  <td style={{ padding: '14px 16px' }}><span className="badge badge-amber">{f.failedLoginAttempts} Failed</span></td>
                  <td style={{ padding: '14px 16px' }}>
                    {f.isLockedOut ? <span className="badge badge-red">LOCKED OUT</span> : <span className="badge badge-green">CLEAR</span>}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--admin-text-muted)' }}>
                    {f.lockoutUntil ? new Date(f.lockoutUntil).toLocaleString() : 'N/A'}
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
