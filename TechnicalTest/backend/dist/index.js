"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // Must be first — loads .env before anything else
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const search_1 = __importDefault(require("./routes/search"));
const subscription_1 = __importDefault(require("./routes/subscription"));
// ─────────────────────────────────────────────────────────────────────────────
// App setup
// ─────────────────────────────────────────────────────────────────────────────
const app = (0, express_1.default)();
/**
 * Stripe webhook endpoint requires the RAW request body to verify the
 * stripe-signature header. Register this BEFORE express.json() so the
 * JSON parser doesn't consume the body first.
 */
app.use('/api/subscription/webhook', express_1.default.raw({ type: 'application/json' }));
// Parse JSON bodies for all other routes
app.use(express_1.default.json());
// Parse Cookie header so we can read `req.cookies.token`
app.use((0, cookie_parser_1.default)());
/**
 * CORS configuration.
 * - origin: Only the frontend is allowed to make cross-origin requests.
 * - credentials: Required so the browser sends the HTTP-only cookie.
 */
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/search', search_1.default);
app.use('/api/subscription', subscription_1.default);
// Health check — useful for Docker / load balancer probes
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler for unknown routes
app.use((_req, res) => {
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
exports.default = app;
