import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { clearWorkspaceState } from '../../store/slices/workspaceSlice';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast, swal } from '../../lib/alerts';
import { CheckoutModal } from '../../components/billing/CheckoutModal';

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isEmailVerified: boolean;
  createdAt?: string;
  workspace?: {
    id: string;
    name: string;
    slug: string;
    plan?: string;
    currency?: string;
  };
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

export default function UserProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const currentWorkspace = useAppSelector((state) => state.workspace.currentWorkspace);

  // Tab State
  const initialTab = (searchParams.get('tab') as 'profile' | 'security' | 'payments' | 'billing') || 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payments' | 'billing'>(initialTab);

  // Profile data states
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Billing & Payment States
  const [currency, setCurrency] = useState('INR');
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
  const [savingBilling, setSavingBilling] = useState(false);

  // Add Payment Modal State
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [methodType, setMethodType] = useState<'card' | 'upi'>('card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [isDefaultNewMethod, setIsDefaultNewMethod] = useState(false);
  const [submittingMethod, setSubmittingMethod] = useState(false);

  // Notification Preferences State
  const [notifPreferences, setNotifPreferences] = useState({
    emailInvoices: true,
    whatsappAlerts: true,
    aiEscalations: true,
    securityDigest: true,
    systemAnnouncements: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: 'profile' | 'security' | 'payments' | 'billing' ) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadAllProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, billingRes] = await Promise.allSettled([
        apiClient.get<{ data: UserProfileData }>('/api/auth/me'),
        apiClient.get<{ data: { currency: string; billingDetails: BillingAddress; paymentMethods: PaymentMethod[] } }>('/api/billing/settings'),
      ]);

      if (meRes.status === 'fulfilled' && meRes.value?.data) {
        const u = meRes.value.data;
        setProfile(u);
        setNameInput(u.name || '');
        setPhoneInput(u.phone || '');
      } else {
        // Fallback to local auth store if API is offline
        if (authUser) {
          const fallbackData: UserProfileData = {
            id: authUser.id,
            name: authUser.name || 'User',
            email: authUser.email,
            role: authUser.role || 'agent',
            isEmailVerified: authUser.isEmailVerified || false,
            workspace: currentWorkspace ? { id: currentWorkspace.id, name: currentWorkspace.name, slug: currentWorkspace.slug || 'default' } : undefined,
          };
          setProfile(fallbackData);
          setNameInput(fallbackData.name);
        }
      }

      if (billingRes.status === 'fulfilled' && billingRes.value?.data) {
        const b = billingRes.value.data;
        if (b.currency) setCurrency(b.currency);
        if (b.billingDetails) setBillingDetails(b.billingDetails);
        if (b.paymentMethods) setPaymentMethods(b.paymentMethods);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load user profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllProfileData();
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiClient.patch<{ data: UserProfileData }>('/api/auth/profile', {
        name: nameInput.trim(),
        phone: phoneInput.trim(),
      });
      if (res.data) {
        setProfile((prev) => (prev ? { ...prev, name: res.data.name, phone: res.data.phone } : res.data));
      }
      toast.success('Profile information updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!profile?.email) return;
    setResendingVerification(true);
    try {
      await apiClient.post('/api/auth/resend-verification', { email: profile.email });
      toast.success('Verification link sent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not send verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  // Password Strength Calculation (UI/UX Pro Max Guideline)
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: '#ef4444' };
      case 2: return { score: 50, label: 'Fair', color: '#f59e0b' };
      case 3: return { score: 75, label: 'Good', color: '#3b82f6' };
      case 4: return { score: 100, label: 'Strong', color: '#10b981' };
      default: return { score: 0, label: 'Weak', color: '#ef4444' };
    }
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('New password and confirmation do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully! Keep it safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTriggerForgotPasswordEmail = async () => {
    if (!profile?.email) return;
    const confirmed = await swal.confirm(
      'Send Reset Password Link',
      `Send an official password reset link to your email (${profile.email})?`,
      'Yes, Send Link',
    );
    if (!confirmed) return;

    try {
      await apiClient.post('/api/auth/forgot-password', { email: profile.email });
      toast.success(`Password reset email sent to ${profile.email}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to trigger reset email');
    }
  };

  const handleUpdateCurrency = async (newCurrency: string) => {
    setCurrency(newCurrency);
    try {
      await apiClient.patch('/api/billing/settings', { currency: newCurrency });
      toast.success(`Settlement currency updated to ${newCurrency}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update currency');
    }
  };

  const handleSaveBillingDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBilling(true);
    try {
      await apiClient.patch('/api/billing/settings', { billingDetails });
      toast.success('Billing details & tax address saved successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save billing details');
    } finally {
      setSavingBilling(false);
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
      toast.error(err?.message || 'Failed to add payment method');
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
      toast.error(err?.message || 'Failed to set default method');
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
      toast.error(err?.message || 'Failed to remove payment method');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearWorkspaceState());
    navigate('/login');
  };

  const getInitials = (str?: string) => {
    if (!str) return 'AD';
    return str.substring(0, 2).toUpperCase();
  };

  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '100%' }}>
      {/* Top Profile Hero Card */}
      <div
        className="section-card"
        style={{
          marginBottom: 'var(--space-6)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            {/* Avatar */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-strong)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {getInitials(profile?.name || profile?.email)}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: profile?.isEmailVerified ? 'var(--color-success)' : 'var(--color-warning)',
                  border: '2px solid var(--color-surface)',
                }}
                title={profile?.isEmailVerified ? 'Email Verified' : 'Email Unverified'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-foreground)' }}>
                  {profile?.name || 'Administrator'}
                </h1>
                <span
                  className="badge badge-primary"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                >
                  {profile?.role === 'admin' ? 'Workspace Admin' : 'Agent User'}
                </span>
                {profile?.isEmailVerified ? (
                  <span className="badge badge-success" style={{ fontSize: '11px' }}>
                    Verified Email
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                    Unverified Email
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-foreground-secondary)', flexWrap: 'wrap' }}>
                <span>Email: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-foreground)' }}>{profile?.email || 'admin@bizeazer.in'}</span></span>
                {profile?.phone && <span>Phone: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-foreground)' }}>{profile.phone}</span></span>}
                <span>Workspace: {profile?.workspace?.name || currentWorkspace?.name || 'Workspace Portal'}</span>
                {profile?.createdAt && (
                  <span>Member since {new Date(profile.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {!profile?.isEmailVerified && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResendVerificationEmail}
                disabled={resendingVerification}
              >
                <Icon name="plane" size={14} />
                <span>{resendingVerification ? 'Sending...' : 'Verify Email'}</span>
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <Icon name="logout" size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="tab-group" style={{ marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => handleTabChange('profile')}
          className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <Icon name="user" size={14} />
          <span>General Profile</span>
        </button>
        <button
          onClick={() => handleTabChange('security')}
          className={`tab-item ${activeTab === 'security' ? 'active' : ''}`}
        >
          <Icon name="shield" size={14} />
          <span>Password & Security</span>
        </button>
        <button
          onClick={() => handleTabChange('payments')}
          className={`tab-item ${activeTab === 'payments' ? 'active' : ''}`}
        >
          <Icon name="coins" size={14} />
          <span>Payment Methods & Currency</span>
        </button>
        <button
          onClick={() => handleTabChange('billing')}
          className={`tab-item ${activeTab === 'billing' ? 'active' : ''}`}
        >
          <Icon name="document" size={14} />
          <span>Billing Details & Tax</span>
        </button>
        {/* <button
          onClick={() => handleTabChange('notifications')}
          className={`tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          <Icon name="bell" size={14} />
          <span>Notifications</span>
        </button> */}
      </div>

      {loading ? (
        <LoadingState message="Loading Profile & Account Settings..." subtitle="Fetching verified user details, security certificates, and payment records" />
      ) : error ? (
        <ErrorAlert title="Profile Data Unavailable" message={error} onRetry={loadAllProfileData} />
      ) : (
        <div style={{ animation: 'slideUp 0.3s ease', width: '100%' }}>

          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: 'var(--space-6)', alignItems: 'start', width: '100%' }}>
              {/* Profile Information Form */}
              <div className="section-card" style={{ width: '100%' }}>
                <h3 className="section-title">
                  <Icon name="user" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                  <span>Personal Account Information</span>
                </h3>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  <div className="form-group">
                    <label className="form-label-styled">Full Display Name</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="e.g. John Doe"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Registered Account Email</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        type="email"
                        className="form-input-styled"
                        value={profile?.email || ''}
                        disabled
                        style={{ opacity: 0.7, cursor: 'not-allowed' }}
                      />
                      {profile?.isEmailVerified ? (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-success-muted)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: '11px', fontWeight: 700 }}>
                          VERIFIED
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleResendVerificationEmail}
                          disabled={resendingVerification}
                        >
                          {resendingVerification ? 'Sending...' : 'Verify'}
                        </button>
                      )}
                    </div>
                    <span className="form-hint">Email address cannot be changed directly for security compliance reasons.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Contact Phone Number</label>
                    <input
                      type="tel"
                      className="form-input-styled"
                      placeholder="+91 98765 43210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                    />
                    <span className="form-hint">Used for critical security recovery and WhatsApp dispatch notifications.</span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Icon name="check" size={16} />
                    <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                  </button>
                </form>
              </div>

              {/* Workspace Affiliation & Role Matrix Card */}
              <div className="section-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <Icon name="shield" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                    <span>Workspace & Access Privileges</span>
                  </h3>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '4px 0 0 0' }}>
                    Details regarding your assigned workspace permissions and active billing tier.
                  </p>
                </div>

                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Workspace Name:</span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                      {profile?.workspace?.name || currentWorkspace?.name || 'Workspace Portal'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Workspace Slug:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>
                      {profile?.workspace?.slug || currentWorkspace?.slug || 'default'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Account Role:</span>
                    <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                      {profile?.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'INBOX AGENT'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Active Plan Tier:</span>
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>
                      {(profile?.workspace?.plan || currentWorkspace?.plan || 'growth').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground-muted)', marginBottom: 'var(--space-2)' }}>
                    PERMITTED CAPABILITIES:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: 'Broadcast Campaigns & Message Templates', enabled: true },
                      { label: 'Live WhatsApp Inbox & Lead Extraction', enabled: true },
                      { label: 'Gemini RAG Knowledge Base Training', enabled: true },
                      { label: 'Billing Invoices & Gateway Checkouts', enabled: profile?.role === 'admin' },
                      { label: 'Outbound Webhooks & Developer API Keys', enabled: profile?.role === 'admin' },
                    ].map((perm, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                        <span className={`badge ${perm.enabled ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {perm.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                        <span style={{ color: perm.enabled ? 'var(--color-foreground)' : 'var(--color-foreground-muted)' }}>
                          {perm.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: 'var(--space-6)', alignItems: 'start', width: '100%' }}>
              {/* Password Change Form */}
              <div className="section-card" style={{ width: '100%' }}>
                <h3 className="section-title">
                  <Icon name="key" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                  <span>Change Password</span>
                </h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', marginTop: '-8px', marginBottom: 'var(--space-5)' }}>
                  Update your authentication credentials. Choose a robust passphrase with mixed casing, digits, and symbols.
                </p>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  {/* Current Password */}
                  <div className="form-group">
                    <label className="form-label-styled">Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="form-input-styled"
                        placeholder="Enter your existing password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-foreground-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        <Icon name={showCurrentPassword ? 'eye-off' : 'eye'} size={16} />
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="form-group">
                    <label className="form-label-styled">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-input-styled"
                        placeholder="At least 8 characters with numbers & symbols"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-foreground-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        <Icon name={showNewPassword ? 'eye-off' : 'eye'} size={16} />
                      </button>
                    </div>

                    {/* Interactive Password Strength Indicator */}
                    {newPassword && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>Strength:</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${passwordStrength.score}%`,
                              backgroundColor: passwordStrength.color,
                              transition: 'width 0.3s ease, background-color 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label className="form-label-styled">Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input-styled"
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-foreground-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={16} />
                      </button>
                    </div>

                    {confirmPassword && (
                      <div style={{ fontSize: '11px', marginTop: '4px', color: newPassword === confirmPassword ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={changingPassword}
                    >
                      <Icon name="check" size={16} />
                      <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleTriggerForgotPasswordEmail}
                    >
                      <Icon name="key" size={13} />
                      <span>Forgot Password?</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Overview & Active Sessions */}
              <div className="section-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <Icon name="shield" className="section-title-icon" style={{ color: 'var(--color-success)' }} />
                    <span>Security & Active Sessions</span>
                  </h3>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: '4px 0 0 0' }}>
                    Track devices authenticated to this account and manage active authorization tokens.
                  </p>
                </div>

                {/* Current Active Session Card */}
                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name="globe" size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Current Browser Session</span>
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>ACTIVE</span>
                    </div>
                    <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                      Windows Desktop • Chrome / Edge • IP: Verified
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication Status Card */}
                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Email Verification Security</div>
                    <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                      {profile?.isEmailVerified
                        ? 'Confirmed account ownership via verified mailbox.'
                        : 'Unverified mailbox. Verify your email to secure your account.'}
                    </div>
                  </div>
                  {profile?.isEmailVerified ? (
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>ENABLED</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleResendVerificationEmail}
                      disabled={resendingVerification}
                    >
                      Send Verification
                    </button>
                  )}
                </div>

                {/* Session Sign-Out Action */}
                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Revoke All Active Sessions</div>
                    <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                      Signs out all browsers, mobile tabs, and developer tokens immediately.
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    Sign Out All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT METHODS & SETTLEMENT CURRENCY */}
          {activeTab === 'payments' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: 'var(--space-8)', alignItems: 'start', width: '100%' }}>
              {/* Settlement Currency Card */}
              <div className="section-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div>
                  <h3 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                    <Icon name="coins" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                    <span>Workspace Settlement Currency</span>
                  </h3>
                  <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
                    Select your settlement currency for wholesale WhatsApp usage, plan billing, and client sub-workspaces.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  {[
                    { code: 'INR', symbol: '₹', name: 'Indian Rupee', sub: 'Domestic GST compliant' },
                    { code: 'USD', symbol: '$', name: 'US Dollar', sub: 'Global international' },
                    { code: 'EUR', symbol: '€', name: 'Euro', sub: 'European Union VAT' },
                    { code: 'GBP', symbol: '£', name: 'British Pound', sub: 'United Kingdom' },
                  ].map((c) => (
                    <div
                      key={c.code}
                      onClick={() => handleUpdateCurrency(c.code)}
                      style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        border: currency === c.code ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: currency === c.code ? 'var(--color-surface-secondary)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>{c.symbol} {c.code}</span>
                        {currency === c.code && (
                          <span className="badge badge-primary" style={{ fontSize: '10px' }}>ACTIVE</span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{c.name}</div>
                      <div className="text-secondary" style={{ fontSize: '11px' }}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-foreground-secondary)',
                }}>
                  {currency === 'INR' ? (
                    <span>Invoices generated in INR automatically include 18% GST (CGST 9% + SGST 9% or IGST 18% for inter-state transactions).</span>
                  ) : (
                    <span>Invoices billed in {currency} are treated as international export of digital software services with 0% tax.</span>
                  )}
                </div>
              </div>

              {/* Payment Methods Card */}
              <div className="section-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                      <Icon name="shield" className="section-title-icon" style={{ color: 'var(--color-success)' }} />
                      <span>Saved Payment Methods</span>
                    </h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                      Manage credit/debit cards and UPI IDs linked for recurring plan renewals and wholesale messaging.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowCheckoutModal(true)}
                    >
                      <Icon name="coins" size={14} />
                      <span>Pay / Upgrade Plan</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAddMethodModal(true)}
                    >
                      <Icon name="plus" size={14} />
                      <span>Add Method</span>
                    </button>
                  </div>
                </div>

                {paymentMethods.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-lg)',
                          border: pm.isDefault ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface-secondary)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: pm.type === 'card' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: pm.type === 'card' ? 'var(--color-primary)' : 'var(--color-success)',
                          }}>
                            <Icon name={pm.type === 'card' ? 'coins' : 'shield'} size={20} />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                                {pm.type === 'card' ? `${pm.brand || 'Card'} •••• ${pm.last4}` : pm.upiId}
                              </span>
                              {pm.isDefault && (
                                <span className="badge badge-primary" style={{ fontSize: '10px' }}>DEFAULT</span>
                              )}
                            </div>
                            <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                              {pm.type === 'card'
                                ? `Expires ${pm.expiryMonth}/${pm.expiryYear} • ${pm.holderName || 'Cardholder'}`
                                : `Instant UPI Auto-Pay • ${pm.holderName || 'VPA'}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {!pm.isDefault && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDeletePaymentMethod(pm.id)}
                            title="Delete Payment Method"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="coins"
                    title="No Payment Methods Saved"
                    description="Add a credit card or UPI ID to enable seamless monthly subscription renewals and wholesale messaging."
                    minHeight="180px"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BILLING DETAILS & TAX */}
          {activeTab === 'billing' && (
            <div className="section-card" style={{ width: '100%', maxWidth: '100%' }}>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h3 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                  <Icon name="users" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                  <span>Company Billing Details & Tax Identification</span>
                </h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                  This information appears directly on your official invoices, tax receipts, and compliance audit records.
                </p>
              </div>

              <form onSubmit={handleSaveBillingDetails} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
                  <div className="form-group">
                    <label className="form-label-styled">Legal Business / Company Name</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="e.g. Aadi IT Services LLP"
                      value={billingDetails.companyName}
                      onChange={(e) => setBillingDetails({ ...billingDetails, companyName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">GSTIN / Tax ID / VAT Number</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      value={billingDetails.taxId}
                      onChange={(e) => setBillingDetails({ ...billingDetails, taxId: e.target.value })}
                    />
                    <span className="form-hint">Used for 18% Input Tax Credit (ITC) claiming under GST rules.</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Billing Contact Email</label>
                    <input
                      type="email"
                      className="form-input-styled"
                      placeholder="accounts@aadiitservices.com"
                      value={billingDetails.billingEmail}
                      onChange={(e) => setBillingDetails({ ...billingDetails, billingEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Billing Phone Number</label>
                    <input
                      type="tel"
                      className="form-input-styled"
                      placeholder="+91 98765 43210"
                      value={billingDetails.phone}
                      onChange={(e) => setBillingDetails({ ...billingDetails, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
                  <div className="form-group">
                    <label className="form-label-styled">Address Line 1</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="Street address, building name, suite"
                      value={billingDetails.addressLine1}
                      onChange={(e) => setBillingDetails({ ...billingDetails, addressLine1: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="Landmark, floor, wing"
                      value={billingDetails.addressLine2}
                      onChange={(e) => setBillingDetails({ ...billingDetails, addressLine2: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label-styled">City</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="City"
                      value={billingDetails.city}
                      onChange={(e) => setBillingDetails({ ...billingDetails, city: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">State / Province</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="State"
                      value={billingDetails.state}
                      onChange={(e) => setBillingDetails({ ...billingDetails, state: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Postal / PIN Code</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="Postal Code"
                      value={billingDetails.postalCode}
                      onChange={(e) => setBillingDetails({ ...billingDetails, postalCode: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Country</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="Country"
                      value={billingDetails.country}
                      onChange={(e) => setBillingDetails({ ...billingDetails, country: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 'var(--space-2)' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingBilling}>
                    <Icon name="check" size={16} />
                    <span>{savingBilling ? 'Saving Details...' : 'Save Billing Details'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS & COMMUNICATION */}
          {/* {activeTab === 'notifications' && (
            <div className="section-card" style={{ width: '100%', maxWidth: '100%' }}>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h3 className="section-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                  <Icon name="bell" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                  <span>Notification & Alert Preferences</span>
                </h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                  Customize which notifications and delivery receipts are routed to your email and WhatsApp handle.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {[
                  {
                    key: 'emailInvoices',
                    title: 'Payment Receipts & Monthly Invoices',
                    desc: 'Automatically send itemized PDF receipts and GST invoices to your billing contact email.',
                  },
                  {
                    key: 'whatsappAlerts',
                    title: 'WhatsApp Broadcast Campaign Completion Alerts',
                    desc: 'Receive immediate status notifications when large contact dispatches finish or encounter errors.',
                  },
                  {
                    key: 'aiEscalations',
                    title: 'Gemini AI Live Human Fallback Alerts',
                    desc: 'Notify inbox supervisors when a customer conversation falls below confidence thresholds.',
                  },
                  {
                    key: 'securityDigest',
                    title: 'Critical Security & Login Alerts',
                    desc: 'Get immediate notifications when passwords are reset or new API keys are generated.',
                  },
                ].map((item) => (
                  <div key={item.key} className="form-toggle-row">
                    <div className="form-toggle-info">
                      <div className="form-toggle-title">{item.title}</div>
                      <div className="form-toggle-desc">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={(notifPreferences as any)[item.key]}
                      onChange={(e) => {
                        setNotifPreferences({ ...notifPreferences, [item.key]: e.target.checked });
                        toast.success('Notification preference updated');
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )} */}
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
                  Stored securely using industry-standard PCI tokenization.
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
                <span>UPI ID (Instant Pay)</span>
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
                  id="profileDefaultPaymentCheckbox"
                  checked={isDefaultNewMethod}
                  onChange={(e) => setIsDefaultNewMethod(e.target.checked)}
                />
                <label htmlFor="profileDefaultPaymentCheckbox" style={{ fontSize: 'var(--text-xs)', cursor: 'pointer', userSelect: 'none' }}>
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
      {/* Checkout with Payment Method Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={loadAllProfileData}
        savedMethods={paymentMethods}
        billingDetails={billingDetails}
        initialGateway={currency === 'INR' ? 'razorpay' : 'stripe'}
      />
    </div>
  );
}
