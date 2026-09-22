import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

interface MessageTemplate {
  id?: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: string;
  bodyText: string;
  headerText?: string;
  footerText?: string;
  buttons?: Array<{ type: 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER'; text: string; url?: string }>;
}

export default function TemplateBuilderPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('UTILITY');
  const [language, setLanguage] = useState('en');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');

  // Interactive Button States
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [quickReply1, setQuickReply1] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: MessageTemplate[] }>('/api/waba/templates');
      if (res.data) {
        setTemplates(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch WABA templates from Meta server.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateTemplate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bodyText.trim()) return;

    setCreating(true);
    setStatusMessage('Submitting interactive template to Meta Cloud API for review...');

    const buttons = [];
    if (ctaText.trim() && ctaUrl.trim()) {
      buttons.push({ type: 'URL' as const, text: ctaText.trim(), url: ctaUrl.trim() });
    }
    if (quickReply1.trim()) {
      buttons.push({ type: 'QUICK_REPLY' as const, text: quickReply1.trim() });
    }

    try {
      await apiClient.post('/api/waba/templates', {
        name,
        category,
        language,
        headerType: headerText ? 'TEXT' : 'NONE',
        headerText,
        bodyText,
        footerText,
        buttons: buttons.length > 0 ? buttons : undefined,
      });

      setStatusMessage('Template submitted successfully! Meta Status: APPROVED.');
      setName('');
      setHeaderText('');
      setBodyText('');
      setFooterText('');
      setCtaText('');
      setCtaUrl('');
      setQuickReply1('');
      loadTemplates();
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err: any) {
      setStatusMessage(`Submission failed: ${err.message || 'Error submitting template'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (tplName: string) => {
    if (!confirm(`Are you sure you want to delete template "${tplName}"?`)) return;
    try {
      await apiClient.delete(`/api/waba/templates/${tplName}`);
      loadTemplates();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">WhatsApp Template Builder & Device Live Preview</h1>
          <p className="page-subtitle">
            Design, preview, and submit Meta-approved WhatsApp message templates with call-to-action buttons.
          </p>
        </div>
      </header>

      {statusMessage && (
        <div className="status-message status-message-info">
          <Icon name="check" size={14} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid: Left Editor | Right WhatsApp Mobile Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-8)', alignItems: 'start', marginBottom: 'var(--space-8)' }}>
        {/* Template Creation Form */}
        <div className="section-card">
          <h3 className="section-title">
            <Icon name="document" className="section-title-icon" />
            <span>Template Specification</span>
          </h3>

          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label-styled">Template Name (lowercase & underscores)</label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="e.g. payment_reminder_v1"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label-styled">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="UTILITY">Utility</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label-styled">Language</label>
                <select
                  className="form-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="es">Spanish (es)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-styled">Header Text (Optional)</label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="e.g. Account Update"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label-styled">
                Body Text (Use variables like &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;)
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Hello {{1}}, your invoice {{2}} is ready for payment."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                required
              />
            </div>

            {/* Interactive Buttons Section */}
            <div style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <label className="form-label-styled" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
                Interactive Buttons (Call To Action & Quick Reply)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="CTA Label (e.g. Visit Portal)"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                />
                <input
                  type="url"
                  className="form-input-styled"
                  placeholder="Target URL (https://...)"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>

              <input
                type="text"
                className="form-input-styled"
                placeholder="Quick Reply Label (e.g. Talk to Agent)"
                value={quickReply1}
                onChange={(e) => setQuickReply1(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label-styled">Footer Text (Optional)</label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="e.g. Reply STOP to opt out"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              <Icon name="plane" size={14} />
              <span>{creating ? 'Submitting to Meta API...' : 'Submit Interactive Template to Meta'}</span>
            </button>
          </form>
        </div>

        {/* WhatsApp Real-time Mobile Device Preview Frame */}
        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="section-title" style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <Icon name="phone" className="section-title-icon" />
            <span>WhatsApp Device Live Preview</span>
          </h3>

          {/* Phone Frame Container */}
          <div style={{
            width: '280px',
            backgroundColor: '#075E54', // Official WhatsApp Header green
            borderRadius: '24px',
            border: '8px solid #1E293B',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Phone Top Notch */}
            <div style={{ backgroundColor: '#1E293B', height: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '4px', backgroundColor: '#475569', borderRadius: '2px' }} />
            </div>

            {/* WhatsApp App Header */}
            <div style={{ padding: '8px 12px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFFFFF', color: '#075E54', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>IQ</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.1 }}>NotifyIQ Business</div>
                <div style={{ fontSize: '9px', opacity: 0.8 }}>Official Business Account</div>
              </div>
            </div>

            {/* Chat Area Background */}
            <div style={{ backgroundColor: '#E5DDD5', padding: '12px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {/* WhatsApp Message Bubble */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px 8px 8px 0px',
                padding: '10px 12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                fontSize: '12px',
                color: '#111827',
                lineHeight: 1.4,
              }}>
                {headerText && (
                  <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px', color: '#111827' }}>
                    {headerText}
                  </div>
                )}
                
                <div style={{ fontSize: '12px', color: '#374151' }}>
                  {bodyText ? bodyText.replace(/\{\{1\}\}/g, 'John Doe').replace(/\{\{2\}\}/g, 'INV-9042') : 'Your WhatsApp template message content will appear here...'}
                </div>

                {footerText && (
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '6px' }}>
                    {footerText}
                  </div>
                )}

                <div style={{ fontSize: '9px', color: '#9CA3AF', textAlign: 'right', marginTop: '4px' }}>
                  10:42 AM &#10004;&#10004;
                </div>
              </div>

              {/* Action Buttons Render inside Preview */}
              {(ctaText || quickReply1) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {ctaText && (
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                      color: '#00a884',
                      fontWeight: 700,
                      fontSize: '11px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}>
                      <Icon name="external-link" size={12} style={{ color: '#00a884' }} />
                      <span>{ctaText}</span>
                    </div>
                  )}
                  {quickReply1 && (
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                      color: '#00a884',
                      fontWeight: 700,
                      fontSize: '11px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                    }}>
                      {quickReply1}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registered Templates Table */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            Registered Meta WABA Templates ({templates.length})
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={loadTemplates}>
            <Icon name="refresh" size={14} />
            <span>Sync Meta Status</span>
          </button>
        </div>

        {loading ? (
          <LoadingState message="Fetching registered WABA templates..." />
        ) : error ? (
          <ErrorAlert message={error} onRetry={loadTemplates} title="Meta WABA Templates Error" />
        ) : templates.length === 0 ? (
          <EmptyState
            title="No WABA Templates Found"
            description="Create your first interactive WhatsApp message template to submit for Meta Cloud approval."
            icon="document"
          />
        ) : (
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Category</th>
                  <th>Language</th>
                  <th>Meta Review Status</th>
                  <th>Body Preview</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr key={tpl.id || tpl.name}>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{tpl.name}</td>
                    <td>
                      <span className="badge badge-neutral">{tpl.category}</span>
                    </td>
                    <td><code style={{ fontSize: '11px' }}>{tpl.language}</code></td>
                    <td>
                      <span className={`badge ${tpl.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                        <Icon name={tpl.status === 'APPROVED' ? 'check' : 'clock'} size={10} />
                        {tpl.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }} className="truncate text-secondary">
                      "{tpl.bodyText}"
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTemplate(tpl.name)}
                      >
                        <Icon name="trash" size={12} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
