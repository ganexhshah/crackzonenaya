import { api } from '@/lib/api';

export interface TransactionReport {
  id: string;
  transactionId: string;
  userId: string;
  issueType: string;
  description: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  adminRemark?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  transaction?: {
    id: string;
    type: string;
    amount: number;
    status: string;
    reference?: string;
    createdAt: string;
    user?: {
      id: string;
      username: string;
      email: string;
      avatar?: string;
    };
  };
}

export interface CreateReportData {
  transactionId: string;
  issueType: string;
  description: string;
}

export interface UpdateReportData {
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  adminRemark?: string;
}

export const transactionReportService = {
  async createReport(data: CreateReportData): Promise<TransactionReport> {
    return api.post('/transaction-reports', data);
  },

  async getMyReports(): Promise<TransactionReport[]> {
    return api.get('/transaction-reports/my-reports');
  },

  async getReport(id: string): Promise<TransactionReport> {
    return api.get(`/transaction-reports/${id}`);
  },

  async cancelReport(id: string): Promise<TransactionReport> {
    return api.patch(`/transaction-reports/${id}/cancel`, {});
  },

  // Admin methods
  async adminGetAllReports(): Promise<TransactionReport[]> {
    return api.get('/admin/transaction-reports');
  },

  async adminGetReportStats(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    resolved: number;
    rejected: number;
  }> {
    return api.get('/admin/transaction-reports/stats');
  },

  async adminUpdateReport(id: string, data: UpdateReportData): Promise<TransactionReport> {
    return api.patch(`/admin/transaction-reports/${id}`, data);
  },
};
