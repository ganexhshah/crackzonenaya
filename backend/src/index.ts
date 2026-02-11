import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import matchRoutes from './routes/match.routes';
import tournamentRoutes from './routes/tournament.routes';
import transactionRoutes from './routes/transaction.routes';
import adminRoutes from './routes/admin.routes';
import paymentMethodRoutes from './routes/payment-method.routes';
import scrimRoutes from './routes/scrim.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/scrims', scrimRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint for scrims
app.get('/api/test-scrims', (req, res) => {
  res.json({ message: 'Scrim routes are loaded' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`✅ Database connected`);
    
    // Connect to Redis
    await connectRedis();
    
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  await disconnectRedis();
  process.exit(0);
});
