import { api } from '@/lib/api';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface Conversation {
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

class MessageService {
  async sendMessage(receiverId: string, content: string): Promise<Message> {
    return api.post('/messages', { receiverId, content });
  }

  async getConversations(): Promise<Conversation[]> {
    return api.get('/messages/conversations');
  }

  async getMessages(userId: string): Promise<Message[]> {
    return api.get(`/messages/${userId}`);
  }

  async markAsRead(messageId: string): Promise<void> {
    return api.put(`/messages/${messageId}/read`);
  }

  async markConversationAsRead(userId: string): Promise<void> {
    return api.put(`/messages/conversation/${userId}/read`);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return api.delete(`/messages/${messageId}`);
  }
}

export const messageService = new MessageService();
