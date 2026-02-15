import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// Send message
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user!.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message',
        message: `${req.user!.username} sent you a message`,
        type: 'SYSTEM',
        link: `/dashboard/messages`
      }
    });

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversations
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversationsMap.has(partnerId)) {
        const partner = message.senderId === userId ? message.receiver : message.sender;
        
        // Count unread messages from this partner
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partnerId,
            receiverId: userId,
            read: false
          }
        });

        conversationsMap.set(partnerId, {
          userId: partnerId,
          user: partner,
          lastMessage: message,
          unreadCount
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages with a specific user
router.get('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const otherUserId = req.params.userId as string;
    const userId = req.user!.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Mark messages from other user as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Mark message as read
router.put('/:messageId/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const userId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { read: true }
    });

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Mark all messages in conversation as read
router.put('/conversation/:userId/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const otherUserId = req.params.userId as string;
    const userId = req.user!.id;

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// Delete message
router.delete('/:messageId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const userId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
