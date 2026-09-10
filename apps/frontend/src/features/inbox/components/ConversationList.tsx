import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setActiveConversationId, fetchConversations } from '../../../store/slices/inboxSlice';
import { useTranslation } from '../../../i18n';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function ConversationList() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const conversations = useAppSelector((state) => state.inbox.conversations);
  const activeConversationId = useAppSelector((state) => state.inbox.activeConversationId);
  const loading = useAppSelector((state) => state.inbox.loadingConversations);
  const error = useAppSelector((state) => state.inbox.error);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <section className="chat-list-panel">
      <header className="panel-header">
        <h2 className="panel-title">{t('conversations')}</h2>
        <input
          type="text"
          className="search-box"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      <div className="conversations-list" style={{ flex: 1, overflowY: 'auto' }}>
        {loading && conversations.length === 0 ? (
          <LoadingState message="Loading live WhatsApp conversations..." />
        ) : error && conversations.length === 0 ? (
          <ErrorAlert message={error} onRetry={() => dispatch(fetchConversations())} title="Inbox Error" />
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            title="No Conversations"
            description={searchTerm ? "No active chat threads match your search query." : "No incoming customer messages yet."}
            icon="inbox"
          />
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv._id}
              className={`conversation-card ${conv._id === activeConversationId ? 'active' : ''}`}
              onClick={() => dispatch(setActiveConversationId(conv._id))}
            >
              <div className="conversation-meta">
                <div className="conversation-header">
                  <span className="contact-name">{conv.contactName}</span>
                  <span className="message-time">{conv.lastMessageAt}</span>
                </div>
                <div className="message-preview">{conv.lastMessageText}</div>
                <div style={{ marginTop: '8px' }}>
                  <span className={`sentiment-badge sentiment-${conv.sentiment}`}>
                    {conv.sentiment}
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

