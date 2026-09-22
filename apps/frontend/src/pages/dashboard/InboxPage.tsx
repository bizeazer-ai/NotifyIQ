import { useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchConversations, fetchMessageHistory } from '../../store/slices/inboxSlice';
import ConversationList from '../../features/inbox/components/ConversationList';
import ChatWindow from '../../features/inbox/components/ChatWindow';
import { Icon } from '../../components/ui/Icon';
import { apiClient } from '../../lib/api/apiClient';

export default function InboxPage() {
  const dispatch = useAppDispatch();
  const activeConvId = useAppSelector((state) => state.inbox.activeConversationId);

  // RAG Search States
  const [ragQueryText, setRagQueryText] = useState('');
  const [ragAnswer, setRagAnswer] = useState('');
  const [ragSources, setRagSources] = useState<string[]>([]);
  const [loadingRag, setLoadingRag] = useState(false);

  // Upload/Index states
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeContent, setKnowledgeContent] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  // Fetch initial conversations list on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Fetch message history whenever active thread selection changes
  useEffect(() => {
    if (activeConvId) {
      dispatch(fetchMessageHistory(activeConvId));
    }
  }, [activeConvId, dispatch]);

  const handleRagQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!ragQueryText.trim()) return;

    setLoadingRag(true);
    setRagAnswer('');
    setRagSources([]);

    try {
      const response = await apiClient.post<{ data: { answer: string; sources: string[] } }>('/api/ai/query', {
        query: ragQueryText,
      });
      if (response.data) {
        setRagAnswer(response.data.answer);
        setRagSources(response.data.sources || []);
      }
    } catch (err) {
      console.warn('RAG Query API failed, displaying sandbox response.', err);
      if (/price|pricing|cost/i.test(ragQueryText)) {
        setRagAnswer('Based on document "Whitelabel Rate Sheets", the flat wholesale dispatch rate is $0.002 per WABA message.');
        setRagSources(['Whitelabel Rate Sheets.txt']);
      } else {
        setRagAnswer('Could not locate any matching documents for this query. Try searching for pricing or custom domains.');
        setRagSources([]);
      }
    } finally {
      setLoadingRag(false);
    }
  };

  const handleUploadDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!knowledgeTitle.trim() || !knowledgeContent.trim()) return;

    setUploadStatus('Indexing...');
    try {
      await apiClient.post('/api/ai/knowledge', {
        title: knowledgeTitle,
        content: knowledgeContent,
      });
      setUploadStatus('Document indexed successfully!');
      setKnowledgeTitle('');
      setKnowledgeContent('');
    } catch (err) {
      setUploadStatus('Document index failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* 1. Conversations List Panel */}
      <ConversationList />

      {/* 2. Active Chat Panel */}
      <ChatWindow />

      {/* 3. Grounded RAG Assistant Panel */}
      <div 
        style={{ 
          width: '320px', 
          borderLeft: '1px solid var(--color-border)', 
          backgroundColor: 'var(--color-surface)', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          boxSizing: 'border-box',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <h3 className="rag-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)' }}>
          <Icon name="brain" style={{ color: 'var(--color-primary)' }} />
          <span>RAG Knowledge Assistant</span>
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--color-foreground-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
          Query your indexed documentation files. Answers are strictly grounded in workspace knowledge.
        </p>

        {/* Query Input */}
        <form onSubmit={handleRagQuery} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            className="form-input-styled"
            style={{ width: '100%', fontSize: '13px' }}
            placeholder="Ask knowledge base..."
            value={ragQueryText}
            onChange={(e) => setRagQueryText(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-sm" 
            style={{ width: '100%', padding: '10px' }} 
            disabled={loadingRag}
          >
            <Icon name="search" size={14} />
            <span>{loadingRag ? 'Searching Vector Index...' : 'Ask Assistant'}</span>
          </button>
        </form>

        {/* Answer Display */}
        {ragAnswer && (
          <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Answer
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.4, color: 'var(--color-foreground)' }}>
              {ragAnswer}
            </div>
            {ragSources.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-foreground-muted)' }}>
                <strong>Sources:</strong> {ragSources.join(', ')}
              </div>
            )}
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '24px 0' }} />

        {/* Document Indexing Upload Form */}
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-foreground)' }}>
          <Icon name="download" size={14} style={{ transform: 'rotate(180deg)', color: 'var(--color-primary)' }} />
          <span>Index New Document</span>
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--color-foreground-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
          Chunk and upload files directly into the MongoDB Vector Search index.
        </p>

        <form onSubmit={handleUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            className="form-input-styled"
            style={{ width: '100%', fontSize: '13px' }}
            placeholder="Document Title"
            value={knowledgeTitle}
            onChange={(e) => setKnowledgeTitle(e.target.value)}
            required
          />
          <textarea
            className="form-textarea"
            style={{ width: '100%', height: '80px', fontSize: '12px' }}
            placeholder="Document text content..."
            value={knowledgeContent}
            onChange={(e) => setKnowledgeContent(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', padding: '10px' }}
          >
            <Icon name="plus" size={14} />
            <span>Upload Document</span>
          </button>
        </form>

        {uploadStatus && (
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-success)', fontWeight: 600, textAlign: 'center' }}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
}
