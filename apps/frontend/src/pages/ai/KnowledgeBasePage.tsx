import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

interface KnowledgeDoc {
  _id: string;
  docId?: string;
  title: string;
  fileType: string;
  content: string;
  chunkIndex?: number;
  createdAt: string;
}

interface QueryResult {
  answer: string;
  sources: string[];
  confidenceScore: number;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'playground'>('upload');

  // Direct Text Upload State
  const [rawTitle, setRawTitle] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [uploadingText, setUploadingText] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // RAG Playground State
  const [testQuery, setTestQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: KnowledgeDoc[] }>('/api/ai/knowledge');
      if (res.data) {
        setDocuments(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch knowledge base documents from backend.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleRawSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rawTitle.trim() || !rawContent.trim()) return;

    setUploadingText(true);
    setStatusMessage('Indexing raw document text into Gemini 768-dim vector space...');
    try {
      await apiClient.post('/api/ai/knowledge', {
        title: rawTitle,
        content: rawContent,
      });

      setStatusMessage('Document text indexed successfully!');
      setRawTitle('');
      setRawContent('');
      loadDocuments();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      setStatusMessage(`Indexing failed: ${err.message || 'Error uploading document'}`);
    } finally {
      setUploadingText(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadingFile(true);
    setStatusMessage(`Parsing, chunking, and embedding "${selectedFile.name}"...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const textContent = (reader.result as string) || '';
        await apiClient.post('/api/ai/knowledge', {
          title: selectedFile.name,
          content: textContent,
          fileType: selectedFile.name.split('.').pop(),
        });

        setStatusMessage(`Successfully processed "${selectedFile.name}" (Parsed, 500-token chunked & Gemini vectorized)!`);
        setSelectedFile(null);
        loadDocuments();
        setTimeout(() => setStatusMessage(''), 4000);
      };
      reader.readAsText(selectedFile);
    } catch (err: any) {
      setStatusMessage(`File upload failed: ${err.message || 'Processing error'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRunQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setQuerying(true);
    setQueryResult(null);

    try {
      const res = await apiClient.post<{ data: QueryResult }>('/api/ai/query', {
        query: testQuery,
      });

      if (res.data) {
        setQueryResult(res.data);
      }
    } catch (err: any) {
      alert(`RAG Search query error: ${err.message}`);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>RAG Knowledge Base Control</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Upload Word (.docx), PDF (.pdf), YAML, JSON, CSV, or Text files. Gemini gemini-embedding-001 vectors ground auto-replies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: activeTab === 'upload' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === 'upload' ? 'var(--btn-text)' : 'var(--text-primary)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Upload Documents
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: activeTab === 'playground' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === 'playground' ? 'var(--btn-text)' : 'var(--text-primary)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            RAG Query Playground
          </button>
        </div>
      </header>

      {statusMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: '13px' }}>
          {statusMessage}
        </div>
      )}

      {activeTab === 'upload' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Multi-Format Ingestion Form */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="attachment" style={{ color: 'var(--accent)' }} />
              <span>Multi-Format File Dropzone</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Accepted extensions: <code>.docx</code>, <code>.pdf</code>, <code>.yaml</code>, <code>.json</code>, <code>.csv</code>, <code>.txt</code>. Automatically split into 500-token chunks with 50-token overlap.
            </p>

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '10px', padding: '28px', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                <input
                  type="file"
                  id="kb-file-input"
                  accept=".pdf,.docx,.doc,.yaml,.yml,.json,.csv,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="kb-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <Icon name="attachment" style={{ fontSize: '28px', color: 'var(--accent)', marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {selectedFile ? selectedFile.name : 'Click to select file'}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PDF, Word, YAML, JSON, CSV, TXT (Max 15MB)</span>
                </label>
              </div>

              <button
                type="submit"
                className="send-btn"
                disabled={!selectedFile || uploadingFile}
                style={{ padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
              >
                {uploadingFile ? 'Parsing & Chunking File...' : 'Parse & Embed File Document'}
              </button>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>Direct Raw Text Entry</h3>
            <form onSubmit={handleRawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Document Title (e.g. Return Policy v2)"
                value={rawTitle}
                onChange={(e) => setRawTitle(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                required
              />
              <textarea
                rows={4}
                placeholder="Paste raw text content here..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                required
              />
              <button
                type="submit"
                disabled={uploadingText}
                style={{ padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {uploadingText ? 'Embedding Raw Text...' : 'Index Text String'}
              </button>
            </form>
          </div>

          {/* Indexed Chunks List */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="brain" style={{ color: 'var(--accent)' }} />
              <span>Indexed Knowledge Chunks ({documents.length})</span>
            </h3>

            {loading ? (
              <LoadingState message="Loading indexed knowledge base documents..." />
            ) : error ? (
              <ErrorAlert message={error} onRetry={loadDocuments} title="Knowledge Base Error" />
            ) : documents.length === 0 ? (
              <EmptyState
                title="No Knowledge Documents"
                description="Upload your first document (PDF, Word, TXT, CSV) or index raw text to train Gemini auto-reply AI."
                icon="document"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-light)', textTransform: 'uppercase' }}>
                        [{doc.fileType}] {doc.title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      "{doc.content.substring(0, 160)}..."
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* RAG Query Playground */
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="search" style={{ color: 'var(--accent)' }} />
            <span>Live Gemini RAG Grounding Playground</span>
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            Test your knowledge base vector search. The query will be embedded using <code>gemini-embedding-001</code>, matched against MongoDB Atlas Vector Search / Cosine Similarity, and answered by <code>gemini-3.5-flash-lite</code>.
          </p>

          <form onSubmit={handleRunQuery} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Ask any question regarding your workspace policies, pricing, or instructions..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              required
            />
            <button
              type="submit"
              disabled={querying}
              className="send-btn"
              style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
            >
              {querying ? 'Searching Vector Space...' : 'Run RAG Query'}
            </button>
          </form>

          {queryResult && (
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--sentiment-positive)' }}>
                  ✓ Gemini RAG Answer Generated
                </span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-light)' }}>
                  Confidence Score: {(queryResult.confidenceScore * 100).toFixed(1)}%
                </span>
              </div>

              <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '16px' }}>
                {queryResult.answer}
              </div>

              {queryResult.sources.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Grounded Source Documents:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {queryResult.sources.map((src, idx) => (
                      <span
                        key={idx}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}
                      >
                        📄 {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

