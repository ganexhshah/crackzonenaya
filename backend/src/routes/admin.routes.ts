import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendEmail } from '../config/email';

const router = Router();

// Middleware to check admin role
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(isAdmin);

// Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalTeams,
      totalTournaments,
      totalMatches,
      pendingRegistrations,
      pendingTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.tournament.count(),
      prisma.match.count(),
      prisma.tournamentRegistration.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      totalUsers,
      totalTeams,
      totalTournaments,
      totalMatches,
      pendingRegistrations,
      pendingTransactions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        role: true,
        status: true,
        isVerified: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        role: true,
        status: true,
        isVerified: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        teams: {
          include: { team: true },
        },
        matches: true,
        transactions: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all registrations
router.get('/registrations', async (req, res) => {
  try {
    const registrations = await prisma.tournamentRegistration.findMany({
      include: {
        tournament: true,
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysAgo = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      matchStats,
      revenueStats,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      prisma.match.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      userGrowth,
      matchStats,
      revenue: revenueStats._sum.amount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update transaction status
router.patch('/transactions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition. Only COMPLETED or FAILED is allowed.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!transaction) {
        return { error: 'NOT_FOUND' as const };
      }

      // Enforce one-way transition from PENDING only
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

      // Balance mutation occurs in same DB transaction to avoid double credit/refund races.
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

      const updatedTransaction = await tx.transaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return { updatedTransaction, transaction };
    });

    if ('error' in result) {
      if (result.error === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      if (result.error === 'ALREADY_FINALIZED') {
        return res.status(409).json({ error: `Transaction already finalized as ${result.currentStatus}` });
      }
      return res.status(409).json({ error: 'Transaction status update conflict. Please retry.' });
    }
    const { updatedTransaction, transaction } = result;

    // Notify user when admin accepts/rejects (non-blocking)
    if (
      transaction.type === 'DEPOSIT' &&
      transaction.status !== status &&
      (status === 'COMPLETED' || status === 'FAILED')
    ) {
      const decisionText = status === 'COMPLETED' ? 'accepted' : 'rejected';
      const subject =
        status === 'COMPLETED'
          ? 'Payment Approved - Wallet Credited'
          : 'Payment Rejected - Action Required';

      sendEmail(
        transaction.user.email,
        subject,
        `
          <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:${status === 'COMPLETED' ? '#065f46' : '#7f1d1d'};padding:16px 20px;">
                <h2 style="margin:0;font-size:18px;color:#ffffff;">
                  Payment ${status === 'COMPLETED' ? 'Approved' : 'Rejected'}
                </h2>
              </div>
              <div style="padding:20px;">
                <p style="margin:0 0 12px;color:#4b5563;">
                  Your deposit request has been <strong>${decisionText}</strong> by admin.
                </p>
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;">
                  <p style="margin:0 0 8px;"><strong>Amount:</strong> INR ${Number(transaction.amount).toFixed(2)}</p>
                  <p style="margin:0;"><strong>Reference:</strong> ${transaction.reference}</p>
                </div>
                ${
                  status === 'COMPLETED'
                    ? '<p style="margin:16px 0 0;color:#111827;">The amount has been added to your wallet balance.</p>'
                    : '<p style="margin:16px 0 0;color:#111827;">Please verify your transaction details and submit again if needed.</p>'
                }
              </div>
            </div>
          </div>
        `
      ).catch((emailError) => {
        console.error('Transaction decision email failed (non-critical):', emailError?.message || emailError);
      });
    }

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
