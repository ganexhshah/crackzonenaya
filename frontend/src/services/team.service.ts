import { api } from '@/lib/api';

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  description?: string;
  ownerId: string;
  isActive: boolean;
  balance?: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  members: TeamMember[];
  _count?: {
    members: number;
  };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'OWNER' | 'CAPTAIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    balance?: number;
  };
}

export interface CreateTeamData {
  name: string;
  tag: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export const teamService = {
  async getAllTeams(): Promise<Team[]> {
    return api.get('/teams');
  },

  async getMyTeams(): Promise<Team[]> {
    return api.get('/teams/my-teams');
  },

  async getUserTeams(): Promise<Team[]> {
    return api.get('/teams/my-teams');
  },

  async getTeam(id: string): Promise<Team> {
    return api.get(`/teams/${id}`);
  },

  async getTeamById(id: string): Promise<Team> {
    return api.get(`/teams/${id}`);
  },

  async createTeam(data: CreateTeamData): Promise<Team> {
    return api.post('/teams', data);
  },

  async updateTeam(id: string, data: UpdateTeamData): Promise<Team> {
    return api.put(`/teams/${id}`, data);
  },

  async uploadLogo(id: string, file: File): Promise<{ logo: string }> {
    return api.uploadFile(`/teams/${id}/logo`, file, 'logo');
  },

  async addMember(teamId: string, userId: string): Promise<TeamMember> {
    return api.post(`/teams/${teamId}/members`, { userId });
  },

  async removeMember(teamId: string, userId: string): Promise<{ message: string }> {
    return api.delete(`/teams/${teamId}/members/${userId}`);
  },

  async deleteTeam(id: string): Promise<{ message: string }> {
    return api.delete(`/teams/${id}`);
  },

  async getPublicTeam(id: string): Promise<Team> {
    return api.get(`/teams/${id}/public`);
  },

  async acceptInvite(teamId: string): Promise<{ message: string; team: Team }> {
    return api.post(`/teams/${teamId}/accept-invite`);
  },

  async declineInvite(teamId: string): Promise<{ message: string }> {
    return api.post(`/teams/${teamId}/decline-invite`);
  },

  async inviteMember(teamId: string, userId: string): Promise<{ message: string }> {
    return api.post(`/teams/${teamId}/invite`, { userId });
  },

  async getTeamInvitations(teamId: string): Promise<any[]> {
    return api.get(`/teams/${teamId}/invitations`);
  },

  // Admin methods
  async adminGetAllTeams(): Promise<Team[]> {
    return api.get('/admin/teams');
  },

  async adminGetTeamStats(): Promise<{ total: number; active: number; inactive: number }> {
    return api.get('/admin/teams/stats');
  },

  async adminUpdateTeamStatus(teamId: string, isActive: boolean): Promise<Team> {
    return api.patch(`/admin/teams/${teamId}/status`, { isActive });
  },

  async adminDeleteTeam(teamId: string): Promise<{ message: string }> {
    return api.delete(`/admin/teams/${teamId}`);
  },
};
