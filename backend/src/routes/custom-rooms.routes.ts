import { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../utils/cloudinary';
import { createRateLimit } from '../middleware/rateLimit';

const router = Router();
const prisma = new PrismaClient();
const limiter = createRateLimit(20, 10 * 60 * 1000);

const ODDS_DEFAULT = 1.8;

function computePayout(entryFee: number, odds: number) {
  // payout the winner gets back from the pot (keeps platform fee inside pot)
  return Number((entryFee * odds).toFixed(2));
}

// Create custom room (creator stakes entry fee immediately if > 0)
router.post('/', authenticate, limiter, async (req: any, res) => {
  try {
    const {
      type,
      teamSize,
      rounds,
      throwableLimit,
      characterSkill,
      headshotOnly,
      gunAttributes,
      coinSetting,
      roomMaker,
      entryFee,
    } = req.body;

    const parsedEntryFee = Number(entryFee || 0);
    if (!Number.isFinite(parsedEntryFee) || parsedEntryFee < 0) {
      return res.status(400).json({ error: 'Invalid entry fee' });
    }

    const parsedRounds = Number(rounds);
    if (!Number.isFinite(parsedRounds) || ![7, 9, 13].includes(parsedRounds)) {
      return res.status(400).json({ error: 'Invalid rounds' });
    }

    const payout = computePayout(parsedEntryFee, ODDS_DEFAULT);

    const room = await prisma.$transaction(
      async (tx) => {
        // Deduct stake from creator if needed
        if (parsedEntryFee > 0) {
          const updated = await tx.user.updateMany({
            where: { id: req.user.id, balance: { gte: parsedEntryFee } },
            data: { balance: { decrement: parsedEntryFee } },
          });
          if (updated.count !== 1) throw new Error('INSUFFICIENT_BALANCE');
        }

        const created = await tx.customRoom.create({
          data: {
            type,
            status: 'WAITING_JOIN',
            creatorId: req.user.id,
            teamSize,
            rounds: parsedRounds,
            throwableLimit: !!throwableLimit,
            characterSkill: !!characterSkill,
            headshotOnly: !!headshotOnly,
            gunAttributes: !!gunAttributes,
            coinSetting: Number(coinSetting || 0) || 0,
            roomMaker: String(roomMaker || 'ME').toUpperCase() === 'OPPONENT' ? 'OPPONENT' : 'ME',
            entryFee: parsedEntryFee,
            odds: ODDS_DEFAULT,
            payout,
          },
          include: {
            creator: { select: { id: true, username: true, email: true, gameId: true, gameName: true } as any },
            opponent: { select: { id: true, username: true, email: true, gameId: true, gameName: true } as any },
          },
        });

        if (parsedEntryFee > 0) {
          await tx.transaction.create({
            data: {
              userId: req.user.id,
              type: 'CUSTOM_MATCH_STAKE',
              amount: parsedEntryFee,
              status: 'COMPLETED',
              reference: `customroom:${created.id}:stake:${req.user.id}`,
              description: `Custom room stake (${created.id})`,
            },
          });
        }

        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    res.status(201).json(room);
  } catch (e: any) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    console.error('Create custom room error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// List my rooms (created or joined)
router.get('/my', authenticate, async (req: any, res) => {
  try {
    const rooms = await prisma.customRoom.findMany({
      where: {
        OR: [{ creatorId: req.user.id }, { opponentId: req.user.id }],
      },
      include: {
        creator: { select: { id: true, username: true, gameId: true, gameName: true } as any },
        opponent: { select: { id: true, username: true, gameId: true, gameName: true } as any },
        reports: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(rooms);
  } catch (e) {
    console.error('List my rooms error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// List open rooms to join (public to authenticated users)
router.get('/open', authenticate, async (req: any, res) => {
  try {
    const rooms = await prisma.customRoom.findMany({
      where: {
        status: 'WAITING_JOIN',
        opponentId: null,
        creatorId: { not: req.user.id },
      },
      include: {
        creator: { select: { id: true, username: true, gameId: true, gameName: true } as any },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(rooms);
  } catch (e) {
    console.error('List open rooms error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a room (opponent stakes entry fee)
router.post('/:id/join', authenticate, limiter, async (req: any, res) => {
  try {
    const roomId = req.params.id;
    const room = await prisma.customRoom.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.creatorId === req.user.id) return res.status(400).json({ error: 'You cannot join your own room' });
    if (room.opponentId) return res.status(400).json({ error: 'Room already has an opponent' });
    if (room.status !== 'WAITING_JOIN' && room.status !== 'OPEN') return res.status(400).json({ error: 'Room not open' });

    const updated = await prisma.$transaction(
      async (tx) => {
        // lock by updating opponentId only if null
        if (room.entryFee > 0) {
          const dec = await tx.user.updateMany({
            where: { id: req.user.id, balance: { gte: room.entryFee } },
            data: { balance: { decrement: room.entryFee } },
          });
          if (dec.count !== 1) throw new Error('INSUFFICIENT_BALANCE');
        }

        const r = await tx.customRoom.update({
          where: { id: roomId },
          data: {
            opponentId: req.user.id,
            status: 'READY_TO_START',
          },
          include: {
            creator: { select: { id: true, username: true, gameId: true, gameName: true } as any },
            opponent: { select: { id: true, username: true, gameId: true, gameName: true } as any },
          },
        });

        if (room.entryFee > 0) {
          await tx.transaction.create({
            data: {
              userId: req.user.id,
              type: 'CUSTOM_MATCH_STAKE',
              amount: room.entryFee,
              status: 'COMPLETED',
              reference: `customroom:${roomId}:stake:${req.user.id}`,
              description: `Custom room stake (${roomId})`,
            },
          });
        }

        return r;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    res.json(updated);
  } catch (e: any) {
    if (e instanceof Error && e.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    console.error('Join room error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Both sides must confirm start
router.post('/:id/ready', authenticate, limiter, async (req: any, res) => {
  try {
    const roomId = req.params.id;
    const room = await prisma.customRoom.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (![room.creatorId, room.opponentId].includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!room.opponentId) return res.status(400).json({ error: 'Opponent not joined yet' });
    if (room.status !== 'READY_TO_START' && room.status !== 'STARTED') {
      return res.status(400).json({ error: 'Room not ready to start' });
    }

    const patch =
      req.user.id === room.creatorId ? { creatorReady: true } : { opponentReady: true };

    const updated = await prisma.customRoom.update({
      where: { id: roomId },
      data: patch,
    });

    // If both ready, mark started
    if (updated.creatorReady && updated.opponentReady && updated.status !== 'STARTED') {
      const started = await prisma.customRoom.update({
        where: { id: roomId },
        data: { status: 'STARTED' },
      });
      return res.json(started);
    }

    res.json(updated);
  } catch (e) {
    console.error('Ready error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set room id/password (only room maker side)
router.post('/:id/room', authenticate, limiter, async (req: any, res) => {
  try {
    const { roomId, roomPassword } = req.body;
    const id = req.params.id;
    const room = await prisma.customRoom.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'STARTED') return res.status(400).json({ error: 'Room not started yet' });

    const makerIsCreator = room.roomMaker === 'ME';
    const can =
      (makerIsCreator && req.user.id === room.creatorId) ||
      (!makerIsCreator && req.user.id === room.opponentId);
    if (!can) return res.status(403).json({ error: 'Only room maker can set room details' });

    const updated = await prisma.customRoom.update({
      where: { id },
      data: {
        roomId: String(roomId || '').slice(0, 60) || null,
        roomPassword: String(roomPassword || '').slice(0, 60) || null,
      },
    });
    res.json(updated);
  } catch (e) {
    console.error('Set room error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit result (only room maker uploads screenshot and selects winner side)
router.post('/:id/result', authenticate, limiter, upload.single('screenshot'), async (req: any, res) => {
  try {
    const id = req.params.id;
    const { winnerSide } = req.body;
    const room = await prisma.customRoom.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'STARTED') return res.status(400).json({ error: 'Room not started' });

    const makerIsCreator = room.roomMaker === 'ME';
    const can =
      (makerIsCreator && req.user.id === room.creatorId) ||
      (!makerIsCreator && req.user.id === room.opponentId);
    if (!can) return res.status(403).json({ error: 'Only room maker can submit result' });

    if (!req.file) return res.status(400).json({ error: 'Screenshot is required' });
    if (winnerSide !== 'CREATOR' && winnerSide !== 'OPPONENT') {
      return res.status(400).json({ error: 'Invalid winner side' });
    }

    const url = await uploadToCloudinary(req.file.buffer, 'custom-room-results');

    const updated = await prisma.customRoom.update({
      where: { id },
      data: {
        status: 'UNDER_REVIEW',
        resultScreenshotUrl: url,
        winnerSide,
      },
      include: {
        creator: { select: { id: true, username: true, email: true } },
        opponent: { select: { id: true, username: true, email: true } },
      },
    });
    res.json(updated);
  } catch (e) {
    console.error('Submit result error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Report room (either side)
router.post('/:id/report', authenticate, limiter, upload.array('evidence', 5), async (req: any, res) => {
  try {
    const id = req.params.id;
    const { reason, description } = req.body;
    const room = await prisma.customRoom.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (![room.creatorId, room.opponentId].includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!reason || !description) return res.status(400).json({ error: 'Reason and description required' });

    const evidence: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToCloudinary((file as any).buffer, 'custom-room-reports');
        evidence.push(url);
      }
    }

    const report = await prisma.customRoomReport.create({
      data: {
        roomId: id,
        reporterId: req.user.id,
        reason: String(reason).slice(0, 200),
        description: String(description).slice(0, 2000),
        evidence,
      },
    });
    res.status(201).json(report);
  } catch (e) {
    console.error('Report error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list rooms under review
router.get('/admin/review', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    const rooms = await prisma.customRoom.findMany({
      where: { status: { in: ['UNDER_REVIEW'] } },
      include: {
        creator: { select: { id: true, username: true, email: true } },
        opponent: { select: { id: true, username: true, email: true } },
        reports: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    res.json(rooms);
  } catch (e) {
    console.error('Admin review list error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: resolve and payout
router.post('/admin/:id/resolve', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    const id = req.params.id;
    const { winnerSide } = req.body;
    if (winnerSide !== 'CREATOR' && winnerSide !== 'OPPONENT') {
      return res.status(400).json({ error: 'Invalid winner side' });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const room = await tx.customRoom.findUnique({ where: { id } });
        if (!room) throw new Error('NOT_FOUND');
        if (room.status !== 'UNDER_REVIEW') throw new Error('BAD_STATUS');
        if (!room.opponentId) throw new Error('NO_OPPONENT');

        const winnerId = winnerSide === 'CREATOR' ? room.creatorId : room.opponentId;
        const payout = room.payout;
        if (payout > 0) {
          await tx.user.update({
            where: { id: winnerId },
            data: { balance: { increment: payout } },
          });
          await tx.transaction.create({
            data: {
              userId: winnerId,
              type: 'CUSTOM_MATCH_PAYOUT',
              amount: payout,
              status: 'COMPLETED',
              reference: `customroom:${room.id}:payout:${winnerId}`,
              description: `Custom room payout (${room.id})`,
            },
          });
        }

        return tx.customRoom.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            winnerSide,
            resolvedAt: new Date(),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    res.json(result);
  } catch (e: any) {
    if (e instanceof Error && e.message === 'NOT_FOUND') return res.status(404).json({ error: 'Room not found' });
    if (e instanceof Error && e.message === 'BAD_STATUS') return res.status(400).json({ error: 'Room not under review' });
    console.error('Resolve error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
