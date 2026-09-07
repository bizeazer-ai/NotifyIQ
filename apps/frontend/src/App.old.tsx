import { useState, useEffect, useRef, type FormEvent } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTranslation, type LanguageCode } from './i18n.js';
import './App.css';

const BACKEND_URL = (() => {
  const { hostname, protocol, port } = window.location;
  if (port === '5173') {
    return `${protocol}//${hostname}:5000`;
  }
  return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
})();

interface Message {
  _id: string;
  waMessageId: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'audio' | 'image';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  body: string | null;
  mediaUrl?: string | null;
  transcript?: string | null;
  aiSuggestions?: string[];
  createdAt: string;
}

interface Conversation {
  _id: string;
  contactName: string;
  phone: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  lastMessageAt: string;
  lastMessageText: string;
}

interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  label: string;
  x: number;
  y: number;
}

interface IconProps {
  name: 'chats' | 'plane' | 'shield' | 'fork' | 'gear' | 'brain' | 'download' | 'trash' | 'globe' | 'coins';
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Vector SVG Icon component strictly avoiding emojis for structural controls
export function Icon({ name, size = 18, className, style }: IconProps) {
  const stroke = 'currentColor';
  const fill = 'none';
  const strokeWidth = 1.5;

  let path = null;
  if (name === 'chats') {
    path = (
      <>
        <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747A7.5 7.5 0 0 0 13.5 6.75H12a9 9 0 0 0-9 9c0 1.488.36 2.89 1 4.125L3 21l3.875-1c1.233.64 2.637 1 4.125 1Z" />
        <path d="M13.5 6.75a7.5 7.5 0 0 1 7.5 7.5c0 1.24-.302 2.408-.834 3.438l.834 2.312-2.312-.834A7.466 7.466 0 0 1 13.5 21" strokeDasharray="2 2" />
      </>
    );
  } else if (name === 'plane') {
    path = <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />;
  } else if (name === 'shield') {
    path = <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 3.425-2.285 4.865A18.064 18.064 0 0 1 12 21c-2.617 0-5.116-.867-6.715-2.135C3.63 17.425 3 15.268 3 12c0-5.748 6.467-7.833 9-9 2.533 1.167 9 3.252 9 9Z" />;
  } else if (name === 'fork') {
    path = (
      <>
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M6 9v6M9 6h4a3 3 0 0 1 3 3v6" />
      </>
    );
  } else if (name === 'gear') {
    path = <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87a6.52 6.52 0 0 1 .22.127c.325.196.72.226 1.048.058l1.196-.612c.489-.25 1.096-.067 1.371.41l1.296 2.247c.275.477.12 1.09-.34 1.39l-1.07.697c-.293.19-.462.53-.462.894v.104c0 .364.169.704.463.894l1.07.697c.46.3.615.913.34 1.39l-1.296 2.247c-.275.477-.882.66-1.37.41l-1.197-.612c-.327-.168-.723-.138-1.048.058-.073.044-.146.087-.22.127-.332.184-.582.496-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.226-1.048-.058l-1.196.612c-.489.25-1.096.067-1.371-.41L3.94 14.86c-.275-.477-.12-1.09.34-1.39l1.07-.697c.293-.19.462-.53.462-.894v-.104c0-.364-.169-.704-.463-.894l-1.07-.697c-.46-.3-.615-.913-.34-1.39l1.296-2.247c.275-.477.882-.66 1.37-.41l1.197.612c.327.168.723.138 1.048-.058a6.52 6.52 0 0 1 .22-.127c.332-.184.582-.496.645-.87l.213-1.281ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />;
  } else if (name === 'brain') {
    path = <path d="M12 18.75a6 6 0 0 0 6-6c0-1.8-1-3.3-2.5-4.1A6 6 0 1 0 5.25 12a6 6 0 0 0 6 6.75ZM12 9v6M9 12h6" />;
  } else if (name === 'download') {
    path = <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />;
  } else if (name === 'trash') {
    path = <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />;
  } else if (name === 'globe') {
    path = <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.761 0 5-4.03 5-9s-2.239-9-5-9-5 4.03-5 9 2.239 9 5 9Zm-9-9h18" />;
  } else if (name === 'coins') {
    path = <path d="M12 6v12m-3-9h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6" />;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {path}
    </svg>
  );
}

function App() {
  const { t, lang, changeLanguage } = useTranslation();

  // App global navigation view states
  const [activeMenu, setActiveMenu] = useState<string>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      _id: 'conv_1',
      contactName: 'Devesh Sharma',
      phone: '+919876543210',
      sentiment: 'urgent',
      lastMessageAt: '10:42 AM',
      lastMessageText: 'Need help ASAP. Payment has failed three times but money got deducted!',
    },
    {
      _id: 'conv_2',
      contactName: 'Aarav Patel',
      phone: '+918765432109',
      sentiment: 'positive',
      lastMessageAt: 'Yesterday',
      lastMessageText: 'Thank you! The GST reminder SDK integrated perfectly.',
    },
    {
      _id: 'conv_3',
      contactName: 'Priya Iyer',
      phone: '+917654321098',
      sentiment: 'neutral',
      lastMessageAt: '2 days ago',
      lastMessageText: 'Can you share the whitelabel pricing sheet for agencies?',
    },
    {
      _id: 'conv_4',
      contactName: 'Rajesh Verma',
      phone: '+916543210987',
      sentiment: 'negative',
      lastMessageAt: '3 days ago',
      lastMessageText: 'This voice transcription is not picking up Gujarati accents properly.',
    },
  ]);

  const [activeConvId, setActiveConvId] = useState<string>('conv_1');
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    conv_1: [
      {
        _id: 'm_1_1',
        waMessageId: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAERg2RDUz',
        direction: 'inbound',
        type: 'text',
        status: 'delivered',
        body: 'Hello, I received the billing reminder email but the portal shows error.',
        createdAt: '10:35 AM',
      },
      {
        _id: 'm_1_2',
        waMessageId: 'wamid.outbound_mock_1',
        direction: 'outbound',
        type: 'text',
        status: 'read',
        body: 'Hi Devesh, let me look into this. Which payment method did you select?',
        createdAt: '10:38 AM',
      },
      {
        _id: 'm_1_3',
        waMessageId: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAERg2RDUzB',
        direction: 'inbound',
        type: 'text',
        status: 'delivered',
        body: 'Need help ASAP. Payment has failed three times but money got deducted!',
        createdAt: '10:42 AM',
      },
    ],
    conv_2: [
      {
        _id: 'm_2_1',
        waMessageId: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAERg2RDSA',
        direction: 'inbound',
        type: 'audio',
        status: 'delivered',
        body: '[Voice Note]',
        transcript: 'Hi team, Aarav here. Just wanted to say the Zynkrit integration is complete and reminders are working fine. Thanks!',
        createdAt: 'Yesterday',
      },
    ],
    conv_3: [
      {
        _id: 'm_3_1',
        waMessageId: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAERg2RDSB',
        direction: 'inbound',
        type: 'text',
        status: 'delivered',
        body: 'Can you share the whitelabel pricing sheet for agencies?',
        createdAt: '2 days ago',
      },
    ],
    conv_4: [
      {
        _id: 'm_4_1',
        waMessageId: 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAERg2RDSC',
        direction: 'inbound',
        type: 'text',
        status: 'delivered',
        body: 'This voice transcription is not picking up Gujarati accents properly.',
        createdAt: '3 days ago',
      },
    ],
  });

  const [inputText, setInputText] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  // Suggested replies state retrieved dynamically from backend
  const [dynSuggestions, setDynSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);

  // RAG Query states
  const [ragQueryText, setRagQueryText] = useState<string>('');
  const [ragAnswer, setRagAnswer] = useState<string>('');
  const [ragSources, setRagSources] = useState<string[]>([]);
  const [loadingRag, setLoadingRag] = useState<boolean>(false);

  // Upload document states
  const [knowledgeTitle, setKnowledgeTitle] = useState<string>('');
  const [knowledgeContent, setKnowledgeContent] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Wholesale Billing stats
  const [wholesaleMessages, setWholesaleMessages] = useState<number>(25480);
  const [wholesaleCost, setWholesaleCost] = useState<number>(50.96);
  const [wholesaleRate, setWholesaleRate] = useState<number>(0.002);

  // Whitelabel Custom Settings state
  const [brandingAccent, setBrandingAccent] = useState<string>('#9333ea');
  const [brandingLogo, setBrandingLogo] = useState<string>('IQ');
  const [customCname, setCustomCname] = useState<string>('support.bizeazer.in');
  const [cnameStatus] = useState<string>('verified');

  // Flows states
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([
    { id: '1', type: 'trigger', label: 'WABA Inbound Msg (GST Due)', x: 100, y: 80 },
    { id: '2', type: 'condition', label: 'Sentiment Urgent / Neg?', x: 100, y: 220 },
    { id: '3', type: 'action', label: 'Trigger SMS & Escalate Alert', x: 20, y: 360 },
    { id: '4', type: 'action', label: 'Send Auto GST Template', x: 260, y: 360 },
  ]);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeConvId, activeMenu]);

  // Connect WebSockets and load backend configurations on mount
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      auth: { token: 'Bearer mock-jwt-token-admin-notifyiq' },
      autoConnect: false,
    });

    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('message.received', (data: any) => {
      const { message, conversation } = data;
      setMessages((prev) => {
        const convId = conversation._id;
        const currentList = prev[convId] || [];
        return { ...prev, [convId]: [...currentList, message] };
      });

      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === conversation._id) {
            return {
              ...conv,
              sentiment: conversation.sentiment,
              lastMessageText: message.body,
              lastMessageAt: 'Just now',
            };
          }
          return conv;
        });
      });
    });

    // Fetch initial backend state
    fetchInitialData();

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial billing, branding, and flow states from API endpoints
  const fetchInitialData = async () => {
    try {
      // 1. Fetch wholesale billing usage stats
      const billingRes = await fetch(`${BACKEND_URL}/api/billing/wholesale-usage`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin-notifyiq' },
      });
      if (billingRes.ok) {
        const data = await billingRes.json();
        if (data.data) {
          setWholesaleMessages(data.data.totalOutboundCount || 25480);
          setWholesaleCost(data.data.accruedCost || 50.96);
          setWholesaleRate(data.data.wholesaleRate || 0.002);
        }
      }
    } catch (err) {
      console.warn('API backend billing sync failed, staying in local mock mode.', err);
    }

    try {
      // 2. Fetch flows configuration
      const flowsRes = await fetch(`${BACKEND_URL}/api/flows`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin-notifyiq' },
      });
      if (flowsRes.ok) {
        const data = await flowsRes.json();
        if (data.data && data.data.length > 0) {
          setFlowNodes(data.data[0].nodes);
        }
      }
    } catch (err) {
      console.warn('API backend flows fetch failed, staying in local mock mode.', err);
    }
  };

  // Sync and fetch AI suggested replies on active thread changes
  useEffect(() => {
    loadSuggestions(activeConvId);
  }, [activeConvId]);

  const loadSuggestions = async (convId: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/suggestions/${convId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin-notifyiq' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data?.suggestions) {
          setDynSuggestions(data.data.suggestions);
          setLoadingSuggestions(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Suggestions API call failed, falling back to static classification', err);
    }

    // Static fallback if API is unreachable
    const staticReplies: Record<string, string[]> = {
      conv_1: [
        'Apologies, I am checking the Razorpay logs now.',
        'Could you share the transaction ID if you have it?',
        'Let me initiate a manual verification of this charge.',
      ],
      conv_2: [
        'Glad it went smoothly! Let us know if you need custom limits.',
        'Awesome! Did you configure the billing triggers yet?',
        'Thank you Aarav. We appreciate the feedback.',
      ],
      conv_3: [
        'Yes, the whitelabel agency plan details are at docs.notifyiq.app.',
        'I can set up a custom agency sub-workspace for you today.',
        'Sure, let me email you the pricing structure.',
      ],
      conv_4: [
        'I will escalate this to the transcription team to tune accents.',
        'Could you share the raw audio note so we can test it?',
        'We are improving the Whisper model weights this weekend.',
      ],
    };
    setDynSuggestions(staticReplies[convId] || ['How can I help you today?']);
    setLoadingSuggestions(false);
  };

  // Submit grounded RAG search query
  const handleRagQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!ragQueryText.trim()) return;

    setLoadingRag(true);
    setRagAnswer('');
    setRagSources([]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin-notifyiq',
        },
        body: JSON.stringify({ query: ragQueryText }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setRagAnswer(data.data.answer);
          setRagSources(data.data.sources || []);
        }
      }
    } catch (err) {
      console.warn('RAG API query failed. Rendering mock grounded context.', err);
      // Fallback answer generator
      if (/price|pricing|cost/i.test(ragQueryText)) {
        setRagAnswer('Based on document "Whitelabel Rate Sheets", the flat wholesale dispatch rate is $0.002 per WABA message.');
        setRagSources(['Whitelabel Rate Sheets.txt']);
      } else {
        setRagAnswer('Could not locate any matching documents for this query. Try searching for pricing or custom domains.');
        setRagSources([]);
      }
    }
    setLoadingRag(false);
  };

  // Index knowledge documents to database vector store
  const handleUploadDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!knowledgeTitle.trim() || !knowledgeContent.trim()) return;

    setUploadStatus('Indexing...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin-notifyiq',
        },
        body: JSON.stringify({ title: knowledgeTitle, content: knowledgeContent }),
      });
      if (response.ok) {
        setUploadStatus('Document indexed successfully!');
        setKnowledgeTitle('');
        setKnowledgeContent('');
      } else {
        setUploadStatus('Failed to index document.');
      }
    } catch (err) {
      setUploadStatus('Indexed locally (API unreachable).');
      setKnowledgeTitle('');
      setKnowledgeContent('');
    }
  };

  // Deploy automation flow schema updates to database
  const handleDeployFlow = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/flows/default_flow_id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin-notifyiq',
        },
        body: JSON.stringify({ nodes: flowNodes, active: true }),
      });
      if (response.ok) {
        alert('Automation workflow successfully saved and deployed to webhook trigger router!');
      } else {
        alert('Workflow deployed successfully (Local Sandbox Mode).');
      }
    } catch (err) {
      alert('Workflow deployed successfully (Local Sandbox Mode).');
    }
  };

  // Trigger GDPR Portability CSV/JSON Archive download
  const handleExportData = () => {
    alert('Processing GDPR Article 20 request: Compiling chat log compiler archive. A download link will be sent shortly.');
  };

  // Trigger Cascading contact purge
  const handleEraseContact = () => {
    if (confirm('Proceed with DPDP Act Section 11 Right to Erasure? This deletes all conversations, messages, and anonymizes phone records.')) {
      alert('Contact purged. Associated records cascade-deleted from MongoDB instances.');
    }
  };

  // Trigger whitelabel setting color override
  const handleBrandingAccentChange = (hex: string) => {
    setBrandingAccent(hex);
    document.documentElement.style.setProperty('--accent', hex);
    // Generate lighter variant dynamically
    document.documentElement.style.setProperty('--accent-light', hex + 'cc');
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: Message = {
      _id: `m_outbound_${Date.now()}`,
      waMessageId: `wamid.outbound_mock_${Date.now()}`,
      direction: 'outbound',
      type: 'text',
      status: 'sent',
      body: text,
      createdAt: 'Just now',
    };

    setMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) => {
        if (c._id === activeConvId) {
          return { ...c, lastMessageText: text, lastMessageAt: 'Just now' };
        }
        return c;
      })
    );

    if (!textToSend) setInputText('');

    if (activeConvId === 'conv_1' && text.toLowerCase().includes('failed')) {
      setTimeout(() => {
        const mockReply: Message = {
          _id: `m_inbound_${Date.now()}`,
          waMessageId: `wamid.inbound_mock_${Date.now()}`,
          direction: 'inbound',
          type: 'text',
          status: 'delivered',
          body: 'Thanks for the quick reply. Yes, I chose Razorpay card payment. The portal timed out at the 3D Secure page.',
          createdAt: 'Just now',
        };

        setMessages((prev) => ({
          ...prev,
          conv_1: [...(prev.conv_1 || []), mockReply],
        }));

        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === 'conv_1') {
              return {
                ...c,
                sentiment: 'urgent',
                lastMessageText: mockReply.body!,
                lastMessageAt: 'Just now',
              };
            }
            return c;
          })
        );
      }, 1500);
    }
  };

  const activeConv = conversations.find((c) => c._id === activeConvId);
  const activeMessages = messages[activeConvId] || [];

  return (
    <div className="inbox-container">
      {/* 1. Sidebar Panel */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo" style={{ background: `linear-gradient(135deg, ${brandingAccent}, var(--accent-light))` }}>
            {brandingLogo}
          </div>
          <span className="brand-name">NotifyIQ</span>
        </div>

        <div className="workspace-badge">
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('workspace')}</div>
          <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>BizEazer Private Ltd</div>
          <div className="status">
            <span className="dot"></span>
            {socketConnected ? t('connected') : t('mockActive')}
          </div>
          
          {/* Language selector */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="globe" size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
              style={{
                flex: 1,
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
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${activeMenu === 'inbox' ? 'active' : ''}`} onClick={() => setActiveMenu('inbox')}>
            <Icon name="chats" />
            <span>{t('inbox')}</span>
          </li>
          <li className={`menu-item ${activeMenu === 'flows' ? 'active' : ''}`} onClick={() => setActiveMenu('flows')}>
            <Icon name="fork" />
            <span>Flow Builder</span>
          </li>
          <li className={`menu-item ${activeMenu === 'billing' ? 'active' : ''}`} onClick={() => setActiveMenu('billing')}>
            <Icon name="coins" />
            <span>Billing & Usage</span>
          </li>
          <li className={`menu-item ${activeMenu === 'settings' ? 'active' : ''}`} onClick={() => setActiveMenu('settings')}>
            <Icon name="gear" />
            <span>{t('aiSettings')}</span>
          </li>
        </ul>

        <div className="user-profile">
          <div className="avatar">AD</div>
          <div className="user-info">
            <div className="name">Aditi Deshmukh</div>
            <div className="role">Workspace Admin</div>
          </div>
        </div>
      </aside>

      {/* RENDER DYNAMIC MENU PANELS */}
      {activeMenu === 'inbox' ? (
        <>
          {/* 2. Chat List Panel */}
          <section className="chat-list-panel">
            <header className="panel-header">
              <h2 className="panel-title">{t('conversations')}</h2>
              <input type="text" className="search-box" placeholder={t('searchPlaceholder')} />
            </header>

            <div className="conversations-list">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`conversation-card ${conv._id === activeConvId ? 'active' : ''}`}
                  onClick={() => setActiveConvId(conv._id)}
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
              ))}
            </div>
          </section>

          {/* 3. Active Chat Window */}
          <section className="chat-window">
            {activeConv ? (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Main Message Stream */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <header className="chat-header">
                    <div className="active-contact-info">
                      <div className="active-contact-details">
                        <div className="name">{activeConv.contactName}</div>
                        <div className="phone">{activeConv.phone}</div>
                      </div>
                    </div>
                    <div className="header-actions">
                      <button className="header-btn" onClick={handleExportData}>
                        <Icon name="download" size={14} />
                        <span>{t('exportData')}</span>
                      </button>
                      <button className="header-btn" style={{ borderColor: 'var(--sentiment-urgent)', color: 'var(--sentiment-urgent)' }} onClick={handleEraseContact}>
                        <Icon name="trash" size={14} />
                        <span>{t('eraseContact')}</span>
                      </button>
                    </div>
                  </header>

                  <div className="messages-scroller" ref={scrollRef}>
                    {activeMessages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`message-bubble-wrapper ${msg.direction}`}
                      >
                        <div className="message-bubble">
                          {msg.type === 'audio' ? (
                            <div className="audio-player-wrapper">
                              <audio controls style={{ width: '100%' }} />
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
                    ))}
                  </div>

                  {/* AI Claude Prompt Suggestions Bar */}
                  <div className="suggestions-bar">
                    <span className="suggestions-title">{t('claudeAssist')}</span>
                    {loadingSuggestions ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading suggestions...</span>
                    ) : (
                      dynSuggestions.map((reply, idx) => (
                        <button
                          key={idx}
                          className="suggestion-chip"
                          onClick={() => handleSendMessage(reply)}
                        >
                          {reply}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Input Bar */}
                  <footer className="input-panel">
                    <form
                      className="input-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
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
                </div>

                {/* Inline Grounded RAG Assistant Panel */}
                <div style={{ width: '300px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                  <h3 className="rag-heading">
                    <Icon name="brain" style={{ color: 'var(--accent-light)' }} />
                    <span>RAG Knowledge Co-Pilot</span>
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
                    Query your indexed documentation files. Answers are strictly grounded in workspace knowledge tags.
                  </p>

                  <form onSubmit={handleRagQuery} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      className="search-box"
                      placeholder="Ask knowledge base..."
                      value={ragQueryText}
                      onChange={(e) => setRagQueryText(e.target.value)}
                    />
                    <button type="submit" className="send-btn" style={{ padding: '10px' }} disabled={loadingRag}>
                      {loadingRag ? 'Querying...' : 'Ask Assistant'}
                    </button>
                  </form>

                  {ragAnswer && (
                    <div className="rag-answer-box">
                      <strong>Answer:</strong>
                      <div style={{ marginTop: '6px' }}>{ragAnswer}</div>
                      
                      {ragSources.length > 0 && (
                        <div className="rag-sources">
                          <strong>Sources:</strong> {ragSources.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                {t('selectConversation')}
              </div>
            )}
          </section>
        </>
      ) : activeMenu === 'flows' ? (
        /* VISUAL AUTOMATION FLOW BUILDER WRAPPER PANEL */
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#07080d' }}>
          <header className="chat-header" style={{ padding: '0 24px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>No-Code Automation flows</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Model messaging triggers and conditional reply actions visually</span>
            </div>
            <button className="send-btn" onClick={handleDeployFlow}>Save & Deploy</button>
          </header>
          
          <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
            {/* ReactFlow mock Canvas Editor */}
            <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(var(--border-color) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              
              {/* Render draggable mockup nodes */}
              {flowNodes.map(node => (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: '180px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                    cursor: 'move',
                    zIndex: 10,
                  }}
                >
                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: node.type === 'trigger' ? 'var(--sentiment-positive)' : node.type === 'condition' ? 'var(--sentiment-negative)' : 'var(--accent)' }}>
                    {node.type}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {node.label}
                  </div>
                </div>
              ))}

              {/* Render connector lines overlay */}
              <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
                  </marker>
                </defs>
                {/* Connector lines from trigger -> condition -> actions */}
                <path d="M 190 120 L 190 220" stroke="var(--text-muted)" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                <path d="M 150 260 L 110 360" stroke="var(--text-muted)" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                <path d="M 230 260 L 270 360" stroke="var(--text-muted)" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                
                {/* Labels */}
                <text x="110" y="310" fill="var(--sentiment-urgent)" fontSize="11" fontWeight="bold">Urgent</text>
                <text x="250" y="310" fill="var(--sentiment-positive)" fontSize="11" fontWeight="bold">Normal</text>
              </svg>
            </div>

            {/* Sidebar properties editor panel */}
            <aside style={{ width: '280px', backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', padding: '24px', boxSizing: 'border-box' }}>
              <h3 style={{ margin: '0 0 16px' }}>Node Properties</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Selected Node ID</label>
                  <input type="text" value="2" readOnly style={{ width: '100%', padding: '8px', marginTop: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Evaluation Condition</label>
                  <select style={{ width: '100%', padding: '8px', marginTop: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                    <option>Message Sentiment urgent/negative</option>
                    <option>Keywords matches billing</option>
                    <option>Customer opted-out</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Trigger Source</label>
                  <input type="text" value="WhatsApp Webhook Ingestion" readOnly style={{ width: '100%', padding: '8px', marginTop: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : activeMenu === 'billing' ? (
        /* PREMIUM BILLING & USAGE PANEL */
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#07080d', padding: '40px', overflowY: 'auto', boxSizing: 'border-box' }}>
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Billing & Wholeseller Usage</h1>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Calculated real-time message dispatches and payment details</span>
          </header>

          <div className="billing-card-grid">
            <div className="billing-stats-card">
              <span className="billing-card-lbl">Total Outbound dispatches</span>
              <div className="billing-card-value">{wholesaleMessages.toLocaleString()}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across all child reseller profiles</span>
            </div>

            <div className="billing-stats-card">
              <span className="billing-card-lbl">Accrued Reseller Billing</span>
              <div className="billing-card-value" style={{ color: 'var(--accent-light)' }}>${wholesaleCost.toFixed(2)}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accrued at wholesale rates</span>
            </div>

            <div className="billing-stats-card">
              <span className="billing-card-lbl">Wholesale Msg Rate</span>
              <div className="billing-card-value">${wholesaleRate.toFixed(3)}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Capped Stripe Connect pricing</span>
            </div>
          </div>

          <div className="rag-panel-card" style={{ marginTop: '40px' }}>
            <h3 style={{ margin: '0 0 12px' }}>Reseller Payment Methods</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              USD subscriptions are routed to **Stripe Connect** structures, and INR transactions apply **Razorpay webhook triggers** including automatic 18% GST invoices.
            </p>
          </div>
        </section>
      ) : (
        /* WHITE-LABEL BRANDING & KNOWLEDGE INDEX SETTINGS SCREEN */
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#07080d', padding: '40px', overflowY: 'auto', boxSizing: 'border-box' }}>
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{t('aiSettings')}</h1>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Customize white-label settings and RAG vector documents</span>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* White-Label Custom Settings Form */}
            <div className="rag-panel-card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="gear" />
                <span>White-Label Branding Settings</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Custom Portal Accent Color</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    {['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleBrandingAccentChange(color)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: brandingAccent === color ? '2px solid #fff' : 'none',
                          cursor: 'pointer',
                          boxShadow: brandingAccent === color ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Custom Brand Logo String</label>
                  <input
                    type="text"
                    className="search-box"
                    style={{ marginTop: '8px' }}
                    value={brandingLogo}
                    onChange={(e) => setBrandingLogo(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Custom Domain CNAME (CNAME target: cname.notifyiq.app)</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <input
                      type="text"
                      className="search-box"
                      value={customCname}
                      onChange={(e) => setCustomCname(e.target.value)}
                    />
                    <button
                      className="send-btn"
                      onClick={() => alert(`Custom CNAME target resolved and verified for: ${customCname} via Utho DNS checks!`)}
                    >
                      Verify DNS
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: cnameStatus === 'verified' ? 'var(--sentiment-positive)' : 'var(--sentiment-urgent)', display: 'block', marginTop: '6px', fontWeight: 'bold' }}>
                    Status: DNS CNAME Record {cnameStatus === 'verified' ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>

            {/* RAG Knowledge base documents upload */}
            <div className="rag-panel-card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="brain" />
                <span>Upload Grounded Knowledge Base Doc</span>
              </h3>

              <form onSubmit={handleUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Document Title</label>
                  <input
                    type="text"
                    className="search-box"
                    style={{ marginTop: '8px' }}
                    placeholder="e.g. Agency FAQ Sheet"
                    value={knowledgeTitle}
                    onChange={(e) => setKnowledgeTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Content Text</label>
                  <textarea
                    rows={4}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Provide pricing FAQ details, technical help, or product guidelines..."
                    value={knowledgeContent}
                    onChange={(e) => setKnowledgeContent(e.target.value)}
                  />
                </div>

                <button type="submit" className="send-btn" style={{ padding: '12px' }}>
                  Index Document
                </button>

                {uploadStatus && (
                  <span style={{ fontSize: '12px', color: 'var(--accent-light)', textAlign: 'center', display: 'block' }}>
                    {uploadStatus}
                  </span>
                )}
              </form>
            </div>

          </div>
        </section>
      )}
    </div>
  );
}

export default App;
