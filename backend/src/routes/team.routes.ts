import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../utils/cloudinary';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

const router = Router();

// Get all teams (with 5 minute cache)
router.get('/', authenticate, cacheMiddleware(300, 'teams'), async (req: any, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's teams (with 2 minute cache)
router.get('/my-teams', authenticate, cacheMiddleware(120, 'my-teams'), async (req: any, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team by ID (with 5 minute cache)
router.get('/:id', authenticate, cacheMiddleware(300, 'team'), async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true, avatar: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true, email: true } },
          },
        },
        matches: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create team
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { name, tag, description } = req.body;

    const existingTag = await prisma.team.findUnique({ where: { tag } });
    if (existingTag) {
      return res.status(400).json({ error: 'Team tag already exists' });
    }

    const team = await prisma.team.create({
      data: {
        name,
        tag,
        description,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    // Invalidate teams cache
    await invalidateCache('teams:*');
    await invalidateCache('my-teams:*');

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const { name, description } = req.body;

    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: req.params.id },
      data: { name, description },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    // Invalidate cache for this team and lists
    await invalidateCache(`team:*${req.params.id}*`);
    await invalidateCache('teams:*');
    await invalidateCache('my-teams:*');

    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload team logo
router.post('/:id/logo', authenticate, upload.single('logo'), async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoUrl = await uploadToCloudinary(req.file.buffer, 'team-logos');

    const updatedTeam = await prisma.team.update({
      where: { id: req.params.id },
      data: { logo: logoUrl },
    });

    res.json({ logo: updatedTeam.logo });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add team member
router.post('/:id/members', authenticate, async (req: any, res) => {
  try {
    const { userId } = req.body;

    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User already in team' });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: req.params.id,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove team member
router.delete('/:id/members/:userId', authenticate, async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId: req.params.userId,
        },
      },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete team
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.team.delete({ where: { id: req.params.id } });

    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
