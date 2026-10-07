import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

interface Contact {
  _id: string;
  name: string;
  phone: string;
  consentGiven: boolean;
  optedOut: boolean;
}

interface CampaignStats {
  totalSent: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export default function CampaignsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    totalSent: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [templateName, setTemplateName] = useState('');
  const [languageCode, setLanguageCode] = useState('en');
  const [wabaTemplates, setWabaTemplates] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [dispatchType, setDispatchType] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledAt, setScheduledAt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Dynamic Template Values
  const [headerUrl, setHeaderUrl] = useState('');
  const [bodyParams, setBodyParams] = useState<Record<string, string>>({ '{{1}}': '{{name}}' });

  const selectedTemplateObj = wabaTemplates.find((t) => t.name === templateName);
  const headerComp = selectedTemplateObj?.components?.find((c: any) => c.type === 'HEADER');
  const headerFormat = (headerComp?.format || (selectedTemplateObj?.headerText ? 'TEXT' : 'NONE')).toUpperCase();
  const bodyComp = selectedTemplateObj?.components?.find((c: any) => c.type === 'BODY');
  const bodyText = bodyComp?.text || selectedTemplateObj?.bodyText || '';
  const footerComp = selectedTemplateObj?.components?.find((c: any) => c.type === 'FOOTER');
  const footerText = footerComp?.text || selectedTemplateObj?.footerText || '';
  const templateVariables: string[] = Array.from(new Set(bodyText.match(/\{\{(\d+)\}\}/g) || []));

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const contactsRes = await apiClient.get<{ data: Contact[] }>('/api/contacts');
      if (contactsRes.data) {
        const eligibleContacts = contactsRes.data.filter((c) => c.consentGiven && !c.optedOut);
        setContacts(eligibleContacts);
      }

      const statsRes = await apiClient.get<{ data: CampaignStats }>('/api/messages/campaigns/stats');
      if (statsRes.data) {
        setStats(statsRes.data);
      }

