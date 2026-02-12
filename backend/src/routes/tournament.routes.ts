import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        registrations: {
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
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create tournament (Admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const {
      name,
      description,
      prizePool,
      entryFee,
      maxTeams,
      format,
      rules,
      registrationStart,
      registrationEnd,
      startDate,
    } = req.body;

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        prizePool,
        entryFee,
        maxTeams,
        format,
        rules,
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        startDate: new Date(startDate),
      },
    });

    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update tournament (Admin only)
router.put('/:id', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload tournament banner (Admin only)
router.post('/:id/banner', authenticate, authorize('ADMIN'), upload.single('banner'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bannerUrl = await uploadToCloudinary(req.file.buffer, 'tournament-banners');

    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: { banner: bannerUrl },
    });

    res.json({ banner: tournament.banner });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register for tournament
router.post('/:id/register', authenticate, async (req: any, res) => {
  try {
    const { teamId } = req.body;

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

    const registration = await prisma.$transaction(
      async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id: req.params.id },
          include: { _count: { select: { registrations: true } } },
        });
        if (!tournament) {
          throw new Error('TOURNAMENT_NOT_FOUND');
        }
        if (tournament.status !== 'REGISTRATION_OPEN') {
          throw new Error('REGISTRATION_CLOSED');
        }
        if (tournament._count.registrations >= tournament.maxTeams) {
          throw new Error('TOURNAMENT_FULL');
        }

        const existingRegistration = await tx.tournamentRegistration.findUnique({
          where: {
            tournamentId_teamId: {
              tournamentId: req.params.id,
              teamId,
            },
          },
        });
        if (existingRegistration) {
          throw new Error('ALREADY_REGISTERED');
        }

        return tx.tournamentRegistration.create({
          data: {
            tournamentId: req.params.id,
            teamId,
            userId: req.user.id,
            paymentStatus: tournament.entryFee > 0 ? 'PENDING' : 'COMPLETED',
          },
          include: {
            team: true,
            tournament: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    res.status(201).json(registration);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TOURNAMENT_NOT_FOUND') return res.status(404).json({ error: 'Tournament not found' });
      if (error.message === 'REGISTRATION_CLOSED') return res.status(400).json({ error: 'Registration is not open' });
      if (error.message === 'TOURNAMENT_FULL') return res.status(400).json({ error: 'Tournament is full' });
      if (error.message === 'ALREADY_REGISTERED') return res.status(400).json({ error: 'Team already registered' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's tournament registrations
router.get('/my-registrations', authenticate, async (req: any, res) => {
  try {
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { userId: req.user.id },
      include: {
        tournament: true,
        team: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update registration status (Admin only)
router.patch('/:id/registrations/:registrationId', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    const { status } = req.body;

    const registration = await prisma.tournamentRegistration.update({
      where: { id: req.params.registrationId },
      data: { status },
    });

    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete tournament (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: any, res) => {
  try {
    await prisma.tournament.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tournament deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
