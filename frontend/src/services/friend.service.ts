import { api } from '@/lib/api';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  friend: {
    id: string;
    username: string;
    avatar?: string;
    gameName?: string;
    gameId?: string;
  };
}

export interface FriendRequest {
  id: string;
  userId: string;
  friendId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    gameName?: string;
    gameId?: string;
  };
}

class FriendService {
  async sendFriendRequest(friendId: string): Promise<Friend> {
    return api.post('/friends/request', { friendId });
  }

  async acceptFriendRequest(requestId: string): Promise<Friend> {
    return api.post(`/friends/accept/${requestId}`);
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    return api.post(`/friends/reject/${requestId}`);
  }

  async removeFriend(friendId: string): Promise<void> {
    return api.delete(`/friends/${friendId}`);
  }

  async getFriends(): Promise<Friend[]> {
    return api.get('/friends');
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    return api.get('/friends/requests');
  }

  async checkFriendStatus(userId: string): Promise<{ status: 'none' | 'pending' | 'accepted'; requestId?: string }> {
    return api.get(`/friends/status/${userId}`);
  }
}

export const friendService = new FriendService();
