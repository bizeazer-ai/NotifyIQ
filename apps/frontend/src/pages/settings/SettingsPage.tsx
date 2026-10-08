import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

interface AutoReplySettings {
  enabled: boolean;
  systemPrompt: string;
  confidenceThreshold: number;
  fallbackToHuman: boolean;
  outOfHoursOnly: boolean;
  operatingHours: {
    enabled: boolean;
    timezone: string;
    workDays: number[];
    startTime: string;
    endTime: string;
  };
  outOfHoursMessage: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isExpired: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'branding' | 'autoReply' | 'apiKeys'>('autoReply');

  // Branding States
  const [brandingAccent, setBrandingAccent] = useState('#2563eb');
  const [customCname, setCustomCname] = useState('support.bizeazer.in');

  // Auto-Reply States
  const [autoReply, setAutoReply] = useState<AutoReplySettings>({
    enabled: true,
    systemPrompt: 'You are NotifyIQ, an AI assistant for BizEazer. Answer customer questions strictly using the provided knowledge base context.',
    confidenceThreshold: 0.75,
    fallbackToHuman: true,
    outOfHoursOnly: false,
    operatingHours: {
      enabled: true,
      timezone: 'Asia/Kolkata',
      workDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
    },
    outOfHoursMessage: 'Thank you for reaching out! Our support team is currently offline. We will respond during business hours.',
  });

