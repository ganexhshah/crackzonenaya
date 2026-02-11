import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = Router();

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
        email: true,
        avatar: true,
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

// Update profile
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const { gameName, gameId, avatar, gameUsername, rank, bio, phone, country, discordId } = req.body;

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
    if (gameUsername || rank || bio || phone || country || discordId) {
      await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { gameUsername, rank, bio, phone, country, discordId },
        create: {
          userId: req.user.id,
          gameUsername,
          rank,
          bio,
          phone,
          country,
          discordId,
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
