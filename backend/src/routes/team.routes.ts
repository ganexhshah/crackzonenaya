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
router.get(
  '/my-teams',
  authenticate,
  cacheMiddleware(120, (req: any) => `my-teams:${req.user?.id || 'anon'}`),
  async (req: any, res) => {
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
  }
);

// Get team by ID (with 5 minute cache)
router.get('/:id', authenticate, cacheMiddleware(300, 'team'), async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
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

// Get public team info (no auth required)
router.get('/:id/public', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true, gameName: true } },
          },
        },
        _count: {
          select: { members: true, matches: true },
        },
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

// Join team request
router.post('/:id/join', authenticate, async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId: req.user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.teamJoinRequest.findFirst({
      where: {
        teamId: req.params.id,
        userId: req.user.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request for this team' });
    }

    // Create join request
    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        teamId: req.params.id,
        userId: req.user.id,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, username: true, avatar: true, gameName: true, gameId: true } },
      },
    });

    res.status(201).json(joinRequest);
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept team invite (user accepts invitation to join)
router.post('/:id/accept-invite', authenticate, async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ 
      where: { id: req.params.id },
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user has a pending invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId: req.user.id,
        },
      },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'No pending invitation found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId: req.user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    // Add user to team and update invitation status
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: req.params.id,
          userId: req.user.id,
          role: 'MEMBER',
        },
      }),
      prisma.teamInvitation.update({
        where: {
          teamId_userId: {
            teamId: req.params.id,
            userId: req.user.id,
          },
        },
        data: {
          status: 'ACCEPTED',
        },
      }),
    ]);

    // Invalidate cache
    await invalidateCache(`team:*${req.params.id}*`);
    await invalidateCache('teams:*');
    await invalidateCache('my-teams:*');

    // Fetch updated team data
    const updatedTeam = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    res.json({ message: 'Successfully joined the team', team: updatedTeam });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Decline team invite (user declines invitation to join)
router.post('/:id/decline-invite', authenticate, async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Update invitation status to DECLINED
    await prisma.teamInvitation.updateMany({
      where: {
        teamId: req.params.id,
        userId: req.user.id,
        status: 'PENDING',
      },
      data: {
        status: 'DECLINED',
      },
    });

    res.json({ message: 'Invitation declined' });
  } catch (error) {
    console.error('Decline invite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send team invitation (owner only)
router.post('/:id/invite', authenticate, async (req: any, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only team owner can send invitations' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return res.status(400).json({ error: 'Invitation already sent to this user' });
    }

    // Create or update invitation
    const invitation = await prisma.teamInvitation.upsert({
      where: {
        teamId_userId: {
          teamId: req.params.id,
          userId,
        },
      },
      update: {
        status: 'PENDING',
        invitedBy: req.user.id,
      },
      create: {
        teamId: req.params.id,
        userId,
        invitedBy: req.user.id,
        status: 'PENDING',
      },
    });

    // Invalidate cache
    await invalidateCache(`team:${req.params.id}`);
    await invalidateCache('my-teams');

    res.status(201).json({ 
      message: 'Invitation sent successfully',
      invitation,
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team invitations (owner only)
router.get('/:id/invitations', authenticate, async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId: req.params.id },
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

    res.json(invitations);
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's pending invitations
router.get('/invitations/pending', authenticate, async (req: any, res) => {
  try {
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        userId: req.user.id,
        status: 'PENDING',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
            logo: true,
            owner: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invitations);
  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team join requests (owner only)
router.get('/:id/join-requests', authenticate, async (req: any, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const requests = await prisma.teamJoinRequest.findMany({
      where: {
        teamId: req.params.id,
      },
      include: {
        user: { 
          select: { 
            id: true, 
            username: true, 
            email: true,
            avatar: true, 
            gameName: true, 
            gameId: true 
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/reject join request (PUT method with action in body)
router.put('/:id/join-requests/:requestId', authenticate, async (req: any, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'

    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: req.params.requestId },
    });

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (action === 'approve') {
      // Add user to team
      await prisma.teamMember.create({
        data: {
          teamId: req.params.id,
          userId: joinRequest.userId,
          role: 'MEMBER',
        },
      });

      // Update request status
      await prisma.teamJoinRequest.update({
        where: { id: req.params.requestId },
        data: { status: 'APPROVED' },
      });

      res.json({ message: 'Join request approved' });
    } else if (action === 'reject') {
      await prisma.teamJoinRequest.update({
        where: { id: req.params.requestId },
        data: { status: 'REJECTED' },
      });

      res.json({ message: 'Join request rejected' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Join request action error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/reject join request (POST method with action in URL - for frontend compatibility)
router.post('/:id/join-requests/:requestId/:action', authenticate, async (req: any, res) => {
  try {
    const { action } = req.params; // 'approve' or 'reject'

    const team = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: req.params.requestId },
    });

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (action === 'approve') {
      // Add user to team
      await prisma.teamMember.create({
        data: {
          teamId: req.params.id,
          userId: joinRequest.userId,
          role: 'MEMBER',
        },
      });

      // Update request status
      await prisma.teamJoinRequest.update({
        where: { id: req.params.requestId },
        data: { status: 'APPROVED' },
      });

      res.json({ message: 'Join request approved' });
    } else if (action === 'reject') {
      await prisma.teamJoinRequest.update({
        where: { id: req.params.requestId },
        data: { status: 'REJECTED' },
      });

      res.json({ message: 'Join request rejected' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Handle join request error:', error);
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