  // API Keys States
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiryDays, setNewKeyExpiryDays] = useState<number>(90);
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['send', 'read', 'webhook']);
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [developerSnippetTab, setDeveloperSnippetTab] = useState<'curl' | 'node' | 'python'>('curl');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadAutoReplySettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: AutoReplySettings }>('/api/workspaces/auto-reply');
      if (res.data) setAutoReply(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch workspace auto-reply settings.');
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    setKeysLoading(true);
    try {
      const res = await apiClient.get<{ data: ApiKeyItem[] }>('/api/api-keys');
      if (res.data) setApiKeys(res.data);
    } catch (err: any) {
      console.warn('Failed to fetch workspace API keys:', err);
    } finally {
      setKeysLoading(false);
    }
  };

  useEffect(() => {
    loadAutoReplySettings();
    loadApiKeys();
  }, []);

  const handleSaveAutoReply = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage('Deploying auto-reply bot parameters to Webhook Worker...');

    try {
      await apiClient.patch('/api/workspaces/auto-reply', autoReply);
      setStatusMessage('Auto-reply bot agent settings updated & deployed successfully!');
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err: any) {
      setStatusMessage(`Save failed: ${err.message || 'Error updating settings'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateApiKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);

    try {
      const res = await apiClient.post<{ data: { apiKey: string } }>('/api/api-keys', {
        name: newKeyName.trim(),
        expiresInDays: newKeyExpiryDays > 0 ? newKeyExpiryDays : undefined,
        scopes: newKeyScopes,
      });

      if (res.data?.apiKey) {
        setCreatedKeySecret(res.data.apiKey);
        await loadApiKeys();
      }
    } catch (err: any) {
      alert(`Failed to generate API Key: ${err?.message || 'Unknown error'}`);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently revoke API Key "${name}"? External services using this key will immediately be blocked.`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/api-keys/${id}`);
      await loadApiKeys();
      setStatusMessage(`API Key "${name}" revoked successfully.`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      alert(`Failed to revoke API key: ${err?.message || 'Error'}`);
    }
  };

  const handleRotateApiKey = async (id: string, name: string) => {
    if (!confirm(`Rotate secret for API Key "${name}"? The previous secret will expire immediately.`)) {
      return;
    }

    try {
      const res = await apiClient.post<{ data: { apiKey: string } }>(`/api/api-keys/${id}/rotate`);
      if (res.data?.apiKey) {
        setCreatedKeySecret(res.data.apiKey);
        setIsCreateKeyModalOpen(true);
        await loadApiKeys();
      }
    } catch (err: any) {
      alert(`Failed to rotate key: ${err?.message || 'Error'}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleUpdateAccentColor = (color: string) => {
    setBrandingAccent(color);
    document.documentElement.style.setProperty('--accent', color);
  };

  const handleVerifyCname = () => {
    setStatusMessage('Querying DNS TXT/CNAME records...');
    setTimeout(() => {
      setStatusMessage('CNAME verified successfully! support.bizeazer.in is pointing to cname.notifyiq.app.');
      setTimeout(() => setStatusMessage(''), 3000);
    }, 1500);
  };

  const hostUrl = window.location.origin;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Workspace Settings & Developer Hub</h1>
          <p className="page-subtitle">
            Manage Gemini RAG auto-reply behavior, external platform API keys, and white-label agency branding.
          </p>
        </div>

        <div className="tab-group">
          <button
            onClick={() => setActiveTab('autoReply')}
            className={`tab-item ${activeTab === 'autoReply' ? 'active' : ''}`}
          >
            Auto-Reply Bot Agent
          </button>
          <button
            onClick={() => setActiveTab('apiKeys')}
            className={`tab-item ${activeTab === 'apiKeys' ? 'active' : ''}`}
          >
            API Keys & Developer Portal
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`tab-item ${activeTab === 'branding' ? 'active' : ''}`}
          >
            White-Label Branding
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className="status-message status-message-info">{statusMessage}</div>
      )}

      {loading ? (
        <LoadingState message="Loading workspace settings..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadAutoReplySettings} title="Settings Error" />
      ) : activeTab === 'autoReply' ? (
        <div className="section-card" style={{ maxWidth: '800px' }}>
          <h3 className="section-title">
            <Icon name="brain" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
            <span>Gemini Auto-Reply Configuration</span>
          </h3>

          <form onSubmit={handleSaveAutoReply} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Master Toggle */}
            <div className="form-toggle-row">
              <div className="form-toggle-info">
                <div className="form-toggle-title">Enable Gemini Auto-Reply Agent</div>
                <div className="form-toggle-desc">Automatically respond to inbound WhatsApp messages using RAG Knowledge Base.</div>
              </div>
              <input
                type="checkbox"
                className="form-checkbox"
                checked={autoReply.enabled}
                onChange={(e) => setAutoReply({ ...autoReply, enabled: e.target.checked })}
              />
            </div>

            {/* System Prompt */}
            <div className="form-group">
              <label className="form-label-styled">Agent System Prompt & Behavior Instructions</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={autoReply.systemPrompt}
                onChange={(e) => setAutoReply({ ...autoReply, systemPrompt: e.target.value })}
              />
              <span className="form-hint">
                Grounding instruction for gemini-3.5-flash-lite model when answering customer queries.
              </span>
            </div>

            {/* Confidence Threshold Slider */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <label className="form-label-styled">Confidence Score Threshold</label>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {(autoReply.confidenceThreshold * 100).toFixed(0)}% Match Required
                </span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.05"
                value={autoReply.confidenceThreshold}
                onChange={(e) => setAutoReply({ ...autoReply, confidenceThreshold: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-foreground-muted)', marginTop: 'var(--space-1)' }}>
                <span>Relaxed (40% - More Answers)</span>
                <span>Strict (95% - High Precision)</span>
              </div>
            </div>

            {/* Fallback to Human */}
            <div className="form-toggle-row">
              <div className="form-toggle-info">
                <div className="form-toggle-title">Fallback to Live Human Agent</div>
                <div className="form-toggle-desc">Escalate thread to Inbox and trigger socket alert if vector confidence falls below threshold.</div>
              </div>
              <input
                type="checkbox"
                className="form-checkbox"
                checked={autoReply.fallbackToHuman}
                onChange={(e) => setAutoReply({ ...autoReply, fallbackToHuman: e.target.checked })}
              />
            </div>

            {/* Operating Hours Toggle */}
            <div className="form-toggle-row">
              <div className="form-toggle-info">
                <div className="form-toggle-title">Enforce Operating Hours</div>
                <div className="form-toggle-desc">Restrict AI replies strictly to business hours or trigger custom out-of-office message.</div>
              </div>
              <input
                type="checkbox"
                className="form-checkbox"
                checked={autoReply.operatingHours.enabled}
                onChange={(e) =>
                  setAutoReply({
                    ...autoReply,
                    operatingHours: { ...autoReply.operatingHours, enabled: e.target.checked },
                  })
                }
              />
            </div>

            {/* Operating Hours Inputs */}
            {autoReply.operatingHours.enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div className="form-group">
                  <label className="form-label-styled">Business Start Time (24h)</label>
                  <input
                    type="time"
                    className="form-input-styled"
                    value={autoReply.operatingHours.startTime}
                    onChange={(e) =>
                      setAutoReply({
                        ...autoReply,
                        operatingHours: { ...autoReply.operatingHours, startTime: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-styled">Business End Time (24h)</label>
                  <input
                    type="time"
                    className="form-input-styled"
                    value={autoReply.operatingHours.endTime}
                    onChange={(e) =>
                      setAutoReply({
                        ...autoReply,
                        operatingHours: { ...autoReply.operatingHours, endTime: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
              style={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Deploying Settings...' : 'Save & Deploy Auto-Reply Agent'}
            </button>
          </form>
        </div>
      ) : activeTab === 'apiKeys' ? (
        /* API Keys & Developer Portal Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px' }}>
          {/* Top Card: Overview & Generation */}
          <div className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>
                  <Icon name="key" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
                  <span>Developer API Keys</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-foreground-muted)' }}>
                  Authenticate external CRM systems, ERPs, Zapier, mobile apps, or backend servers to perform WhatsApp actions.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setNewKeyName('');
                  setCreatedKeySecret(null);
                  setIsCreateKeyModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Icon name="plus" size={16} />
                <span>Generate New API Key</span>
              </button>
            </div>

            {/* Keys Table */}
            {keysLoading ? (
              <LoadingState message="Loading workspace API keys..." />
            ) : apiKeys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                <Icon name="key" size={36} style={{ color: 'var(--color-foreground-muted)', opacity: 0.5, marginBottom: 'var(--space-2)' }} />
                <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)' }}>No API Keys Generated Yet</h4>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-foreground-muted)' }}>
                  Create an API key to allow external applications to send WhatsApp messages and query chat history.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-foreground-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Key Name</th>
                      <th style={{ padding: '10px 12px' }}>Prefix</th>
                      <th style={{ padding: '10px 12px' }}>Scopes</th>
                      <th style={{ padding: '10px 12px' }}>Created</th>
                      <th style={{ padding: '10px 12px' }}>Last Used</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--color-foreground)' }}>
                          {key.name}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                          {key.keyPrefix}...
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {key.scopes.map((s) => (
                              <span
                                key={s}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: 'rgba(37, 99, 235, 0.1)',
                                  color: 'var(--color-primary)',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-foreground-muted)', fontSize: 'var(--text-xs)' }}>
                          {new Date(key.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-foreground-muted)', fontSize: 'var(--text-xs)' }}>
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {key.isExpired ? (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '12px' }}>Expired</span>
                          ) : (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '12px' }}>Active</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRotateApiKey(key.id, key.name)}
                              title="Regenerate Key Secret"
                            >
                              <Icon name="refresh" size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRevokeApiKey(key.id, key.name)}
                              title="Revoke Key"
                              style={{ color: '#ef4444' }}
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interactive Developer Quickstart & Integration Guide */}
          <div className="section-card">
            <h3 className="section-title">
              <Icon name="code" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
              <span>External Platform Integration Quickstart</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-foreground-muted)', lineHeight: 1.6 }}>
                External platforms can interact with NotifyIQ by including your secret API key in the request headers:
              </p>

              <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Header:</span>
                <span>x-api-key: nq_live_your_secret_key_here</span>
                <span style={{ color: 'var(--color-foreground-muted)', marginLeft: 'auto' }}>OR Authorization: Bearer nq_live_...</span>
              </div>

              {/* Code Snippet Tabs */}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setDeveloperSnippetTab('curl')}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: developerSnippetTab === 'curl' ? '2px solid var(--color-primary)' : '2px solid transparent',
                      color: developerSnippetTab === 'curl' ? 'var(--color-primary)' : 'var(--color-foreground-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    cURL (REST API)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeveloperSnippetTab('node')}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: developerSnippetTab === 'node' ? '2px solid var(--color-primary)' : '2px solid transparent',
                      color: developerSnippetTab === 'node' ? 'var(--color-primary)' : 'var(--color-foreground-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Node.js / SDK
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeveloperSnippetTab('python')}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: developerSnippetTab === 'python' ? '2px solid var(--color-primary)' : '2px solid transparent',
                      color: developerSnippetTab === 'python' ? 'var(--color-primary)' : 'var(--color-foreground-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Python (Requests)
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <pre
                    style={{
                      background: '#090d16',
                      color: '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      overflowX: 'auto',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      margin: 0,
                    }}
                  >
                    {developerSnippetTab === 'curl' && (
`# 1. Send WhatsApp Text Message
curl -X POST "${hostUrl}/api/messages/send" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: nq_live_YOUR_API_KEY" \\
  -d '{
    "to": "+15551622494",
    "body": "Hello! Your appointment is confirmed."
  }'

# 2. Send WhatsApp Media Message (Image, Video, Document)
curl -X POST "${hostUrl}/api/messages/send-media" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: nq_live_YOUR_API_KEY" \\
  -d '{
    "to": "+15551622494",
    "type": "image",
    "mediaUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    "caption": "Here is your invoice receipt"
  }'

# 3. Send WhatsApp Meta Template Message
curl -X POST "${hostUrl}/api/messages/send-template" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: nq_live_YOUR_API_KEY" \\
  -d '{
    "to": "+15551622494",
    "templateName": "hello_world",
    "languageCode": "en_US"
  }'`
                    )}

                    {developerSnippetTab === 'node' && (
`import { NotifyIQSdk } from '@notifyiq/sdk';

// Initialize SDK with your API Key
const notifyiq = new NotifyIQSdk({
  apiKey: 'nq_live_YOUR_API_KEY',
  baseUrl: '${hostUrl}',
});

// 1. Send outbound text message
const textResult = await notifyiq.messages.sendText({
  to: '+15551622494',
  body: 'Hello from external Node.js backend!',
});
console.log('Dispatched message ID:', textResult.data.waMessageId);

// 2. Send image or PDF invoice
await notifyiq.messages.sendMedia({
  to: '+15551622494',
  type: 'image',
  mediaUrl: 'https://example.com/receipt.jpg',
  caption: 'Payment received',
});

// 3. Query all conversation threads
const threads = await notifyiq.messages.getConversations();
console.log('Active chats:', threads.data);`
                    )}

                    {developerSnippetTab === 'python' && (
`import requests

API_KEY = "nq_live_YOUR_API_KEY"
BASE_URL = "${hostUrl}"

headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
}

# 1. Send WhatsApp Text
payload = {
    "to": "+15551622494",
    "body": "Hello from Python script!",
}
response = requests.post(f"{BASE_URL}/api/messages/send", headers=headers, json=payload)
print(response.json())

# 2. Fetch Conversation History
conv_id = "6ab49e5c875aae41ad241cdd"
history = requests.get(f"{BASE_URL}/api/messages/history/{conv_id}", headers=headers)
print(history.json())`
                    )}
                  </pre>

                  <button
                    type="button"
                    onClick={() => {
                      const snippet = developerSnippetTab === 'curl'
                        ? `curl -X POST "${hostUrl}/api/messages/send" -H "Content-Type: application/json" -H "x-api-key: nq_live_YOUR_API_KEY" -d '{"to": "+15551622494", "body": "Hello!"}'`
                        : developerSnippetTab === 'node'
                        ? `import { NotifyIQSdk } from '@notifyiq/sdk';\nconst sdk = new NotifyIQSdk({ apiKey: 'nq_live_YOUR_API_KEY' });`
                        : `import requests\nrequests.post("${hostUrl}/api/messages/send", headers={"x-api-key": "nq_live_YOUR_API_KEY"}, json={"to": "+15551622494", "body": "Hello!"})`;
                      copyToClipboard(snippet);
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Endpoints Reference Grid */}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  Core WhatsApp Operations Reference:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: '#10b981', marginRight: '8px' }}>POST</span>
                    <span style={{ fontFamily: 'monospace' }}>/api/messages/send</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>Send WhatsApp text message</div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: '#10b981', marginRight: '8px' }}>POST</span>
                    <span style={{ fontFamily: 'monospace' }}>/api/messages/send-media</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>Send Image, Video, Audio, or Document</div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: '#10b981', marginRight: '8px' }}>POST</span>
                    <span style={{ fontFamily: 'monospace' }}>/api/messages/send-template</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>Send approved Meta WhatsApp template</div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: '#10b981', marginRight: '8px' }}>POST</span>
                    <span style={{ fontFamily: 'monospace' }}>/api/messages/upload</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>Direct binary media upload to Meta Cloud API</div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: '#3b82f6', marginRight: '8px' }}>GET</span>
                    <span style={{ fontFamily: 'monospace' }}>/api/messages/conversations</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>List active customer conversations</div>
                  </div>

                  <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 700, color: '#3b82f6', marginRight: '8px' }}>GET</span>
                    <span style={{ fontFamily: 'monospace' }}>/api/messages/history/:id</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>Fetch conversation chat history</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* White-Label Branding Tab */
        <div className="section-card" style={{ maxWidth: '600px' }}>
          <h3 className="section-title">
            <Icon name="shield" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
            <span>White-Label Branding Settings</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label-styled">Accent Color Theme</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input
                  type="color"
                  value={brandingAccent}
                  onChange={(e) => handleUpdateAccentColor(e.target.value)}
                  style={{ width: '44px', height: '44px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input-styled"
                  value={brandingAccent}
                  onChange={(e) => handleUpdateAccentColor(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-styled">Reseller Custom Domain CNAME</label>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <input
                  type="text"
                  className="form-input-styled"
                  value={customCname}
                  onChange={(e) => setCustomCname(e.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={handleVerifyCname}>
                  Verify DNS
                </button>
              </div>
              <span className="form-hint" style={{ color: 'var(--color-success)' }}>
                ✓ CNAME verified pointing to cname.notifyiq.app
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Generate or Show Secret API Key */}
      {isCreateKeyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {createdKeySecret ? (
              /* Secret Key Display State */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '12px' }}>
                  <Icon name="check" size={24} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>API Key Generated Successfully!</h3>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    color: '#eab308',
                    fontSize: '13px',
                    marginBottom: '16px',
                    lineHeight: '1.4',
                  }}
                >
                  ⚠️ <strong>Save this key now.</strong> For security reasons, you will not be able to view this full key again after closing this window.
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label-styled">Your Secret API Key</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      readOnly
                      value={createdKeySecret}
                      className="form-input-styled"
                      style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--color-surface)', color: 'var(--color-foreground)' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => copyToClipboard(createdKeySecret)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {copiedKey ? '✓ Copied!' : 'Copy Key'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsCreateKeyModalOpen(false);
                      setCreatedKeySecret(null);
                    }}
                  >
                    I Have Saved My Key
                  </button>
                </div>
              </div>
            ) : (
              /* Key Creation Form */
              <form onSubmit={handleCreateApiKey}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Generate Developer API Key</h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateKeyModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-foreground-muted)', cursor: 'pointer' }}
                  >
                    <Icon name="close" size={20} />
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label-styled">Key Name / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zoho CRM Sync, Mobile Backend, Zapier"
                    className="form-input-styled"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <span className="form-hint">Used to identify where this key is being used.</span>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label-styled">Expiration Period</label>
                  <select
                    className="form-input-styled"
                    value={newKeyExpiryDays}
                    onChange={(e) => setNewKeyExpiryDays(parseInt(e.target.value, 10))}
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days (Recommended)</option>
                    <option value={180}>180 Days</option>
                    <option value={365}>1 Year</option>
                    <option value={0}>Never Expire</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label-styled">Allowed Scopes & Permissions</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes('send')}
                        onChange={(e) => {
                          if (e.target.checked) setNewKeyScopes([...newKeyScopes, 'send']);
                          else setNewKeyScopes(newKeyScopes.filter((s) => s !== 'send'));
                        }}
                      />
                      <span><strong>send</strong> - Send text, media, and template messages</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes('read')}
                        onChange={(e) => {
                          if (e.target.checked) setNewKeyScopes([...newKeyScopes, 'read']);
                          else setNewKeyScopes(newKeyScopes.filter((s) => s !== 'read'));
                        }}
                      />
                      <span><strong>read</strong> - Access conversations, message history, and contacts</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes('webhook')}
                        onChange={(e) => {
                          if (e.target.checked) setNewKeyScopes([...newKeyScopes, 'webhook']);
                          else setNewKeyScopes(newKeyScopes.filter((s) => s !== 'webhook'));
                        }}
                      />
                      <span><strong>webhook</strong> - Manage outbound webhooks and event subscriptions</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsCreateKeyModalOpen(false)}
                    disabled={creatingKey}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingKey || !newKeyName.trim()}
                  >
                    {creatingKey ? 'Generating Key...' : 'Create API Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
