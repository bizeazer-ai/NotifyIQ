import { useState, useEffect, type FormEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../ui/Icon';
import { toast } from '../../lib/alerts';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'bank_transfer';
  brand?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  upiId?: string;
  holderName?: string;
  isDefault?: boolean;
}

export interface BillingAddress {
  companyName: string;
  taxId: string;
  billingEmail: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  savedMethods: PaymentMethod[];
  billingDetails?: BillingAddress;
  initialGateway?: 'razorpay' | 'stripe';
  initialPlan?: string;
}



function detectBrand(number: string): string {
  const clean = number.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(clean)) return 'Mastercard';
  if (/^3[47]/.test(clean)) return 'American Express';
  if (/^60|^6521|^6522/.test(clean)) return 'RuPay';
  return 'Visa';
}

export function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  savedMethods = [],
  billingDetails,
  initialGateway = 'razorpay',
  initialPlan = 'growth',
}: CheckoutModalProps) {
  const [gateway, setGateway] = useState<'razorpay' | 'stripe'>(initialGateway);
  const [plan, setPlan] = useState<string>(initialPlan);
  const [paymentChoice, setPaymentChoice] = useState<'saved' | 'new' | 'gateway'>('saved');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  // New Payment Method Fields
  const [newMethodType, setNewMethodType] = useState<'card' | 'upi'>('card');
  const [cardHolder, setCardHolder] = useState(billingDetails?.companyName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [saveForFuture, setSaveForFuture] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGateway(initialGateway);
      setPlan(initialPlan);

      if (savedMethods && savedMethods.length > 0) {
        setPaymentChoice('saved');
        const defaultMethod = savedMethods.find((m) => m.isDefault) || savedMethods[0];
        setSelectedMethodId(defaultMethod.id);
      } else {
        setPaymentChoice('new');
      }
    }
  }, [isOpen, initialGateway, initialPlan, savedMethods]);

  if (!isOpen) return null;

  // Calculation
  const isRazorpay = gateway === 'razorpay';
  const baseAmount = plan === 'enterprise' ? (isRazorpay ? 14999 : 199) : (isRazorpay ? 3999 : 49);
  const gstAmount = isRazorpay ? Math.round(baseAmount * 0.18) : 0;
  const totalAmount = baseAmount + gstAmount;
  const currencySymbol = isRazorpay ? '\u20b9' : '$';

  const selectedSavedMethod = savedMethods.find((m) => m.id === selectedMethodId);

  const formatCardNumber = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  };

  const openRazorpayPopup = (orderData: {
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
    prefill?: any;
  }) => {
    const launch = () => {
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'NotifyIQ Platform',
        description: `NotifyIQ ${plan.toUpperCase()} Subscription + 18% GST`,
        order_id: orderData.orderId,
        prefill: orderData.prefill || {
          name: billingDetails?.companyName || 'Workspace Admin',
          email: billingDetails?.billingEmail || undefined,
          contact: billingDetails?.phone || undefined,
        },
        handler: async function (response: any) {
          try {
            toast.info('Verifying payment and capturing funds with Razorpay API...');
            const verifyRes = await apiClient.post<{ message: string }>('/api/billing/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            });
            toast.success(verifyRes.message || `Payment verified & captured! ID: ${response.razorpay_payment_id}`);
            onSuccess();
            onClose();
          } catch (verifyErr: any) {
            toast.error(verifyErr.message || 'Payment verification failed');
          }
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };

    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = launch;
      document.body.appendChild(script);
    } else {
      launch();
    }
  };

  const handleProcessPayment = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Direct gateway fallback
      if (paymentChoice === 'gateway') {
        if (gateway === 'stripe') {
          toast.info('Initializing Stripe Checkout Session...');
          const res = await apiClient.post<{ data: { checkoutUrl: string } }>('/api/billing/stripe/checkout', { plan });
          if (res.data?.checkoutUrl) {
            window.location.href = res.data.checkoutUrl;
          }
          return;
        } else {
          toast.info('Generating Razorpay Bank Order (18% GST HSN 998314)...');
          const res = await apiClient.post<{ data: any }>('/api/billing/razorpay/order', { amount: baseAmount });
          const order = res.data;
          if (!order) throw new Error('Failed to create order');
          openRazorpayPopup(order);
          return;
        }
      }

      // 2. Saved or New payment method selection
      const chargePayload: any = { gateway, plan };

      if (paymentChoice === 'saved') {
        if (!selectedMethodId) {
          toast.error('Please choose a saved payment method.');
          setSubmitting(false);
          return;
        }
        chargePayload.paymentMethodId = selectedMethodId;
      } else if (paymentChoice === 'new') {
        if (newMethodType === 'card') {
          if (!cardNumber.trim() || !cardHolder.trim() || !cardExpiry.trim()) {
            toast.error('Please complete all required card fields.');
            setSubmitting(false);
            return;
          }
        } else {
          if (!upiId.trim() || !upiId.includes('@')) {
            toast.error('Please enter a valid UPI address (e.g. name@bank).');
            setSubmitting(false);
            return;
          }
        }

        const cleanCard = cardNumber.replace(/\s+/g, '');
        const expParts = cardExpiry.split('/');
        chargePayload.newMethod = {
          type: newMethodType,
          brand: detectBrand(cleanCard),
          last4: cleanCard.slice(-4) || '4242',
          expiryMonth: expParts[0] || '12',
          expiryYear: expParts[1] || '28',
          upiId: upiId.trim(),
          holderName: cardHolder.trim() || 'Workspace Admin',
          saveForFuture,
        };
      }

      toast.info(`Connecting to ${gateway.toUpperCase()} payment gateway...`);
      const res = await apiClient.post<{ message: string; data: any }>('/api/billing/charge', chargePayload);
      const data = res.data;

      // Check if gateway requires client authentication (3DS / OTP / UPI popup / redirect)
      if (data?.requiresAction) {
        if (data.gateway === 'stripe' && data.checkoutUrl) {
          toast.info('Redirecting to Stripe secure checkout...');
          window.location.href = data.checkoutUrl;
          return;
        } else if (data.gateway === 'razorpay' && data.orderId) {
          openRazorpayPopup(data);
          return;
        }
      }

      // If off-session charge succeeded directly
      toast.success(res.message || 'Payment successfully processed!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Payment transaction failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: '580px', width: '100%', padding: 'var(--space-6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          <div>
            <h3 className="modal-title" style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>
              Complete Subscription Payment
            </h3>
            <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '2px 0 0' }}>
              Select payment gateway and choose a saved payment method or add a new card/UPI.
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            disabled={submitting}
            title="Close"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Step 1: Payment Gateway Selector */}
          <div>
            <label className="form-label-styled" style={{ marginBottom: '6px' }}>
              Select Payment Gateway
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div
                onClick={() => setGateway('razorpay')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: gateway === 'razorpay' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: gateway === 'razorpay' ? 'var(--color-surface-secondary)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>Razorpay (India)</span>
                  <Icon name="shield" size={14} style={{ color: 'var(--color-success)' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-foreground-secondary)' }}>
                  UPI, RuPay, Domestic Cards & Netbanking
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {'\u20b9'}{totalAmount.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-foreground-muted)' }}>(incl. 18% GST)</span>
                </div>
              </div>

              <div
                onClick={() => setGateway('stripe')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: gateway === 'stripe' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: gateway === 'stripe' ? 'var(--color-surface-secondary)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>Stripe (Global)</span>
                  <Icon name="coins" size={14} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-foreground-secondary)' }}>
                  Visa, Mastercard, AMEX International
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--color-primary)' }}>
                  ${totalAmount} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-foreground-muted)' }}>/ month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method Options */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label-styled" style={{ margin: 0 }}>
                Payment Method
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {savedMethods.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('saved')}
                    className={`btn btn-xs ${paymentChoice === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    Saved ({savedMethods.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPaymentChoice('new')}
                  className={`btn btn-xs ${paymentChoice === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  + Add New
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentChoice('gateway')}
                  className={`btn btn-xs ${paymentChoice === 'gateway' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  Gateway Portal
                </button>
              </div>
            </div>

            {/* CHOICE A: SAVED PAYMENT METHODS */}
            {paymentChoice === 'saved' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedMethods.map((m) => (
                  <label
                    key={m.id}
                    onClick={() => setSelectedMethodId(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: selectedMethodId === m.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: selectedMethodId === m.id ? 'var(--color-surface-secondary)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="radio"
                        name="savedMethodRadio"
                        checked={selectedMethodId === m.id}
                        onChange={() => setSelectedMethodId(m.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <Icon name={m.type === 'card' ? 'coins' : 'shield'} size={16} style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--color-foreground)' }}>
                          {m.type === 'card' ? `${m.brand || 'Card'} \u2022\u2022\u2022\u2022 ${m.last4}` : m.upiId}
                          {m.isDefault && (
                            <span className="badge badge-primary" style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 5px' }}>DEFAULT</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-foreground-secondary)' }}>
                          {m.type === 'card' ? `Expires ${m.expiryMonth}/${m.expiryYear} \u2022 ${m.holderName || 'Cardholder'}` : `UPI Auto-Pay \u2022 ${m.holderName || 'VPA'}`}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      Ready to charge
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* CHOICE B: ADD NEW PAYMENT METHOD */}
            {paymentChoice === 'new' && (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px', backgroundColor: 'var(--color-surface-secondary)' }}>
                {/* Method Type Pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    className={`btn btn-xs ${newMethodType === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setNewMethodType('card')}
                    style={{ flex: 1 }}
                  >
                    <Icon name="coins" size={12} />
                    <span>Credit / Debit Card</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${newMethodType === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setNewMethodType('upi')}
                    style={{ flex: 1 }}
                  >
                    <Icon name="shield" size={12} />
                    <span>UPI Address (VPA)</span>
                  </button>
                </div>

                {newMethodType === 'card' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label-styled" style={{ fontSize: '11px' }}>Cardholder Name</label>
                      <input
                        type="text"
                        className="form-input-styled"
                        placeholder="Name on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        required={paymentChoice === 'new' && newMethodType === 'card'}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label-styled" style={{ fontSize: '11px' }}>Card Number</label>
                      <input
                        type="text"
                        className="form-input-styled"
                        placeholder="4532 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        required={paymentChoice === 'new' && newMethodType === 'card'}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label-styled" style={{ fontSize: '11px' }}>Expiry (MM/YY)</label>
                        <input
                          type="text"
                          className="form-input-styled"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          required={paymentChoice === 'new' && newMethodType === 'card'}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label-styled" style={{ fontSize: '11px' }}>CVV / CVC</label>
                        <input
                          type="password"
                          className="form-input-styled"
                          placeholder="CVV"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                          maxLength={4}
                          required={paymentChoice === 'new' && newMethodType === 'card'}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label-styled" style={{ fontSize: '11px' }}>UPI ID / VPA</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="e.g. mobile@okaxis or company@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required={paymentChoice === 'new' && newMethodType === 'upi'}
                    />
                    <span className="form-hint" style={{ fontSize: '10px' }}>
                      An instant UPI Auto-Debit request will be routed to your UPI app for authorization.
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="savePaymentForFuture"
                    checked={saveForFuture}
                    onChange={(e) => setSaveForFuture(e.target.checked)}
                  />
                  <label htmlFor="savePaymentForFuture" style={{ fontSize: '11.5px', color: 'var(--color-foreground-secondary)', cursor: 'pointer' }}>
                    Save this payment method to my workspace for future renewals
                  </label>
                </div>
              </div>
            )}

            {/* CHOICE C: GATEWAY PORTAL CHECKOUT */}
            {paymentChoice === 'gateway' && (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px', backgroundColor: 'var(--color-surface-secondary)', textAlign: 'center' }}>
                <Icon name="external-link" size={24} style={{ color: 'var(--color-primary)', margin: '0 auto 6px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700 }}>
                  Redirect to Official {gateway === 'razorpay' ? 'Razorpay' : 'Stripe'} Gateway
                </h4>
                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-foreground-secondary)' }}>
                  You will be securely transferred to the payment gateway to complete authorization.
                </p>
              </div>
            )}
          </div>

          {/* Order Total Review Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                NotifyIQ {plan.toUpperCase()} Plan (Monthly)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>
                {isRazorpay ? 'Base: \u20b93,999 + 18% GST (\u20b9720)' : 'International Software Service'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {currencySymbol}{totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {submitting ? (
                <>
                  <Icon name="spinner" size={14} className="spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Icon name="check" size={14} />
                  <span>
                    Pay {currencySymbol}{totalAmount.toLocaleString()}
                    {paymentChoice === 'saved' && selectedSavedMethod ? ` with ${selectedSavedMethod.type === 'card' ? selectedSavedMethod.brand : 'UPI'}` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
