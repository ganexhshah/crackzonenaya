import { api } from '@/lib/api';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  banner?: string;
  prizePool?: number;
  entryFee: number;
  maxTeams: number;
  format: string;
  rules?: string;
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  registrations?: TournamentRegistration[];
  _count?: {
    registrations: number;
  };
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  registeredAt: string;
  team: any;
  tournament: Tournament;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  prizePool?: number;
  entryFee: number;
  maxTeams: number;
  format: string;
  rules?: string;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
}

export interface RegisterTournamentData {
  teamId: string;
}

export const tournamentService = {
  async getAllTournaments(): Promise<Tournament[]> {
    return api.get('/tournaments');
  },

  async getTournamentById(id: string): Promise<Tournament> {
    return api.get(`/tournaments/${id}`);
  },

  async createTournament(data: CreateTournamentData): Promise<Tournament> {
    return api.post('/tournaments', data);
  },

  async updateTournament(id: string, data: Partial<CreateTournamentData>): Promise<Tournament> {
    return api.put(`/tournaments/${id}`, data);
  },

  async uploadBanner(id: string, file: File): Promise<{ banner: string }> {
    return api.uploadFile(`/tournaments/${id}/banner`, file, 'banner');
  },

  async registerForTournament(id: string, data: RegisterTournamentData): Promise<TournamentRegistration> {
    return api.post(`/tournaments/${id}/register`, data);
  },

  async getMyRegistrations(): Promise<TournamentRegistration[]> {
    return api.get('/tournaments/my-registrations');
  },

  async updateRegistrationStatus(
    tournamentId: string,
    registrationId: string,
    status: string
  ): Promise<TournamentRegistration> {
    return api.patch(`/tournaments/${tournamentId}/registrations/${registrationId}`, { status });
  },

  async deleteTournament(id: string): Promise<{ message: string }> {
    return api.delete(`/tournaments/${id}`);
  },
};
