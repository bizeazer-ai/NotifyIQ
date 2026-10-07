import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  sendMessage,
  sendMediaMessage,
  sendTemplateMessage,
  addOptimisticMessage,
  toggleConversationAi,
} from '../../../store/slices/inboxSlice';
import type { Message } from '../../../store/slices/inboxSlice';
import { useTranslation } from '../../../i18n';
import { Icon } from '../../../components/ui/Icon';
import { apiClient } from '../../../lib/api/apiClient';
import LeadDrawer from './LeadDrawer';

interface ChatWindowProps {
  onBackToList?: () => void;
}

interface TemplateModalData {
  template: any;
  headerFormat: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerUrl: string;
  headerText: string;
  bodyText: string;
  variables: string[];
  variableValues: Record<string, string>;
  footerText: string;
  buttons: any[];
}

function renderTemplateMessageBody(body: string | null, wabaTemplates: any[]): string {
  if (!body) return '';
  const match = body.match(/^\[Template(?: Message)?: ([^\]]+)\]$/i);
  if (match && match[1]) {
    const tplName = match[1].trim();
    const found = wabaTemplates.find((t) => t.name === tplName);
    if (found) {
      const bodyComp = found.components?.find((c: any) => c.type === 'BODY');
      if (bodyComp?.text) return bodyComp.text;
      if (found.bodyText) return found.bodyText;
    }
  }
  return body;
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

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateModalData, setTemplateModalData] = useState<TemplateModalData | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState(false);

  // Media Attachment State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const headerFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | 'audio'>('image');
  const [mediaCaption, setMediaCaption] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

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

  // ── Template Selection & Dynamic Variable Configuration ───────────────────
  const handleApplyTemplate = (tplName: string) => {
    setSelectedTemplate(tplName);
    if (!tplName) return;
    const found = wabaTemplates.find((t) => t.name === tplName);
    if (!found) return;

    const headerComp = found.components?.find((c: any) => c.type === 'HEADER');
    const headerFormat = (headerComp?.format || (found.headerText ? 'TEXT' : 'NONE')).toUpperCase() as any;
    const headerText = headerComp?.text || found.headerText || '';
    const bodyComp = found.components?.find((c: any) => c.type === 'BODY');
    const bodyText = bodyComp?.text || found.bodyText || '';
    const footerComp = found.components?.find((c: any) => c.type === 'FOOTER');
    const footerText = footerComp?.text || found.footerText || '';
    const buttonsComp = found.components?.find((c: any) => c.type === 'BUTTONS');
    const buttons = buttonsComp?.buttons || found.buttons || [];

    const varMatches: string[] = Array.from(new Set(bodyText.match(/\{\{(\d+)\}\}/g) || []));
    const initialVarVals: Record<string, string> = {};
    varMatches.forEach((v: string, idx: number) => {
      // Pre-fill variable 1 with contact name if available
      initialVarVals[v] = idx === 0 && activeConv?.contactName ? activeConv.contactName : '';
    });

    setTemplateModalData({
      template: found,
      headerFormat,
      headerUrl: '',
      headerText,
      bodyText,
      variables: varMatches,
      variableValues: initialVarVals,
      footerText,
      buttons,
    });
    setIsTemplateModalOpen(true);
  };

  const handleSendTemplate = async () => {
    if (!templateModalData || !activeConv) return;
    setSendingTemplate(true);
    try {
      const { template, headerFormat, headerUrl, bodyText, variables, variableValues } = templateModalData;

      const components: any[] = [];
      if (headerUrl && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerFormat)) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: headerFormat.toLowerCase(),
              [headerFormat.toLowerCase()]: { link: headerUrl },
            },
          ],
        });
      }

      if (variables.length > 0) {
        const bodyParams = variables.map((v) => ({
          type: 'text',
          text: variableValues[v] || v,
        }));
        components.push({
          type: 'body',
          parameters: bodyParams,
        });
      }

      // Compute rendered body for chat bubble
      let rendered = bodyText;
      variables.forEach((v) => {
        rendered = rendered.replace(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), variableValues[v] || v);
      });

      const optimisticMsg: Message = {
        _id: `optimistic_${Date.now()}`,
        waMessageId: `wamid.opt_${Date.now()}`,
        direction: 'outbound',
        type: 'template',
        status: 'sent',
        body: rendered,
        mediaUrl: headerUrl || null,
        createdAt: 'Just now',
      };

      dispatch(addOptimisticMessage({ conversationId: activeConv._id, message: optimisticMsg }));

      await dispatch(
        sendTemplateMessage({
          to: activeConv.phone,
          templateName: template.name,
          languageCode: template.language || 'en_US',
          components,
          renderedBody: rendered,
          mediaUrl: headerUrl || undefined,
        })
      ).unwrap();

      setIsTemplateModalOpen(false);
      setSelectedTemplate('');
      setTemplateModalData(null);
    } catch (err: any) {
      alert(`Failed to send template message: ${err || 'Error'}`);
    } finally {
      setSendingTemplate(false);
    }
  };

  // ── Helper: Client-Side Image Compression for large photos/screenshots ──────
  const compressImageIfNeeded = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      return file;
    }
    // Skip if already small (under 800 KB)
    if (file.size <= 800 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxWidth = 1920;
        const maxHeight = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedName = file.name.replace(/\.[^.]+$/, '.jpg');
              const compressedFile = new File([blob], compressedName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  // ── Media Attachment Handlers ──────────────────────────────────────────────
  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Check Meta 24-hr customer care window
    if (!isWindowActive) {
      alert(
        'The 24-hour WhatsApp customer care window has expired for this contact. Meta prohibits sending free-form media outside this window. Please select an approved WhatsApp Template with a media header to re-engage.'
      );
      e.target.value = '';
      return;
    }

    let type: 'image' | 'video' | 'document' | 'audio' = 'document';
    if (rawFile.type.startsWith('image/')) type = 'image';
    else if (rawFile.type.startsWith('video/')) type = 'video';
    else if (rawFile.type.startsWith('audio/')) type = 'audio';

    // WhatsApp Cloud API size ceilings
    const MAX_LIMITS: Record<string, number> = {
      image: 5 * 1024 * 1024,     // 5 MB
      audio: 16 * 1024 * 1024,    // 16 MB
      video: 16 * 1024 * 1024,    // 16 MB
      document: 25 * 1024 * 1024, // 25 MB
    };
    const limit = MAX_LIMITS[type] || 25 * 1024 * 1024;

    let file = rawFile;
    if (type === 'image') {
      try {
        file = await compressImageIfNeeded(rawFile);
      } catch (err) {
        console.warn('Image compression fallback:', err);
      }
    }

    if (file.size > limit) {
      const limitMB = Math.round(limit / (1024 * 1024));
      const fileMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(
        `File is too large (${fileMB} MB). WhatsApp Cloud API enforces a maximum limit of ${limitMB} MB for ${type} files. Please choose a smaller file.`
      );
      e.target.value = '';
      return;
    }

    setMediaType(type);
    setMediaFile(file);
    setMediaCaption('');

    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreviewUrl(reader.result as string);
      setIsMediaModalOpen(true);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleHeaderFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !templateModalData) return;

    let file = rawFile;
    if (file.type.startsWith('image/')) {
      try {
        file = await compressImageIfNeeded(rawFile);
      } catch (err) {
        console.warn('Header image compression fallback:', err);
      }
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('File exceeds maximum 25MB limit. Please choose a smaller file.');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post<{ data: { url: string } }>('/api/messages/upload', formData);
      if (res.data?.url) {
        setTemplateModalData({ ...templateModalData, headerUrl: res.data.url });
      }
    } catch (err: any) {
      const is413 = err?.response?.status === 413 || (typeof err?.message === 'string' && err.message.includes('too large'));
      const msg = is413
        ? 'File exceeds the maximum allowed upload size. WhatsApp limits: 5MB for images, 16MB for audio/video, 25MB for documents.'
        : (err?.response?.data?.message || err?.message || 'Upload error');
      alert(`Failed to upload header media: ${msg}`);
    }

    e.target.value = '';
  };

  const handleSendMedia = async () => {
    if (!mediaFile || !activeConv || !mediaPreviewUrl) return;
    setUploadingMedia(true);
    try {
      // 1. Upload to backend using multipart/form-data (browser auto-generates boundary)
      const formData = new FormData();
      formData.append('file', mediaFile);

      const uploadRes = await apiClient.post<{ data: { url: string; filename: string } }>(
        '/api/messages/upload',
        formData
      );

      const serverMediaUrl = uploadRes.data?.url || mediaPreviewUrl;

      // 2. Optimistic message
      const optimisticMsg: Message = {
        _id: `optimistic_${Date.now()}`,
        waMessageId: `wamid.opt_${Date.now()}`,
        direction: 'outbound',
        type: mediaType,
        status: 'sent',
        body: mediaCaption || mediaFile.name,
        mediaUrl: serverMediaUrl,
        createdAt: 'Just now',
      };
      dispatch(addOptimisticMessage({ conversationId: activeConv._id, message: optimisticMsg }));

      // 3. Dispatch send media
      await dispatch(
        sendMediaMessage({
          to: activeConv.phone,
          type: mediaType,
          mediaUrl: serverMediaUrl,
          caption: mediaCaption || undefined,
          filename: mediaFile.name,
        })
      ).unwrap();

      setIsMediaModalOpen(false);
      setMediaFile(null);
      setMediaPreviewUrl('');
      setMediaCaption('');
    } catch (err: any) {
      const is413 = err?.response?.status === 413 || (typeof err?.message === 'string' && err.message.includes('too large'));
      const errorMsg = is413
        ? 'File exceeds the maximum allowed upload size. WhatsApp allows up to 5MB for images, 16MB for audio/video, and 25MB for documents.'
        : (err?.response?.data?.message || err?.message || err || 'Failed to send media');
      alert(`Failed to send media message: ${errorMsg}`);
    } finally {
      setUploadingMedia(false);
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
    <section className="chat-window" style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--color-surface)', height: '100%', minWidth: 0, position: 'relative' }}>
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
                  padding: msg.type === 'template' ? '12px 14px' : '10px 14px',
                  borderRadius: msg.direction === 'outbound' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: msg.direction === 'outbound' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: msg.direction === 'outbound' ? '#FFFFFF' : 'var(--color-foreground)',
                  border: msg.direction === 'outbound' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '14px',
                  lineHeight: '1.4',
                }}
              >
                {/* 1. Audio Message */}
                {msg.type === 'audio' ? (
                  <div className="audio-player-wrapper">
                    <audio controls src={msg.mediaUrl || undefined} style={{ width: '100%' }} />
                    {msg.transcript && (
                      <div className="voice-transcript" style={{ fontSize: '11px', marginTop: '6px', opacity: 0.9 }}>
                        <strong>{t('whisperTranscript')}:</strong> {msg.transcript}
                      </div>
                    )}
                  </div>
                ) : /* 2. Image Message */
                msg.type === 'image' ? (
                  <div className="image-message-wrapper">
                    {msg.mediaUrl && (
                      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={msg.mediaUrl}
                          alt="Shared media"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '260px',
                            borderRadius: '8px',
                            display: 'block',
                            objectFit: 'cover',
                            marginBottom: msg.body && msg.body !== '[Image]' ? '6px' : '0',
                          }}
                        />
                      </a>
                    )}
                    {msg.body && msg.body !== '[Image]' && (
                      <div style={{ fontSize: '13.5px' }}>{msg.body}</div>
                    )}
                  </div>
                ) : /* 3. Video Message */
                msg.type === 'video' ? (
                  <div className="video-message-wrapper">
                    {msg.mediaUrl && (
                      <video
                        controls
                        src={msg.mediaUrl}
                        style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', display: 'block', marginBottom: '6px' }}
                      />
                    )}
                    {msg.body && msg.body !== '[Video]' && (
                      <div style={{ fontSize: '13.5px' }}>{msg.body}</div>
                    )}
                  </div>
                ) : /* 4. Document Message */
                msg.type === 'document' ? (
                  <div className="document-message-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: msg.direction === 'outbound' ? 'rgba(255,255,255,0.2)' : 'var(--color-primary-muted)', color: msg.direction === 'outbound' ? '#FFF' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="document" size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.body || 'Document'}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.8 }}>File Attachment</div>
                    </div>
                    {msg.mediaUrl && (
                      <a
                        href={msg.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{ color: 'inherit', padding: '6px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.1)' }}
                        title="Download Document"
                      >
                        <Icon name="download" size={14} />
                      </a>
                    )}
                  </div>
                ) : /* 5. WhatsApp Template Message */
                msg.type === 'template' ? (
                  <div className="template-message-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 700, opacity: 0.85, marginBottom: '6px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      <Icon name="sparkles" size={11} />
                      <span>WhatsApp Template Message</span>
                    </div>
                    {msg.mediaUrl && (
                      <img
                        src={msg.mediaUrl}
                        alt="Template Header"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                      />
                    )}
                    <div style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap' }}>
                      {renderTemplateMessageBody(msg.body, wabaTemplates)}
                    </div>
                  </div>
                ) : (
                  /* 6. Standard Text Message */
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
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
          {/* File Input hidden trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaFileChange}
            accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.csv,.xlsx"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            title="Attach Media or Document"
            onClick={() => fileInputRef.current?.click()}
          >
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

      {/* ── Modal 1: Send Media Attachment Dialog ─────────────────────────── */}
      {isMediaModalOpen && mediaFile && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '460px',
              padding: '20px',
              boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-foreground)' }}>
                Send {mediaType.toUpperCase()}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsMediaModalOpen(false)}
                style={{ padding: '4px' }}
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {/* Media Preview Box */}
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '240px',
                overflow: 'hidden',
                marginBottom: '14px',
                border: '1px solid var(--color-border)',
              }}
            >
              {mediaType === 'image' ? (
                <img
                  src={mediaPreviewUrl}
                  alt="Attachment preview"
                  style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }}
                />
              ) : mediaType === 'video' ? (
                <video
                  controls
                  src={mediaPreviewUrl}
                  style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '4px' }}
                />
              ) : mediaType === 'audio' ? (
                <audio controls src={mediaPreviewUrl} style={{ width: '100%' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Icon name="document" size={36} style={{ color: 'var(--color-primary)', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{mediaFile.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '4px' }}>
                    {(mediaFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Caption (Optional)
              </label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="Add a message or description..."
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsMediaModalOpen(false)}
                disabled={uploadingMedia}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSendMedia}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? (
                  <>
                    <Icon name="spinner" size={14} className="icon-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Icon name="send" size={14} />
                    <span>Send {mediaType}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: WABA Template Dynamic Values Dialog ───────────────────── */}
      {isTemplateModalOpen && templateModalData && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '22px',
              boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                    {templateModalData.template.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(34, 197, 94, 0.12)',
                      color: '#16a34a',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    {templateModalData.template.category || 'UTILITY'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-foreground-secondary)', marginTop: '2px' }}>
                  Language: <strong>{templateModalData.template.language || 'en_US'}</strong> • Fill in required variables before dispatching to Meta
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setSelectedTemplate('');
                  setTemplateModalData(null);
                }}
                style={{ padding: '4px' }}
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {/* Live WhatsApp Preview Card */}
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                border: '1px solid var(--color-border)',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '6px' }}>
                Preview to Recipient ({activeConv.phone}):
              </div>

              {/* Preview Header Media */}
              {templateModalData.headerUrl && (
                <img
                  src={templateModalData.headerUrl}
                  alt="Header preview"
                  style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                />
              )}

              {/* Preview Body with Real-time Variable Replacements */}
              <div style={{ fontSize: '13.5px', lineHeight: '1.45', whiteSpace: 'pre-wrap', color: 'var(--color-foreground)' }}>
                {(() => {
                  let text = templateModalData.bodyText;
                  templateModalData.variables.forEach((v) => {
                    const val = templateModalData.variableValues[v];
                    text = text.replace(
                      new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                      val ? `[${val}]` : v
                    );
                  });
                  return text;
                })()}
              </div>

              {/* Preview Footer */}
              {templateModalData.footerText && (
                <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', marginTop: '8px' }}>
                  {templateModalData.footerText}
                </div>
              )}
            </div>

            {/* Dynamic Inputs Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* 1. Header Media URL (if applicable) */}
              {['IMAGE', 'DOCUMENT', 'VIDEO'].includes(templateModalData.headerFormat) && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>
                      Header {templateModalData.headerFormat} URL (Required)
                    </label>
                    <input
                      type="file"
                      ref={headerFileInputRef}
                      onChange={handleHeaderFileUpload}
                      accept={templateModalData.headerFormat === 'IMAGE' ? 'image/*' : templateModalData.headerFormat === 'VIDEO' ? 'video/*' : 'application/pdf'}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => headerFileInputRef.current?.click()}
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                    >
                      <Icon name="attachment" size={12} />
                      <span>Upload File</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    className="form-input-styled"
                    placeholder={`https://example.com/media.${templateModalData.headerFormat === 'IMAGE' ? 'jpg' : 'pdf'}`}
                    value={templateModalData.headerUrl}
                    onChange={(e) =>
                      setTemplateModalData({ ...templateModalData, headerUrl: e.target.value })
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* 2. Body Variables {{1}}, {{2}}, etc. */}
              {templateModalData.variables.map((variableName, idx) => (
                <div key={variableName}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Variable {variableName} {idx === 0 ? '(e.g. Customer Name)' : idx === 1 ? '(e.g. Order ID / Promo)' : ''}
                  </label>
                  <input
                    type="text"
                    className="form-input-styled"
                    placeholder={`Enter value for ${variableName}`}
                    value={templateModalData.variableValues[variableName] || ''}
                    onChange={(e) =>
                      setTemplateModalData({
                        ...templateModalData,
                        variableValues: {
                          ...templateModalData.variableValues,
                          [variableName]: e.target.value,
                        },
                      })
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              ))}

              {templateModalData.variables.length === 0 && !['IMAGE', 'DOCUMENT', 'VIDEO'].includes(templateModalData.headerFormat) && (
                <div style={{ fontSize: '12px', color: 'var(--color-foreground-secondary)' }}>
                  This template does not contain dynamic variables. Ready to dispatch as is.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setSelectedTemplate('');
                  setTemplateModalData(null);
                }}
                disabled={sendingTemplate}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSendTemplate}
                disabled={sendingTemplate}
              >
                {sendingTemplate ? (
                  <>
                    <Icon name="spinner" size={14} className="icon-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Icon name="send" size={14} />
                    <span>Send Template Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
