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
      buttons.push({ type: 'URL', text: ctaText.trim(), url: ctaUrl.trim() });
    }
    if (quickReply1.trim()) {
      buttons.push({ type: 'QUICK_REPLY', text: quickReply1.trim() });
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

      setStatusMessage('Template submitted successfully with CTA buttons! Status: APPROVED.');
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
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>WhatsApp Message Template Builder</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Create and submit approved interactive WhatsApp templates required for initiating communications outside the 24-hour window.
        </p>
      </header>

      {statusMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: '13px' }}>
          {statusMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Template Creation Form */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="plane" style={{ color: 'var(--accent)' }} />
            <span>New Template Specification</span>
          </h3>

          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Template Name (lowercase & underscores)
              </label>
              <input
                type="text"
                placeholder="e.g. payment_reminder_v1"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                >
                  <option value="UTILITY">Utility</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="es">Spanish (es)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Header Text (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Account Update"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Body Message (Use variables like &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;)
              </label>
              <textarea
                rows={3}
                placeholder="Hello {{1}}, your invoice {{2}} is ready."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                required
              />
            </div>

            {/* Interactive Buttons Section */}
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                Interactive Buttons (Call To Action / Quick Reply)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="CTA Button Label (e.g. Visit Website)"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                />
                <input
                  type="url"
                  placeholder="Target URL (https://...)"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>

              <input
                type="text"
                placeholder="Quick Reply Label (e.g. Talk to Support Agent)"
                value={quickReply1}
                onChange={(e) => setQuickReply1(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Footer Text (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Reply STOP to opt out"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="send-btn"
              style={{ padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
            >
              {creating ? 'Submitting to Meta...' : 'Submit Interactive Template for Meta Approval'}
            </button>
          </form>
        </div>

        {/* Existing Templates Table */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            Registered Meta Templates ({templates.length})
          </h3>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {templates.map((tpl) => (
                <div
                  key={tpl.id || tpl.name}
                  style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent-light)' }}>
                      {tpl.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: tpl.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: tpl.status === 'APPROVED' ? 'var(--sentiment-positive)' : '#eab308',
                        }}
                      >
                        {tpl.status}
                      </span>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.name)}
                        style={{ background: 'none', border: 'none', color: 'var(--sentiment-urgent)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Category: {tpl.category} | Lang: {tpl.language}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: tpl.buttons && tpl.buttons.length > 0 ? '10px' : '0' }}>
                    "{tpl.bodyText}"
                  </div>

                  {tpl.buttons && tpl.buttons.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {tpl.buttons.map((btn, bIdx) => (
                        <span
                          key={bIdx}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: '1px solid var(--accent)',
                            color: 'var(--accent-light)',
                            background: 'rgba(56, 189, 248, 0.1)',
                          }}
                        >
                          🔗 {btn.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

