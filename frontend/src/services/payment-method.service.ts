import { api } from '@/lib/api';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'UPI' | 'BANK' | 'WALLET';
  accountNumber?: string;
  accountName?: string;
  upiId?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodData {
  name: string;
  type: 'UPI' | 'BANK' | 'WALLET';
  accountNumber?: string;
  accountName?: string;
  upiId?: string;
  qrCodeFile?: File;
}

export interface UpdatePaymentMethodData extends CreatePaymentMethodData {
  id: string;
}

class PaymentMethodService {
  // Get all active payment methods (public)
  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get<PaymentMethod[]>('/payment-methods/active');
    return response;
  }

  // Get all payment methods (admin)
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get<PaymentMethod[]>('/payment-methods');
    return response;
  }

  // Create payment method with QR code
  async createPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('type', data.type);
    
    if (data.accountNumber) formData.append('accountNumber', data.accountNumber);
    if (data.accountName) formData.append('accountName', data.accountName);
    if (data.upiId) formData.append('upiId', data.upiId);
    if (data.qrCodeFile) formData.append('qrCode', data.qrCodeFile);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/payment-methods`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create payment method');
    }

    return result;
  }

  // Update payment method
  async updatePaymentMethod(data: UpdatePaymentMethodData): Promise<PaymentMethod> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('type', data.type);
    
    if (data.accountNumber) formData.append('accountNumber', data.accountNumber);
    if (data.accountName) formData.append('accountName', data.accountName);
    if (data.upiId) formData.append('upiId', data.upiId);
    if (data.qrCodeFile) formData.append('qrCode', data.qrCodeFile);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/payment-methods/${data.id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update payment method');
    }

    return result;
  }

  // Toggle payment method status
  async togglePaymentMethod(id: string): Promise<PaymentMethod> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/payment-methods/${id}/toggle`, {
      method: 'PATCH',
      headers,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to toggle payment method');
    }

    return result;
  }

  // Delete payment method
  async deletePaymentMethod(id: string): Promise<void> {
    await api.delete(`/payment-methods/${id}`);
  }
}

export const paymentMethodService = new PaymentMethodService();
