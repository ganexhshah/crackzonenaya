import { Router, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary';
import { sendEmail } from '../config/email';
import { createRateLimit } from '../middleware/rateLimit';
import { createNotification } from './notification.routes';

const router = Router();
const prisma = new PrismaClient();
const paymentLimiter = createRateLimit(8, 10 * 60 * 1000);

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction' });
  }
});

router.post('/deposit', authenticate, paymentLimiter, upload.single('receipt'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, method, transactionId } = req.body;
    const file = req.file;

    if (!amount || !method || !transactionId) {
      return res.status(400).json({ message: 'Amount, method, and transaction ID are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({ message: 'Minimum deposit amount is INR 100' });
    }

    if (typeof transactionId !== 'string' || transactionId.trim().length < 4 || transactionId.trim().length > 100) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    if (!file) {
      return res.status(400).json({ message: 'Receipt screenshot is required' });
    }

    const safeMethod = String(method).trim().slice(0, 30);
    const safeTxnId = transactionId.trim();
    const reference = `${safeMethod.toUpperCase()}-${safeTxnId}`;

    let receiptUrl = '';
    try {
      receiptUrl = await uploadToCloudinary(file.buffer, 'receipts');
    } catch (uploadError) {
      console.error('Receipt upload error:', uploadError);
      return res.status(500).json({ message: 'Failed to upload receipt' });
    }

    const transaction = await prisma.$transaction(
      async (tx) => {
        const existingReference = await tx.transaction.findFirst({
          where: {
            reference,
            type: 'DEPOSIT',
            status: { in: ['PENDING', 'COMPLETED'] },
          },
          select: { id: true },
        });
        if (existingReference) {
          throw new Error('DUPLICATE_REFERENCE');
        }

        return tx.transaction.create({
          data: {
            userId,
            type: 'DEPOSIT',
            amount: parsedAmount,
            reference,
            receiptUrl,
            status: 'PENDING',
            description: `Deposit via ${safeMethod}`,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    sendEmail(
      req.user!.email,
      'Payment Submitted - Verification In Progress',
      `
        <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:#111827;padding:16px 20px;">
              <h2 style="margin:0;font-size:18px;color:#ffffff;">CrackZone Wallet Update</h2>
            </div>
            <div style="padding:20px;">
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;">Payment Submitted</p>
              <p style="margin:0 0 16px;color:#4b5563;">Your payment is being verified by our team.</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;">
                <p style="margin:0 0 8px;"><strong>Amount:</strong> INR ${parsedAmount.toFixed(2)}</p>
                <p style="margin:0 0 8px;"><strong>Method:</strong> ${safeMethod}</p>
                <p style="margin:0;"><strong>Reference:</strong> ${transaction.reference}</p>
              </div>
              <p style="margin:16px 0 0;color:#111827;">Your funds will be added to your wallet once verified (usually within 24 hours).</p>
            </div>
          </div>
        </div>
      `
    ).catch((emailError) => {
      console.error('Deposit submitted email failed (non-critical):', emailError?.message || emailError);
    });

    // Create notification for deposit submission
    createNotification(
      userId,
      'Deposit Request Submitted',
      `Your deposit of रु ${parsedAmount.toFixed(2)} is being verified. Reference: ${transaction.reference}`,
      'WALLET',
      '/dashboard/wallet'
    ).catch((notifError) => {
      console.error('Deposit notification failed (non-critical):', notifError);
    });

    res.status(201).json({
      message: 'Deposit request submitted successfully',
      transaction,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_REFERENCE') {
      return res.status(409).json({ message: 'This transaction reference is already submitted' });
    }
    console.error('Submit deposit error:', error);
    res.status(500).json({ message: 'Failed to submit deposit request' });
  }
});

router.post('/withdrawal', authenticate, paymentLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, method, accountNumber } = req.body;

    if (!amount || !method || !accountNumber) {
      return res.status(400).json({ message: 'Amount, method, and account number are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    if (parsedAmount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is INR 100' });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: userId,
          balance: { gte: parsedAmount },
        },
        data: {
          balance: { decrement: parsedAmount },
        },
      });

      if (updated.count !== 1) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      return tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: parsedAmount,
          reference: `${String(method).toUpperCase().slice(0, 20)}-${String(accountNumber).slice(0, 60)}`,
          status: 'PENDING',
          description: `Withdrawal to ${String(method).slice(0, 20)} - ${String(accountNumber).slice(0, 60)}`,
        },
      });
    });

    // Create notification for withdrawal submission
    createNotification(
      userId,
      'Withdrawal Request Submitted',
      `Your withdrawal of रु ${parsedAmount.toFixed(2)} is being processed. Amount deducted from wallet.`,
      'WALLET',
      '/dashboard/wallet'
    ).catch((notifError) => {
      console.error('Withdrawal notification failed (non-critical):', notifError);
    });

    res.status(201).json({
      message: 'Withdrawal request submitted successfully. Amount deducted from balance.',
      transaction,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    console.error('Submit withdrawal error:', error);
    res.status(500).json({ message: 'Failed to submit withdrawal request' });
  }
});

