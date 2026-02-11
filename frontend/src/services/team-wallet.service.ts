import { api } from '@/lib/api';

export interface TeamTransaction {
  id: string;
  teamId: string;
  userId?: string;
  type: string;
  amount: number;
  description?: string;
  reference?: string;
  createdAt: string;
}

export interface MoneyRequest {
  id: string;
  teamId: string;
  requestedBy: string;
  requestedFrom: string;
  amount: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  respondedAt?: string;
  team?: {
    id: string;
    name: string;
    tag: string;
    logo?: string;
  };
}

export const teamWalletService = {
  async getBalance(teamId: string): Promise<{ balance: number }> {
    return api.get(`/team-wallet/${teamId}/balance`);
  },

  async getTransactions(teamId: string): Promise<TeamTransaction[]> {
    return api.get(`/team-wallet/${teamId}/transactions`);
  },

  async requestMoney(
    teamId: string,
    memberIds: string[],
    amountPerMember: number,
    reason?: string
  ): Promise<{ message: string; requests: MoneyRequest[] }> {
    return api.post(`/team-wallet/${teamId}/request-money`, {
      memberIds,
      amountPerMember,
      reason,
    });
  },

  async getPendingRequests(): Promise<MoneyRequest[]> {
    return api.get('/team-wallet/requests/pending');
  },

  async respondToRequest(
    requestId: string,
    action: 'approve' | 'reject'
  ): Promise<{ message: string }> {
    return api.post(`/team-wallet/requests/${requestId}/respond`, { action });
  },

  async getTeamRequests(teamId: string): Promise<MoneyRequest[]> {
    return api.get(`/team-wallet/${teamId}/requests`);
  },
};
