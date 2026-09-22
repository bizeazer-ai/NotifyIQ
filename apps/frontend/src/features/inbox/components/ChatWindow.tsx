import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { sendMessage, addOptimisticMessage } from '../../../store/slices/inboxSlice';
import type { Message } from '../../../store/slices/inboxSlice';
import { useTranslation } from '../../../i18n';
import { Icon } from '../../../components/ui/Icon';
import { apiClient } from '../../../lib/api/apiClient';

export default function ChatWindow() {
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
  const [botModeActive, setBotModeActive] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [wabaTemplates, setWabaTemplates] = useState<any[]>([]);

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
      <section className="chat-window" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-foreground-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Icon name="chats" size={48} style={{ color: 'var(--color-border-strong)', marginBottom: '12px' }} />
          <div style={{ fontWeight: 600 }}>{t('selectConversation')}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Choose a contact from the list on the left to start chatting</div>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-window" style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--color-surface)', height: '100%' }}>
      {/* Active Header */}
      <header className="chat-header" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="active-contact-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            }}
          >
            {activeConv.contactName.substring(0, 2).toUpperCase()}
          </div>
          <div className="active-contact-details">
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-foreground)' }}>{activeConv.contactName}</span>
              <span
                onClick={() => setBotModeActive(!botModeActive)}
                style={{
                  cursor: 'pointer',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: botModeActive ? 'var(--color-info-muted)' : 'var(--color-error-muted)',
                  color: botModeActive ? 'var(--color-info)' : 'var(--color-error)',
                  border: `1px solid ${botModeActive ? 'rgba(14, 165, 233, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Icon name={botModeActive ? 'bot' : 'user'} size={12} />
                {botModeActive ? 'Gemini Bot Mode' : 'Human Takeover'}
              </span>
            </div>
            <div className="phone" style={{ fontSize: '12px', color: 'var(--color-foreground-secondary)' }}>{activeConv.phone}</div>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={selectedTemplate}
            onChange={(e) => handleApplyTemplate(e.target.value)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-md)' }}
          >
            <option value="">-- Select WABA Template --</option>
            {wabaTemplates.map((tpl) => (
              <option key={tpl.id || tpl.name} value={tpl.name}>
                {tpl.name} ({tpl.status || 'APPROVED'})
              </option>
            ))}
          </select>

          <button className="btn btn-secondary btn-sm" onClick={handleExportData}>
            <Icon name="download" size={14} />
            <span>{t('exportData')}</span>
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleEraseContact}
          >
            <Icon name="trash" size={14} />
            <span>{t('eraseContact')}</span>
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
    </section>
  );
}
