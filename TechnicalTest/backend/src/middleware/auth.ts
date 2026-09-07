/**
 * Authentication middleware.
 *
 * Reads the JWT from the `token` HTTP-only cookie set during login,
 * verifies it, and attaches the decoded user payload to `req.user`.
 *
 * Using an HTTP-only cookie (rather than Authorization header / localStorage)
 * prevents JavaScript access to the token and mitigates XSS attacks.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** JWT payload shape */
export interface JwtPayload {
  id: string;
  email: string;
}

/**
 * Extended Express Request that carries the decoded JWT user payload.
 * Downstream route handlers should cast `req` to `AuthRequest` after
 * the `authenticate` middleware has run.
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Express middleware that validates the JWT cookie.
 *
 * On success: sets `req.user` and calls `next()`.
 * On failure: returns 401 JSON error.
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  // Read the JWT from the HTTP-only cookie
  const token: string | undefined = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: authentication required' });
    return;
  }

  try {
    // Verify the token signature and expiry with our server-side secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    // Token is expired, tampered-with, or otherwise invalid
    res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}