      const templatesRes = await apiClient.get<{ data: any[] }>('/api/waba/templates');
      if (templatesRes.data) {
        setWabaTemplates(templatesRes.data);
        if (templatesRes.data.length > 0 && !templateName) {
          setTemplateName(templatesRes.data[0].name);
          if (templatesRes.data[0].language) {
            setLanguageCode(templatesRes.data[0].language);
          }
        }
      }

    } catch (err: any) {
      setError(err?.message || 'Failed to fetch campaign statistics or target contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectContact = (id: string) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter((cid) => cid !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedContactIds.length === contacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map((c) => c._id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedContactIds.length === 0) {
      alert('Please select at least one contact to target.');
      return;
    }

    if (dispatchType === 'scheduled' && !scheduledAt) {
      alert('Please select a valid scheduled date & time.');
      return;
    }

    if (['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerFormat) && !headerUrl.trim()) {
      alert(`Please enter a valid header ${headerFormat} URL for this template.`);
      return;
    }

    setStatusMessage(dispatchType === 'scheduled' ? `Scheduling campaign for ${new Date(scheduledAt).toLocaleString()}...` : 'Launching immediate broadcast job...');

    try {
      await apiClient.post('/api/messages/campaigns/launch', {
        templateName,
        languageCode,
        contactIds: selectedContactIds,
        scheduledAt: dispatchType === 'scheduled' ? scheduledAt : undefined,
        templateParameters: {
          headerUrl: headerUrl || undefined,
          bodyParams: templateVariables.map((v) => bodyParams[v] || v),
        },
      });

      setStatusMessage(dispatchType === 'scheduled' ? `Campaign scheduled successfully for ${new Date(scheduledAt).toLocaleString()}!` : 'Campaign launched successfully! Broadcaster enqueued to BullMQ Redis.');
      setSelectedContactIds([]);
      setTimeout(() => {
        setStatusMessage('');
        loadData();
      }, 3500);
    } catch (err: any) {
      setStatusMessage(`Launch failed: ${err.message || 'Error occurred'}`);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Broadcast Campaigns & Dispatch Telemetry</h1>
          <p className="page-subtitle">
            Schedule template notifications and monitor real-time read, delivery, and delivery failure metrics.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadData}>
            <Icon name="refresh" size={14} />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </header>

      {loading ? (
        <LoadingState message="Fetching campaign metrics and contact target lists..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} title="Campaign Service Error" />
      ) : (
        <div style={{ animation: 'slideUp 0.35s ease' }}>
          {/* Analytics Summary widgets */}
          <div className="stat-grid">
            <div className="stat-card stat-blue card-hover">
              <div className="stat-card-label">Total Transmitted</div>
              <div className="stat-card-value">{stats.totalSent}</div>
            </div>
            <div className="stat-card stat-green card-hover">
              <div className="stat-card-label">Delivered SLA</div>
              <div className="stat-card-value">{stats.delivered}</div>
            </div>
            <div className="stat-card stat-cyan card-hover">
              <div className="stat-card-label">Read (Opened)</div>
              <div className="stat-card-value">{stats.read}</div>
            </div>
            <div className="stat-card stat-orange card-hover">
              <div className="stat-card-label">Failed Dispatches</div>
              <div className="stat-card-value">{stats.failed}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-8)', alignItems: 'start' }}>
            {/* Wizard Form */}
            <div className="section-card">
              <h2 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>
                <Icon name="plane" className="section-title-icon" />
                <span>Launch Broadcast Campaign</span>
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label-styled">Meta WABA Template</label>
                    <select
                      className="form-select"
                      value={templateName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setTemplateName(name);
                        const found = wabaTemplates.find((t) => t.name === name);
                        if (found?.language) {
                          setLanguageCode(found.language);
                        }
                      }}
                      required
                    >
                      <option value="">-- Select WABA Template --</option>
                      {wabaTemplates.map((tpl) => (
                        <option key={tpl.id || tpl.name} value={tpl.name}>
                          {tpl.name} ({tpl.language || 'original'})
                        </option>
                      ))}
                    </select>
                    {wabaTemplates.length === 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
                        No registered Meta templates found. Please create one in WhatsApp Templates.
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label-styled">Original Language</label>
                    <input
                      type="text"
                      className="form-input-styled"
                      value={languageCode || 'en_US'}
                      readOnly
                      style={{ backgroundColor: 'var(--color-surface-secondary)', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                {/* Dynamic Template Parameters (Variables & Media) */}
                {selectedTemplateObj && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                      <Icon name="sparkles" size={14} />
                      <span>Template Customization & Dynamic Variables</span>
                    </div>

                    {/* Header Media URL if required */}
                    {['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerFormat) && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label-styled">
                          Header {headerFormat} URL <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                          type="url"
                          className="form-input-styled"
                          placeholder={`https://example.com/media.${headerFormat === 'IMAGE' ? 'jpg' : 'pdf'}`}
                          value={headerUrl}
                          onChange={(e) => setHeaderUrl(e.target.value)}
                          required
                        />
                        <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>
                          Meta Cloud API requires a publicly accessible HTTPS link for template header media.
                        </div>
                      </div>
                    )}

                    {/* Body Variables {{1}}, {{2}}, etc. */}
                    {templateVariables.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: templateVariables.length > 1 ? '1fr 1fr' : '1fr', gap: 'var(--space-3)' }}>
                        {templateVariables.map((varTag, idx) => (
                          <div className="form-group" key={varTag} style={{ marginBottom: 0 }}>
                            <label className="form-label-styled">
                              Variable {varTag} {idx === 0 ? '(Recipient Name)' : ''}
                            </label>
                            <input
                              type="text"
                              className="form-input-styled"
                              placeholder={idx === 0 ? '{{name}} (Replaced with contact name)' : `Value for ${varTag}`}
                              value={bodyParams[varTag] !== undefined ? bodyParams[varTag] : (idx === 0 ? '{{name}}' : '')}
                              onChange={(e) =>
                                setBodyParams({
                                  ...bodyParams,
                                  [varTag]: e.target.value,
                                })
                              }
                            />
                            <div style={{ fontSize: '10.5px', color: 'var(--color-foreground-muted)', marginTop: '2px' }}>
                              Tip: Use <code>&#123;&#123;name&#125;&#125;</code> for contact's name or <code>&#123;&#123;phone&#125;&#125;</code> for phone.
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerFormat) && (
                        <div style={{ fontSize: '11.5px', color: 'var(--color-foreground-muted)' }}>
                          This template does not require dynamic parameters. It will be sent with its approved text.
                        </div>
                      )
                    )}

                    {/* Live WhatsApp Preview */}
                    <div
                      style={{
                        marginTop: '4px',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-foreground-secondary)', marginBottom: '4px' }}>
                        Live Message Card Preview:
                      </div>
                      {headerUrl && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerFormat) && (
                        <img
                          src={headerUrl}
                          alt="Header media preview"
                          style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '4px', marginBottom: '6px' }}
                        />
                      )}
                      <div style={{ fontSize: '12.5px', whiteSpace: 'pre-wrap', color: 'var(--color-foreground)' }}>
                        {(() => {
                          let text = bodyText;
                          templateVariables.forEach((v) => {
                            const val = bodyParams[v] !== undefined ? bodyParams[v] : (v === '{{1}}' ? '{{name}}' : v);
                            text = text.replace(
                              new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                              val ? `[${val}]` : v
                            );
                          });
                          return text;
                        })()}
                      </div>
                      {footerText && (
                        <div style={{ fontSize: '10.5px', color: 'var(--color-foreground-muted)', marginTop: '4px' }}>
                          {footerText}
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Dispatch Schedule Timing */}
                <div style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                }}>
                  <label className="form-label-styled" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>Dispatch Schedule</label>
                  <div style={{ display: 'flex', gap: 'var(--space-5)', marginBottom: dispatchType === 'scheduled' ? 'var(--space-4)' : '0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer', fontWeight: 600 }}>
                      <input type="radio" name="dispatchType" checked={dispatchType === 'instant'} onChange={() => setDispatchType('instant')} />
                      <span>Send Immediately</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer', fontWeight: 600 }}>
                      <input type="radio" name="dispatchType" checked={dispatchType === 'scheduled'} onChange={() => setDispatchType('scheduled')} />
                      <span>Schedule for Future Date</span>
                    </label>
                  </div>

                  {dispatchType === 'scheduled' && (
                    <input
                      type="datetime-local"
                      className="form-input-styled"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      required
                    />
                  )}
                </div>

                {/* Target Contacts Selection table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <label className="form-label-styled">Target Contacts ({selectedContactIds.length} selected)</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleSelectAll}>
                      {selectedContactIds.length === contacts.length ? 'Deselect All' : 'Select All Eligible'}
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <EmptyState
                      title="No Eligible Contacts"
                      description="No contacts with active DPDP opt-in consent found in database. Add contacts to launch broadcasts."
                      icon="users"
                    />
                  ) : (
                    <div style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface)',
                    }}>
                      {contacts.map((contact) => (
                        <div
                          key={contact._id}
                          onClick={() => handleSelectContact(contact._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderBottom: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            backgroundColor: selectedContactIds.includes(contact._id) ? 'var(--color-primary-muted)' : 'transparent',
                            transition: 'background-color var(--transition-fast)',
                          }}
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={selectedContactIds.includes(contact._id)}
                            onChange={() => {}}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-foreground)' }}>{contact.name}</span>
                            <span className="text-muted" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>{contact.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={selectedContactIds.length === 0}
                >
                  <Icon name="plane" size={16} />
                  <span>{dispatchType === 'scheduled' ? 'Schedule Broadcast Dispatch' : 'Queue Immediate Campaign Broadcast'}</span>
                </button>
              </form>

              {statusMessage && (
                <div className="status-message status-message-info" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
                  <Icon name="check" size={14} />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h3 className="section-title" style={{ fontSize: 'var(--text-md)', marginBottom: 0 }}>
                <Icon name="fork" className="section-title-icon" />
                <span>Rate-Limit Safe Queue</span>
              </h3>
              <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
                NotifyIQ uses <strong>BullMQ Redis</strong> queues to rate limit campaign broadcasts, making sure we don't exceed the Meta developer API threshold of <strong>80 messages/second</strong> per active phone sender node.
              </p>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />
              <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-foreground)' }}>Eligible Contacts Only</h4>
              <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
                In compliance with the <strong>DPDP Act Section 11</strong>, contacts who have explicitly opted out or requested deletion are automatically omitted from target broadcasts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
