import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';
import { sendEmail } from '../config/email';
import { authenticate } from '../middleware/auth';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const { email, username, password, fullName } = req.body;

      // Check for existing user
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        if (existingUser.username === username) {
          return res.status(400).json({ error: 'Username already taken' });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = Math.random().toString(36).substring(7);

      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName,
          verificationToken,
          isVerified: true, // Auto-verify for now since email might not work
        },
      });

      // Try to send verification email (non-blocking)
      sendEmail(
        email,
        'Verify your email',
        `<p>Click <a href="${process.env.FRONTEND_URL}/auth/verify?token=${verificationToken}">here</a> to verify your email.</p>`
      ).catch(err => console.log('Email send failed (non-critical):', err.message));

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }
);

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res) => {
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

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    const resetToken = Math.random().toString(36).substring(7);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await sendEmail(
      email,
      'Reset your password',
      `<p>Click <a href="${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    );

    res.json({ message: 'If email exists, reset link will be sent' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    let payload;
    
    // Try to parse as JSON (from useGoogleLogin flow)
    try {
      payload = JSON.parse(credential);
    } catch {
      // If not JSON, verify as ID token (from GoogleLogin component)
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google credential' });
    }

    const email = payload.email;
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture = payload.picture;
    const googleId = payload.sub;

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId }
        ]
      },
      include: { profile: true }
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      const username = email.split('@')[0] + Math.random().toString(36).substring(2, 6);
      
      user = await prisma.user.create({
        data: {
          email,
          username,
          fullName: name,
          avatar: picture,
          googleId,
          provider: 'GOOGLE',
          isVerified: true,
          password: '', // No password for OAuth users
        },
        include: { profile: true }
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatar: picture || user.avatar,
          isVerified: true,
        },
        include: { profile: true }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
      },
      isNewUser,
      hasProfile: !!user.profile
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

export default router;
