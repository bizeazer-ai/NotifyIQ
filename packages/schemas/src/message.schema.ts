import { z } from 'zod';

export const SendMessageSchema = z.object({
  to: z.string().optional(),
  phone: z.string().optional(),
  recipientId: z.string().optional(),
  body: z.string().min(1),
});

export type SendMessagePayload = z.infer<typeof SendMessageSchema>;

export interface ConversationContract {
  _id: string;
  contactId?: string;
  contactName: string;
  phone: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  lastMessageAt: string;
  lastMessageText: string;
  isHumanTakeover?: boolean;
  status?: 'open' | 'pending' | 'resolved';
  assignedTo?: string | null;
  lastInboundAt?: string | null;
  windowExpiresAt?: string | null;
}

export interface MessageContract {
  _id: string;
  waMessageId: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'audio' | 'image' | 'document' | 'video' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  body: string | null;
  mediaUrl?: string | null;
  transcript?: string | null;
  aiSuggestions?: string[];
  createdAt: string;
  conversationId?: string;
}

export const CampaignLaunchSchema = z.object({
  templateName: z.string().min(1),
  contactIds: z.array(z.string()),
  languageCode: z.string().default('en'),
  scheduledAt: z.string().optional(),
  templateParameters: z
    .object({
      headerUrl: z.string().optional(),
      bodyParams: z.array(z.string()).optional(),
      buttonParams: z.array(z.string()).optional(),
    })
    .optional(),
});

export type CampaignLaunchPayload = z.infer<typeof CampaignLaunchSchema>;

export interface CampaignStatsContract {
  totalSent: number;
  delivered: number;
  read: number;
  failed: number;
}
