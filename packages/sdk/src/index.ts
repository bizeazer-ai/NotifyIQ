export interface SdkOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface SendMessagePayload {
  to: string;
  body: string;
}

export interface SendMessageResponse {
  message: string;
  data: {
    id: string;
    waMessageId: string;
    direction: 'inbound' | 'outbound';
    type: string;
    status: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class NotifyIQSdk {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: SdkOptions) {
    if (!options.apiKey) {
      throw new Error('API Key is required to initialize the NotifyIQ SDK');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.notifyiq.app';
  }

  /**
   * Namespace for messaging APIs
   */
  public readonly messages = {
    /**
     * Dispatches an outbound WhatsApp text message to a client contact
     */
    sendText: async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
      const url = `${this.baseUrl}/api/messages/send`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error((data as any)?.message || `HTTP request failed with status: ${response.status}`);
        }

        return data as SendMessageResponse;
      } catch (err) {
        console.error('[NotifyIQSdk] Error in messages.sendText:', err);
        throw err;
      }
    },
  };
}
