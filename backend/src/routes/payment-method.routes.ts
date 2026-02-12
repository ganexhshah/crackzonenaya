import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import cloudinary from '../config/cloudinary';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Middleware to check admin role
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Get all payment methods (public - for users)
router.get('/active', async (req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(methods);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all payment methods (admin)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(methods);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create payment method with QR code upload
router.post('/', authenticate, isAdmin, upload.single('qrCode'), async (req, res) => {
  try {
    const { name, type, accountNumber, accountName, upiId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    let qrCodeUrl = null;

    // Upload QR code to Cloudinary if provided
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'payment-qr-codes',
        resource_type: 'image'
      });

      qrCodeUrl = result.secure_url;
    }

    const method = await prisma.paymentMethod.create({
      data: {
        name,
        type,
        accountNumber: accountNumber || null,
        accountName: accountName || null,
        upiId: upiId || null,
        qrCodeUrl,
        isActive: true
      }
    });

    res.status(201).json(method);
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update payment method
router.put('/:id', authenticate, isAdmin, upload.single('qrCode'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, accountNumber, accountName, upiId } = req.body;

    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id: id as string }
    });

    if (!existingMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    let qrCodeUrl = existingMethod.qrCodeUrl;

    // Upload new QR code if provided
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'payment-qr-codes',
        resource_type: 'image'
      });

      qrCodeUrl = result.secure_url;

      // Delete old QR code from Cloudinary if exists
      if (existingMethod.qrCodeUrl) {
        const publicId = existingMethod.qrCodeUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    const method = await prisma.paymentMethod.update({
      where: { id: id as string },
      data: {
        name: name || existingMethod.name,
        type: type || existingMethod.type,
        accountNumber: accountNumber !== undefined ? accountNumber : existingMethod.accountNumber,
        accountName: accountName !== undefined ? accountName : existingMethod.accountName,
        upiId: upiId !== undefined ? upiId : existingMethod.upiId,
        qrCodeUrl
      }
    });

    res.json(method);
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle payment method status
router.patch('/:id/toggle', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const method = await prisma.paymentMethod.findUnique({
      where: { id: id as string }
    });

    if (!method) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const updated = await prisma.paymentMethod.update({
      where: { id: id as string },
      data: { isActive: !method.isActive }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete payment method
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const method = await prisma.paymentMethod.findUnique({
      where: { id: id as string }
    });

    if (!method) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Delete QR code from Cloudinary if exists
    if (method.qrCodeUrl) {
      const publicId = method.qrCodeUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await prisma.paymentMethod.delete({
      where: { id: id as string }
    });

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