router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!['COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition. Only COMPLETED or FAILED is allowed.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!transaction) {
        return { error: 'NOT_FOUND' as const };
      }

      if (transaction.status !== 'PENDING') {
        return { error: 'ALREADY_FINALIZED' as const, currentStatus: transaction.status };
      }

      const updatedCount = await tx.transaction.updateMany({
        where: { id, status: 'PENDING' },
        data: { status },
      });

      if (updatedCount.count !== 1) {
        return { error: 'CONFLICT' as const };
      }

      if (status === 'COMPLETED' && transaction.type === 'DEPOSIT') {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      } else if (status === 'FAILED' && transaction.type === 'WITHDRAWAL') {
        await tx.user.update({
          where: { id: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      }

      const updatedTransaction = await tx.transaction.findUnique({ where: { id } });
      return { updatedTransaction, transaction };
    });

    if ('error' in result) {
      if (result.error === 'NOT_FOUND') {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      if (result.error === 'ALREADY_FINALIZED') {
        return res.status(409).json({ message: `Transaction already finalized as ${result.currentStatus}` });
      }
      return res.status(409).json({ message: 'Transaction status update conflict. Please retry.' });
    }

    const { updatedTransaction, transaction } = result;

    // Create notifications based on transaction status and type
    if (status === 'COMPLETED') {
      if (transaction.type === 'DEPOSIT') {
        createNotification(
          transaction.userId,
          'Deposit Approved ✓',
          `Your deposit of रु ${transaction.amount.toFixed(2)} has been approved and added to your wallet!`,
          'WALLET',
          '/dashboard/wallet'
        ).catch((notifError) => {
          console.error('Deposit approved notification failed (non-critical):', notifError);
        });
      } else if (transaction.type === 'WITHDRAWAL') {
        createNotification(
          transaction.userId,
          'Withdrawal Completed ✓',
          `Your withdrawal of रु ${transaction.amount.toFixed(2)} has been processed successfully.`,
          'WALLET',
          '/dashboard/wallet'
        ).catch((notifError) => {
          console.error('Withdrawal completed notification failed (non-critical):', notifError);
        });
      }
    } else if (status === 'FAILED') {
      if (transaction.type === 'DEPOSIT') {
        createNotification(
          transaction.userId,
          'Deposit Rejected',
          `Your deposit of रु ${transaction.amount.toFixed(2)} was rejected. Please verify your payment details.`,
          'WALLET',
          '/dashboard/wallet'
        ).catch((notifError) => {
          console.error('Deposit rejected notification failed (non-critical):', notifError);
        });
      } else if (transaction.type === 'WITHDRAWAL') {
        createNotification(
          transaction.userId,
          'Withdrawal Failed - Refunded',
          `Your withdrawal of रु ${transaction.amount.toFixed(2)} failed. Amount refunded to your wallet.`,
          'WALLET',
          '/dashboard/wallet'
        ).catch((notifError) => {
          console.error('Withdrawal failed notification failed (non-critical):', notifError);
        });
      }
    }

    res.json({
      message: 'Transaction status updated successfully',
      transaction: result.updatedTransaction,
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ message: 'Failed to update transaction status' });
  }
});

export default router;
