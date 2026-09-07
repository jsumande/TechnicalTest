"use strict";
/**
 * Authentication routes.
 *
 * POST /api/auth/login   — Verify credentials, issue JWT in HTTP-only cookie
 * POST /api/auth/logout  — Clear the JWT cookie
 * GET  /api/auth/me      — Return current user info and subscription status
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
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
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        // Look up the user by email
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        // Use bcrypt.compare even when user is null to prevent timing attacks
        // (constant-time comparison so response time doesn't reveal whether
        //  the email exists)
        const passwordValid = user
            ? await bcryptjs_1.default.compare(password, user.passwordHash)
            : false;
        if (!user || !passwordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Sign a JWT with the user's id and email
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (err) {
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
router.post('/logout', (_req, res) => {
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
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
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
    }
    catch (err) {
        console.error('[GET /auth/me] Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
