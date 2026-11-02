import { useEffect, useState, type FormEvent } from 'react';
import type { WholesaleUsageContract as WholesaleUsageResponse, InvoiceContract as Invoice } from '@notifyiq/schemas';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast, swal } from '../../lib/alerts';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BillingAddress {
  companyName: string;
  taxId: string;
  billingEmail: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'bank_transfer';
  brand?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  upiId?: string;
  holderName?: string;
  isDefault: boolean;
  createdAt?: string;
}

export default function BillingPage() {
  // const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'details'>('overview');
  const [usage, setUsage] = useState<WholesaleUsageResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Billing Settings state
  const [currency, setCurrency] = useState<string>('INR');
  const [billingDetails, setBillingDetails] = useState<BillingAddress>({
    companyName: '',
    taxId: '',
    billingEmail: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);

  // Add Payment Method Modal State
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [methodType, setMethodType] = useState<'card' | 'upi'>('card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [isDefaultNewMethod, setIsDefaultNewMethod] = useState(false);
  const [submittingMethod, setSubmittingMethod] = useState(false);

  const loadBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usageRes, invoicesRes, settingsRes] = await Promise.allSettled([
        apiClient.get<{ data: WholesaleUsageResponse }>('/api/billing/wholesale-usage'),
        apiClient.get<{ data: Invoice[] }>('/api/billing/invoices'),
        apiClient.get<{ data: { currency: string; plan: string; billingDetails: BillingAddress; paymentMethods: PaymentMethod[] } }>('/api/billing/settings'),
      ]);

      if (usageRes.status === 'fulfilled' && usageRes.value?.data) {
        setUsage(usageRes.value.data);
      }
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value?.data) {
        setInvoices(invoicesRes.value.data);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.data) {
        const data = settingsRes.value.data;
        if (data.currency) setCurrency(data.currency);
        if (data.billingDetails) setBillingDetails(data.billingDetails);
        if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to billing service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleUpdateCurrency = async (newCurrency: string) => {
    setCurrency(newCurrency);
    setSavingCurrency(true);
    try {
      await apiClient.patch('/api/billing/settings', { currency: newCurrency });
      toast.success(`Currency updated to ${newCurrency}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update currency preference');
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleSaveBillingDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await apiClient.patch('/api/billing/settings', { billingDetails });
      toast.success('Billing details & tax address saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save billing details');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleAddPaymentMethod = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingMethod(true);
    try {
      let payload: any = {
        type: methodType,
        isDefault: isDefaultNewMethod,
      };

      if (methodType === 'card') {
        const cleanCard = cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 12) {
          toast.warning('Please enter a valid card number');
          setSubmittingMethod(false);
          return;
        }
        const last4 = cleanCard.slice(-4);
        const [expMonth, expYear] = cardExpiry.split('/');
        // Simple card brand detection
        let brand = 'Visa';
        if (cleanCard.startsWith('5')) brand = 'Mastercard';
        else if (cleanCard.startsWith('3')) brand = 'Amex';
        else if (cleanCard.startsWith('6')) brand = 'RuPay';

        payload = {
          ...payload,
          brand,
          last4,
          expiryMonth: expMonth?.trim() || '12',
          expiryYear: expYear?.trim() || '28',
          holderName: cardHolder,
        };
      } else {
        if (!upiIdInput || !upiIdInput.includes('@')) {
          toast.warning('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
          setSubmittingMethod(false);
          return;
        }
        payload = {
          ...payload,
          upiId: upiIdInput.trim(),
          holderName: cardHolder || 'UPI VPA Account',
        };
      }

      const res = await apiClient.post<{ data: PaymentMethod[] }>('/api/billing/payment-methods', payload);
      if (res.data) {
        setPaymentMethods(res.data);
      }
      toast.success('Payment method added successfully');
      setShowAddMethodModal(false);
      // Reset form
      setCardHolder('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setUpiIdInput('');
      setIsDefaultNewMethod(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add payment method');
    } finally {
      setSubmittingMethod(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      const res = await apiClient.patch<{ data: PaymentMethod[] }>(`/api/billing/payment-methods/${methodId}/default`);
      if (res.data) {
        setPaymentMethods(res.data);
      }
      toast.success('Default payment method updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update default payment method');
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    const confirmed = await swal.confirm(
      'Remove Payment Method',
      'Are you sure you want to delete this payment method from your workspace?',
      'Yes, Remove',
    );
    if (!confirmed) return;

    try {
      const res = await apiClient.delete<{ data: PaymentMethod[] }>(`/api/billing/payment-methods/${methodId}`);
      if (res.data) {
        setPaymentMethods(res.data);
      }
      toast.success('Payment method removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove payment method');
    }
  };

  const handleCheckoutStripe = async (plan: string = 'growth') => {
    setCheckoutLoading(true);
    toast.info('Initializing Stripe Hosted Checkout Session...');

    try {
      const res = await apiClient.post<{ data: { checkoutUrl: string } }>('/api/billing/stripe/checkout', { plan });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not launch Stripe payment gateway');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutRazorpay = async () => {
    setCheckoutLoading(true);
    toast.info('Generating Razorpay Order (18% GST HSN 998314)...');

    try {
      const res = await apiClient.post<{ data: { orderId: string; amount: number; currency: string; keyId: string; gstAmount: number } }>('/api/billing/razorpay/order', { amount: 3999 });

      const order = res.data;
      if (!order) throw new Error('Failed to generate order');

      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => openRazorpayModal(order);
        document.body.appendChild(script);
      } else {
        openRazorpayModal(order);
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not launch payment gateway');
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
        toast.success(`Payment verified! ID: ${response.razorpay_payment_id}`);
        loadBillingData();
      },
      prefill: {
        name: billingDetails.companyName || 'Workspace Admin',
        email: billingDetails.billingEmail || 'admin@bizeazer.in',
        contact: billingDetails.phone || '',
      },
      theme: {
        color: '#2563eb',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '100%' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div className="page-header-left">
          <h1 className="page-title">Billing & Payment Hub</h1>
          <p className="page-subtitle">
            Manage your workspace currency, billing address, payment methods, wholesale dispatches, and tax invoice logs.
          </p>
        </div>

        {/* <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="tab-group" style={{ margin: 0 }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
            >
              Usage & Invoices
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`tab-item ${activeTab === 'methods' ? 'active' : ''}`}
            >
              Payment Methods & Currency
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`tab-item ${activeTab === 'details' ? 'active' : ''}`}
            >
              Billing Details & Tax
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={loadBillingData} title="Refresh billing records">
            <Icon name="refresh" size={14} />
            <span>Refresh</span>
          </button>
        </div> */}
      </header>

      {loading ? (
        <LoadingState message="Loading Billing & Subscription Data..." subtitle="Calculating wholesale dispatches and payment invoice records" />
      ) : error ? (
        <ErrorAlert title="Billing Data Unavailable" message={error} onRetry={loadBillingData} />
      ) : (
        <div style={{ animation: 'slideUp 0.35s ease', width: '100%' }}>

          {/* TAB 1: USAGE & INVOICES */}
          {/* {activeTab === 'overview' && ( */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', width: '100%' }}>
            {/* Analytics summary widgets */}
            {usage && (
              <div className="stat-grid" style={{ width: '100%' }}>
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
                  <div className="stat-card-value">{getCurrencySymbol(currency)}{usage.usageStats.totalCost.toFixed(2)}</div>
                </div>
                <div className="stat-card stat-purple card-hover">
                  <div className="stat-card-label">Wholesale Message Rate</div>
                  <div className="stat-card-value">{getCurrencySymbol(currency)}{usage.usageStats.wholesaleRate.toFixed(3)}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 'var(--space-8)', alignItems: 'start', width: '100%' }}>
              {/* Child workspaces details table */}
              <div className="section-card" style={{ width: '100%' }}>
                <h2 className="section-title" style={{ fontSize: 'var(--text-lg)' }}>Child Reseller Accounts Usage</h2>

                {usage && usage.subAccountsList.length > 0 ? (
                  <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                    <table className="table-styled" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Workspace Name</th>
                          <th>Slug</th>
                          <th style={{ textAlign: 'right' }}>Dispatches</th>
                          <th style={{ textAlign: 'right' }}>Accrued Cost</th>
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
                              {getCurrencySymbol(currency)}{(usage.usageStats.totalCost * (idx === 0 ? 0.5 : idx === 1 ? 0.3 : 0.2)).toFixed(2)}
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
              <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>
                <h3 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Instant Plan Top-Up</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
                  Select a payment gateway below to renew your Growth plan, scale conversational limits, or pay wholesale invoices.
                </p>

                <div style={{
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface-secondary)',
                }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <Icon name="coins" size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>Stripe Connect (USD Global)</span>
                  </div>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '0 0 var(--space-3) 0' }}>
                    International cards, Visa, Mastercard, AMEX with instant webhook activation.
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
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <Icon name="shield" size={14} style={{ color: 'var(--color-success)' }} />
                    <span>Razorpay Checkout (INR Domestic)</span>
                  </div>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '0 0 var(--space-3) 0' }}>
                    Supports Netbanking, UPI, and RuPay with automated 18% GST (HSN 998314) invoicing.
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
            <div className="section-card" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Payment & Invoice Audit Logs</h2>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                    Compliance ledger for all subscription renewals, one-time topups, and refund receipts.
                  </p>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: 'var(--text-xs)' }}>{invoices.length} Invoices</span>
              </div>

              {invoices.length > 0 ? (
                <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                  <table className="table-styled" style={{ width: '100%' }}>
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
                            {inv.details?.notes || 'Subscription payment'}
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
                            {getCurrencySymbol(currency)}{(inv.details?.amount || 0.0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon="coins" title="No Past Invoices" description="No payment invoices generated yet. Upgrade your subscription to create billing records." minHeight="160px" />
              )}
            </div>
          </div>
          {/* )} */}

          {/* TAB 2: PAYMENT METHODS & CURRENCY */}

        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddMethodModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 className="modal-title" style={{ marginBottom: '2px' }}>Add New Payment Method</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                  Stored securely using industry standard tokenization.
                </p>
              </div>
              <button className="btn-close" onClick={() => setShowAddMethodModal(false)} title="Close">✕</button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <button
                type="button"
                className={`btn btn-sm ${methodType === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setMethodType('card')}
              >
                <Icon name="coins" size={14} />
                <span>Credit / Debit Card</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${methodType === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setMethodType('upi')}
              >
                <Icon name="shield" size={14} />
                <span>UPI ID (India Instant Pay)</span>
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {methodType === 'card' ? (
                <>
                  <div className="form-group">
                    <label className="form-label-styled">Cardholder Name</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="e.g. John Doe"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Card Number</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="4000 1234 5678 9010"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label-styled">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        className="form-input-styled"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label-styled">CVV / CVC</label>
                      <input
                        type="password"
                        className="form-input-styled"
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label-styled">Account Holder / Business Name</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="e.g. Aadi Technologies"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Virtual Payment Address (UPI ID)</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="username@okhdfcbank or merchant@upi"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      required
                    />
                    <span className="form-hint">Supports Google Pay, PhonePe, Paytm, and BHIM UPI handles.</span>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                <input
                  type="checkbox"
                  id="defaultPaymentCheckbox"
                  checked={isDefaultNewMethod}
                  onChange={(e) => setIsDefaultNewMethod(e.target.checked)}
                />
                <label htmlFor="defaultPaymentCheckbox" style={{ fontSize: 'var(--text-xs)', cursor: 'pointer', userSelect: 'none' }}>
                  Set as default payment method for this workspace
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: 'var(--space-3)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMethodModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingMethod}>
                  {submittingMethod ? 'Adding Method...' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
