import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../utils/cloudinary';
import { createRateLimit } from '../middleware/rateLimit';
import { sendEmail } from '../config/email';
import {
  ticketCreatedAdminEmail,
  ticketCreatedUserEmail,
  ticketMessageEmail,
  ticketStatusChangedEmail,
} from '../utils/supportEmails';

const router = Router();
const contactLimiter = createRateLimit(10, 15 * 60 * 1000);
const supportLimiter = createRateLimit(15, 15 * 60 * 1000);

const getSupportAdminEmail = () => {
  const configured = (process.env.SUPPORT_ADMIN_EMAIL || '').trim();
  if (configured) return configured;
  return (process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim();
};

// Get all FAQs
router.get('/faqs', async (req, res) => {
  try {
    const { category } = req.query;

    const faqs = await prisma.fAQ.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as any }),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(faqs);
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit contact form
router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        userId: (req as any).user?.id,
      },
    });

    // TODO: Send email notification to admin

    res.status(201).json({ message: 'Message sent successfully', id: contactMessage.id });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create support ticket
router.post('/tickets', authenticate, supportLimiter, upload.array('attachments', 5), async (req: any, res) => {
  try {
    const { category, subject, description, priority } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Category, subject, and description are required' });
    }

    // Upload attachments to Cloudinary
    const attachments: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'support-tickets');
        attachments.push(url);
      }
    }

    // Generate non-predictable unique ticket number
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: req.user.id,
        category,
        subject,
        description,
        priority: priority || 'MEDIUM',
        attachments,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });

    // Email notifications (best-effort)
    try {
      const adminEmail = getSupportAdminEmail();
      if (ticket.user?.email) {
        await sendEmail(
          ticket.user.email,
          `Ticket Submitted: ${ticket.ticketNumber}`,
          ticketCreatedUserEmail({
            username: ticket.user.username,
            ticket: {
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
            },
          })
        );
      }

      if (adminEmail) {
        await sendEmail(
          adminEmail,
          `New Support Ticket: ${ticket.ticketNumber}`,
          ticketCreatedAdminEmail({
            ticket: {
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
            },
            username: ticket.user?.username,
            email: ticket.user?.email,
          })
        );
      }
    } catch (emailErr) {
      console.warn('Ticket create email failed:', emailErr);
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's tickets
router.get('/tickets', authenticate, async (req: any, res) => {
  try {
    const { status } = req.query;

    const tickets = await prisma.supportTicket.findMany({
      where: {
        userId: req.user.id,
        ...(status && { status: status as any }),
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single ticket with messages
router.get('/tickets/:id', authenticate, async (req: any, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        assignedTo: {
          select: { id: true, username: true, avatar: true },
        },
        messages: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user owns the ticket or is admin
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add message to ticket
router.post('/tickets/:id/messages', authenticate, upload.array('attachments', 3), async (req: any, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user owns the ticket or is admin
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Upload attachments
    const attachments: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'ticket-messages');
        attachments.push(url);
      }
    }

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: req.params.id,
        userId: req.user.id,
        message,
        attachments,
        isStaffReply: req.user.role === 'ADMIN',
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true, role: true },
        },
      },
    });

    // Update ticket status
    if (ticket.status === 'WAITING_USER' && req.user.id === ticket.userId) {
      await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: { status: 'IN_PROGRESS' },
      });
    } else if (req.user.role === 'ADMIN' && ticket.status === 'OPEN') {
      await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Email notifications (best-effort)
    try {
      const adminEmail = getSupportAdminEmail();
      const fullTicket = await prisma.supportTicket.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      });

      if (fullTicket) {
        const ticketLike = {
          id: fullTicket.id,
          ticketNumber: fullTicket.ticketNumber,
          subject: fullTicket.subject,
          category: fullTicket.category,
          priority: fullTicket.priority,
          status: fullTicket.status,
        };

        if (req.user.role === 'ADMIN') {
          // Admin replied -> notify user
          if (fullTicket.user?.email) {
            await sendEmail(
              fullTicket.user.email,
              `Support Reply: ${fullTicket.ticketNumber}`,
              ticketMessageEmail({
                toRole: 'USER',
                ticket: ticketLike,
                fromName: req.user.username || 'Support',
                message,
              })
            );
          }
        } else {
          // User replied -> notify admins
          if (adminEmail) {
            await sendEmail(
              adminEmail,
              `User Reply: ${fullTicket.ticketNumber}`,
              ticketMessageEmail({
                toRole: 'ADMIN',
                ticket: ticketLike,
                fromName: req.user.username || 'User',
                message,
              })
            );
          }
        }
      }
    } catch (emailErr) {
      console.warn('Ticket message email failed:', emailErr);
    }

    res.status(201).json(ticketMessage);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create report
router.post('/reports', authenticate, supportLimiter, upload.array('evidence', 5), async (req: any, res) => {
  try {
    const { type, reportedUserId, reason, description, matchId } = req.body;

    if (!type || !reason || !description) {
      return res.status(400).json({ error: 'Type, reason, and description are required' });
    }

    // Upload evidence
    const evidence: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'reports');
        evidence.push(url);
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        reportedUserId,
        type,
        reason,
        description,
        matchId,
        evidence,
      },
      include: {
        reporter: {
          select: { id: true, username: true, avatar: true },
        },
        reportedUser: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // TODO: Send notification to admins

    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's reports
router.get('/reports', authenticate, async (req: any, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: req.user.id },
      include: {
        reportedUser: {
          select: { id: true, username: true, avatar: true },
        },
        reviewedBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all tickets
router.get('/admin/tickets', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, category, priority } = req.query;

    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(category && { category: category as any }),
        ...(priority && { priority: priority as any }),
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        assignedTo: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Update ticket
router.put('/admin/tickets/:id', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, priority, assignedToId } = req.body;

    const before = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        assignedTo: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // Email notifications (best-effort): status changes
    try {
      if (before?.user?.email && before.status !== ticket.status) {
        await sendEmail(
          before.user.email,
          `Ticket Status Updated: ${ticket.ticketNumber}`,
          ticketStatusChangedEmail({
            username: before.user.username,
            oldStatus: before.status,
            newStatus: ticket.status,
            ticket: {
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
            },
          })
        );
      }
    } catch (emailErr) {
      console.warn('Ticket status email failed:', emailErr);
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all reports
router.get('/admin/reports', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, type } = req.query;

    const reports = await prisma.report.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(type && { type: type as any }),
      },
      include: {
        reporter: {
          select: { id: true, username: true, avatar: true },
        },
        reportedUser: {
          select: { id: true, username: true, avatar: true },
        },
        reviewedBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Update report
router.put('/admin/reports/:id', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, reviewNotes } = req.body;

    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewNotes,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
      },
      include: {
        reporter: {
          select: { id: true, username: true, avatar: true },
        },
        reportedUser: {
          select: { id: true, username: true, avatar: true },
        },
        reviewedBy: {
          select: { id: true, username: true },
        },
      },
    });

    res.json(report);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get support dashboard stats
router.get('/admin/stats', authenticate, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      tickets: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
