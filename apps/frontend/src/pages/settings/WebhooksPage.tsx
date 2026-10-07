import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';

export interface OutboundWebhookItem {
  _id?: string;
  id?: string;
  workspaceId: string;
  description: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastDelivery?: {
    status: 'success' | 'failed' | null;
    statusCode: number | null;
    at: string | null;
    error: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface TestDeliveryResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  latencyMs?: number;
  responseBody?: string;
  error?: string;
}

const EVENT_METADATA: Record<string, { label: string; group: string; desc: string; color: string }> = {
  'message.inbound': {
    label: 'Inbound Message',
    group: 'Messaging',
    desc: 'Triggered when a customer sends a message to your WhatsApp number.',
    color: '#10B981',
  },
  'message.status': {
    label: 'Message Status',
    group: 'Messaging',
    desc: 'Sent, delivered, read, or failed receipts for outbound messages.',
    color: '#06B6D4',
  },
  'ai.replied': {
    label: 'AI Bot Replied',
    group: 'AI & Automation',
    desc: 'Triggered when the AI agent responds automatically using knowledge base context.',
    color: '#8B5CF6',
  },
  'sentiment.analyzed': {
    label: 'Sentiment Analyzed',
    group: 'AI & Automation',
    desc: 'Real-time conversation sentiment score (positive, neutral, negative, urgent).',
    color: '#EC4899',
  },
  'human.handover': {
    label: 'Human Handover',
    group: 'AI & Automation',
    desc: 'Triggered when a conversation is escalated from AI bot to a live human agent.',
    color: '#F59E0B',
  },
  'flow.executed': {
    label: 'Flow Executed',
    group: 'AI & Automation',
    desc: 'Triggered when a visual flow automation step completes its execution.',
    color: '#6366F1',
  },
  'lead.status_changed': {
    label: 'Lead Status Changed',
    group: 'CRM & Contacts',
    desc: 'Lead qualification status or contact pipeline phase updated.',
    color: '#F97316',
  },
  'template.status_changed': {
    label: 'Template Status',
    group: 'Meta WABA',
    desc: 'Meta approves, rejects, or pauses a WhatsApp template.',
    color: '#3B82F6',
  },
  'account.quality_changed': {
    label: 'Account Quality',
    group: 'Meta WABA',
    desc: 'Phone number quality rating change (Green/Yellow/Red).',
    color: '#14B8A6',
  },
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<OutboundWebhookItem[]>([]);
  const [supportedEvents, setSupportedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<OutboundWebhookItem | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    url: '',
    events: ['*'],
    allEvents: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // HMAC Secret Reveal Modal (shown on create or rotate)
  const [revealedSecret, setRevealedSecret] = useState<{
    secret: string;
    description: string;
    isRotation?: boolean;
  } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // Action Loading & Test Delivery Results
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<TestDeliveryResult | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Verification code tab
  const [activeCodeTab, setActiveCodeTab] = useState<'node' | 'python'>('node');

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [whRes, evRes] = await Promise.all([
        apiClient.get<{ data: OutboundWebhookItem[] }>('/api/webhooks'),
        apiClient.get<{ data: string[] }>('/api/webhooks/events'),
      ]);
      setWebhooks(whRes.data || []);
      setSupportedEvents(evRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load webhooks. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingWebhook(null);
    setFormData({
      description: '',
      url: '',
      events: ['*'],
      allEvents: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (wh: OutboundWebhookItem) => {
    setEditingWebhook(wh);
    const hasAll = wh.events.includes('*');
    setFormData({
      description: wh.description,
      url: wh.url,
      events: hasAll ? ['*'] : wh.events,
      allEvents: hasAll,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWebhook(null);
    setFormError(null);
  };

  const handleToggleEvent = (eventName: string) => {
    if (formData.allEvents) {
      setFormData({
        ...formData,
        allEvents: false,
        events: [eventName],
      });
      return;
    }

    const current = formData.events.filter((e) => e !== '*');
    if (current.includes(eventName)) {
      const updated = current.filter((e) => e !== eventName);
      setFormData({
        ...formData,
        events: updated.length === 0 ? ['*'] : updated,
        allEvents: updated.length === 0,
      });
    } else {
      setFormData({
        ...formData,
        events: [...current, eventName],
        allEvents: false,
      });
    }
  };

  const handleToggleAllEvents = (checked: boolean) => {
    setFormData({
      ...formData,
      allEvents: checked,
      events: checked ? ['*'] : ['message.inbound'],
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.description.trim()) {
      setFormError('Please enter a description for this webhook endpoint.');
      return;
    }

    if (!formData.url.trim() || !formData.url.startsWith('http')) {
      setFormError('Please enter a valid HTTP or HTTPS destination URL.');
      return;
    }

    const eventsToSave = formData.allEvents ? ['*'] : formData.events;
    if (eventsToSave.length === 0) {
      setFormError('Please select at least one event type.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingWebhook) {
        const id = editingWebhook._id || editingWebhook.id;
        const res = await apiClient.patch<{ data: OutboundWebhookItem }>(`/api/webhooks/${id}`, {
          description: formData.description.trim(),
          url: formData.url.trim(),
          events: eventsToSave,
        });
        setWebhooks((prev) => prev.map((item) => ((item._id || item.id) === id ? res.data : item)));
        closeModal();
      } else {
        const res = await apiClient.post<{ data: OutboundWebhookItem & { secret: string } }>('/api/webhooks', {
          description: formData.description.trim(),
          url: formData.url.trim(),
          events: eventsToSave,
        });

        const created = res.data;
        setWebhooks((prev) => [created, ...prev]);
        closeModal();

        if (created.secret) {
          setRevealedSecret({
            secret: created.secret,
            description: created.description,
            isRotation: false,
          });
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save webhook configuration.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (wh: OutboundWebhookItem) => {
    const id = wh._id || wh.id;
    if (!id) return;
    setActionLoading((prev) => ({ ...prev, [`toggle-${id}`]: true }));
    try {
      const res = await apiClient.patch<{ data: OutboundWebhookItem }>(`/api/webhooks/${id}`, {
        isActive: !wh.isActive,
      });
      setWebhooks((prev) => prev.map((item) => ((item._id || item.id) === id ? res.data : item)));
    } catch (err: any) {
      alert(`Failed to update status: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`toggle-${id}`]: false }));
    }
  };

  const handleTestPing = async (wh: OutboundWebhookItem) => {
    const id = wh._id || wh.id;
    if (!id) return;
    setActionLoading((prev) => ({ ...prev, [`test-${id}`]: true }));
    setTestResult(null);

    try {
      const res = await apiClient.post<{
        success: boolean;
        statusCode: number;
        latencyMs: number;
        responseBody: string;
      }>(`/api/webhooks/${id}/test`);

      setTestResult({
        webhookId: id,
        success: res.success,
        statusCode: res.statusCode,
        latencyMs: res.latencyMs,
        responseBody: res.responseBody,
      });

      // Refresh list to update lastDelivery telemetry
      const updatedList = await apiClient.get<{ data: OutboundWebhookItem[] }>('/api/webhooks');
      if (updatedList.data) setWebhooks(updatedList.data);
    } catch (err: any) {
      setTestResult({
        webhookId: id,
        success: false,
        error: err?.message || 'Network error executing test delivery',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`test-${id}`]: false }));
    }
  };

  const handleRotateSecret = async (wh: OutboundWebhookItem) => {
    const id = wh._id || wh.id;
    if (!id) return;

    const ok = window.confirm(
      `Are you sure you want to rotate the HMAC secret for "${wh.description}"?\n\n` +
      `Your receiving server must be updated with the new secret immediately, or signature verification will fail.`
    );
    if (!ok) return;

    setActionLoading((prev) => ({ ...prev, [`rotate-${id}`]: true }));
    try {
      const res = await apiClient.post<{ data: { id: string; secret: string } }>(`/api/webhooks/${id}/rotate-secret`);
      if (res.data?.secret) {
        setRevealedSecret({
          secret: res.data.secret,
          description: wh.description,
          isRotation: true,
        });
      }
    } catch (err: any) {
      alert(`Secret rotation failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`rotate-${id}`]: false }));
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [`delete-${id}`]: true }));
    try {
      await apiClient.delete(`/api/webhooks/${id}`);
      setWebhooks((prev) => prev.filter((item) => (item._id || item.id) !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Deletion failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete-${id}`]: false }));
    }
  };

  const copyToClipboard = (text: string, isSecret = false, whId?: string) => {
    navigator.clipboard.writeText(text);
    if (isSecret) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    }
    if (whId) {
      setCopiedUrlId(whId);
      setTimeout(() => setCopiedUrlId(null), 2000);
    }
  };

  const activeCount = webhooks.filter((w) => w.isActive).length;
  const failingCount = webhooks.filter((w) => w.failureCount > 0).length;

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}
              >
                <Icon name="webhook" size={20} />
              </div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
                Outbound Webhooks & Events
              </h1>
            </div>
            <p className="page-subtitle" style={{ margin: '6px 0 0 48px', color: 'var(--color-foreground-secondary)' }}>
              Stream WhatsApp events, AI replies, sentiments, and lead updates to your CRM, Zapier, or backend API with HMAC-SHA256 signatures.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchInitialData}
              disabled={loading}
              title="Refresh webhook status"
            >
              <Icon name="refresh" size={15} />
              <span>Refresh</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Icon name="plus" size={16} />
              <span>Add Webhook Endpoint</span>
            </button>
          </div>
        </div>
      </header>

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-foreground-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Configured Endpoints
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-foreground)' }}>{webhooks.length}</span>
            <span style={{ fontSize: '13px', color: 'var(--color-foreground-secondary)' }}>destinations</span>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-foreground-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Forwarding
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#10B981' }}>{activeCount}</span>
            <span style={{ fontSize: '13px', color: 'var(--color-foreground-secondary)' }}>live streams</span>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-foreground-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Health Status
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: failingCount > 0 ? '#EF4444' : '#10B981' }}>
              {failingCount > 0 ? `${failingCount} Degraded` : '100% Operational'}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-foreground-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Payload Security
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span className="badge" style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '12px', padding: '4px 8px' }}>
              HMAC-SHA256
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-foreground-muted)' }}>X-NotifyIQ-Signature-256</span>
          </div>
        </div>
      </div>

      {/* Global Alert / Test Delivery Feedback */}
      {testResult && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            marginBottom: '24px',
            backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: testResult.success ? '#10B981' : '#EF4444',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={testResult.success ? 'check' : 'close'} size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: testResult.success ? '#065F46' : '#991B1B' }}>
                {testResult.success ? 'Webhook Ping Delivered Successfully' : 'Webhook Ping Delivery Failed'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-foreground-secondary)', marginTop: '2px' }}>
                {testResult.statusCode && (
                  <span style={{ fontWeight: 600, marginRight: '10px' }}>
                    HTTP Status: {testResult.statusCode}
                  </span>
                )}
                {testResult.latencyMs !== undefined && (
                  <span style={{ marginRight: '10px' }}>Latency: {testResult.latencyMs}ms</span>
                )}
                {testResult.error && <span>Reason: {testResult.error}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground-muted)' }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Fetching registered webhook endpoints..." minHeight="280px" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchInitialData} />
      ) : webhooks.length === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            borderRadius: '16px',
            border: '2px dashed var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="webhook" size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--color-foreground)' }}>
            No Webhook Endpoints Registered
          </h3>
          <p style={{ margin: '0 auto 24px', maxWidth: '520px', fontSize: '14px', color: 'var(--color-foreground-secondary)' }}>
            Set up an endpoint URL to receive real-time notifications for incoming WhatsApp chats, automated AI replies, lead status transitions, and delivery receipts.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Icon name="plus" size={16} />
            <span>Create Your First Webhook</span>
          </button>
        </div>
      ) : (
        /* Endpoints List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {webhooks.map((wh) => {
            const id = wh._id || wh.id || '';
            const isToggling = !!actionLoading[`toggle-${id}`];
            const isTesting = !!actionLoading[`test-${id}`];
            const isRotating = !!actionLoading[`rotate-${id}`];
            const isDeleting = !!actionLoading[`delete-${id}`];
            const hasAllEvents = wh.events.includes('*');

            return (
              <div
                key={id}
                className="card"
                style={{
                  padding: '24px',
                  borderRadius: '14px',
                  border: `1px solid ${wh.isActive ? 'var(--color-border)' : 'var(--color-border-strong)'}`,
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  opacity: wh.isActive ? 1 : 0.75,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: wh.isActive ? '#10B981' : '#94A3B8',
                        boxShadow: wh.isActive ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
                      }}
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                        {wh.description}
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: wh.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                        color: wh.isActive ? '#059669' : '#64748B',
                      }}
                    >
                      {wh.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                    {wh.failureCount > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#DC2626',
                        }}
                      >
                        {wh.failureCount} Failures
                      </span>
                    )}
                  </div>

                  {/* Top Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Toggle Switch */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleToggleActive(wh)}
                      disabled={isToggling}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      title={wh.isActive ? 'Pause Webhook' : 'Activate Webhook'}
                    >
                      {isToggling ? 'Updating...' : wh.isActive ? 'Pause' : 'Activate'}
                    </button>

                    {/* Test Ping Button */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleTestPing(wh)}
                      disabled={isTesting || !wh.isActive}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <Icon name="zap" size={14} />
                      <span>{isTesting ? 'Pinging...' : 'Test Delivery'}</span>
                    </button>

                    {/* Edit */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => openEditModal(wh)}
                      style={{ padding: '6px 10px' }}
                      title="Edit Endpoint Settings"
                    >
                      <Icon name="sliders" size={14} />
                    </button>

                    {/* Rotate Secret */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleRotateSecret(wh)}
                      disabled={isRotating}
                      style={{ padding: '6px 10px' }}
                      title="Rotate HMAC Secret"
                    >
                      <Icon name="key" size={14} />
                    </button>

                    {/* Delete */}
                    {deleteConfirmId === id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteWebhook(id)}
                          disabled={isDeleting}
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setDeleteConfirmId(null)}
                          style={{ padding: '6px 8px', fontSize: '11px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setDeleteConfirmId(id)}
                        style={{ padding: '6px 10px', color: 'var(--color-error)' }}
                        title="Delete Webhook"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* URL Display */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600, wordBreak: 'break-all' }}>
                    {wh.url}
                  </span>
                  <button
                    onClick={() => copyToClipboard(wh.url, false, id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: copiedUrlId === id ? '#10B981' : 'var(--color-foreground-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginLeft: '12px',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={copiedUrlId === id ? 'check' : 'copy'} size={14} />
                    <span style={{ fontSize: '11px' }}>{copiedUrlId === id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Subscribed Events Badges */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-foreground-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Subscribed Events ({hasAllEvents ? 'Wildcard' : wh.events.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {hasAllEvents ? (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(37, 99, 235, 0.2)',
                        }}
                      >
                        * All Events (Wildcard Subscription)
                      </span>
                    ) : (
                      wh.events.map((ev) => {
                        const meta = EVENT_METADATA[ev];
                        return (
                          <span
                            key={ev}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              color: meta?.color || 'var(--color-foreground-secondary)',
                              border: `1px solid ${meta?.color ? `${meta.color}40` : 'var(--color-border)'}`,
                            }}
                            title={meta?.desc || ev}
                          >
                            {ev}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Telemetry Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '12px',
                    color: 'var(--color-foreground-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span>
                      Created: {new Date(wh.createdAt).toLocaleDateString()}
                    </span>
                    {wh.lastDelivery ? (
                      <span>
                        Last Delivery:{' '}
                        <strong
                          style={{
                            color: wh.lastDelivery.status === 'success' ? '#10B981' : '#EF4444',
                          }}
                        >
                          {wh.lastDelivery.status === 'success' ? `HTTP ${wh.lastDelivery.statusCode || 200}` : 'Failed'}
                        </strong>{' '}
                        {wh.lastDelivery.at ? `(${new Date(wh.lastDelivery.at).toLocaleTimeString()})` : ''}
                      </span>
                    ) : (
                      <span>No events dispatched yet</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="shield" size={13} style={{ color: '#10B981' }} />
                    <span>HMAC-SHA256 Protected</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Developer Integration Guide */}
      <section
        className="card"
        style={{
          marginTop: '36px',
          padding: '28px',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-foreground)' }}>
              Webhook Verification & Security
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-foreground-secondary)' }}>
              Every HTTP POST request sent to your webhook endpoint contains cryptographic security headers to prevent tampering.
            </p>
          </div>

          <div style={{ display: 'flex', backgroundColor: 'var(--color-surface-secondary)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveCodeTab('node')}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeCodeTab === 'node' ? 'var(--color-surface)' : 'transparent',
                color: activeCodeTab === 'node' ? 'var(--color-primary)' : 'var(--color-foreground-secondary)',
                boxShadow: activeCodeTab === 'node' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Node.js Express
            </button>
            <button
              onClick={() => setActiveCodeTab('python')}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeCodeTab === 'python' ? 'var(--color-surface)' : 'transparent',
                color: activeCodeTab === 'python' ? 'var(--color-primary)' : 'var(--color-foreground-secondary)',
                boxShadow: activeCodeTab === 'python' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Python FastAPI
            </button>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div
          style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            padding: '16px 20px',
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '12.5px',
            lineHeight: 1.6,
            overflowX: 'auto',
          }}
        >
          {activeCodeTab === 'node' ? (
            <pre style={{ margin: 0 }}>
{`// Express.js Webhook Receiver Handler
const crypto = require('crypto');

app.post('/api/webhook', (req, res) => {
  const signature = req.headers['x-notifyiq-signature-256'];
  const event = req.headers['x-notifyiq-event'];
  const deliveryId = req.headers['x-notifyiq-delivery-id'];

  // Calculate expected HMAC using your plaintext secret
  const expectedHash = crypto
    .createHmac('sha256', process.env.NOTIFYIQ_WEBHOOK_SECRET)
    .update(req.rawBody || JSON.stringify(req.body))
    .digest('hex');

  const expectedSignature = 'sha256=' + expectedHash;

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  // Handle verified payload
  console.log(\`Received \${event} event:\`, req.body);
  res.status(200).json({ received: true });
});`}
            </pre>
          ) : (
            <pre style={{ margin: 0 }}>
{`# Python FastAPI Webhook Receiver
import hmac, hashlib
from fastapi import FastAPI, Request, Header, HTTPException

app = FastAPI()

@app.post("/api/webhook")
async def receive_webhook(
    request: Request,
    x_notifyiq_signature_256: str = Header(None),
    x_notifyiq_event: str = Header(None)
):
    raw_body = await request.body()
    secret = "your_webhook_secret".encode('utf-8')
    computed = "sha256=" + hmac.new(secret, raw_body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(x_notifyiq_signature_256 or "", computed):
        raise HTTPException(status_code=401, detail="Signature mismatch")

    data = await request.json()
    return {"status": "ok", "event": x_notifyiq_event}`}
            </pre>
          )}
        </div>
      </section>

      {/* Modal: Create or Edit Webhook */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={closeModal}
        >
          <div
            className="modal-container card"
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '28px',
              backgroundColor: 'var(--color-surface)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={editingWebhook ? 'sliders' : 'plus'} size={18} />
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  {editingWebhook ? 'Edit Webhook Endpoint' : 'Register New Webhook Endpoint'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-foreground-muted)' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#DC2626',
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Description / Endpoint Name <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HubSpot Lead Sync, Zapier Receiver, In-House CRM"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={120}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Destination URL <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://your-domain.com/api/webhooks/notifyiq"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--color-foreground-muted)', display: 'block', marginTop: '4px' }}>
                  Must be an accessible HTTP or HTTPS URL that accepts POST requests.
                </span>
              </div>

              {/* Event Subscriptions */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>
                    Select Subscribed Events
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.allEvents}
                      onChange={(e) => handleToggleAllEvents(e.target.checked)}
                    />
                    <strong style={{ color: 'var(--color-primary)' }}>Subscribe to all events (*)</strong>
                  </label>
                </div>

                {!formData.allEvents && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                    }}
                  >
                    {supportedEvents
                      .filter((ev) => ev !== '*')
                      .map((ev) => {
                        const meta = EVENT_METADATA[ev];
                        const isChecked = formData.events.includes(ev);

                        return (
                          <label
                            key={ev}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                              cursor: 'pointer',
                              border: isChecked ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleEvent(ev)}
                              style={{ marginTop: '3px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>
                                  {meta?.label || ev}
                                </span>
                                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-foreground-muted)' }}>
                                  ({ev})
                                </span>
                              </div>
                              {meta?.desc && (
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-foreground-secondary)' }}>
                                  {meta.desc}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={formSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editingWebhook ? 'Update Webhook' : 'Register Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: HMAC Secret Reveal (One-Time Display) */}
      {revealedSecret && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            className="modal-container card"
            style={{
              width: '100%',
              maxWidth: '560px',
              borderRadius: '16px',
              padding: '28px',
              backgroundColor: 'var(--color-surface)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Icon name="key" size={28} />
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>
              {revealedSecret.isRotation ? 'Secret Rotated Successfully' : 'Webhook Registered Successfully'}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-foreground-secondary)' }}>
              Here is your HMAC signing secret for <strong>{revealedSecret.description}</strong>.
            </p>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#B45309',
                fontSize: '12.5px',
                textAlign: 'left',
                marginBottom: '16px',
              }}
            >
              ⚠️ <strong>Store this secret securely!</strong> For your protection, this plaintext secret will never be displayed again.
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#0F172A',
                color: '#38BDF8',
                fontFamily: 'monospace',
                fontSize: '14px',
                marginBottom: '24px',
                border: '1px solid #1E293B',
              }}
            >
              <span style={{ wordBreak: 'break-all', userSelect: 'all' }}>{revealedSecret.secret}</span>
              <button
                onClick={() => copyToClipboard(revealedSecret.secret, true)}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px', marginLeft: '12px', flexShrink: 0 }}
              >
                <Icon name={copiedSecret ? 'check' : 'copy'} size={14} />
                <span>{copiedSecret ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setRevealedSecret(null)}
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
            >
              I Have Saved My Webhook Secret
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
