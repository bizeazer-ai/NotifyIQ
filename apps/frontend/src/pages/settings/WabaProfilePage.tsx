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
      const statusRes = await apiClient.get<{ data: WabaStatus }>('/api/waba/status');
      if (statusRes.data) {
        setStatus(statusRes.data);
        if (statusRes.data.phoneNumberId) {
          setSelectedPhoneId(statusRes.data.phoneNumberId);
        }
      }

      const profileRes = await apiClient.get<{ data: WabaProfile }>('/api/waba/profile');
      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (statusRes.data?.isConnected) {
        const phoneRes = await apiClient.get<{ data: PhoneNumberOption[] }>('/api/waba/phone-numbers');
        if (phoneRes.data && phoneRes.data.length > 0) {
          setPhoneNumbers(phoneRes.data);
          if (!statusRes.data.phoneNumberId) {
            setSelectedPhoneId(phoneRes.data[0].id);
          }
        }
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
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Meta WABA Integration & Profile</h1>
          <p className="page-subtitle">
            Manage your connected Meta WhatsApp Business Account (WABA), add attached phone numbers, switch active numbers, and inspect Meta Graph API response logs.
          </p>
        </div>
      </header>

      {statusMessage && (
        <div className="status-message status-message-info">{statusMessage}</div>
      )}

      {loading ? (
        <LoadingState message="Fetching WABA profile details from Meta Graph API..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} title="Meta WABA Profile Error" />
      ) : (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          {/* Meta Connection & Phone Number Selector Card */}
          <div className="section-card" style={{ marginBottom: 'var(--space-8)' }}>
            {!status.isConnected ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
                <div>
                  <h3 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>
                    <Icon name="shield" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                    <span>Meta Embedded Signup OAuth Setup</span>
                  </h3>
                  <p className="text-secondary" style={{ margin: 0, fontSize: 'var(--text-sm)', maxWidth: '600px', lineHeight: 'var(--leading-relaxed)' }}>
                    Connect your official Meta WhatsApp Business Account in under 2 minutes without leaving NotifyIQ. Exchanging tokens automatically registers webhooks and selects the first available phone number.
                  </p>
                </div>
                <EmbeddedSignupButton onSuccess={() => loadData()} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <h3 className="section-title" style={{ marginBottom: 'var(--space-1)' }}>
                      <Icon name="shield" className="section-title-icon" style={{ color: 'var(--color-success)' }} />
                      <span>Meta WABA Account Connected & Active</span>
                    </h3>
                    <p className="text-secondary" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>
                      Your workspace is linked to Meta Cloud API v20.0. Select active phone numbers or add a new phone number to your WABA.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                      <Icon name="plus" size={12} />
                      <span>Add New Phone Number</span>
                    </button>
                    <span className="badge badge-success">✓ CONNECTED & VERIFIED</span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-foreground-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>WABA Account ID</span>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-foreground)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>
                      {status.businessAccountId || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-foreground-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Active Phone Number ID</span>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>
                      {status.phoneNumberId || 'None Selected'}
                    </div>
                  </div>
                </div>

                {/* Phone Number Select Dropdown */}
                <div className="form-group">
                  <label className="form-label-styled">Select Active WhatsApp Phone Number</label>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <select
                      className="form-select"
                      value={selectedPhoneId}
                      onChange={(e) => handleSelectPhone(e.target.value)}
                      disabled={switchingPhone}
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
                      className={`btn ${selectedPhoneId === status.phoneNumberId ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleSelectPhone(selectedPhoneId)}
                      disabled={switchingPhone || selectedPhoneId === status.phoneNumberId}
                    >
                      {switchingPhone ? 'Switching...' : selectedPhoneId === status.phoneNumberId ? 'Active Number' : 'Set as Active Number'}
                    </button>
                  </div>
                  <span className="form-hint">
                    Querying attached phone numbers via Meta API: <code>GET /v20.0/{'{wabaId}'}/phone_numbers</code>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Dialog for Registering a New Phone Number */}
          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal-card" style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <h3 className="modal-title" style={{ marginBottom: 0 }}>Register New Phone Number on Meta API</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
                </div>

                <form onSubmit={handleRegisterPhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label-styled">Verified Business Display Name</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      placeholder="e.g. NotifyIQ Customer Support"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label-styled">Country Code</label>
                      <input
                        type="text"
                        className="form-input-styled"
                        placeholder="91"
                        value={newCountryCode}
                        onChange={(e) => setNewCountryCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label-styled">Phone Number (digits only)</label>
                      <input
                        type="text"
                        className="form-input-styled"
                        placeholder="9876543210"
                        value={newPhoneNumber}
                        onChange={(e) => setNewPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={registeringPhone}>
                      {registeringPhone ? 'Submitting to Meta...' : 'Submit to Meta Graph API'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WABA Business Profile Editor */}
          <div className="section-card" style={{ maxWidth: '800px', marginBottom: 'var(--space-8)' }}>
            <h3 className="section-title">
              <Icon name="gear" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
              <span>WhatsApp Business Profile Editor</span>
            </h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label-styled">About / Tagline</label>
                <input
                  type="text"
                  className="form-input-styled"
                  value={profile.about}
                  onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  placeholder="Short tagline shown under your business name"
                />
              </div>

              <div className="form-group">
                <label className="form-label-styled">Business Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Detailed business description"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
                <div className="form-group">
                  <label className="form-label-styled">Support Email</label>
                  <input
                    type="email"
                    className="form-input-styled"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="support@company.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-styled">Industry Category / Vertical</label>
                  <select
                    className="form-select"
                    value={profile.vertical}
                    onChange={(e) => setProfile({ ...profile, vertical: e.target.value })}
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

              <div className="form-group">
                <label className="form-label-styled">Business Address</label>
                <input
                  type="text"
                  className="form-input-styled"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Physical business office location"
                />
              </div>

              <div className="form-group">
                <label className="form-label-styled">Website URL</label>
                <input
                  type="url"
                  className="form-input-styled"
                  value={profile.websites?.[0] || ''}
                  onChange={(e) => setProfile({ ...profile, websites: [e.target.value] })}
                  placeholder="https://company.com"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={savingProfile}
                style={{ alignSelf: 'flex-start' }}
              >
                {savingProfile ? 'Syncing to Meta...' : 'Save & Publish Profile to WhatsApp'}
              </button>
            </form>
          </div>

          {/* Meta Graph API Response Audit Logs Section */}
          {status.isConnected && (
            <div className="section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>
                  <Icon name="brain" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                  <span>Meta Graph API Request & Response Logs ({apiLogs.length})</span>
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={loadApiLogs}>
                  <Icon name="refresh" size={12} />
                  <span>Refresh Logs</span>
                </button>
              </div>

              {apiLogs.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>No Meta Graph API calls logged yet for this workspace.</p>
              ) : (
                <div className="table-container">
                  <table className="table-styled">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Endpoint URL</th>
                        <th>Response Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="text-secondary" style={{ whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {log.httpMethod}
                          </td>
                          <td>
                            <span className={`badge ${log.responseStatus < 300 ? 'badge-success' : 'badge-error'}`}>
                              {log.responseStatus}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', maxWidth: '300px' }}>
                            {log.endpointUrl}
                          </td>
                          <td className="text-secondary">
                            {log.errorMessage ? (
                              <span className="text-error">Error: {log.errorMessage}</span>
                            ) : (
                              <pre style={{
                                margin: 0,
                                fontSize: '10px',
                                background: 'var(--color-surface-secondary)',
                                padding: 'var(--space-2)',
                                borderRadius: 'var(--radius-xs)',
                                maxWidth: '320px',
                                maxHeight: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
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
        </div>
      )}
    </div>
  );
}
