import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all matches
router.get('/', authenticate, async (req: any, res) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        team: {
          include: {
            owner: { select: { id: true, username: true } },
          },
        },
        players: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's matches
router.get('/my-matches', authenticate, async (req: any, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { team: { ownerId: req.user.id } },
          { team: { members: { some: { userId: req.user.id } } } },
          { players: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        team: true,
        players: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get match by ID
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        team: {
          include: {
            owner: { select: { id: true, username: true, avatar: true } },
            members: {
              include: {
                user: { select: { id: true, username: true, avatar: true } },
              },
            },
          },
        },
        players: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create match
router.post('/', authenticate, async (req: any, res) => {
  try {
    const {
      title,
      description,
      teamId,
      opponentName,
      matchType,
      scheduledAt,
      roomId,
      roomPassword,
    } = req.body;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: req.user.id },
    });

    if (!isMember && team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const match = await prisma.match.create({
      data: {
        title,
        description,
        teamId,
        opponentName,
        matchType,
        scheduledAt: new Date(scheduledAt),
        roomId,
        roomPassword,
      },
      include: {
        team: true,
      },
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update match
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { team: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const isMember = await prisma.teamMember.findFirst({
      where: { teamId: match.teamId, userId: req.user.id },
    });

    if (!isMember && match.team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        team: true,
        players: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update match status
router.patch('/:id/status', authenticate, async (req: any, res) => {
  try {
    const { status } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { team: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        status,
        startedAt: status === 'LIVE' ? new Date() : match.startedAt,
        endedAt: status === 'COMPLETED' ? new Date() : match.endedAt,
      },
    });

    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit match result
router.post('/:id/result', authenticate, async (req: any, res) => {
  try {
    const { result, score, playerStats } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { team: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        result,
        score,
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    // Update player stats if provided
    if (playerStats && Array.isArray(playerStats)) {
      for (const stat of playerStats) {
        await prisma.matchPlayer.upsert({
          where: {
            matchId_userId: {
              matchId: req.params.id,
              userId: stat.userId,
            },
          },
          update: {
            kills: stat.kills,
            deaths: stat.deaths,
            assists: stat.assists,
            damage: stat.damage,
          },
          create: {
            matchId: req.params.id,
            userId: stat.userId,
            kills: stat.kills,
            deaths: stat.deaths,
            assists: stat.assists,
            damage: stat.damage,
          },
        });
      }
    }

    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete match
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { team: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.match.delete({ where: { id: req.params.id } });

    res.json({ message: 'Match deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
