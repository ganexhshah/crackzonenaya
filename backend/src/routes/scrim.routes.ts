import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// Public scrims (published + upcoming/live)
router.get('/public', async (req, res) => {
  try {
    const scrims = await prisma.match.findMany({
      where: {
        matchType: 'SCRIM',
        status: {
          in: ['SCHEDULED', 'LIVE'],
        },
      },
      include: {
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    const publishedScrims = scrims.filter((scrim: any) => {
      const visibility = scrim?.scrimConfig?.scrimStatusControls?.visibilityStatus;
      return visibility === 'PUBLISHED';
    });

    const sanitized = publishedScrims.map((scrim: any) => ({
      id: scrim.id,
      title: scrim.title,
      description: scrim.description,
      opponentName: scrim.opponentName,
      status: scrim.status,
      scheduledAt: scrim.scheduledAt,
      matchType: scrim.matchType,
      scrimConfig: scrim.scrimConfig,
      createdAt: scrim.createdAt,
      updatedAt: scrim.updatedAt,
      _count: scrim._count,
    }));

    res.json(sanitized);
  } catch (error: any) {
    console.error('Get public scrims error:', error);
    res.status(500).json({ message: 'Failed to fetch public scrims' });
  }
});

// Get all scrims (admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, search } = req.query;

    const where: any = {
      matchType: 'SCRIM',
    };

    if (status && status !== 'all') {
      where.status = status.toString().toUpperCase();
    }

    if (search) {
      where.title = {
        contains: search.toString(),
        mode: 'insensitive',
      };
    }

    const scrims = await prisma.match.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        players: {
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
            players: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    res.json(scrims);
  } catch (error: any) {
    console.error('Get scrims error:', error);
    res.status(500).json({ message: 'Failed to fetch scrims' });
  }
});

// Get single scrim (public - for users)
router.get('/:id/public', async (req, res) => {
  try {
    const id = req.params.id as string;

    const scrim = await prisma.match.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
            logo: true,
          },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!scrim) {
      return res.status(404).json({ message: 'Scrim not found' });
    }

    // Check if scrim is published
    const visibility = (scrim as any)?.scrimConfig?.scrimStatusControls?.visibilityStatus;
    if (visibility !== 'PUBLISHED') {
      return res.status(403).json({ message: 'This scrim is not publicly available' });
    }

    // Sanitize response - don't expose sensitive data
    const sanitized = {
      id: scrim.id,
      title: scrim.title,
      description: scrim.description,
      opponentName: scrim.opponentName,
      status: scrim.status,
      scheduledAt: scrim.scheduledAt,
      matchType: scrim.matchType,
      scrimConfig: scrim.scrimConfig,
      createdAt: scrim.createdAt,
      updatedAt: scrim.updatedAt,
      _count: scrim._count,
      // Only show room details if scrim is LIVE
      ...(scrim.status === 'LIVE' && {
        roomId: scrim.roomId,
        roomPassword: scrim.roomPassword,
      }),
    };

    res.json(sanitized);
  } catch (error: any) {
    console.error('Get public scrim error:', error);
    res.status(500).json({ message: 'Failed to fetch scrim' });
  }
});

// Get single scrim (admin)
router.get('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = req.params.id as string;

    const scrim = await prisma.match.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
            logo: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!scrim) {
      return res.status(404).json({ message: 'Scrim not found' });
    }

    res.json(scrim);
  } catch (error: any) {
    console.error('Get scrim error:', error);
    res.status(500).json({ message: 'Failed to fetch scrim' });
  }
});

// Create scrim
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const {
      title,
      description,
      teamId,
      opponentName,
      scheduledAt,
      roomId,
      roomPassword,
      status = 'SCHEDULED',
      scrimConfig,
    } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const scrim = await prisma.match.create({
      data: {
        title,
        description,
        teamId,
        opponentName: opponentName || 'TBD',
        matchType: 'SCRIM',
        status: status.toUpperCase(),
        scheduledAt: new Date(scheduledAt),
        roomId,
        roomPassword,
        scrimConfig,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
      },
    });

    res.status(201).json(scrim);
  } catch (error: any) {
    console.error('Create scrim error:', error);
    res.status(500).json({ message: 'Failed to create scrim' });
  }
});

// Update scrim
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const {
      title,
      description,
      opponentName,
      scheduledAt,
      roomId,
      roomPassword,
      status,
      result,
      score,
      scrimConfig,
    } = req.body;

    const updateData: any = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (opponentName) updateData.opponentName = opponentName;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (roomId !== undefined) updateData.roomId = roomId;
    if (roomPassword !== undefined) updateData.roomPassword = roomPassword;
    if (status) updateData.status = status.toUpperCase();
    if (result !== undefined) updateData.result = result;
    if (score !== undefined) updateData.score = score;
    if (scrimConfig !== undefined) updateData.scrimConfig = scrimConfig;

    if (status === 'LIVE' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'COMPLETED' && !updateData.endedAt) {
      updateData.endedAt = new Date();
    }

    const scrim = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
      },
    });

    res.json(scrim);
  } catch (error: any) {
    console.error('Update scrim error:', error);
    res.status(500).json({ message: 'Failed to update scrim' });
  }
});

// Delete scrim
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = req.params.id as string;

    await prisma.match.delete({
      where: { id },
    });

    res.json({ message: 'Scrim deleted successfully' });
  } catch (error: any) {
    console.error('Delete scrim error:', error);
    res.status(500).json({ message: 'Failed to delete scrim' });
  }
});

// Update room details
router.put('/:id/room', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { roomId, roomPassword } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'Room ID is required' });
    }

    const scrim = await prisma.match.update({
      where: { id },
      data: {
        roomId,
        roomPassword,
      },
    });

    res.json(scrim);
  } catch (error: any) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Failed to update room details' });
  }
});

// Add player to scrim
router.post('/:id/players', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const player = await prisma.matchPlayer.create({
      data: {
        matchId: id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(player);
  } catch (error: any) {
    console.error('Add player error:', error);
    res.status(500).json({ message: 'Failed to add player' });
  }
});

// Update player stats
router.put('/:id/players/:playerId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const playerId = req.params.playerId as string;
    const { kills, deaths, assists, damage } = req.body;

    const updateData: any = {};
    if (kills !== undefined) updateData.kills = parseInt(kills);
    if (deaths !== undefined) updateData.deaths = parseInt(deaths);
    if (assists !== undefined) updateData.assists = parseInt(assists);
    if (damage !== undefined) updateData.damage = parseInt(damage);

    const player = await prisma.matchPlayer.update({
      where: { id: playerId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    res.json(player);
  } catch (error: any) {
    console.error('Update player stats error:', error);
    res.status(500).json({ message: 'Failed to update player stats' });
  }
});

export default router;
