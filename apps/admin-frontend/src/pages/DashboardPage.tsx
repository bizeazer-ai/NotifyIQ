import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  MessageSquare,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { adminFetch } from '../lib/api';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/dashboard/stats');
      setStats(data.data || data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Platform Overview — Mission Control
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Real-time status across tenant workspaces, infrastructure, WABA connections, and billing
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#FFF',
            border: '1px solid var(--admin-card-border)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--admin-text-primary)',
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: 'var(--admin-card-shadow)',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'var(--color-red-50)',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '24px',
          color: 'var(--color-red-600)',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {/* Total Workspaces */}
        <div style={{
          backgroundColor: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-card-border)',
          borderRadius: 'var(--admin-card-radius)',
          padding: '20px',
          boxShadow: 'var(--admin-card-shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Workspaces</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-blue-50)', color: 'var(--color-blue-600)' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            {loading ? '...' : stats?.workspaces?.total || 0}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
            <span className="badge badge-green">{stats?.workspaces?.active || 0} Active</span>
            {stats?.workspaces?.suspended > 0 && (
              <span className="badge badge-red">{stats?.workspaces?.suspended} Suspended</span>
            )}
          </div>
        </div>

        {/* 24h Message Volume */}
        <div style={{
          backgroundColor: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-card-border)',
          borderRadius: 'var(--admin-card-radius)',
          padding: '20px',
          boxShadow: 'var(--admin-card-shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>24h Message Traffic</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F0FDF4', color: 'var(--color-emerald-600)' }}>
              <MessageSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            {loading ? '...' : (stats?.messaging?.sent24h || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px', display: 'block' }}>
            Outbound WhatsApp & Webhook dispatch
          </span>
        </div>

        {/* Estimated MRR */}
        <div style={{
          backgroundColor: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-card-border)',
          borderRadius: 'var(--admin-card-radius)',
          padding: '20px',
          boxShadow: 'var(--admin-card-shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Estimated MRR</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-amber-50)', color: 'var(--color-amber-500)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            {loading ? '...' : `$${(stats?.revenue?.estimatedMrrUsd || 0).toLocaleString()}`}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px', display: 'block' }}>
            Reconciled across Razorpay & Stripe
          </span>
        </div>

        {/* WABA Health */}
        <div style={{
          backgroundColor: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-card-border)',
          borderRadius: 'var(--admin-card-radius)',
          padding: '20px',
          boxShadow: 'var(--admin-card-shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>WABA Health</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-blue-50)', color: 'var(--color-blue-600)' }}>
              <Zap size={20} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            {loading ? '...' : `${stats?.wabaHealth?.green || 0} / ${stats?.wabaHealth?.totalConnected || 0}`}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
            <span className="badge badge-green">{stats?.wabaHealth?.green || 0} Healthy</span>
            {stats?.wabaHealth?.yellow > 0 && <span className="badge badge-amber">{stats?.wabaHealth?.yellow} Warning</span>}
            {stats?.wabaHealth?.red > 0 && <span className="badge badge-red">{stats?.wabaHealth?.red} Critical</span>}
          </div>
        </div>
      </div>

      {/* Grid: System Status & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* System & Queue Infrastructure */}
        <div style={{
          backgroundColor: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-card-border)',
          borderRadius: 'var(--admin-card-radius)',
          padding: '24px',
          boxShadow: 'var(--admin-card-shadow)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--color-blue-600)" />
            <span>Infrastructure Traffic-Lights</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color={stats?.systemHealth?.mongoConnected !== false ? 'var(--color-emerald-600)' : 'var(--color-red-600)'} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>MongoDB Database Cluster</span>
              </div>
              <span className={`badge ${stats?.systemHealth?.mongoConnected !== false ? 'badge-green' : 'badge-red'}`}>
                {stats?.systemHealth?.mongoConnected !== false ? 'OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color={stats?.systemHealth?.redisConnected !== false ? 'var(--color-emerald-600)' : 'var(--color-red-600)'} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Redis Queue Host (BullMQ Cluster)</span>
              </div>
              <span className={`badge ${stats?.systemHealth?.redisConnected !== false ? 'badge-green' : 'badge-red'}`}>
                {stats?.systemHealth?.redisConnected !== false ? 'OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color={stats?.systemHealth?.status === 'operational' ? 'var(--color-emerald-600)' : 'var(--color-amber-500)'} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Meta WhatsApp Business API Gateway</span>
              </div>
              <span className={`badge ${stats?.systemHealth?.status === 'operational' ? 'badge-green' : 'badge-amber'}`}>
                {stats?.systemHealth?.status === 'operational' ? 'CONNECTED' : 'WARNING'}
              </span>
            </div>
          </div>
        </div>

        {/* Support & Admin Shortcuts */}
        <div style={{
          backgroundColor: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-card-border)',
          borderRadius: 'var(--admin-card-radius)',
          padding: '24px',
          boxShadow: 'var(--admin-card-shadow)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: '16px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="/workspaces"
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-slate-800)',
                textDecoration: 'none',
                backgroundColor: 'var(--color-slate-50)',
              }}
            >
              Search or Impersonate Workspace →
            </a>
            <a
              href="/compliance"
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-slate-800)',
                textDecoration: 'none',
                backgroundColor: 'var(--color-slate-50)',
              }}
            >
              Process Erasure Requests →
            </a>
            <a
              href="/security"
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-slate-800)',
                textDecoration: 'none',
                backgroundColor: 'var(--color-slate-50)',
              }}
            >
              Audit Log & Active Sessions →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
