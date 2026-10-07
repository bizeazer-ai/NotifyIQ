import { useState, type FormEvent, type ChangeEvent } from 'react';
import { apiClient } from '../../../lib/api/apiClient';
import { Icon } from '../../../components/ui/Icon';

interface ChatHistoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (summary: string) => void;
}

export default function ChatHistoryImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ChatHistoryImportModalProps) {
  const [txtFile, setTxtFile] = useState<File | null>(null);
  const [fallbackPhone, setFallbackPhone] = useState('');
  const [businessIdentifier, setBusinessIdentifier] = useState('You');
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.txt')) {
        setErrorMsg('Please select a valid WhatsApp .txt chat export file.');
        setTxtFile(null);
        return;
      }
      setErrorMsg('');
      setTxtFile(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!txtFile) {
      setErrorMsg('Please select a .txt file to import.');
      return;
    }

    setImporting(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileContent = (reader.result as string) || '';
        const res = await apiClient.post<{
          data: {
            contactPhone: string;
            totalMessagesImported: number;
            leadsDetected: number;
          };
        }>('/api/contacts/import-chat-history', {
          fileContent,
          fallbackPhone: fallbackPhone.trim() || undefined,
          businessIdentifier: businessIdentifier.trim() || 'You',
        });

        const data = res.data;
        const summary = `Successfully imported ${data.totalMessagesImported} historical messages for ${data.contactPhone} (${data.leadsDetected} inquiry leads seeded)!`;
        onSuccess(summary);
        onClose();
      } catch (err: any) {
        setErrorMsg(err?.message || 'Chat history import failed. Please verify file format.');
      } finally {
        setImporting(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
      setImporting(false);
    };

    reader.readAsText(txtFile);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="chats" size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                Import WhatsApp Chat (.txt)
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-foreground-secondary)' }}>
                Backfill historical chats & auto-extract sales leads
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Instructions box */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '11.5px',
            lineHeight: 1.5,
            color: 'var(--color-foreground-secondary)',
            marginBottom: '18px',
          }}
        >
          <strong style={{ color: 'var(--color-foreground)' }}>How to export chat from WhatsApp:</strong>
          <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
            <li>Open the WhatsApp chat on your Android or iPhone.</li>
            <li>Tap ⋮ (Menu) or Contact Info → <strong>Export Chat</strong>.</li>
            <li>Select <strong>Without Media</strong> to generate a clean <code>.txt</code> file.</li>
            <li>Upload the file below to backfill the full thread and seed leads.</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
              WhatsApp Chat Export File (.txt) *
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              required
              className="form-input-styled"
              style={{ width: '100%', fontSize: '12px', padding: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
              Recipient Phone Number (Optional / Fallback)
            </label>
            <input
              type="text"
              placeholder="+919876543210 (required if iOS export saved with name only)"
              value={fallbackPhone}
              onChange={(e) => setFallbackPhone(e.target.value)}
              className="form-input-styled"
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
              Your Sender Name in Export (Default: "You")
            </label>
            <input
              type="text"
              placeholder="You (or your business display name in the export)"
              value={businessIdentifier}
              onChange={(e) => setBusinessIdentifier(e.target.value)}
              className="form-input-styled"
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={importing}
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={importing || !txtFile}
              style={{ padding: '8px 18px' }}
            >
              <Icon name={importing ? 'spinner' : 'download'} size={14} style={{ transform: importing ? 'none' : 'rotate(180deg)' }} />
              <span>{importing ? 'Importing History & Extracting Leads...' : 'Import Chat History'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
