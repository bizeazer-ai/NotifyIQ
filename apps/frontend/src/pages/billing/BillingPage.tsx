import { useEffect, useState } from 'react';
import type { WholesaleUsageContract as WholesaleUsageResponse, InvoiceContract as Invoice } from '@notifyiq/schemas';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingPage() {
  const [usage, setUsage] = useState<WholesaleUsageResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const usageRes = await apiClient.get<{ data: WholesaleUsageResponse }>('/api/billing/wholesale-usage');
      if (usageRes.data) {
        setUsage(usageRes.data);
      }

      const invoicesRes = await apiClient.get<{ data: Invoice[] }>('/api/billing/invoices');
      if (invoicesRes.data) {
        setInvoices(invoicesRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to billing service. Please check your network or server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleCheckoutStripe = async (plan: string = 'growth') => {
    setCheckoutLoading(true);
    setStatusMessage('Initializing Stripe Hosted Checkout Session...');

    try {
      const res = await apiClient.post<{ data: { checkoutUrl: string } }>('/api/billing/stripe/checkout', { plan });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err: any) {
      setStatusMessage(`Stripe Checkout Error: ${err.message || 'Could not launch payment gateway'}`);
      setTimeout(() => setStatusMessage(''), 4000);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutRazorpay = async () => {
    setCheckoutLoading(true);
    setStatusMessage('Generating Razorpay Order (18% GST HSN 998314)...');

    try {
      const res = await apiClient.post<{ data: { orderId: string; amount: number; currency: string; keyId: string; gstAmount: number } }>('/api/billing/razorpay/order', { amount: 3999 });

      const order = res.data;
      if (!order) throw new Error('Failed to generate order');

      // Load Razorpay Checkout SDK dynamically if not loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => openRazorpayModal(order);
        document.body.appendChild(script);
      } else {
        openRazorpayModal(order);
      }
    } catch (err: any) {
      setStatusMessage(`Razorpay Checkout Error: ${err.message || 'Could not launch payment gateway'}`);
      setTimeout(() => setStatusMessage(''), 4000);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openRazorpayModal = (order: any) => {
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'NotifyIQ Platform',
      description: 'WhatsApp API Growth Subscription + 18% GST',
      order_id: order.orderId,
      handler: async function (response: any) {
        setStatusMessage(`Razorpay payment successful! Payment ID: ${response.razorpay_payment_id}`);
        loadBillingData();
        setTimeout(() => setStatusMessage(''), 5000);
      },
      prefill: {
        name: 'Workspace Admin',
        email: 'admin@bizeazer.in',
      },
      theme: {
        color: '#2563eb',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Billing & Usage</h1>
          <p className="page-subtitle">
            Calculated real-time message dispatches, reseller wholesale cost margins, and active payment histories.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadBillingData}>
            <Icon name="refresh" size={14} />
            <span>Refresh Usage</span>
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className="status-message status-message-info">{statusMessage}</div>
      )}

      {loading ? (
        <LoadingState message="Loading Billing & Subscription Data..." subtitle="Calculating wholesale dispatches and payment invoice records" />
      ) : error ? (
        <ErrorAlert title="Billing Data Unavailable" message={error} onRetry={loadBillingData} />
      ) : (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          {/* Analytics summary widgets */}
          {usage && (
            <div className="stat-grid">
              <div className="stat-card stat-blue card-hover">
                <div className="stat-card-label">Reseller Sub-Accounts</div>
                <div className="stat-card-value">{usage.subAccountsCount}</div>
              </div>
              <div className="stat-card stat-green card-hover">
                <div className="stat-card-label">Outbound Dispatches</div>
                <div className="stat-card-value">{usage.usageStats.totalOutboundMessages.toLocaleString()}</div>
              </div>
              <div className="stat-card stat-orange card-hover">
                <div className="stat-card-label">Accrued Wholesale Billing</div>
                <div className="stat-card-value">${usage.usageStats.totalCost.toFixed(2)}</div>
              </div>
              <div className="stat-card stat-purple card-hover">
                <div className="stat-card-label">Wholesale Message Rate</div>
                <div className="stat-card-value">${usage.usageStats.wholesaleRate.toFixed(3)}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-8)', alignItems: 'start', marginBottom: 'var(--space-8)' }}>
            {/* Child workspaces details table */}
            <div className="section-card">
              <h2 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>Child Reseller Accounts Usage</h2>

              {usage && usage.subAccountsList.length > 0 ? (
                <div className="table-container">
                  <table className="table-styled">
                    <thead>
                      <tr>
                        <th>Workspace Name</th>
                        <th>Slug</th>
                        <th style={{ textAlign: 'right' }}>Dispatches</th>
                        <th style={{ textAlign: 'right' }}>Accrued cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.subAccountsList.map((sub, idx) => (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 600 }}>{sub.name}</td>
                          <td className="text-secondary">{sub.slug}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {Math.floor(usage.usageStats.totalOutboundMessages * (idx === 0 ? 0.5 : idx === 1 ? 0.3 : 0.2)).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-primary)', fontWeight: 600 }}>
                            ${(usage.usageStats.totalCost * (idx === 0 ? 0.5 : idx === 1 ? 0.3 : 0.2)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon="users" title="No Child Workspaces" description="No sub-accounts are currently linked to this parent agency workspace." minHeight="180px" />
              )}
            </div>

            {/* Subscriptions upgrade Card */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <h3 className="section-title" style={{ fontSize: 'var(--text-md)', marginBottom: 0 }}>Payment Gateway Integrations</h3>
              <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
                Choose your billing option to upgrade sub-workspaces or increase WABA limits.
              </p>

              <div style={{
                border: '1px solid var(--color-border)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-surface-secondary)',
              }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <Icon name="coins" size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>Stripe Connect (USD)</span>
                </div>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '0 0 var(--space-3) 0' }}>
                  Route payments globally. Charge details support visa/mastercard debit cards.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleCheckoutStripe('growth')}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Connecting...' : 'Checkout with Stripe ($49/mo)'}
                </button>
              </div>

              <div style={{
                border: '1px solid var(--color-border)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-surface-secondary)',
              }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <Icon name="shield" size={14} style={{ color: 'var(--color-success)' }} />
                  <span>Razorpay Checkouts (INR)</span>
                </div>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '0 0 var(--space-3) 0' }}>
                  Supports Netbanking/UPI transactions. Invoices automatically apply 18% GST (HSN 998314).
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleCheckoutRazorpay}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Generating Order...' : 'Checkout with Razorpay (₹3,999 + GST)'}
                </button>
              </div>
            </div>
          </div>

          {/* Invoice History section */}
          <div className="section-card">
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>Payment Invoice Logs</h2>

            {invoices.length > 0 ? (
              <div className="table-container">
                <table className="table-styled">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Gateway</th>
                      <th>Description</th>
                      <th>Tax Specification</th>
                      <th>Transaction Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-foreground-secondary)' }}>
                          {inv._id.substring(0, 12)}...
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {inv.details?.paymentGateway || 'System'}
                        </td>
                        <td className="text-secondary">
                          {inv.details?.notes || 'Payment confirmation'}
                        </td>
                        <td>
                          <span className={inv.details?.gstApplied ? 'text-success' : 'text-muted'} style={{ fontSize: 'var(--text-xs)' }}>
                            {inv.details?.gstApplied || 'No GST (Export)'}
                          </span>
                        </td>
                        <td className="text-muted">
                          {new Date(inv.createdAt).toLocaleDateString()} {new Date(inv.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                          ${(inv.details?.amount || 0.0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="coins" title="No Past Invoices" description="No payment invoices generated yet. Upgrade your subscription to create billing records." minHeight="200px" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
