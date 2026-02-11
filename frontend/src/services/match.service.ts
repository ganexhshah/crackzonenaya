import { api } from '@/lib/api';

export interface Match {
  id: string;
  title: string;
  description?: string;
  teamId: string;
  opponentName: string;
  matchType: 'SCRIM' | 'TOURNAMENT' | 'PRACTICE';
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  result?: string;
  score?: string;
  roomId?: string;
  roomPassword?: string;
  createdAt: string;
  updatedAt: string;
  team: any;
  players: MatchPlayer[];
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  userId: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface CreateMatchData {
  title: string;
  description?: string;
  teamId: string;
  opponentName: string;
  matchType: 'SCRIM' | 'TOURNAMENT' | 'PRACTICE';
  scheduledAt: string;
  roomId?: string;
  roomPassword?: string;
}

export interface UpdateMatchData {
  title?: string;
  description?: string;
  opponentName?: string;
  scheduledAt?: string;
  roomId?: string;
  roomPassword?: string;
}

export interface SubmitResultData {
  result: string;
  score: string;
  playerStats?: {
    userId: string;
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
  }[];
}

export const matchService = {
  async getAllMatches(): Promise<Match[]> {
    return api.get('/matches');
  },

  async getMyMatches(): Promise<Match[]> {
    return api.get('/matches/my-matches');
  },

  async getMatchById(id: string): Promise<Match> {
    return api.get(`/matches/${id}`);
  },

  async createMatch(data: CreateMatchData): Promise<Match> {
    return api.post('/matches', data);
  },

  async updateMatch(id: string, data: UpdateMatchData): Promise<Match> {
    return api.put(`/matches/${id}`, data);
  },

  async updateStatus(id: string, status: string): Promise<Match> {
    return api.patch(`/matches/${id}/status`, { status });
  },

  async submitResult(id: string, data: SubmitResultData): Promise<Match> {
    return api.post(`/matches/${id}/result`, data);
  },

  async deleteMatch(id: string): Promise<{ message: string }> {
    return api.delete(`/matches/${id}`);
  },
};
