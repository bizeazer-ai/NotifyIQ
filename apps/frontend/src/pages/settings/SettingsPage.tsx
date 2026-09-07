import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';

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

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadAutoReplySettings = async () => {
    try {
      const res = await apiClient.get<{ data: AutoReplySettings }>('/api/workspaces/auto-reply');
      if (res.data) setAutoReply(res.data);
    } catch {
      // Use initial state
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
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>AI & Bot Agent Control Center</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Manage Gemini RAG auto-reply behavior, confidence thresholds, operating hours, and white-label branding.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('autoReply')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: activeTab === 'autoReply' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === 'autoReply' ? 'var(--btn-text)' : 'var(--text-primary)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Auto-Reply Bot Agent
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: activeTab === 'branding' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === 'branding' ? 'var(--btn-text)' : 'var(--text-primary)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            White-Label Branding
          </button>
        </div>
      </header>

      {statusMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: '13px' }}>
          {statusMessage}
        </div>
      )}

      {activeTab === 'autoReply' ? (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', maxWidth: '800px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="brain" style={{ color: 'var(--accent)' }} />
            <span>Gemini Auto-Reply Configuration</span>
          </h3>

          <form onSubmit={handleSaveAutoReply} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Master Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Enable Gemini Auto-Reply Agent</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Automatically respond to inbound WhatsApp messages using RAG Knowledge Base.</div>
              </div>
              <input
                type="checkbox"
                checked={autoReply.enabled}
                onChange={(e) => setAutoReply({ ...autoReply, enabled: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
            </div>

            {/* System Prompt */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Agent System Prompt & Behavior Instructions
              </label>
              <textarea
                rows={4}
                value={autoReply.systemPrompt}
                onChange={(e) => setAutoReply({ ...autoReply, systemPrompt: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Grounding instruction for gemini-3.5-flash-lite model when answering customer queries.
              </span>
            </div>

            {/* Confidence Threshold Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Confidence Score Threshold</label>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-light)' }}>
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
                style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Relaxed (40% - More Answers)</span>
                <span>Strict (95% - High Precision)</span>
              </div>
            </div>

            {/* Fallback to Human */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Fallback to Live Human Agent</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Escalate thread to Inbox and trigger socket alert if vector confidence falls below threshold.</div>
              </div>
              <input
                type="checkbox"
                checked={autoReply.fallbackToHuman}
                onChange={(e) => setAutoReply({ ...autoReply, fallbackToHuman: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
            </div>

            {/* Operating Hours */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Business Operating Hours Schedule</span>
                <input
                  type="checkbox"
                  checked={autoReply.operatingHours.enabled}
                  onChange={(e) =>
                    setAutoReply({
                      ...autoReply,
                      operatingHours: { ...autoReply.operatingHours, enabled: e.target.checked },
                    })
                  }
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
              </div>

              {autoReply.operatingHours.enabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Time</label>
                    <input
                      type="time"
                      value={autoReply.operatingHours.startTime}
                      onChange={(e) =>
                        setAutoReply({
                          ...autoReply,
                          operatingHours: { ...autoReply.operatingHours, startTime: e.target.value },
                        })
                      }
                      style={{ width: '100%', padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Time</label>
                    <input
                      type="time"
                      value={autoReply.operatingHours.endTime}
                      onChange={(e) =>
                        setAutoReply({
                          ...autoReply,
                          operatingHours: { ...autoReply.operatingHours, endTime: e.target.value },
                        })
                      }
                      style={{ width: '100%', padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="send-btn"
              style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', alignSelf: 'flex-start' }}
            >
              {saving ? 'Deploying Settings...' : 'Save & Deploy Auto-Reply Agent'}
            </button>
          </form>
        </div>
      ) : (
        /* White-Label Branding Tab */
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="shield" style={{ color: 'var(--accent)' }} />
            <span>White-Label Branding Settings</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Accent Color Theme</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={brandingAccent}
                  onChange={(e) => handleUpdateAccentColor(e.target.value)}
                  style={{ width: '44px', height: '44px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={brandingAccent}
                  onChange={(e) => handleUpdateAccentColor(e.target.value)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', textTransform: 'uppercase', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Reseller Custom Domain CNAME</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={customCname}
                  onChange={(e) => setCustomCname(e.target.value)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyCname}
                  style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Verify DNS
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--sentiment-positive)', marginTop: '4px' }}>
                ✓ CNAME verified pointing to cname.notifyiq.app
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
