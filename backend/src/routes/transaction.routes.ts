import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = Router();
const prisma = new PrismaClient();

// Extend Request type
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Get all transactions for the authenticated user
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

// Get a specific transaction
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

// Submit deposit request
router.post('/deposit', authenticate, upload.single('receipt'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, method, transactionId } = req.body;
    const file = req.file;

    if (!amount || !method || !transactionId) {
      return res.status(400).json({ message: 'Amount, method, and transaction ID are required' });
    }

    if (!file) {
      return res.status(400).json({ message: 'Receipt screenshot is required' });
    }

    // Upload receipt to Cloudinary
    let receiptUrl = '';
    try {
      receiptUrl = await uploadToCloudinary(file.buffer, 'receipts');
    } catch (uploadError) {
      console.error('Receipt upload error:', uploadError);
      return res.status(500).json({ message: 'Failed to upload receipt' });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount: parseFloat(amount),
        reference: `${method.toUpperCase()}-${transactionId}`,
        receiptUrl,
        status: 'PENDING',
        description: `Deposit via ${method}`,
      },
    });

    res.status(201).json({
      message: 'Deposit request submitted successfully',
      transaction,
    });
  } catch (error) {
    console.error('Submit deposit error:', error);
    res.status(500).json({ message: 'Failed to submit deposit request' });
  }
});

// Submit withdrawal request
router.post('/withdrawal', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, method, accountNumber } = req.body;

    if (!amount || !method || !accountNumber) {
      return res.status(400).json({ message: 'Amount, method, and account number are required' });
    }

    // Minimum withdrawal check
    if (parseFloat(amount) < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is रु 100' });
    }

    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient balance
    if (user.balance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct amount from user balance immediately
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: parseFloat(amount),
        },
      },
    });

    // Create withdrawal transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        amount: parseFloat(amount),
        reference: `${method.toUpperCase()}-${accountNumber}`,
        status: 'PENDING',
        description: `Withdrawal to ${method} - ${accountNumber}`,
      },
    });

    res.status(201).json({
      message: 'Withdrawal request submitted successfully. Amount deducted from balance.',
      transaction,
    });
  } catch (error) {
    console.error('Submit withdrawal error:', error);
    res.status(500).json({ message: 'Failed to submit withdrawal request' });
  }
});

// Admin: Update transaction status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const userId = req.user!.id;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { status },
    });

    res.json({
      message: 'Transaction status updated successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ message: 'Failed to update transaction status' });
  }
});

export default router;
