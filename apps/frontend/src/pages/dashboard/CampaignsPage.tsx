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
  const [templateName, setTemplateName] = useState('gst_due_reminder');
  const [languageCode, setLanguageCode] = useState('en');
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
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Marketing Campaigns</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Schedule template notifications and monitor real-time read, delivery, and delivery failure metrics.
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="globe" size={14} />
          <span>Refresh Metrics</span>
        </button>
      </header>

      {loading ? (
        <LoadingState message="Fetching campaign metrics and contact target lists..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} title="Campaign Service Error" />
      ) : (
        <>
          {/* Analytics Summary widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Total Transmitted</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-primary)' }}>{stats.totalSent}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--sentiment-positive)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Delivered</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--sentiment-positive)' }}>{stats.delivered}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--accent-light)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Read (Opened)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--accent-light)' }}>{stats.read}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--sentiment-urgent)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Failed Dispatches</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--sentiment-urgent)' }}>{stats.failed}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
            {/* Wizard Form */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>Launch Broadcast Campaign</h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Meta WABA Template</label>
                    <select
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="gst_due_reminder">GST Due Payment Reminder (gst_due_reminder)</option>
                      <option value="billing_notification">Billing Invoice Payment Success (billing_notification)</option>
                      <option value="opt_in_confirmation">Consent Opt-in Confirmation (opt_in_confirmation)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Language</label>
                    <select
                      value={languageCode}
                      onChange={(e) => setLanguageCode(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="en">English (en)</option>
                      <option value="hi">हिन्दी (hi)</option>
                      <option value="es">Español (es)</option>
                      <option value="fr">Français (fr)</option>
                    </select>
                  </div>
                </div>

                {/* Dispatch Schedule Timing */}
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>Dispatch Schedule</label>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: dispatchType === 'scheduled' ? '14px' : '0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dispatchType"
                        checked={dispatchType === 'instant'}
                        onChange={() => setDispatchType('instant')}
                      />
                      <span>Send Immediately</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dispatchType"
                        checked={dispatchType === 'scheduled'}
                        onChange={() => setDispatchType('scheduled')}
                      />
                      <span>Schedule for Future Date</span>
                    </label>
                  </div>

                  {dispatchType === 'scheduled' && (
                    <div>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Target Contacts Selection table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Target Contacts ({selectedContactIds.length} selected)</label>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
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
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-tertiary)' }}>
                      {contacts.map((contact) => (
                        <div
                          key={contact._id}
                          onClick={() => handleSelectContact(contact._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            background: selectedContactIds.includes(contact._id) ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedContactIds.includes(contact._id)}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{contact.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{contact.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="send-btn"
                  style={{ padding: '12px', width: '100%', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={selectedContactIds.length === 0}
                >
                  <Icon name="plane" size={14} />
                  <span>{dispatchType === 'scheduled' ? 'Schedule Broadcast Dispatch' : 'Queue Immediate Campaign Broadcast'}</span>
                </button>
              </form>

              {statusMessage && (
                <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--accent-light)', fontWeight: 600, textAlign: 'center' }}>
                  {statusMessage}
                </div>
              )}
            </div>

            {/* Info panel */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="fork" style={{ color: 'var(--accent-light)' }} />
                <span>Rate-Limit Safe Queue</span>
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                NotifyIQ uses <strong>BullMQ Redis</strong> queues to rate limit campaign broadcasts, making sure we don't exceed the Meta developer API threshold of <strong>80 messages/second</strong> per active phone sender node.
              </p>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>Eligible Contacts Only</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                In compliance with the <strong>DPDP Act Section 11</strong>, contacts who have explicitly opted out or requested deletion are automatically omitted from target broadcasts.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

