import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = Router();

// Get all users (for team invitations)
router.get('/all', authenticate, async (req: any, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.user.id, // Exclude current user
        },
      },
      select: {
        id: true,
        username: true,
        gameName: true,
        gameId: true,
        avatar: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users by email or username
router.get('/search', authenticate, async (req: any, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    if (query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { gameName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        gameName: true,
        gameId: true,
        avatar: true,
      },
      take: 10,
    });

    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile (current user)
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get wallet balance
router.get('/wallet', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { balance: true },
    });

    // Get pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        status: 'PENDING',
        type: 'DEPOSIT',
      },
    });

    const pendingAmount = pendingTransactions.reduce((sum, txn) => sum + txn.amount, 0);

    res.json({
      balance: user?.balance || 0,
      pendingAmount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (public profile) - MUST come after specific routes
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        avatar: true,
        gameName: true,
        gameId: true,
        role: true,
        createdAt: true,
        profile: true,
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                tag: true,
                logo: true,
                _count: {
                  select: { members: true }
                }
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate user stats (you can expand this based on your needs)
    const stats = {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      points: 0,
    };

    res.json({
      ...user,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update specific user's profile (only if it's the current user)
router.put('/:id/profile', authenticate, async (req: any, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user is updating their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { gameName, gameId, avatar, gameUsername, rank, bio, phone, country, discordId, instagramHandle } = req.body;

    // Update user table fields (gameName, gameId, avatar)
    const updateUserData: any = {};
    if (gameName !== undefined) updateUserData.gameName = gameName;
    if (gameId !== undefined) updateUserData.gameId = gameId;
    if (avatar !== undefined) updateUserData.avatar = avatar;

    if (Object.keys(updateUserData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateUserData,
      });
    }

    // Update profile table fields if provided
    const profileData: any = {};
    if (gameUsername !== undefined) profileData.gameUsername = gameUsername;
    if (rank !== undefined) profileData.rank = rank;
    if (bio !== undefined) profileData.bio = bio;
    if (phone !== undefined) profileData.phone = phone;
    if (country !== undefined) profileData.country = country;
    if (discordId !== undefined) profileData.discordId = discordId;
    if (instagramHandle !== undefined) profileData.instagramHandle = instagramHandle;

    if (Object.keys(profileData).length > 0) {
      await prisma.profile.upsert({
        where: { userId },
        update: profileData,
        create: {
          userId,
          ...profileData,
        },
      });
    }

    // Return updated user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const { gameName, gameId, avatar, gameUsername, rank, bio, phone, country, discordId, instagramHandle } = req.body;

    // Update user table fields (gameName, gameId, avatar)
    const updateUserData: any = {};
    if (gameName !== undefined) updateUserData.gameName = gameName;
    if (gameId !== undefined) updateUserData.gameId = gameId;
    if (avatar !== undefined) updateUserData.avatar = avatar;

    if (Object.keys(updateUserData).length > 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: updateUserData,
      });
    }

    // Update profile table fields if provided
    if (gameUsername || rank || bio || phone || country || discordId || instagramHandle) {
      await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { gameUsername, rank, bio, phone, country, discordId, instagramHandle },
        create: {
          userId: req.user.id,
          gameUsername,
          rank,
          bio,
          phone,
          country,
          discordId,
          instagramHandle,
        },
      });
    }

    // Return updated user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars');

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
    });

    res.json({ url: user.avatar, avatar: user.avatar });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload route for profile setup (alias for avatar)
router.post('/upload/avatar', authenticate, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars');

    res.json({ url: avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
