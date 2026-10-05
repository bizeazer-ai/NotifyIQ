import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setActiveConversationId, fetchConversations } from '../../../store/slices/inboxSlice';
import { useTranslation } from '../../../i18n';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icon } from '../../../components/ui/Icon';

interface ConversationListProps {
  onSelectConversation?: () => void;
}

export default function ConversationList({ onSelectConversation }: ConversationListProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const conversations = useAppSelector((state) => state.inbox.conversations);
  const activeConversationId = useAppSelector((state) => state.inbox.activeConversationId);
  const loading = useAppSelector((state) => state.inbox.loadingConversations);
  const error = useAppSelector((state) => state.inbox.error);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('ALL');

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'CT';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesSentiment = filterSentiment === 'ALL' || c.sentiment === filterSentiment.toLowerCase();
    return matchesSearch && matchesSentiment;
  });

  const handleSelect = (id: string) => {
    dispatch(setActiveConversationId(id));
    if (onSelectConversation) {
      onSelectConversation();
    }
  };

  return (
    <section className="chat-list-panel">
      <header className="panel-header" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h2 className="panel-title" style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="chats" style={{ color: 'var(--color-primary)' }} />
            <span>{t('conversations')}</span>
          </h2>
          <span className="badge badge-primary" style={{ borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: '11px' }}>
            {conversations.length} Active
          </span>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', marginBottom: 'var(--space-3)' }}>
          <input
            type="text"
            className="search-box"
            style={{ width: '100%', paddingLeft: '34px', borderRadius: 'var(--radius-lg)', fontSize: '13px' }}
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Icon
            name="search"
            size={14}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-foreground-muted)' }}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['ALL', 'URGENT', 'POSITIVE', 'NEUTRAL'].map((sentimentKey) => (
            <button
              key={sentimentKey}
              className={`filter-pill ${filterSentiment === sentimentKey ? 'active' : ''}`}
              onClick={() => setFilterSentiment(sentimentKey)}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {sentimentKey === 'ALL' ? 'All Chats' : sentimentKey.charAt(0) + sentimentKey.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="conversations-list" style={{ flex: 1, overflowY: 'auto' }}>
        {loading && conversations.length === 0 ? (
          <LoadingState message="Loading WhatsApp conversations..." />
        ) : error && conversations.length === 0 ? (
          <ErrorAlert message={error} onRetry={() => dispatch(fetchConversations())} title="Inbox Error" />
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            title="No Conversations"
            description={searchTerm ? 'No active chat threads match your query.' : 'No incoming WhatsApp messages yet.'}
            icon="inbox"
          />
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv._id}
              className={`conversation-card ${conv._id === activeConversationId ? 'active' : ''}`}
              onClick={() => handleSelect(conv._id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: conv._id === activeConversationId ? 'var(--color-primary-muted)' : 'transparent',
                borderLeft: conv._id === activeConversationId ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Contact Avatar Circle */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: conv._id === activeConversationId ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  color: conv._id === activeConversationId ? '#FFFFFF' : 'var(--color-foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  flexShrink: 0,
                  border: '1px solid var(--color-border)',
                  position: 'relative',
                }}
              >
                {getInitials(conv.contactName)}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    border: '2px solid var(--color-surface)',
                  }}
                />
              </div>

              <div className="conversation-meta" style={{ flex: 1, minWidth: 0 }}>
                <div className="conversation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span className="contact-name" style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.contactName}
                  </span>
                  <span className="message-time" style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', fontWeight: 500 }}>
                    {conv.lastMessageAt}
                  </span>
                </div>

                <div className="message-preview" style={{ fontSize: '12px', color: 'var(--color-foreground-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                  {conv.lastMessageText || 'No message content'}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`sentiment-badge sentiment-${conv.sentiment}`} style={{ fontSize: '9.5px', padding: '2px 8px' }}>
                    {conv.sentiment}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', fontFamily: 'monospace' }}>
                    {conv.phone}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

