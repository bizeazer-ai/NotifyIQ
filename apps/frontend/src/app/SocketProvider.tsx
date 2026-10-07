import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { receiveMessage, updateConversationAi, updateConversationStatus } from '../store/slices/inboxSlice';
import { config } from './config';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export default function SocketProvider({ children }: SocketProviderProps) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize authenticated connection
    const newSocket = io(config.socketUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[SocketProvider] Authenticated websocket connected successfully.');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[SocketProvider] Websocket disconnected.');
    });

    // Real-time message events mapping to Redux updates
    newSocket.on('message.received', (data: any) => {
      console.log('[SocketProvider] Message received:', data);
      if (data.message && data.conversation) {
        dispatch(receiveMessage({ message: data.message, conversation: data.conversation }));
      }
    });

    newSocket.on('message.sent', (data: any) => {
      console.log('[SocketProvider] Message echo sent:', data);
      if (data.message && data.conversation) {
        dispatch(receiveMessage({ message: data.message, conversation: data.conversation }));
      }
    });

    newSocket.on('conversation.ai_toggled', (data: any) => {
      console.log('[SocketProvider] Conversation AI toggled:', data);
      if (data.conversationId && data.isHumanTakeover !== undefined) {
        dispatch(updateConversationAi({ conversationId: data.conversationId, isHumanTakeover: data.isHumanTakeover }));
      }
    });

    newSocket.on('conversation.status_updated', (data: any) => {
      console.log('[SocketProvider] Conversation status updated:', data);
      if (data.conversationId && data.status) {
        dispatch(updateConversationStatus({ conversationId: data.conversationId, status: data.status }));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, isAuthenticated, dispatch]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
