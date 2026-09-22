import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, RefreshCw, Filter, ArrowUpRight, RotateCcw, AlertCircle } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const AdminBillingDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundWorkspaceId, setRefundWorkspaceId] = useState('');
  const [refundGateway, setRefundGateway] = useState<'Stripe' | 'Razorpay'>('Razorpay');
  const [refundTxId, setRefundTxId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const fetchBillingData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, invoiceData] = await Promise.all([
        adminFetch('/api/admin/billing/overview'),
        adminFetch(`/api/admin/billing/invoices?gateway=${gatewayFilter}&status=${statusFilter}`),
      ]);
      setOverview(overviewData.data || overviewData);
      setInvoices(invoiceData.data?.data || invoiceData.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [gatewayFilter, statusFilter]);

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason) {
      alert('Mandatory audit reason required');
      return;
    }
    setRefunding(true);
    try {
      await adminFetch('/api/admin/billing/refund', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: refundWorkspaceId,
          paymentGateway: refundGateway,
          transactionId: refundTxId,
          amount: parseFloat(refundAmount),
          reasonCode: refundReason,
        }),
      });
      alert('Refund successfully processed and audited!');
      setShowRefundModal(false);
      setRefundTxId('');
      setRefundAmount('');
      setRefundReason('');
      fetchBillingData();
    } catch (err: any) {
      alert(err.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Financial & Billing Oversight
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Reconciled revenue across Razorpay (INR) and Stripe (USD/EUR) with refund controls
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowRefundModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-orange-600)',
              color: '#FFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} /> Issue Refund
          </button>
          <button
            onClick={fetchBillingData}
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

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Total Paying Workspaces</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{overview?.metrics?.payingWorkspaces || 0}</div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Out of {overview?.metrics?.totalWorkspaces || 0} total</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>MRR (INR Rail - Razorpay)</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-blue-600)' }}>
            ₹{(overview?.metrics?.mrr?.inr || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Inclusive 18% GST (HSN 998314)</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>MRR (USD Rail - Stripe)</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-emerald-600)' }}>
            ${(overview?.metrics?.mrr?.usd || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Global subscriptions</span>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Reconciled Total MRR (USD)</span>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--admin-text-primary)' }}>
            ${(overview?.metrics?.mrr?.reconciledUsdTotal || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Combined converted estimate</span>
        </div>
      </div>

      {/* Invoices Table Header & Filter Toolbar */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--admin-card-shadow)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Transaction & Invoice Search</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', fontSize: '13px' }}
            >
              <option value="">All Gateways</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Stripe">Stripe</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-slate-200)', fontSize: '13px' }}
            >
              <option value="">All Statuses</option>
              <option value="success">Payment Succeeded</option>
              <option value="failed">Payment Failed</option>
            </select>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '12px 20px' }}>Workspace ID</th>
              <th style={{ padding: '12px 16px' }}>Gateway</th>
              <th style={{ padding: '12px 16px' }}>Event Action</th>
              <th style={{ padding: '12px 16px' }}>Amount</th>
              <th style={{ padding: '12px 20px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  Loading transactions...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  No billing log records found.
                </td>
              </tr>
            ) : (
              invoices.map((inv: any) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>
                    <code>{inv.workspaceId}</code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${inv.gateway === 'Razorpay' ? 'badge-blue' : 'badge-green'}`}>
                      {inv.gateway}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{inv.action}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {inv.currency === 'INR' ? '₹' : '$'}{inv.amount}
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--admin-text-muted)' }}>
                    {new Date(inv.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Refund Modal */}
      {showRefundModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Process Manual Refund</h2>
            <form onSubmit={handleProcessRefund}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Workspace ID</label>
                <input type="text" required placeholder="Workspace ObjectId" value={refundWorkspaceId} onChange={(e) => setRefundWorkspaceId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Payment Gateway Rail</label>
                <select value={refundGateway} onChange={(e) => setRefundGateway(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }}>
                  <option value="Razorpay">Razorpay (INR)</option>
                  <option value="Stripe">Stripe (USD/EUR)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Transaction / Payment ID</label>
                <input type="text" required placeholder="pay_... or ch_..." value={refundTxId} onChange={(e) => setRefundTxId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Refund Amount (Major Units e.g. 3999 or 49)</label>
                <input type="number" required placeholder="3999" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Mandatory Audit Reason Code</label>
                <input type="text" required placeholder="e.g. Duplicate charge / SLA breach refund" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRefundModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--color-slate-300)', background: '#FFF' }}>
                  Cancel
                </button>
                <button type="submit" disabled={refunding} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--color-orange-600)', color: '#FFF', fontWeight: 600 }}>
                  {refunding ? 'Processing...' : 'Execute Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
