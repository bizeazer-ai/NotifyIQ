export interface SdkOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface SendMessagePayload {
  to: string;
  body: string;
}

export interface SendMediaPayload {
  to: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mediaUrl: string;
  caption?: string;
  filename?: string;
}

export interface SendTemplatePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
  templateParameters?: Record<string, string>;
  renderedBody?: string;
  mediaUrl?: string;
}

export interface LaunchCampaignPayload {
  templateName: string;
  contactIds: string[];
  languageCode?: string;
  templateParameters?: Record<string, string>;
}

export interface CreateContactPayload {
  phone: string;
  name: string;
  email?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  message: string;
  data: T;
}

export class NotifyIQSdk {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: SdkOptions) {
    if (!options.apiKey) {
      throw new Error('API Key is required to initialize the NotifyIQ SDK');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.notifyiq.app').replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error((data as any)?.message || `HTTP request failed with status: ${response.status}`);
    }

    return data as T;
  }

  /**
   * WhatsApp Messaging APIs
   */
  public readonly messages = {
    /**
     * Send an outbound WhatsApp text message
     */
    sendText: async (payload: SendMessagePayload): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /**
     * Send an outbound WhatsApp media message (Image, Video, Audio, Document)
     */
    sendMedia: async (payload: SendMediaPayload): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/messages/send-media', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /**
     * Send an approved Meta WhatsApp Template Message (with dynamic variables and media header support)
     */
    sendTemplate: async (payload: SendTemplatePayload): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/messages/send-template', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /**
     * Get active conversations for the workspace
     */
    getConversations: async (): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/messages/conversations', {
        method: 'GET',
      });
    },

    /**
     * Fetch complete message history for a conversation
     */
    getMessageHistory: async (conversationId: string): Promise<ApiResponse> => {
      return this.request<ApiResponse>(`/api/messages/history/${conversationId}`, {
        method: 'GET',
      });
    },

    /**
     * Toggle AI Bot auto-reply vs Human takeover for a conversation
     */
    toggleAi: async (conversationId: string): Promise<ApiResponse> => {
      return this.request<ApiResponse>(`/api/messages/conversations/${conversationId}/toggle-ai`, {
        method: 'POST',
      });
    },

    /**
     * Assign conversation to a staff member
     */
    assign: async (conversationId: string, staffId: string | null): Promise<ApiResponse> => {
      return this.request<ApiResponse>(`/api/messages/conversations/${conversationId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ staffId }),
      });
    },

    /**
     * Update conversation status (open / pending / resolved)
     */
    updateStatus: async (conversationId: string, status: 'open' | 'pending' | 'resolved'): Promise<ApiResponse> => {
      return this.request<ApiResponse>(`/api/messages/conversations/${conversationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  };

  /**
   * WhatsApp Broadcast Campaigns APIs
   */
  public readonly campaigns = {
    /**
     * Launch a high-throughput WhatsApp broadcast campaign to a targeted contact list
     */
    launch: async (payload: LaunchCampaignPayload): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/messages/campaigns/launch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /**
     * Get real-time campaign delivery, read, and failure metrics
     */
    getStats: async (): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/messages/campaigns/stats', {
        method: 'GET',
      });
    },
  };

  /**
   * Contact Management APIs
   */
  public readonly contacts = {
    /**
     * Create or update a WhatsApp contact
     */
    create: async (payload: CreateContactPayload): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /**
     * List all workspace contacts
     */
    list: async (params?: Record<string, string>): Promise<ApiResponse> => {
      const searchParams = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request<ApiResponse>(`/api/contacts${searchParams}`, {
        method: 'GET',
      });
    },

    /**
     * Get contact details by ID
     */
    get: async (contactId: string): Promise<ApiResponse> => {
      return this.request<ApiResponse>(`/api/contacts/${contactId}`, {
        method: 'GET',
      });
    },

    /**
     * Delete contact permanently (Right to Erasure compliance)
     */
    delete: async (contactId: string): Promise<ApiResponse> => {
      return this.request<ApiResponse>(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
    },
  };

  /**
   * Outbound Business Webhooks APIs
   */
  public readonly webhooks = {
    /**
     * List registered outbound webhook endpoints
     */
    list: async (): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/outbound-webhooks', {
        method: 'GET',
      });
    },

    /**
     * Register a new outbound webhook endpoint
     */
    create: async (payload: { url: string; events: string[]; description?: string }): Promise<ApiResponse> => {
      return this.request<ApiResponse>('/api/outbound-webhooks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /**
     * Remove an outbound webhook endpoint
     */
    delete: async (endpointId: string): Promise<ApiResponse> => {
      return this.request<ApiResponse>(`/api/outbound-webhooks/${endpointId}`, {
        method: 'DELETE',
      });
    },
  };
}
