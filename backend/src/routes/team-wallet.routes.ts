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
    const parsedAmount = Number(amountPerMember);

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'At least one member is required' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount per member must be a positive number' });
    }

    console.log('Money request received:', { teamId, memberIds, amountPerMember, reason, userId: req.user.id });

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
      console.log('Team not found:', teamId);
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      console.log('User is not team owner:', { userId: req.user.id, ownerId: team.ownerId });
      return res.status(403).json({ error: 'Only team leader can request money' });
    }

    // Validate member IDs
    const validMembers = team.members.filter(m => 
      memberIds.includes(m.userId) && m.userId !== req.user.id
    );

    console.log('Valid members:', validMembers.length);

    if (validMembers.length === 0) {
      return res.status(400).json({ error: 'No valid members selected' });
    }

    // Create money requests (don't check balance, let members decide)
    const requests = await Promise.all(
      validMembers.map(member =>
        prisma.teamMoneyRequest.create({
          data: {
            teamId,
            requestedBy: req.user.id,
            requestedFrom: member.userId,
            amount: parsedAmount,
            reason: reason || 'Team entry fee contribution',
          },
        })
      )
    );

    console.log('Money requests created:', requests.length);

    res.json({
      message: 'Money requests sent successfully',
      requests,
    });
  } catch (error) {
    console.error('Money request error:', error);
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
      const result = await prisma.$transaction(async (tx) => {
        const locked = await tx.teamMoneyRequest.updateMany({
          where: {
            id: requestId,
            requestedFrom: req.user.id,
            status: 'PENDING',
          },
          data: {
            status: 'APPROVED',
            respondedAt: new Date(),
          },
        });

        if (locked.count !== 1) {
          return { error: 'ALREADY_PROCESSED' as const };
        }

        const userUpdated = await tx.user.updateMany({
          where: {
            id: req.user.id,
            balance: { gte: request.amount },
          },
          data: { balance: { decrement: request.amount } },
        });

        if (userUpdated.count !== 1) {
          // Revert request status if balance check failed
          await tx.teamMoneyRequest.update({
            where: { id: requestId },
            data: { status: 'PENDING', respondedAt: null },
          });
          return { error: 'INSUFFICIENT_BALANCE' as const };
        }

        await tx.team.update({
          where: { id: request.teamId },
          data: { balance: { increment: request.amount } },
        });

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

        return { ok: true as const };
      });

      if ('error' in result) {
        if (result.error === 'ALREADY_PROCESSED') {
          return res.status(409).json({ error: 'Request already processed' });
        }
        if (result.error === 'INSUFFICIENT_BALANCE') {
          return res.status(400).json({ error: 'Insufficient balance' });
        }
      }

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
