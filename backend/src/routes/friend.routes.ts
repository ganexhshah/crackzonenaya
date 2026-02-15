import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// Send friend request
router.post('/request', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { friendId } = req.body;
    const userId = req.user!.id;

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friend exists
    const friend = await prisma.user.findUnique({ where: { id: friendId } });
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request already exists
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'Already friends' });
      }
      if (existing.status === 'PENDING') {
        return res.status(400).json({ error: 'Friend request already sent' });
      }
    }

    const friendRequest = await prisma.friend.create({
      data: {
        userId,
        friendId,
        status: 'PENDING'
      },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            avatar: true,
            gameName: true,
            gameId: true
          }
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: friendId,
        title: 'New Friend Request',
        message: `${req.user!.username} sent you a friend request`,
        type: 'SYSTEM',
        link: `/dashboard/profile/${userId}`
      }
    });

    res.json(friendRequest);
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/accept/:requestId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = req.params.requestId as string;
    const userId = req.user!.id;

    const friendRequest = await prisma.friend.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendRequest.friendId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.friend.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            gameName: true,
            gameId: true
          }
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: friendRequest.userId,
        title: 'Friend Request Accepted',
        message: `${req.user!.username} accepted your friend request`,
        type: 'SYSTEM',
        link: `/dashboard/profile/${userId}`
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.post('/reject/:requestId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = req.params.requestId as string;
    const userId = req.user!.id;

    const friendRequest = await prisma.friend.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendRequest.friendId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.friend.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Remove friend
router.delete('/:friendId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const friendId = req.params.friendId as string;
    const userId = req.user!.id;

    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Get friends list
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            gameName: true,
            gameId: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            avatar: true,
            gameName: true,
            gameId: true
          }
        }
      }
    });

    // Format response to always show the other user
    const formatted = friends.map(f => ({
      id: f.id,
      userId: f.userId === userId ? f.friendId : f.userId,
      friendId: f.userId === userId ? f.friendId : f.userId,
      status: f.status,
      createdAt: f.createdAt,
      friend: f.userId === userId ? f.friend : f.user
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get friend requests
router.get('/requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.friend.findMany({
      where: {
        friendId: userId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            gameName: true,
            gameId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// Check friend status with a user
router.get('/status/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId as string;
    const userId = req.user!.id;

    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId }
        ]
      }
    });

    if (!friendship) {
      return res.json({ status: 'none' });
    }

    if (friendship.status === 'ACCEPTED') {
      return res.json({ status: 'accepted', requestId: friendship.id });
    }

    if (friendship.status === 'PENDING') {
      return res.json({ status: 'pending', requestId: friendship.id });
    }

    res.json({ status: 'none' });
  } catch (error) {
    console.error('Check friend status error:', error);
    res.status(500).json({ error: 'Failed to check friend status' });
  }
});

export default router;
