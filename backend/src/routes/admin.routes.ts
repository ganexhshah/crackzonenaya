import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendEmail } from '../config/email';
import { createNotification } from './notification.routes';

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
            balance: true,
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

// Get all teams with stats
router.get('/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            matches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(teams);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team stats
router.get('/teams/stats', async (req, res) => {
  try {
    const [total, active, inactive] = await Promise.all([
      prisma.team.count(),
      prisma.team.count({ where: { isActive: true } }),
      prisma.team.count({ where: { isActive: false } }),
    ]);

    res.json({
      total,
      active,
      inactive,
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team status
router.patch('/teams/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const team = await prisma.team.update({
      where: { id },
      data: { isActive },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Update team status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete team
router.delete('/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.team.delete({
      where: { id },
    });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transaction report stats (must be before /transaction-reports to avoid treating 'stats' as ID)
router.get('/transaction-reports/stats', async (req, res) => {
  try {
    const [total, pending, underReview, resolved, rejected] = await Promise.all([
      prisma.transactionReport.count(),
      prisma.transactionReport.count({ where: { status: 'PENDING' } }),
      prisma.transactionReport.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.transactionReport.count({ where: { status: 'RESOLVED' } }),
      prisma.transactionReport.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({
      total,
      pending,
      underReview,
      resolved,
      rejected,
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all transaction reports
router.get('/transaction-reports', async (req, res) => {
  try {
    const reports = await prisma.transactionReport.findMany({
      include: {
        transaction: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Get transaction reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update transaction report status
// Update transaction report status
router.patch('/transaction-reports/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    const report = await prisma.transactionReport.update({
      where: { id },
      data: {
        status,
        adminRemark,
        resolvedBy: req.user.id,
        resolvedAt: status === 'RESOLVED' || status === 'REJECTED' ? new Date() : null,
      },
      include: {
        transaction: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Send email notification to user about status update
    if (report.transaction.user && (status === 'RESOLVED' || status === 'REJECTED' || status === 'UNDER_REVIEW')) {
      const statusText = status === 'RESOLVED' ? 'Resolved' : status === 'REJECTED' ? 'Rejected' : 'Under Review';
      const statusColor = status === 'RESOLVED' ? '#065f46' : status === 'REJECTED' ? '#7f1d1d' : '#1e40af';
      const issueTypeFormatted = report.issueType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      sendEmail(
        report.transaction.user.email,
        `Transaction Issue Report ${statusText}`,
        `
          <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="background:${statusColor};padding:16px 20px;">
                <h2 style="margin:0;font-size:18px;color:#ffffff;">
                  Report Status: ${statusText}
                </h2>
              </div>
              <div style="padding:20px;">
                <p style="margin:0 0 12px;color:#4b5563;">
                  Hi ${report.transaction.user.username},
                </p>
                <p style="margin:0 0 12px;color:#4b5563;">
                  Your transaction issue report has been updated.
                </p>
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin:16px 0;">
                  <p style="margin:0 0 8px;"><strong>Status:</strong> ${statusText}</p>
                  <p style="margin:0 0 8px;"><strong>Issue Type:</strong> ${issueTypeFormatted}</p>
                  <p style="margin:0 0 8px;"><strong>Transaction ID:</strong> ${report.transaction.reference || report.transaction.id}</p>
                  <p style="margin:0;"><strong>Amount:</strong> रु ${Math.abs(report.transaction.amount)}</p>
                </div>
                ${adminRemark ? `
                  <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:14px 16px;margin:16px 0;">
                    <p style="margin:0 0 8px;font-weight:600;color:#92400e;">Admin Response:</p>
                    <p style="margin:0;color:#92400e;">${adminRemark}</p>
                  </div>
                ` : ''}
                <p style="margin:16px 0 0;color:#111827;">
                  ${status === 'RESOLVED' 
                    ? 'Your issue has been resolved. If you have any further questions, please contact support.' 
                    : status === 'REJECTED'
                    ? 'Your report has been reviewed. Please check the admin response above for details.'
                    : 'Our team is currently reviewing your issue. We\'ll update you once we have more information.'}
                </p>
              </div>
            </div>
          </div>
        `
      ).catch((emailError) => {
        console.error('Report status update email failed (non-critical):', emailError?.message || emailError);
      });

      // Create notification for report status update
      const statusEmoji = status === 'RESOLVED' ? '✓' : status === 'REJECTED' ? '✗' : '🔍';
      const notifMessage = status === 'RESOLVED' 
        ? `Your transaction issue report has been resolved. ${adminRemark ? 'Check admin response.' : ''}`
        : status === 'REJECTED'
        ? `Your transaction issue report was rejected. ${adminRemark ? 'Check admin response.' : ''}`
        : 'Your transaction issue report is under review by our team.';

      createNotification(
        report.transaction.userId,
        `Report ${statusText} ${statusEmoji}`,
        notifMessage,
        'WALLET',
        '/dashboard/reports'
      ).catch((notifError) => {
        console.error('Report status notification failed (non-critical):', notifError);
      });
    }

    res.json(report);
  } catch (error) {
    console.error('Update report error:', error);
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

      // Create notification for deposit decision
      if (status === 'COMPLETED') {
        createNotification(
          transaction.userId,
          'Deposit Approved ✓',
          `Your deposit of रु ${transaction.amount.toFixed(2)} has been approved and added to your wallet!`,
          'WALLET',
          '/dashboard/wallet'
        ).catch((notifError) => {
          console.error('Deposit approved notification failed (non-critical):', notifError);
        });
      } else {
        createNotification(
          transaction.userId,
          'Deposit Rejected',
          `Your deposit of रु ${transaction.amount.toFixed(2)} was rejected. Please verify your payment details.`,
          'WALLET',
          '/dashboard/wallet'
        ).catch((notifError) => {
          console.error('Deposit rejected notification failed (non-critical):', notifError);
        });
      }
    }

    // Create notification for withdrawal decision
    if (
      transaction.type === 'WITHDRAWAL' &&
      transaction.status !== status &&
      (status === 'COMPLETED' || status === 'FAILED')
    ) {
      if (status === 'COMPLETED') {
        createNotification(
          transaction.userId,
          'Withdrawal Completed ✓',
          `Your withdrawal of रु ${transaction.amount.toFixed(2)} has been processed successfully.`,
          'WALLET',
          '/dashboard/wallet'
        ).catch((notifError) => {
          console.error('Withdrawal completed notification failed (non-critical):', notifError);
        });
      } else {
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

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
