"use strict";
/**
 * Authentication middleware.
 *
 * Reads the JWT from the `token` HTTP-only cookie set during login,
 * verifies it, and attaches the decoded user payload to `req.user`.
 *
 * Using an HTTP-only cookie (rather than Authorization header / localStorage)
 * prevents JavaScript access to the token and mitigates XSS attacks.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Express middleware that validates the JWT cookie.
 *
 * On success: sets `req.user` and calls `next()`.
 * On failure: returns 401 JSON error.
 */
function authenticate(req, res, next) {
    // Read the JWT from the HTTP-only cookie
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: 'Unauthorized: authentication required' });
        return;
    }
    try {
        // Verify the token signature and expiry with our server-side secret
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        // Token is expired, tampered-with, or otherwise invalid
        res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    }
}
