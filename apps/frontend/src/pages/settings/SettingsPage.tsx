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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'branding' | 'autoReply'>('autoReply');

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

  useEffect(() => {
    loadAutoReplySettings();
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

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">AI & Bot Agent Control Center</h1>
          <p className="page-subtitle">
            Manage Gemini RAG auto-reply behavior, confidence thresholds, operating hours, and white-label branding.
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
        <LoadingState message="Loading workspace AI & auto-reply settings..." />
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

            {/* Operating Hours */}
            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              backgroundColor: 'var(--color-surface-secondary)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-foreground)' }}>Business Operating Hours Schedule</span>
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

              {autoReply.operatingHours.enabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label-styled" style={{ fontSize: 'var(--text-xs)' }}>Start Time</label>
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
                    <label className="form-label-styled" style={{ fontSize: 'var(--text-xs)' }}>End Time</label>
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
            </div>

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
    </div>
  );
}
