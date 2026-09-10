/**
 * Express application entry point.
 *
 * Sets up middleware in the correct order:
 *  1. Raw body parser for /api/subscription/webhook (must come first so the
 *     body isn't consumed by the JSON parser before Stripe can verify it)
 *  2. JSON body parser for all other routes
 *  3. Cookie parser (needed to read the JWT from the token cookie)
 *  4. CORS (restrict to frontend origin with credentials support)
 *  5. Route mounts
 */

import 'dotenv/config'; // Must be first — loads .env before anything else

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import searchRoutes from './routes/search';
import subscriptionRoutes from './routes/subscription';

// ─────────────────────────────────────────────────────────────────────────────
// App setup
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

/**
 * Stripe webhook endpoint requires the RAW request body to verify the
 * stripe-signature header. Register this BEFORE express.json() so the
 * JSON parser doesn't consume the body first.
 */
app.use(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
);

// Parse JSON bodies for all other routes
app.use(express.json());

// Parse Cookie header so we can read `req.cookies.token`
app.use(cookieParser());

const corsOptions = {
  origin: true, // Allow all origins temporarily while supporting credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check — useful for Docker / load balancer probes
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Server
// ─────────────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '4000', 10);

// Only start listening when this file is run directly (not when imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}

export default app;
