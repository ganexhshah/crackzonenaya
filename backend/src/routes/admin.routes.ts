import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';

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
      include: {
        profile: true,
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
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
      include: {
        profile: true,
        teams: {
          include: { team: true },
        },
        matches: true,
        transactions: true,
      },
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

    if (!['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { status },
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

    // Update user balance based on transaction type and status
    if (status === 'COMPLETED' && transaction.status !== 'COMPLETED') {
      if (transaction.type === 'DEPOSIT') {
        // Add to balance for deposits
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            balance: {
              increment: transaction.amount,
            },
          },
        });
      }
      // For withdrawals, money was already deducted, so no action needed
    } else if (status === 'FAILED' && transaction.status !== 'FAILED') {
      if (transaction.type === 'WITHDRAWAL') {
        // Refund the amount if withdrawal is rejected
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            balance: {
              increment: transaction.amount,
            },
          },
        });
      }
    }

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
