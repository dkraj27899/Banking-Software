import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { pool } from './config/database.js';
import { logger } from './utils/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { auditMiddleware } from './middleware/auditLog.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import staffRoutes from './modules/staff/staff.routes.js';
import branchRoutes from './modules/branches/branches.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import memberRoutes from './modules/members/members.routes.js';
import accountRoutes from './modules/accounts/accounts.routes.js';
import transactionRoutes from './modules/transactions/transactions.routes.js';
import statementRoutes from './modules/statements/statements.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import configRoutes from './modules/config/config.routes.js';
import loanRoutes from './modules/loans/loans.routes.js';
import expenseRoutes from './modules/expenses/expenses.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — same origin in production, configurable in dev
app.use(cors({
  origin: env.FRONTEND_URL === '*' ? true : env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '100kb' }));

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Audit trail for mutating requests
app.use('/api', auditMiddleware);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: {
        code: 'UNHEALTHY',
        message: 'Service dependencies unavailable',
      },
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/statements', statementRoutes);
app.use('/api/config', configRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// In production, serve the React frontend
if (env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(import.meta.dirname, '../../frontend/dist');
  app.use(express.static(frontendDist, { maxAge: '1y', immutable: true }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // 404 handler (dev only — Vite handles frontend in dev)
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
  });
}

// Global error handler
app.use(errorHandler);

// Start
const PORT = env.PORT;

async function start() {
  try {
    await redis.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis not available — sessions will not persist across restarts', {
      error: err instanceof Error ? err.message : 'unknown',
    });
  }

  app.listen(PORT, () => {
    logger.info(`BCCS backend listening on port ${PORT}`, {
      env: env.NODE_ENV,
      port: PORT,
    });
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err instanceof Error ? err.message : 'unknown' });
  process.exit(1);
});

export default app;
