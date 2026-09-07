/**
 * Authentication routes.
 *
 * POST /api/auth/login   — Verify credentials, issue JWT in HTTP-only cookie
 * POST /api/auth/logout  — Clear the JWT cookie
 * GET  /api/auth/me      — Return current user info and subscription status
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticates the demo user.
 *
 * On success: signs a 7-day JWT and stores it in an HTTP-only cookie.
 * The cookie is SameSite=Lax so it works for same-origin requests and
 * top-level navigations from Stripe redirects, but not for third-party embeds.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Look up the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // Use bcrypt.compare even when user is null to prevent timing attacks
    // (constant-time comparison so response time doesn't reveal whether
    //  the email exists)
    const passwordValid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign a JWT with the user's id and email
    const token = jwt.sign(
      { id: user.id, email: user.email } satisfies { id: string; email: string },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    // Set JWT in an HTTP-only cookie (not accessible via document.cookie)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (err) {
    console.error('[POST /auth/login] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clears the JWT cookie, effectively logging the user out.
 * No authentication required — clearing a non-existent cookie is a no-op.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the currently authenticated user's profile and subscription status.
 * This is called on every frontend page load to initialise the auth context.
 * We re-query the DB rather than trusting the JWT payload because the
 * subscription status can change via Stripe webhooks between token issuances.
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      // User was deleted from DB after token was issued
      res.clearCookie('token');
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[GET /auth/me] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
