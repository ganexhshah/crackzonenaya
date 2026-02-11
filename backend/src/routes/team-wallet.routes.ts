import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get team wallet balance
router.get('/:teamId/balance', authenticate, async (req: any, res) => {
  try {
    const { teamId } = req.params;

    // Check if user is team member
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.user.id,
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a team member' });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { balance: true },
    });

    res.json({ balance: team?.balance || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team transactions
router.get('/:teamId/transactions', authenticate, async (req: any, res) => {
  try {
    const { teamId } = req.params;

    // Check if user is team member
    const member = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.user.id,
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a team member' });
    }

    const transactions = await prisma.teamTransaction.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create money request (team leader only)
router.post('/:teamId/request-money', authenticate, async (req: any, res) => {
  try {
    const { teamId } = req.params;
    const { memberIds, amountPerMember, reason } = req.body;

    // Check if user is team owner/leader
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, balance: true },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only team leader can request money' });
    }

    // Validate member IDs
    const validMembers = team.members.filter(m => 
      memberIds.includes(m.userId) && m.userId !== req.user.id
    );

    if (validMembers.length === 0) {
      return res.status(400).json({ error: 'No valid members selected' });
    }

    // Check if members have sufficient balance
    const insufficientMembers = validMembers.filter(m => 
      m.user.balance < amountPerMember
    );

    if (insufficientMembers.length > 0) {
      return res.status(400).json({ 
        error: 'Some members have insufficient balance',
        insufficientMembers: insufficientMembers.map(m => ({
          id: m.user.id,
          username: m.user.username,
          balance: m.user.balance,
          required: amountPerMember,
        })),
      });
    }

    // Create money requests
    const requests = await Promise.all(
      validMembers.map(member =>
        prisma.teamMoneyRequest.create({
          data: {
            teamId,
            requestedBy: req.user.id,
            requestedFrom: member.userId,
            amount: amountPerMember,
            reason: reason || 'Team entry fee contribution',
          },
        })
      )
    );

    res.json({
      message: 'Money requests sent successfully',
      requests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending money requests for user
router.get('/requests/pending', authenticate, async (req: any, res) => {
  try {
    const requests = await prisma.teamMoneyRequest.findMany({
      where: {
        requestedFrom: req.user.id,
        status: 'PENDING',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/Reject money request
router.post('/requests/:requestId/respond', authenticate, async (req: any, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const request = await prisma.teamMoneyRequest.findUnique({
      where: { id: requestId },
      include: { team: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.requestedFrom !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    if (action === 'approve') {
      // Check user balance
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user || user.balance < request.amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Process transaction
      await prisma.$transaction(async (tx) => {
        // Deduct from user
        await tx.user.update({
          where: { id: req.user.id },
          data: { balance: { decrement: request.amount } },
        });

        // Add to team wallet
        await tx.team.update({
          where: { id: request.teamId },
          data: { balance: { increment: request.amount } },
        });

        // Create user transaction
        await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'WITHDRAWAL',
            amount: request.amount,
            status: 'COMPLETED',
            description: `Team contribution: ${request.team.name}`,
            reference: requestId,
          },
        });

        // Create team transaction
        await tx.teamTransaction.create({
          data: {
            teamId: request.teamId,
            userId: req.user.id,
            type: 'MEMBER_CONTRIBUTION',
            amount: request.amount,
            description: `Contribution from member`,
            reference: requestId,
          },
        });

        // Update request status
        await tx.teamMoneyRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            respondedAt: new Date(),
          },
        });
      });

      res.json({ message: 'Money transferred to team wallet successfully' });
    } else if (action === 'reject') {
      await prisma.teamMoneyRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      });

      res.json({ message: 'Request rejected' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team money requests (for team leader)
router.get('/:teamId/requests', authenticate, async (req: any, res) => {
  try {
    const { teamId } = req.params;

    // Check if user is team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only team leader can view requests' });
    }

    const requests = await prisma.teamMoneyRequest.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
