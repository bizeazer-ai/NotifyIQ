import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, PieChart, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const RevenueAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/billing/analytics');
      setAnalytics(data.data || data);
    } catch (err: any) {
      setError(err.message || 'Failed to load revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Revenue Analytics & Financial Health
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            SaaS unit economics — ARR, ARPU, Plan distribution, and Paid conversion performance
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Refresh Analytics
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Estimated ARR (USD)</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-emerald-600)' }}>
            ${(analytics?.overview?.arrUsd || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Annual Run Rate</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>ARPU (Average Revenue / Paid)</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-blue-600)' }}>
            ${analytics?.overview?.arpuUsd || 0}/mo
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Per paying workspace</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Paid Conversion Rate</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-amber-500)' }}>
            {analytics?.overview?.paidConversionRate || 0}%
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Free to Paid workspace conversion</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Paid Subscriptions</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>
            {analytics?.overview?.paidWorkspaces || 0}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Active recurring accounts</span>
        </div>
      </div>

      {/* Plan & Currency Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--admin-card-shadow)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Subscription Plan Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(analytics?.planDistribution || {}).map(([plan, count]: [string, any]) => (
              <div key={plan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{plan} Plan</span>
                <span className="badge badge-blue">{count} Workspaces</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--admin-card-shadow)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Billing Currency Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(analytics?.currencyDistribution || {}).map(([curr, count]: [string, any]) => (
              <div key={curr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)' }}>
                <span style={{ fontWeight: 600 }}>{curr} Currency</span>
                <span className="badge badge-green">{count} Workspaces</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
