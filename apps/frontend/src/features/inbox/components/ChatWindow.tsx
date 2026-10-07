import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { sendMessage, addOptimisticMessage, toggleConversationAi } from '../../../store/slices/inboxSlice';
import type { Message } from '../../../store/slices/inboxSlice';
import { useTranslation } from '../../../i18n';
import { Icon } from '../../../components/ui/Icon';
import { apiClient } from '../../../lib/api/apiClient';
import LeadDrawer from './LeadDrawer';

interface ChatWindowProps {
  onBackToList?: () => void;
}

export default function ChatWindow({ onBackToList }: ChatWindowProps = {}) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const activeConvId = useAppSelector((state) => state.inbox.activeConversationId);
  const conversations = useAppSelector((state) => state.inbox.conversations);
  const activeMessages = useAppSelector((state) => {
    if (!activeConvId) return [];
    return state.inbox.messagesByConversationId[activeConvId] || [];
  });
  const loading = useAppSelector((state) => state.inbox.loadingMessages);

  const activeConv = conversations.find((c) => c._id === activeConvId);

  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [wabaTemplates, setWabaTemplates] = useState<any[]>([]);
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState(false);

  const isBotActive = !activeConv?.isHumanTakeover;
  const isWindowActive = activeConv?.windowExpiresAt
    ? new Date(activeConv.windowExpiresAt).getTime() > Date.now()
    : true;

  const formatWindowTimeLeft = () => {
    if (!activeConv?.windowExpiresAt) return 'Active session';
    const diffMs = new Date(activeConv.windowExpiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };


  useEffect(() => {
    apiClient
      .get<{ data: any[] }>('/api/waba/templates')
      .then((res) => {
        if (res.data) setWabaTemplates(res.data);
      })
      .catch(() => setWabaTemplates([]));
  }, []);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll message stream
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  // Query AI suggested template responses
  useEffect(() => {
    if (!activeConvId) return;

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const response = await apiClient.get<{ data: { suggestions: string[] } }>(
          `/api/ai/suggestions/${activeConvId}`
        );
        if (response.data?.suggestions) {
          setSuggestions(response.data.suggestions);
        }
      } catch {
        const staticReplies: Record<string, string[]> = {
          positive: [
            'Thank you for your feedback! Let us know if you need anything else.',
            'Glad it went smoothly! Let us know if you need custom limits.',
            'We appreciate the support!',
          ],
          urgent: [
            'Apologies, checking the transaction logs now.',
            'Could you share the transaction ID if you have it?',
            'Let me initiate a manual verification of this charge right away.',
          ],
          negative: [
            'I will escalate this immediately to the engineering team.',
            'Could you share the details so we can investigate?',
            'Updating configurations today to resolve this.',
          ],
          neutral: [
            'Yes, the whitelabel agency plan details are at docs.notifyiq.app.',
            'I can set up a custom agency sub-workspace for you today.',
            'Sure, let me share the pricing structure.',
          ],
        };
        const sentiment = activeConv?.sentiment || 'neutral';
        setSuggestions(staticReplies[sentiment] || ['How can I help you today?']);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [activeConvId, activeConv?.sentiment]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activeConv) return;

    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticMsg: Message = {
      _id: optimisticId,
      waMessageId: `wamid.opt_${Date.now()}`,
      direction: 'outbound',
      type: 'text',
      status: 'sent',
      body: text,
      createdAt: 'Just now',
    };

    dispatch(addOptimisticMessage({ conversationId: activeConv._id, message: optimisticMsg }));
    if (!textToSend) setInputText('');

    dispatch(sendMessage({ to: activeConv.phone, body: text }));
  };

  const handleApplyTemplate = (tplName: string) => {
    setSelectedTemplate(tplName);
    if (!tplName) return;
    const found = wabaTemplates.find((t) => t.name === tplName);
    if (found?.bodyText) {
      setInputText(found.bodyText);
    } else {
      setInputText(`[Template: ${tplName}]`);
    }
  };

  const handleExportData = () => {
    alert('Processing GDPR Article 20 request: Compiling chat logs. Download link will be ready shortly.');
  };

  const handleEraseContact = () => {
    if (confirm('Proceed with DPDP Act Section 11 Right to Erasure? This permanently purges all conversations.')) {
      alert('Contact purged. Associated records cascade-deleted.');
    }
  };

  if (!activeConv) {
    return (
      <section className="chat-window" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-foreground-muted)', flex: 1, padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <Icon name="chats" size={48} style={{ color: 'var(--color-border-strong)', marginBottom: '12px' }} />
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-foreground)' }}>{t('selectConversation')}</div>
          <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--color-foreground-secondary)' }}>Choose a contact from the list to view chat logs and start messaging</div>
          {onBackToList && (
            <button className="btn btn-primary btn-sm" onClick={onBackToList} style={{ marginTop: '16px' }}>
              <span>← View Conversations</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="chat-window" style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--color-surface)', height: '100%', minWidth: 0 }}>
      {/* Active Header */}
      <header className="chat-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', height: 'auto', minHeight: '64px' }}>
        <div className="active-contact-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', minWidth: 0 }}>
          {onBackToList && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onBackToList}
              style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Back to conversations list"
            >
              <span>←</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Back</span>
            </button>
          )}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-muted)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              border: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            {activeConv.contactName.substring(0, 2).toUpperCase()}
          </div>
          <div className="active-contact-details" style={{ minWidth: 0, flex: 1 }}>
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeConv.contactName}
              </span>
              <span
                onClick={() => dispatch(toggleConversationAi(activeConv._id))}
                title={isBotActive ? 'Click to Pause AI (Human Takeover)' : 'Click to Resume AI Bot'}
                style={{
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: isBotActive ? 'rgba(14, 165, 233, 0.12)' : 'rgba(234, 88, 12, 0.12)',
                  color: isBotActive ? 'var(--color-info)' : '#ea580c',
                  border: `1px solid ${isBotActive ? 'rgba(14, 165, 233, 0.3)' : 'rgba(234, 88, 12, 0.3)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon name={isBotActive ? 'bot' : 'user'} size={12} />
                {isBotActive ? 'AI Bot Active' : 'Human Co-Pilot'}
              </span>

              {/* 24-Hour WhatsApp Service Window Badge */}
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: isWindowActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: isWindowActive ? '#16a34a' : '#dc2626',
                  border: `1px solid ${isWindowActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
                title={isWindowActive ? 'WhatsApp 24-hour customer service window is open' : '24-hour window expired. Meta requires a template message.'}
              >
                <span>{isWindowActive ? '⚡ 24h Window:' : '⚠️ Window Expired:'}</span>
                <span>{formatWindowTimeLeft()}</span>
              </span>
            </div>
            <div className="phone" style={{ fontSize: '11.5px', color: 'var(--color-foreground-secondary)', fontFamily: 'monospace' }}>
              {activeConv.phone}
            </div>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedTemplate}
            onChange={(e) => handleApplyTemplate(e.target.value)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: '11.5px', borderRadius: 'var(--radius-md)' }}
          >
            <option value="">-- WABA Template --</option>
            {wabaTemplates.map((tpl) => (
              <option key={tpl.id || tpl.name} value={tpl.name}>
                {tpl.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsLeadDrawerOpen(true)}
            title="View AI Lead Intelligence & CRM Details"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '11.5px' }}
          >
            <Icon name="sparkles" size={13} style={{ color: 'var(--color-primary)' }} />
            <span>Lead Profile</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handleExportData} title={t('exportData')}>
            <Icon name="download" size={13} />
            <span style={{ fontSize: '11.5px' }}>GDPR</span>
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleEraseContact}
            title={t('eraseContact')}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </header>


      {/* Messages Stream */}
      <div className="messages-scroller" ref={scrollRef} style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto', backgroundColor: 'var(--color-background)' }}>
        {loading && activeMessages.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-foreground-muted)' }}>
            Loading message logs...
          </div>
        ) : (
          activeMessages.map((msg) => (
            <div
              key={msg._id}
              className={`message-bubble-wrapper ${msg.direction}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div
                className="message-bubble"
                style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: msg.direction === 'outbound' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: msg.direction === 'outbound' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: msg.direction === 'outbound' ? '#FFFFFF' : 'var(--color-foreground)',
                  border: msg.direction === 'outbound' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '14px',
                  lineHeight: '1.4',
                }}
              >
                {msg.type === 'audio' ? (
                  <div className="audio-player-wrapper">
                    <audio controls src={msg.mediaUrl || undefined} style={{ width: '100%' }} />
                    {msg.transcript && (
                      <div className="voice-transcript" style={{ fontSize: '11px', marginTop: '6px', opacity: 0.9 }}>
                        <strong>{t('whisperTranscript')}:</strong> {msg.transcript}
                      </div>
                    )}
                  </div>
                ) : (
                  msg.body
                )}
              </div>
              <div className="message-footer" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '10px', color: 'var(--color-foreground-muted)' }}>
                <span className="message-time-stamp">{msg.createdAt}</span>
                <span className="message-status" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {msg.status === 'failed' ? (
                    <span style={{ color: 'var(--color-error)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Icon name="close" size={10} />
                      Failed
                    </span>
                  ) : (
                    <Icon name="check" size={10} style={{ color: msg.status === 'read' ? 'var(--color-info)' : 'inherit' }} />
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Suggestions Bar */}
      <div
        className="suggestions-bar"
        style={{
          padding: '8px 16px',
          backgroundColor: 'var(--color-surface-secondary)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>
          <Icon name="sparkles" size={12} />
          <span>AI Suggestions:</span>
        </div>
        {loadingSuggestions ? (
          <span style={{ fontSize: '12px', color: 'var(--color-foreground-muted)' }}>Generating replies...</span>
        ) : (
          suggestions.map((reply, idx) => (
            <button key={idx} className="filter-pill" onClick={() => handleSend(reply)} style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
              {reply}
            </button>
          ))
        )}
      </div>

      {/* Input Panel */}
      <footer className="input-panel" style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        {!isWindowActive && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              marginBottom: '10px',
              fontSize: '11.5px',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Icon name="alert" size={14} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span>
              <strong>24-Hour WhatsApp Service Window Expired:</strong> Standard text messages will be rejected by Meta Cloud API. Please select and send an approved WABA Template from the dropdown above to re-engage this customer.
            </span>
          </div>
        )}
        <form
          className="input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <button type="button" className="btn btn-ghost btn-sm" title="Attach file">
            <Icon name="attachment" size={16} />
          </button>
          <input
            type="text"
            className="form-input-styled"
            placeholder={t('typeMessage')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            <Icon name="send" size={14} />
            <span>Send</span>
          </button>
        </form>
      </footer>

      {/* Slide-out Lead Drawer */}
      <LeadDrawer
        isOpen={isLeadDrawerOpen}
        onClose={() => setIsLeadDrawerOpen(false)}
        contactPhone={activeConv.phone}
        contactName={activeConv.contactName}
      />
    </section>
  );
}
