import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { EmbeddedSignupButton } from '../../components/waba/EmbeddedSignupButton';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

interface WabaProfile {
  about: string;
  address: string;
  description: string;
  email: string;
  vertical: string;
  websites: string[];
  profilePictureUrl?: string;
}

interface WabaStatus {
  isConnected: boolean;
  businessAccountId: string | null;
  phoneNumberId: string | null;
}

interface PhoneNumberOption {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
  code_verification_status?: string;
}

interface MetaApiLogItem {
  _id: string;
  endpointUrl: string;
  httpMethod: string;
  responseStatus: number;
  requestPayload?: any;
  responseData?: any;
  errorMessage?: string;
  createdAt: string;
}

export default function WabaProfilePage() {
  const [status, setStatus] = useState<WabaStatus>({
    isConnected: false,
    businessAccountId: null,
    phoneNumberId: null,
  });
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberOption[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');

  const [profile, setProfile] = useState<WabaProfile>({
    about: '',
    address: '',
    description: '',
    email: '',
    vertical: 'PROF_SERVICES',
    websites: [''],
  });

  const [apiLogs, setApiLogs] = useState<MetaApiLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchingPhone, setSwitchingPhone] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Register Phone Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('91');
  const [registeringPhone, setRegisteringPhone] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch WABA connection status
      const statusRes = await apiClient.get<{ data: WabaStatus }>('/api/waba/status');
      if (statusRes.data) {
        setStatus(statusRes.data);
        if (statusRes.data.phoneNumberId) {
          setSelectedPhoneId(statusRes.data.phoneNumberId);
        }
      }

      // 2. Fetch WABA Profile
      const profileRes = await apiClient.get<{ data: WabaProfile }>('/api/waba/profile');
      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      // 3. Fetch Phone Numbers list if connected
      if (statusRes.data?.isConnected) {
        const phoneRes = await apiClient.get<{ data: PhoneNumberOption[] }>('/api/waba/phone-numbers');
        if (phoneRes.data && phoneRes.data.length > 0) {
          setPhoneNumbers(phoneRes.data);
          if (!statusRes.data.phoneNumberId) {
            setSelectedPhoneId(phoneRes.data[0].id);
          }
        }

        // Fetch Meta API response logs
        loadApiLogs();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Meta WABA profile server.');
    } finally {
      setLoading(false);
    }
  };

  const loadApiLogs = async () => {
    try {
      const logsRes = await apiClient.get<{ data: MetaApiLogItem[] }>('/api/waba/api-logs');
      if (logsRes.data) {
        setApiLogs(logsRes.data);
      }
    } catch (err) {
      console.warn('Failed loading Meta API response logs:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPhone = async (phoneId: string) => {
    if (!phoneId || phoneId === status.phoneNumberId) return;
    setSwitchingPhone(true);
    setStatusMessage(`Switching active WhatsApp Phone Number to ID: ${phoneId}...`);

    try {
      await apiClient.post('/api/waba/select-phone-number', { phoneNumberId: phoneId });
      setStatus((prev) => ({ ...prev, phoneNumberId: phoneId }));
      setSelectedPhoneId(phoneId);
      setStatusMessage(`Active WhatsApp Phone Number updated successfully to ID: ${phoneId}!`);
      loadApiLogs();
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err: any) {
      setStatusMessage(`Failed to switch phone number: ${err.message || 'Error occurred'}`);
    } finally {
      setSwitchingPhone(false);
    }
  };

  const handleRegisterPhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPhoneNumber || !newDisplayName) return;

    setRegisteringPhone(true);
    setStatusMessage('Registering new phone number on Meta Cloud API...');
    try {
      await apiClient.post<{ data: { phoneNumberId: string } }>('/api/waba/phone-numbers', {
        phoneNumber: newPhoneNumber,
        displayName: newDisplayName,
        countryCode: newCountryCode,
      });

      setStatusMessage(`Phone number "${newDisplayName}" registered successfully on Meta API!`);
      setShowAddModal(false);
      setNewPhoneNumber('');
      setNewDisplayName('');
      loadData();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      setStatusMessage(`Failed to register phone number: ${err.message || 'Error submitting to Meta API'}`);
    } finally {
      setRegisteringPhone(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage('Syncing updated WABA profile details to Meta Graph API v20.0...');
    try {
      await apiClient.post('/api/waba/profile', profile);
      setStatusMessage('WABA profile updated successfully on Meta Cloud API!');
      loadApiLogs();
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err: any) {
      setStatusMessage(`Profile save failed: ${err.message || 'Error updating Meta API'}`);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Meta WABA Integration & Profile</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage your connected Meta WhatsApp Business Account (WABA), add attached phone numbers, switch active numbers, and inspect Meta Graph API response logs.
        </p>
      </header>

      {statusMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: '13px' }}>
          {statusMessage}
        </div>
      )}

      {loading ? (
        <LoadingState message="Fetching WABA profile details from Meta Graph API..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} title="Meta WABA Profile Error" />
      ) : (
        <>
          {/* Meta Connection & Phone Number Selector Card */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            {!status.isConnected ? (
              /* NOT CONNECTED STATE: Show Embedded Signup Button */
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="shield" style={{ color: 'var(--accent)' }} />
                    <span>Meta Embedded Signup OAuth Setup</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.5 }}>
                    Connect your official Meta WhatsApp Business Account in under 2 minutes without leaving NotifyIQ. Exchanging tokens automatically registers webhooks and selects the first available phone number.
                  </p>
                </div>

                <EmbeddedSignupButton onSuccess={() => loadData()} />
              </div>
            ) : (
              /* CONNECTED STATE: Hide Embedded Signup Button & Show WABA Phone Number Selector */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="shield" style={{ color: 'var(--sentiment-positive)' }} />
                      <span>Meta WABA Account Connected & Active</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Your workspace is linked to Meta Cloud API v20.0. Select active phone numbers or add a new phone number to your WABA.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setShowAddModal(true)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--btn-text)',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>+</span>
                      <span>Add New Phone Number</span>
                    </button>

                    <span style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(0, 164, 189, 0.12)', color: 'var(--sentiment-positive)', fontSize: '12px', fontWeight: 'bold' }}>
                      ✓ CONNECTED & VERIFIED
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>WABA Account ID</span>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'monospace' }}>
                      {status.businessAccountId || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Phone Number ID</span>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-light)', marginTop: '4px', fontFamily: 'monospace' }}>
                      {status.phoneNumberId || 'None Selected'}
                    </div>
                  </div>
                </div>

                {/* Phone Number Select Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Select Active WhatsApp Phone Number
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                      value={selectedPhoneId}
                      onChange={(e) => handleSelectPhone(e.target.value)}
                      disabled={switchingPhone}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {phoneNumbers.length === 0 && (
                        <option value={status.phoneNumberId || ''}>
                          {status.phoneNumberId ? `Phone Number ID: ${status.phoneNumberId}` : 'Loading Phone Numbers...'}
                        </option>
                      )}
                      {phoneNumbers.map((pn) => (
                        <option key={pn.id} value={pn.id}>
                          {pn.display_phone_number} — {pn.verified_name} (ID: {pn.id}) {pn.id === status.phoneNumberId ? '[ACTIVE]' : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleSelectPhone(selectedPhoneId)}
                      disabled={switchingPhone || selectedPhoneId === status.phoneNumberId}
                      style={{
                        padding: '10px 20px',
                        background: selectedPhoneId === status.phoneNumberId ? 'var(--bg-tertiary)' : 'var(--accent)',
                        color: selectedPhoneId === status.phoneNumberId ? 'var(--text-muted)' : 'var(--btn-text)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: selectedPhoneId === status.phoneNumberId ? 'default' : 'pointer',
                      }}
                    >
                      {switchingPhone ? 'Switching...' : selectedPhoneId === status.phoneNumberId ? 'Active Number' : 'Set as Active Number'}
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    Querying attached phone numbers via Meta API: <code>GET /v20.0/{'{wabaId}'}/phone_numbers</code>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Dialog for Registering a New Phone Number */}
          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '480px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Register New Phone Number on Meta API</h3>
                  <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>

                <form onSubmit={handleRegisterPhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Verified Business Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NotifyIQ Customer Support"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Country Code
                      </label>
                      <input
                        type="text"
                        placeholder="91"
                        value={newCountryCode}
                        onChange={(e) => setNewCountryCode(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Phone Number (digits only)
                      </label>
                      <input
                        type="text"
                        placeholder="9876543210"
                        value={newPhoneNumber}
                        onChange={(e) => setNewPhoneNumber(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registeringPhone}
                      style={{ padding: '8px 20px', background: 'var(--accent)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {registeringPhone ? 'Submitting to Meta...' : 'Submit to Meta Graph API'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WABA Business Profile Editor */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', maxWidth: '800px', marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="gear" style={{ color: 'var(--accent)' }} />
              <span>WhatsApp Business Profile Editor</span>
            </h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  About / Tagline
                </label>
                <input
                  type="text"
                  value={profile.about}
                  onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                  placeholder="Short tagline shown under your business name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                  placeholder="Detailed business description"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                    placeholder="support@company.com"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Industry Category / Vertical
                  </label>
                  <select
                    value={profile.vertical}
                    onChange={(e) => setProfile({ ...profile, vertical: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="PROF_SERVICES">Professional Services</option>
                    <option value="RETAIL">Retail & E-commerce</option>
                    <option value="FINANCE">Financial Services</option>
                    <option value="EDUCATION">Education</option>
                    <option value="ENTERTAIN">Entertainment</option>
                    <option value="OTHER">Other Industry</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Business Address
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                  placeholder="Physical business office location"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Website URL
                </label>
                <input
                  type="url"
                  value={profile.websites?.[0] || ''}
                  onChange={(e) => setProfile({ ...profile, websites: [e.target.value] })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                  placeholder="https://company.com"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="send-btn"
                style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', alignSelf: 'flex-start' }}
              >
                {savingProfile ? 'Syncing to Meta...' : 'Save & Publish Profile to WhatsApp'}
              </button>
            </form>
          </div>

          {/* Meta Graph API Response Audit Logs Section */}
          {status.isConnected && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="brain" style={{ color: 'var(--accent)' }} />
                  <span>Meta Graph API Request & Response Logs ({apiLogs.length})</span>
                </h3>
                <button
                  onClick={loadApiLogs}
                  style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  ↻ Refresh Logs
                </button>
              </div>

              {apiLogs.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Meta Graph API calls logged yet for this workspace.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px 8px' }}>Timestamp</th>
                        <th style={{ padding: '10px 8px' }}>Method</th>
                        <th style={{ padding: '10px 8px' }}>Status</th>
                        <th style={{ padding: '10px 8px' }}>Endpoint URL</th>
                        <th style={{ padding: '10px 8px' }}>Response Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiLogs.map((log) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: 'bold', color: 'var(--accent-light)' }}>
                            {log.httpMethod}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                backgroundColor: log.responseStatus < 300 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: log.responseStatus < 300 ? 'var(--sentiment-positive)' : 'var(--sentiment-urgent)',
                              }}
                            >
                              {log.responseStatus}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all', maxWidth: '300px' }}>
                            {log.endpointUrl}
                          </td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                            {log.errorMessage ? (
                              <span style={{ color: 'var(--sentiment-urgent)' }}>Error: {log.errorMessage}</span>
                            ) : (
                              <pre style={{ margin: 0, fontSize: '10px', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '4px', maxWidth: '320px', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {JSON.stringify(log.responseData || log.requestPayload || {}, null, 2)}
                              </pre>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

