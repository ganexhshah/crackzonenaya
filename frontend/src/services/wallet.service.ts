import { api } from '@/lib/api';

export interface WalletData {
  balance: number;
  currency: string;
  pendingAmount: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount: number;
  method: string;
  status: 'Verified' | 'Pending' | 'Failed';
  date: string;
  transactionId?: string;
  description?: string;
  receipt?: string;
  reference?: string;
  receiptUrl?: string;
}

export interface DepositRequest {
  amount: number;
  method: string;
  transactionId: string;
  screenshot: File;
}

export interface WithdrawalRequest {
  amount: number;
  method: 'esewa' | 'khalti';
  accountNumber: string;
}

export const walletService = {
  // Get wallet balance
  async getWallet(): Promise<WalletData> {
    const response: any = await api.get('/users/wallet');
    return {
      balance: response.balance || 0,
      currency: 'रु',
      pendingAmount: response.pendingAmount || 0,
    };
  },

  // Get transaction history
  async getTransactions(): Promise<Transaction[]> {
    const response: any[] = await api.get('/transactions');
    return response.map((txn: any) => ({
      id: txn.id,
      type: txn.type.toLowerCase(),
      amount: txn.amount,
      method: txn.reference ? txn.reference.split('-')[0] : 'Wallet',
      status: txn.status === 'COMPLETED' ? 'Verified' : txn.status === 'PENDING' ? 'Pending' : 'Failed',
      date: txn.createdAt,
      transactionId: txn.reference,
      description: txn.description,
      reference: txn.reference,
      receiptUrl: txn.receiptUrl,
    }));
  },

  // Submit deposit request
  async submitDeposit(data: DepositRequest): Promise<void> {
    const formData = new FormData();
    formData.append('amount', data.amount.toString());
    formData.append('method', data.method);
    formData.append('transactionId', data.transactionId);
    formData.append('receipt', data.screenshot);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/transactions/deposit`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit deposit');
    }
  },

  // Submit withdrawal request
  async submitWithdrawal(data: WithdrawalRequest): Promise<void> {
    await api.post('/transactions/withdrawal', {
      amount: data.amount,
      method: data.method,
      accountNumber: data.accountNumber,
    });
  },
};
