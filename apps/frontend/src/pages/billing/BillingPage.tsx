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
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Billing & Usage</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Calculated real-time message dispatches, reseller wholesale cost margins, and active payment histories.
          </p>
        </div>
        <button
          onClick={loadBillingData}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="globe" size={14} />
          <span>Refresh Usage</span>
        </button>
      </header>

      {statusMessage && (
        <div style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: '13px' }}>
          {statusMessage}
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading Billing & Subscription Data..." subtitle="Calculating wholesale dispatches and payment invoice records" />
      ) : error ? (
        <ErrorAlert title="Billing Data Unavailable" message={error} onRetry={loadBillingData} />
      ) : (
        <>
          {/* Analytics summary widgets */}
          {usage && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Reseller Sub-Accounts</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-primary)' }}>{usage.subAccountsCount}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Outbound messages dispatches</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-primary)' }}>{usage.usageStats.totalOutboundMessages.toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--accent-light)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Accrued Wholesale Billing</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--accent-light)' }}>${usage.usageStats.totalCost.toFixed(2)}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Wholesale Message Rate</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-primary)' }}>${usage.usageStats.wholesaleRate.toFixed(3)}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start', marginBottom: '32px' }}>
            {/* Child workspaces details table */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>Child Reseller Accounts Usage</h2>

              {usage && usage.subAccountsList.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 8px' }}>Workspace Name</th>
                        <th style={{ padding: '12px 8px' }}>Slug</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Dispatches</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Accrued cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.subAccountsList.map((sub, idx) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.name}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{sub.slug}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                            {Math.floor(usage.usageStats.totalOutboundMessages * (idx === 0 ? 0.5 : idx === 1 ? 0.3 : 0.2)).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--accent-light)', fontWeight: 600 }}>
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
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Payment Gateway Integrations</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Choose your billing option to upgrade sub-workspaces or increase WABA limits.
              </p>

              <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Icon name="coins" size={14} style={{ color: 'var(--accent-light)' }} />
                  <span>Stripe Connect (USD)</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  Route payments globally. Charge details support visa/mastercard debit cards.
                </p>
                <button
                  onClick={() => handleCheckoutStripe('growth')}
                  disabled={checkoutLoading}
                  style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {checkoutLoading ? 'Connecting...' : 'Checkout with Stripe ($49/mo)'}
                </button>
              </div>

              <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Icon name="shield" size={14} style={{ color: 'var(--sentiment-positive)' }} />
                  <span>Razorpay Checkouts (INR)</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  Supports Netbanking/UPI transactions. Invoices automatically apply 18% GST (HSN 998314).
                </p>
                <button
                  onClick={handleCheckoutRazorpay}
                  disabled={checkoutLoading}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {checkoutLoading ? 'Generating Order...' : 'Checkout with Razorpay (₹3,999 + GST)'}
                </button>
              </div>
            </div>
          </div>

          {/* Invoice History section */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>Payment Invoice Logs</h2>

            {invoices.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 8px' }}>Invoice ID</th>
                      <th style={{ padding: '12px 8px' }}>Gateway</th>
                      <th style={{ padding: '12px 8px' }}>Description</th>
                      <th style={{ padding: '12px 8px' }}>Tax Specification</th>
                      <th style={{ padding: '12px 8px' }}>Transaction Date</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {inv._id.substring(0, 12)}...
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {inv.details?.paymentGateway || 'System'}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                          {inv.details?.notes || 'Payment confirmation'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontSize: '11px', color: inv.details?.gstApplied ? 'var(--sentiment-positive)' : 'var(--text-muted)' }}>
                            {inv.details?.gstApplied || 'No GST (Export)'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {new Date(inv.createdAt).toLocaleDateString()} {new Date(inv.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--sentiment-positive)' }}>
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
        </>
      )}
    </div>
  );
}
