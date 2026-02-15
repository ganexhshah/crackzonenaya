import { createNotification } from '../routes/notification.routes';

/**
 * Utility functions for creating wallet-related notifications
 */

export const notifyDepositSubmitted = async (userId: string, amount: number, reference: string) => {
  return createNotification(
    userId,
    'Deposit Request Submitted',
    `Your deposit of रु ${amount.toFixed(2)} is being verified. Reference: ${reference}`,
    'WALLET',
    '/dashboard/wallet'
  );
};

export const notifyDepositApproved = async (userId: string, amount: number) => {
  return createNotification(
    userId,
    'Deposit Approved ✓',
    `Your deposit of रु ${amount.toFixed(2)} has been approved and added to your wallet!`,
    'WALLET',
    '/dashboard/wallet'
  );
};

export const notifyDepositRejected = async (userId: string, amount: number) => {
  return createNotification(
    userId,
    'Deposit Rejected',
    `Your deposit of रु ${amount.toFixed(2)} was rejected. Please verify your payment details.`,
    'WALLET',
    '/dashboard/wallet'
  );
};

export const notifyWithdrawalSubmitted = async (userId: string, amount: number) => {
  return createNotification(
    userId,
    'Withdrawal Request Submitted',
    `Your withdrawal of रु ${amount.toFixed(2)} is being processed. Amount deducted from wallet.`,
    'WALLET',
    '/dashboard/wallet'
  );
};

export const notifyWithdrawalCompleted = async (userId: string, amount: number) => {
  return createNotification(
    userId,
    'Withdrawal Completed ✓',
    `Your withdrawal of रु ${amount.toFixed(2)} has been processed successfully.`,
    'WALLET',
    '/dashboard/wallet'
  );
};

export const notifyWithdrawalFailed = async (userId: string, amount: number) => {
  return createNotification(
    userId,
    'Withdrawal Failed - Refunded',
    `Your withdrawal of रु ${amount.toFixed(2)} failed. Amount refunded to your wallet.`,
    'WALLET',
    '/dashboard/wallet'
  );
};

export const notifyReportSubmitted = async (userId: string) => {
  return createNotification(
    userId,
    'Issue Report Submitted',
    `Your transaction issue report has been submitted. We'll review it within 24 hours.`,
    'WALLET',
    '/dashboard/reports'
  );
};

export const notifyReportStatusUpdate = async (
  userId: string,
  status: 'RESOLVED' | 'REJECTED' | 'UNDER_REVIEW',
  adminRemark?: string
) => {
  const statusEmoji = status === 'RESOLVED' ? '✓' : status === 'REJECTED' ? '✗' : '🔍';
  const statusText = status === 'RESOLVED' ? 'Resolved' : status === 'REJECTED' ? 'Rejected' : 'Under Review';
  
  const message = status === 'RESOLVED' 
    ? `Your transaction issue report has been resolved. ${adminRemark ? 'Check admin response.' : ''}`
    : status === 'REJECTED'
    ? `Your transaction issue report was rejected. ${adminRemark ? 'Check admin response.' : ''}`
    : 'Your transaction issue report is under review by our team.';

  return createNotification(
    userId,
    `Report ${statusText} ${statusEmoji}`,
    message,
    'WALLET',
    '/dashboard/reports'
  );
};

export const notifyBalanceUpdate = async (userId: string, amount: number, type: 'credit' | 'debit', reason: string) => {
  const action = type === 'credit' ? 'added to' : 'deducted from';
  return createNotification(
    userId,
    'Wallet Balance Updated',
    `रु ${Math.abs(amount).toFixed(2)} ${action} your wallet. Reason: ${reason}`,
    'WALLET',
    '/dashboard/wallet'
  );
};
