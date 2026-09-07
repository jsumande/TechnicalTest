"use strict";
/**
 * Subscription guard middleware.
 *
 * Checks that the currently authenticated user has an active Stripe
 * subscription before allowing access to protected endpoints (e.g.
 * nutrition data). Returns HTTP 403 if the subscription is not active.
 *
 * Must be used AFTER the `authenticate` middleware so `req.user` is set.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSubscription = requireSubscription;
const db_1 = require("../db");
/**
 * Express middleware that enforces an active subscription.
 *
 * On success (subscriptionStatus === "active"): calls `next()`.
 * On failure: returns 403 JSON error.
 */
async function requireSubscription(req, res, next) {
    // req.user is guaranteed by the authenticate middleware, but we guard anyway
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        // Fetch fresh subscription status from DB (don't trust the JWT which could be stale)
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { subscriptionStatus: true },
        });
        if (!user || user.subscriptionStatus !== 'active') {
            res.status(403).json({
                error: 'Subscription required',
                code: 'SUBSCRIPTION_REQUIRED',
            });
            return;
        }
        next();
    }
    catch (err) {
        console.error('[requireSubscription] DB error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
