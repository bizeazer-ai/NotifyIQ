import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const ExecutiveReportsPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/reports/summary');
      setReport(data.data || data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Scheduled Executive KPI Reports
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Automated PDF and Excel platform performance reporting for executive stakeholders
          </p>
        </div>
        <button onClick={fetchReport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-card-border)', background: '#FFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Generate Summary
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Generated Report Card */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--admin-card-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--admin-card-border)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{report?.title || 'Executive KPI Summary'}</h2>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Period: {report?.period} • Generated: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'Just now'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => alert('Exporting PDF...')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'var(--color-blue-600)', color: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Export PDF
            </button>
            <button onClick={() => alert('Exporting Excel...')} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', background: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Export Excel
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--color-slate-50)', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Total Workspaces</span>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px' }}>{report?.kpis?.totalWorkspaces || 0}</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-slate-50)', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Paid Subscriptions</span>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px', color: 'var(--color-blue-600)' }}>{report?.kpis?.paidWorkspaces || 0}</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-slate-50)', padding: '16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>30-Day Message Traffic</span>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px', color: 'var(--color-emerald-600)' }}>{(report?.kpis?.outboundMessages30d || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
