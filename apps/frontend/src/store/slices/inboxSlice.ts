import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ConversationContract as Conversation, MessageContract as Message } from '@notifyiq/schemas';
import { apiClient } from '../../lib/api/apiClient';

export type { Conversation, Message };

interface InboxState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messagesByConversationId: Record<string, Message[]>;
  loadingConversations: boolean;
  loadingMessages: boolean;
  error: string | null;
}

const initialState: InboxState = {
  conversations: [],
  activeConversationId: null,
  messagesByConversationId: {},
  loadingConversations: false,
  loadingMessages: false,
  error: null,
};

// Fetch conversations list
export const fetchConversations = createAsyncThunk(
  'inbox/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get<{ data: Conversation[] }>('/api/messages/conversations');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch conversations');
    }
  }
);

// Fetch message history for a conversation
export const fetchMessageHistory = createAsyncThunk(
  'inbox/fetchMessageHistory',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.get<{ data: Message[] }>(`/api/messages/history/${conversationId}`);
      return { conversationId, messages: res.data };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch messages');
    }
  }
);

// Send message
export const sendMessage = createAsyncThunk(
  'inbox/sendMessage',
  async ({ to, body }: { to: string; body: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post<{ data: Message }>('/api/messages/send', { to, body });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to send message');
    }
  }
);

const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    setActiveConversationId(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload;
    },
    // Real-time WebSocket message receiver
    receiveMessage(
      state,
      action: PayloadAction<{ message: Message; conversation: any }>
    ) {
      const { message, conversation } = action.payload;
      const convId = conversation._id;

      // 1. Append message to logs if already loaded
      if (state.messagesByConversationId[convId]) {
        const exists = state.messagesByConversationId[convId].some(
          (m) => m._id === message._id || m.waMessageId === message.waMessageId
        );
        if (!exists) {
          state.messagesByConversationId[convId].push(message);
        }
      }

      // 2. Update conversation card details
      const existingConvIdx = state.conversations.findIndex((c) => c._id === convId);
      if (existingConvIdx !== -1) {
        state.conversations[existingConvIdx].lastMessageText = message.body || '[Attachment]';
        state.conversations[existingConvIdx].lastMessageAt = 'Just now';
        state.conversations[existingConvIdx].sentiment = conversation.sentiment || state.conversations[existingConvIdx].sentiment;
        
        // Reorder card to the top
        const conv = state.conversations[existingConvIdx];
        state.conversations.splice(existingConvIdx, 1);
        state.conversations.unshift(conv);
      } else {
        state.conversations.unshift({
          _id: convId,
          contactName: conversation.contactName || 'WhatsApp User',
          phone: conversation.phone || '',
          sentiment: conversation.sentiment || 'neutral',
          lastMessageAt: 'Just now',
          lastMessageText: message.body || '',
        });
      }
    },
    addOptimisticMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConversationId[conversationId]) {
        state.messagesByConversationId[conversationId] = [];
      }
      state.messagesByConversationId[conversationId].push(message);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
        if (!state.activeConversationId && action.payload.length > 0) {
          state.activeConversationId = action.payload[0]._id;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessageHistory.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchMessageHistory.fulfilled, (state, action) => {
        state.loadingMessages = false;
        const { conversationId, messages } = action.payload;
        state.messagesByConversationId[conversationId] = messages;
      })
      .addCase(fetchMessageHistory.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const convId = message.conversationId || state.activeConversationId;
        
        if (convId && state.messagesByConversationId[convId]) {
          const idx = state.messagesByConversationId[convId].findIndex((m) => m._id.startsWith('optimistic_'));
          if (idx !== -1) {
            state.messagesByConversationId[convId][idx] = message;
          } else {
            state.messagesByConversationId[convId].push(message);
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to dispatch message via Meta Cloud API';
        const convId = state.activeConversationId;
        if (convId && state.messagesByConversationId[convId]) {
          const idx = state.messagesByConversationId[convId].findIndex((m) => m._id.startsWith('optimistic_'));
          if (idx !== -1) {
            state.messagesByConversationId[convId][idx].status = 'failed';
          }
        }
      });
  },
});

export const { setActiveConversationId, receiveMessage, addOptimisticMessage } = inboxSlice.actions;
export default inboxSlice.reducer;
