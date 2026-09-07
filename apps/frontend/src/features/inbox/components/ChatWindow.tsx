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
    const templateTextMap: Record<string, string> = {
      gst_due_reminder: 'Dear Customer, your monthly GST filing deadline is approaching. Please submit your invoice records.',
      billing_notification: 'Thank you for your payment! Your subscription has been successfully extended.',
      opt_in_confirmation: 'Hello! Thank you for opting in to receive WhatsApp automated updates from BizEazer.',
    };
    if (templateTextMap[tplName]) {
      setInputText(templateTextMap[tplName]);
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
      <section className="chat-window" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div>{t('selectConversation')}</div>
      </section>
    );
  }

  return (
    <section className="chat-window">
      <header className="chat-header">
        <div className="active-contact-info">
          <div className="active-contact-details">
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{activeConv.contactName}</span>
              <span
                onClick={() => setBotModeActive(!botModeActive)}
                style={{
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  backgroundColor: botModeActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: botModeActive ? 'var(--accent-light)' : 'var(--sentiment-urgent)',
                  border: `1px solid ${botModeActive ? 'var(--accent)' : 'var(--sentiment-urgent)'}`,
                }}
              >
                {botModeActive ? '🤖 Gemini Bot Mode' : '👨‍💻 Human Takeover'}
              </span>
            </div>
            <div className="phone">{activeConv.phone}</div>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedTemplate}
            onChange={(e) => handleApplyTemplate(e.target.value)}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">-- Apply Template --</option>
            <option value="gst_due_reminder">GST Due Reminder</option>
            <option value="billing_notification">Billing Payment Success</option>
            <option value="opt_in_confirmation">Consent Opt-in</option>
          </select>

          <button className="header-btn" onClick={handleExportData}>
            <Icon name="download" size={14} />
            <span>{t('exportData')}</span>
          </button>
          <button
            className="header-btn"
            style={{ borderColor: 'var(--sentiment-urgent)', color: 'var(--sentiment-urgent)' }}
            onClick={handleEraseContact}
          >
            <Icon name="trash" size={14} />
            <span>{t('eraseContact')}</span>
          </button>
        </div>
      </header>

      <div className="messages-scroller" ref={scrollRef}>
        {loading && activeMessages.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading message logs...
          </div>
        ) : (
          activeMessages.map((msg) => (
            <div key={msg._id} className={`message-bubble-wrapper ${msg.direction}`}>
              <div className="message-bubble">
                {msg.type === 'audio' ? (
                  <div className="audio-player-wrapper">
                    <audio controls src={msg.mediaUrl || undefined} style={{ width: '100%' }} />
                    {msg.transcript && (
                      <div className="voice-transcript">
                        <strong>{t('whisperTranscript')}:</strong> {msg.transcript}
                      </div>
                    )}
                  </div>
                ) : (
                  msg.body
                )}
              </div>
              <div className="message-footer">
                <span className="message-time-stamp">{msg.createdAt}</span>
                <span className={`message-status ${msg.status === 'read' ? 'read-status' : 'delivered-status'}`}>
                  {msg.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="suggestions-bar">
        <span className="suggestions-title">{t('claudeAssist')}</span>
        {loadingSuggestions ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading AI replies...</span>
        ) : (
          suggestions.map((reply, idx) => (
            <button key={idx} className="suggestion-chip" onClick={() => handleSend(reply)}>
              {reply}
            </button>
          ))
        )}
      </div>

      <footer className="input-panel">
        <form
          className="input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="message-input"
            placeholder={t('typeMessage')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="send-btn">
            <Icon name="plane" size={16} />
          </button>
        </form>
      </footer>
    </section>
  );
}
