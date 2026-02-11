import { api } from '@/lib/api';

export interface Profile {
  id: string;
  userId: string;
  gameId?: string;
  gameUsername?: string;
  rank?: string;
  bio?: string;
  phone?: string;
  country?: string;
  discordId?: string;
  stats?: any;
}

export interface UpdateProfileData {
  gameId?: string;
  gameUsername?: string;
  rank?: string;
  bio?: string;
  phone?: string;
  country?: string;
  discordId?: string;
}

export const userService = {
  async getProfile(): Promise<Profile> {
    return api.get('/users/profile');
  },

  async updateProfile(data: UpdateProfileData): Promise<Profile> {
    return api.put('/users/profile', data);
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    return api.uploadFile('/users/avatar', file, 'avatar');
  },
};
