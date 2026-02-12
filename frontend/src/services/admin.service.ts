import { api } from '@/lib/api';

// Admin Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalTeams: number;
  totalTournaments: number;
  totalMatches: number;
  pendingRegistrations: number;
  pendingTransactions: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

// Users
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt: string;
  profile?: any;
  _count?: {
    teams: number;
    matches: number;
  };
}

// Transactions
export interface AdminTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  description?: string;
  receiptUrl?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

// Registrations
export interface AdminRegistration {
  id: string;
  tournamentId: string;
  teamId: string;
  status: string;
  createdAt: string;
  tournament: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
    tag: string;
  };
}

export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const stats: any = await api.get('/admin/dashboard');
    return {
      totalUsers: stats.totalUsers || 0,
      totalTeams: stats.totalTeams || 0,
      totalTournaments: stats.totalTournaments || 0,
      totalMatches: stats.totalMatches || 0,
      pendingRegistrations: stats.pendingRegistrations || 0,
      pendingTransactions: stats.pendingTransactions || 0,
      recentActivity: [],
    };
  },

  // Users Management
  async getAllUsers(): Promise<AdminUser[]> {
    return api.get('/admin/users');
  },

  async getUserById(id: string): Promise<AdminUser> {
    return api.get(`/admin/users/${id}`);
  },

  async updateUserStatus(id: string, status: string): Promise<AdminUser> {
    return api.patch(`/admin/users/${id}/status`, { status });
  },

  async updateUserRole(id: string, role: string): Promise<AdminUser> {
    return api.patch(`/admin/users/${id}/role`, { role });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return api.delete(`/admin/users/${id}`);
  },

  // Transactions Management
  async getAllTransactions(): Promise<AdminTransaction[]> {
    return api.get('/admin/transactions');
  },

  async updateTransactionStatus(id: string, status: string): Promise<AdminTransaction> {
    return api.patch(`/admin/transactions/${id}/status`, { status });
  },

  // Registrations Management
  async getAllRegistrations(): Promise<AdminRegistration[]> {
    return api.get('/admin/registrations');
  },

  async updateRegistrationStatus(
    tournamentId: string,
    registrationId: string,
    status: string
  ): Promise<AdminRegistration> {
    return api.patch(`/tournaments/${tournamentId}/registrations/${registrationId}`, { status });
  },

  // Analytics
  async getAnalytics(period: string = '7d'): Promise<any> {
    return api.get(`/admin/analytics?period=${period}`);
  },

  // Support Tickets (admin)
  async getSupportTickets(params?: { status?: string; category?: string; priority?: string }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.category) qs.set("category", params.category);
    if (params?.priority) qs.set("priority", params.priority);
    const query = qs.toString();
    return api.get(`/support/admin/tickets${query ? `?${query}` : ""}`);
  },

  async getSupportTicketById(id: string): Promise<any> {
    return api.get(`/support/tickets/${id}`);
  },

  async updateSupportTicket(id: string, patch: { status?: string; priority?: string; assignedToId?: string | null }): Promise<any> {
    return api.put(`/support/admin/tickets/${id}`, patch);
  },
};
