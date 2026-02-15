import { Router } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendEmail } from '../config/email';
import { createNotification } from './notification.routes';

const router = Router();

router.use(authenticate);

// Create a transaction report
router.post('/', async (req: any, res) => {
  try {
    const { transactionId, issueType, description } = req.body;

    if (!transactionId || !issueType || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const report = await prisma.transactionReport.create({
      data: {
        transactionId,
        userId: req.user.id,
        issueType,
        description,
      },
      include: {
        transaction: true,
      },
    });

    // Send email notification to user
    const issueTypeFormatted = issueType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    
    sendEmail(
      transaction.user.email,
      'Transaction Issue Report Received',
      `
        <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="background:#1e40af;padding:16px 20px;">
              <h2 style="margin:0;font-size:18px;color:#ffffff;">
                Issue Report Received
              </h2>
            </div>
            <div style="padding:20px;">
              <p style="margin:0 0 12px;color:#4b5563;">
                Hi ${transaction.user.username},
              </p>
              <p style="margin:0 0 12px;color:#4b5563;">
                We've received your transaction issue report and our team will review it shortly.
              </p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin:16px 0;">
                <p style="margin:0 0 8px;"><strong>Issue Type:</strong> ${issueTypeFormatted}</p>
                <p style="margin:0 0 8px;"><strong>Transaction ID:</strong> ${transaction.reference || transaction.id}</p>
                <p style="margin:0 0 8px;"><strong>Amount:</strong> रु ${Math.abs(transaction.amount)}</p>
                <p style="margin:0;"><strong>Description:</strong> ${description}</p>
              </div>
              <p style="margin:16px 0 0;color:#111827;">
                We'll investigate this issue and get back to you within 24 hours via email.
              </p>
              <p style="margin:12px 0 0;color:#6b7280;font-size:14px;">
                You can check the status of your report in your wallet's Report History.
              </p>
            </div>
          </div>
        </div>
      `
    ).catch((emailError) => {
      console.error('Report confirmation email failed (non-critical):', emailError?.message || emailError);
    });

    // Create notification for report submission
    createNotification(
      req.user.id,
      'Issue Report Submitted',
      `Your transaction issue report has been submitted. We'll review it within 24 hours.`,
      'WALLET',
      '/dashboard/reports'
    ).catch((notifError) => {
      console.error('Report submission notification failed (non-critical):', notifError);
    });

    res.json(report);
  } catch (error) {
    console.error('Create transaction report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's transaction reports
router.get('/my-reports', async (req: any, res) => {
  try {
    const reports = await prisma.transactionReport.findMany({
      where: { userId: req.user.id },
      include: {
        transaction: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single report
router.get('/:id', async (req: any, res) => {
  try {
    const report = await prisma.transactionReport.findUnique({
      where: { id: req.params.id },
      include: {
        transaction: true,
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel/Close a pending report
router.patch('/:id/cancel', async (req: any, res) => {
  try {
    const report = await prisma.transactionReport.findUnique({
      where: { id: req.params.id },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (report.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending reports can be cancelled' });
    }

    const updatedReport = await prisma.transactionReport.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        adminRemark: 'Cancelled by user',
        resolvedAt: new Date(),
      },
      include: {
        transaction: true,
      },
    });

    res.json(updatedReport);
  } catch (error) {
    console.error('Cancel report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
