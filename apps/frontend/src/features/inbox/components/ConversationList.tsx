import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { setActiveConversationId } from '../../../store/slices/inboxSlice';
import { useTranslation } from '../../../i18n';

export default function ConversationList() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const conversations = useAppSelector((state) => state.inbox.conversations);
  const activeConversationId = useAppSelector((state) => state.inbox.activeConversationId);
  const loading = useAppSelector((state) => state.inbox.loadingConversations);

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
          <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            No conversations found
          </div>
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
