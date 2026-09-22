import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setActiveConversationId, fetchConversations } from '../../../store/slices/inboxSlice';
import { useTranslation } from '../../../i18n';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icon } from '../../../components/ui/Icon';

export default function ConversationList() {
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

  return (
    <section className="chat-list-panel">
      <header className="panel-header" style={{ padding: 'var(--space-4) var(--space-4) var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h2 className="panel-title" style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
            {t('conversations')}
          </h2>
          <span className="badge badge-primary">{conversations.length} Active</span>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', marginBottom: 'var(--space-3)' }}>
          <input
            type="text"
            className="search-box"
            style={{ width: '100%', paddingLeft: '32px', margin: 0 }}
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Icon
            name="search"
            size={14}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-foreground-muted)' }}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            className={`filter-pill ${filterSentiment === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('ALL')}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            All
          </button>
          <button
            className={`filter-pill ${filterSentiment === 'URGENT' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('URGENT')}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            Urgent
          </button>
          <button
            className={`filter-pill ${filterSentiment === 'POSITIVE' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('POSITIVE')}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            Positive
          </button>
          <button
            className={`filter-pill ${filterSentiment === 'NEUTRAL' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('NEUTRAL')}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            Neutral
          </button>
        </div>
      </header>

      <div className="conversations-list" style={{ flex: 1, overflowY: 'auto' }}>
        {loading && conversations.length === 0 ? (
          <LoadingState message="Loading live WhatsApp conversations..." />
        ) : error && conversations.length === 0 ? (
          <ErrorAlert message={error} onRetry={() => dispatch(fetchConversations())} title="Inbox Error" />
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            title="No Conversations"
            description={searchTerm ? 'No active chat threads match your search query.' : 'No incoming customer messages yet.'}
            icon="inbox"
          />
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv._id}
              className={`conversation-card ${conv._id === activeConversationId ? 'active' : ''}`}
              onClick={() => dispatch(setActiveConversationId(conv._id))}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: conv._id === activeConversationId ? 'var(--color-primary-muted)' : 'transparent',
                borderLeft: conv._id === activeConversationId ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'background-color 0.15s ease',
              }}
            >
              {/* Contact Avatar Circle */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: conv._id === activeConversationId ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  color: conv._id === activeConversationId ? '#FFFFFF' : 'var(--color-foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                  border: '1px solid var(--color-border)',
                }}
              >
                {getInitials(conv.contactName)}
              </div>

              <div className="conversation-meta" style={{ flex: 1, minWidth: 0 }}>
                <div className="conversation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span className="contact-name" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.contactName}
                  </span>
                  <span className="message-time" style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>
                    {conv.lastMessageAt}
                  </span>
                </div>

                <div className="message-preview" style={{ fontSize: '12px', color: 'var(--color-foreground-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conv.lastMessageText}
                </div>

                <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className={`sentiment-badge sentiment-${conv.sentiment}`}>
                    {conv.sentiment}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-foreground-muted)' }}>
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
