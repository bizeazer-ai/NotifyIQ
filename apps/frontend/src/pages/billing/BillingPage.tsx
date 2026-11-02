import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { WholesaleUsageContract as WholesaleUsageResponse, InvoiceContract as Invoice } from '@notifyiq/schemas';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast, swal } from '../../lib/alerts';
import { CheckoutModal } from '../../components/billing/CheckoutModal';

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

interface ItemizedInvoice {
  invoiceNumber: string;
  date: string;
  paidAt: string;
  status: string;
  paymentGateway: string;
  paymentMethodUsed: string;
  transactionId: string;
  plan: string;
  currency: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstRate: string;
  hsnSacCode: string;
  seller: {
    legalName: string;
    brandName: string;
    website: string;
    description: string;
    gstin: string;
    hsnCode: string;
    address: string;
    supportEmail: string;
  };
  buyer: {
    workspaceName: string;
    companyName: string;
    taxId: string;
    billingEmail: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  lineItems: Array<{
    description: string;
    hsnSac: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    total: number;
  }>;
}

export default function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [usage, setUsage] = useState<WholesaleUsageResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutGateway, setCheckoutGateway] = useState<'razorpay' | 'stripe'>('razorpay');

  // Subscription lifecycle state
  const [plan, setPlan] = useState<string>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelingSub, setCancelingSub] = useState(false);

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

  // Itemized Invoice View / Print Modal
  const [selectedInvoice, setSelectedInvoice] = useState<ItemizedInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  const loadBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usageRes, invoicesRes, settingsRes] = await Promise.allSettled([
        apiClient.get<{ data: WholesaleUsageResponse }>('/api/billing/wholesale-usage'),
        apiClient.get<{ data: Invoice[] }>('/api/billing/invoices'),
        apiClient.get<{ data: { currency: string; plan: string; subscriptionStatus?: string; cancelAtPeriodEnd?: boolean; currentPeriodEnd?: string | null; billingDetails: BillingAddress; paymentMethods: PaymentMethod[] } }>('/api/billing/settings'),
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
        if (data.plan) setPlan(data.plan);
        if (data.subscriptionStatus) setSubscriptionStatus(data.subscriptionStatus);
        if (data.cancelAtPeriodEnd !== undefined) setCancelAtPeriodEnd(data.cancelAtPeriodEnd);
        if (data.currentPeriodEnd) setCurrentPeriodEnd(data.currentPeriodEnd);
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

  // Handle Stripe return redirect: ?session_id=cs_...&success=true
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isSuccess = searchParams.get('success');
    const isCanceled = searchParams.get('canceled');

    if (sessionId && isSuccess === 'true') {
      const verifyStripe = async () => {
        try {
          toast.info('Verifying Stripe checkout session with bank...');
          const res = await apiClient.post<{ message: string }>('/api/billing/stripe/verify', { sessionId });
          toast.success(res.message || 'Subscription successfully activated via Stripe!');
          loadBillingData();
        } catch (err: any) {
          toast.error(err.message || 'Failed to verify Stripe checkout session');
        } finally {
          setSearchParams({}, { replace: true });
        }
      };
      verifyStripe();
    } else if (isCanceled === 'true') {
      toast.warning('Stripe checkout was canceled. No charges were made.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

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

  const handleCancelSubscription = async () => {
    const confirmed = await swal.confirm(
      'Cancel Subscription Auto-Renewal',
      'Are you sure you want to cancel auto-renewal? You will keep full access to your plan features until the end of the current billing cycle.',
      'Yes, Cancel Auto-Renewal',
    );
    if (!confirmed) return;

    setCancelingSub(true);
    try {
      const res = await apiClient.post<{ message: string }>('/api/billing/cancel-subscription', {
        reason: 'User canceled auto-renewal from Billing Hub',
      });
      toast.success(res.message || 'Subscription auto-renewal canceled.');
      loadBillingData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel subscription.');
    } finally {
      setCancelingSub(false);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    setLoadingInvoiceId(invoiceId);
    try {
      const res = await apiClient.get<{ data: ItemizedInvoice }>(`/api/billing/invoices/${invoiceId}`);
      if (res.data) {
        setSelectedInvoice(res.data);
        setShowInvoiceModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not load itemized invoice details.');
    } finally {
      setLoadingInvoiceId(null);
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
        try {
          toast.info('Verifying payment and capturing funds with Razorpay API...');
          const verifyRes = await apiClient.post<{ message: string }>('/api/billing/razorpay/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan: 'growth',
          });
          toast.success(verifyRes.message || `Payment verified & captured! ID: ${response.razorpay_payment_id}`);
          loadBillingData();
        } catch (verifyErr: any) {
          toast.error(verifyErr.message || 'Payment signature verification failed.');
        }
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
            Manage your workspace plan, currency, billing details, payment methods, wholesale dispatches, and tax invoice logs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadBillingData} title="Refresh billing records">
            <Icon name="refresh" size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {loading ? (
        <LoadingState message="Loading Billing & Subscription Data..." subtitle="Calculating wholesale dispatches and payment invoice records" />
      ) : error ? (
        <ErrorAlert title="Billing Data Unavailable" message={error} onRetry={loadBillingData} />
      ) : (
        <div style={{ animation: 'slideUp 0.35s ease', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
            
            {/* Subscription Status Card */}
            <div className="section-card" style={{ width: '100%', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: plan !== 'free' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: plan !== 'free' ? 'var(--color-primary)' : 'var(--color-foreground-muted)',
                  }}>
                    <Icon name="shield" size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                        Current Plan: {plan.toUpperCase()}
                      </span>
                      <span className={`badge ${plan !== 'free' ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                        {subscriptionStatus === 'canceling' ? 'CANCELING AT PERIOD END' : subscriptionStatus.toUpperCase()}
                      </span>
                      {cancelAtPeriodEnd && (
                        <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                          AUTO-RENEW OFF
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-foreground-secondary)', marginTop: '2px' }}>
                      {currentPeriodEnd
                        ? `Billing period ends on ${new Date(currentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`
                        : plan !== 'free' ? 'Active Monthly Subscription' : 'Free tier with standard rate limits'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {plan !== 'free' && !cancelAtPeriodEnd && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-error)', fontSize: '12px' }}
                      onClick={handleCancelSubscription}
                      disabled={cancelingSub}
                    >
                      {cancelingSub ? 'Canceling...' : 'Turn Off Auto-Renew'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setCheckoutGateway(currency === 'INR' ? 'razorpay' : 'stripe');
                      setShowCheckoutModal(true);
                    }}
                  >
                    <Icon name="coins" size={14} />
                    <span>{plan === 'free' ? 'Upgrade Plan' : 'Renew / Change Plan'}</span>
                  </button>
                </div>
              </div>
            </div>

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

            {/* Sub-Accounts & Quick Top-Up Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 'var(--space-6)', alignItems: 'start', width: '100%' }}>
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
              <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
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
                    International cards, Visa, Mastercard, AMEX with instant cryptographic session verification.
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      setCheckoutGateway('stripe');
                      setShowCheckoutModal(true);
                    }}
                    disabled={checkoutLoading}
                  >
                    Checkout with Stripe ($49/mo)
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
                    Supports Netbanking, UPI, and RuPay with automated 18% GST (HSN 998314) tax invoicing.
                  </p>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      setCheckoutGateway('razorpay');
                      setShowCheckoutModal(true);
                    }}
                    disabled={checkoutLoading}
                  >
                    Checkout with Razorpay (₹3,999 + GST)
                  </button>
                </div>
              </div>
            </div>

            {/* Saved Payment Methods Section Card */}
            <div className="section-card" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>
                    <Icon name="shield" size={18} style={{ color: 'var(--color-primary)', marginRight: '8px' }} />
                    <span>Saved Payment Methods & Auto-Pay</span>
                  </h2>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '2px 0 0' }}>
                    Payment methods saved for automated subscription renewals and wholesale usage topups.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setCheckoutGateway(currency === 'INR' ? 'razorpay' : 'stripe');
                      setShowCheckoutModal(true);
                    }}
                  >
                    <Icon name="coins" size={14} />
                    <span>Pay with Saved Method</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddMethodModal(true)}
                  >
                    <Icon name="plus" size={14} />
                    <span>Add New Method</span>
                  </button>
                </div>
              </div>

              {paymentMethods.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        border: pm.isDefault ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: pm.type === 'card' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: pm.type === 'card' ? 'var(--color-primary)' : 'var(--color-success)',
                          }}>
                            <Icon name={pm.type === 'card' ? 'coins' : 'shield'} size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-foreground)' }}>
                              {pm.type === 'card' ? `${pm.brand || 'Card'} •••• ${pm.last4}` : pm.upiId}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-foreground-secondary)' }}>
                              {pm.type === 'card' ? `Expires ${pm.expiryMonth}/${pm.expiryYear}` : 'UPI Auto-Pay'}
                            </div>
                          </div>
                        </div>
                        {pm.isDefault && (
                          <span className="badge badge-primary" style={{ fontSize: '9px', padding: '1px 5px' }}>DEFAULT</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                        <div>
                          {!pm.isDefault && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              style={{ fontSize: '11px', padding: '2px 6px' }}
                              onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                            >
                              Set as Default
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          style={{ color: 'var(--color-error)', fontSize: '11px', padding: '2px 6px' }}
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                  <Icon name="coins" size={28} style={{ color: 'var(--color-foreground-muted)', opacity: 0.5, marginBottom: '6px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>No Payment Methods Saved Yet</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>
                    Save a credit/debit card or UPI ID to enable one-click subscription renewals and wholesale auto-topup.
                  </div>
                </div>
              )}
            </div>

            {/* Invoice History section */}
            <div className="section-card" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Payment & Invoice Audit Logs</h2>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                    Tax compliance ledger for all subscription renewals, one-time topups, and refund receipts.
                  </p>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: 'var(--text-xs)' }}>{invoices.length} Invoices</span>
              </div>

              {invoices.length > 0 ? (
                <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                  <table className="table-styled" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Invoice / Order ID</th>
                        <th>Gateway</th>
                        <th>Description</th>
                        <th>Tax Specification</th>
                        <th>Transaction Date</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th style={{ textAlign: 'center' }}>Tax Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-foreground-secondary)' }}>
                            {(inv.details as any)?.invoiceNumber || (inv._id ? `${inv._id.substring(0, 12)}...` : 'INV-GEN')}
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
                            {getCurrencySymbol((inv.details as any)?.currency || currency)}{((inv.details as any)?.totalAmount || inv.details?.amount || 0.0).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleViewInvoice((inv.details as any)?.invoiceNumber || inv._id)}
                              disabled={loadingInvoiceId === ((inv.details as any)?.invoiceNumber || inv._id)}
                              title="View & Print Official GST Tax Invoice"
                            >
                              <Icon name="download" size={12} />
                              <span>{loadingInvoiceId === ((inv.details as any)?.invoiceNumber || inv._id) ? 'Loading...' : 'Invoice'}</span>
                            </button>
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
              <button className="btn-close" onClick={() => setShowAddMethodModal(false)} title="Close"><Icon name="close" size={14} /></button>
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

      {/* Itemized Tax Invoice View / Print Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: '780px', width: '100%', padding: 'var(--space-6)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Action Bar (hidden on print) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 700 }}>
                  TAX INVOICE / RECEIPT
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-foreground-secondary)' }}>
                  #{selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => window.print()}
                >
                  <Icon name="download" size={14} />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowInvoiceModal(false)}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div id="printable-tax-invoice" style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              {/* Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                    NotifyIQ
                  </h1>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                    A product of <strong style={{ color: '#0f172a' }}>{selectedInvoice.seller.legalName}</strong>
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8' }}>
                    {selectedInvoice.seller.description}
                  </p>
                  <a href={selectedInvoice.seller.website} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none' }}>
                    {selectedInvoice.seller.website}
                  </a>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>TAX INVOICE</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                    Invoice #: {selectedInvoice.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Date: {new Date(selectedInvoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Status: <strong style={{ color: '#16a34a' }}>PAID</strong>
                  </div>
                </div>
              </div>

              {/* Seller and Buyer 2-Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', fontSize: '12px' }}>
                {/* Seller Box */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                    Seller / Service Provider
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{selectedInvoice.seller.legalName}</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>{selectedInvoice.seller.address}</div>
                  <div style={{ color: '#334155', marginTop: '4px' }}>
                    <strong>GSTIN:</strong> {selectedInvoice.seller.gstin}
                  </div>
                  <div style={{ color: '#334155' }}>
                    <strong>SAC Code:</strong> {selectedInvoice.seller.hsnCode} (IT Software Services)
                  </div>
                  <div style={{ color: '#334155' }}>
                    <strong>Support:</strong> {selectedInvoice.seller.supportEmail}
                  </div>
                </div>

                {/* Buyer Box */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                    Billed To / Customer
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                    {selectedInvoice.buyer.companyName || selectedInvoice.buyer.workspaceName}
                  </div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>
                    {selectedInvoice.buyer.address}
                    {selectedInvoice.buyer.city ? `, ${selectedInvoice.buyer.city}` : ''}
                    {selectedInvoice.buyer.state ? `, ${selectedInvoice.buyer.state}` : ''}
                    {selectedInvoice.buyer.postalCode ? ` - ${selectedInvoice.buyer.postalCode}` : ''}
                  </div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>
                    {selectedInvoice.buyer.country}
                  </div>
                  <div style={{ color: '#334155', marginTop: '4px' }}>
                    <strong>Tax ID / GSTIN:</strong> {selectedInvoice.buyer.taxId}
                  </div>
                  <div style={{ color: '#334155' }}>
                    <strong>Email:</strong> {selectedInvoice.buyer.billingEmail || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: 'var(--space-6)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Item Description</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>SAC</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Taxable Value</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax Rate</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 600 }}>{item.description}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{item.hsnSac}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0f172a' }}>
                        {getCurrencySymbol(selectedInvoice.currency)}{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>{selectedInvoice.gstRate}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {getCurrencySymbol(selectedInvoice.currency)}{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary and Tax Breakdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '360px' }}>
                  <div><strong>Payment Method:</strong> {selectedInvoice.paymentMethodUsed}</div>
                  <div><strong>Gateway:</strong> {selectedInvoice.paymentGateway}</div>
                  <div><strong>Txn Reference:</strong> {selectedInvoice.transactionId}</div>
                  <div style={{ marginTop: '8px', fontSize: '10px', fontStyle: 'italic' }}>
                    {selectedInvoice.currency === 'INR'
                      ? 'Computer generated tax invoice. Goods & Services Tax (GST) is levied under Section 9 of the CGST/SGST Act.'
                      : 'Supply meant for export under Bond/Letter of Undertaking (LUT) without payment of integrated tax.'}
                  </div>
                </div>

                <div style={{ width: '260px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                    <span>Taxable Base Value:</span>
                    <span style={{ fontWeight: 600 }}>{getCurrencySymbol(selectedInvoice.currency)}{selectedInvoice.baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {selectedInvoice.currency === 'INR' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                        <span>CGST (9.0%):</span>
                        <span>{getCurrencySymbol(selectedInvoice.currency)}{(selectedInvoice.gstAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                        <span>SGST (9.0%):</span>
                        <span>{getCurrencySymbol(selectedInvoice.currency)}{(selectedInvoice.gstAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                      <span>Integrated Tax (0% Export):</span>
                      <span>$0.00</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', marginTop: '6px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    <span>Total Amount Paid:</span>
                    <span>{getCurrencySymbol(selectedInvoice.currency)}{selectedInvoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout & Payment Method Selector Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={loadBillingData}
        savedMethods={paymentMethods}
        billingDetails={billingDetails}
        initialGateway={checkoutGateway}
      />
    </div>
  );
}
