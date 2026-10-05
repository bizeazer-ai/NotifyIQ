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

    setStatusMessage(dispatchType === 'scheduled' ? `Scheduling campaign for ${new Date(scheduledAt).toLocaleString()}...` : 'Launching immediate broadcast job...');

    try {
      await apiClient.post('/api/messages/campaigns/launch', {
        templateName,
        languageCode,
        contactIds: selectedContactIds,
        scheduledAt: dispatchType === 'scheduled' ? scheduledAt : undefined,
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
