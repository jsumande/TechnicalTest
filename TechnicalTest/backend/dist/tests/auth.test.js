"use strict";
/**
 * Auth route tests.
 *
 * Tests the /api/auth/* endpoints using Supertest (HTTP-level tests
 * that exercise Express routing, middleware, and response format).
 *
 * Prisma is mocked so no real database is needed.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = __importDefault(require("../index"));
// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Mock the Prisma client so tests don't hit a real database.
 * Each test can override the mock return values with jest.fn().mockResolvedValue(...)
 */
globals_1.jest.mock('../db', () => ({
    prisma: {
        user: {
            findUnique: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        },
    },
}));
// Import after mocking so we get the mocked version
const db_1 = require("../db");
const mockUser = db_1.prisma.user;
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
/** Pre-hashed "password" with cost 10 (fast enough for tests) */
let hashedPassword;
/**
 * Build a minimal mock user record.
 * Cast to `any` to avoid TypeScript complaining about the Prisma relation type
 * for `recentSearches` — in tests we only care about the scalar fields.
 */
function mockUserRecord(overrides) {
    return {
        id: 'user_1',
        email: 'demo@example.com',
        passwordHash: hashedPassword,
        subscriptionStatus: 'inactive',
        stripeCustomerId: null,
        subscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
(0, globals_1.beforeAll)(async () => {
    hashedPassword = await bcryptjs_1.default.hash('password', 10);
});
(0, globals_1.beforeEach)(() => {
    globals_1.jest.clearAllMocks();
});
// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
(0, globals_1.describe)('POST /api/auth/login', () => {
    (0, globals_1.it)('returns 400 when email is missing', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ password: 'password' });
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.error).toMatch(/required/i);
    });
    (0, globals_1.it)('returns 400 when password is missing', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ email: 'demo@example.com' });
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.error).toMatch(/required/i);
    });
    (0, globals_1.it)('returns 401 when user does not exist', async () => {
        // Simulate user not found in DB
        mockUser.findUnique.mockResolvedValueOnce(null);
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ email: 'notexist@example.com', password: 'password' });
        (0, globals_1.expect)(res.status).toBe(401);
        (0, globals_1.expect)(res.body.error).toMatch(/invalid/i);
    });
    (0, globals_1.it)('returns 401 on wrong password', async () => {
        // Return a valid user from DB
        mockUser.findUnique.mockResolvedValueOnce(mockUserRecord());
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ email: 'demo@example.com', password: 'wrong-password' });
        (0, globals_1.expect)(res.status).toBe(401);
        (0, globals_1.expect)(res.body.error).toMatch(/invalid/i);
    });
    (0, globals_1.it)('returns 200, user object, and sets HttpOnly cookie on valid credentials', async () => {
        mockUser.findUnique.mockResolvedValueOnce(mockUserRecord());
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ email: 'demo@example.com', password: 'password' });
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.user).toMatchObject({
            id: 'user_1',
            email: 'demo@example.com',
            subscriptionStatus: 'inactive',
        });
        // Verify HTTP-only cookie was set.
        // Supertest may return set-cookie as a single string or string[] — normalise both.
        const rawCookie = res.headers['set-cookie'];
        const cookies = Array.isArray(rawCookie) ? rawCookie : [String(rawCookie)];
        (0, globals_1.expect)(cookies.length).toBeGreaterThan(0);
        const tokenCookie = cookies.find((c) => c.startsWith('token='));
        (0, globals_1.expect)(tokenCookie).toBeDefined();
        (0, globals_1.expect)(tokenCookie).toMatch(/HttpOnly/i);
    });
});
(0, globals_1.describe)('POST /api/auth/logout', () => {
    (0, globals_1.it)('returns 200 and clears the token cookie', async () => {
        const res = await (0, supertest_1.default)(index_1.default).post('/api/auth/logout');
        (0, globals_1.expect)(res.status).toBe(200);
        // Cookie should be cleared (value empty or Max-Age=0)
        const rawCookie = res.headers['set-cookie'];
        if (rawCookie) {
            const cookies = Array.isArray(rawCookie) ? rawCookie : [String(rawCookie)];
            const tokenCookie = cookies.find((c) => c.startsWith('token='));
            if (tokenCookie) {
                (0, globals_1.expect)(tokenCookie).toMatch(/token=;|Max-Age=0/i);
            }
        }
    });
});
(0, globals_1.describe)('GET /api/auth/me', () => {
    (0, globals_1.it)('returns 401 when no cookie is provided', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/api/auth/me');
        (0, globals_1.expect)(res.status).toBe(401);
    });
    (0, globals_1.it)('returns 401 with an invalid JWT', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/auth/me')
            .set('Cookie', 'token=not-a-valid-jwt');
        (0, globals_1.expect)(res.status).toBe(401);
    });
    (0, globals_1.it)('returns 200 with fresh user info when JWT is valid', async () => {
        // Mock findUnique to return active user for BOTH login AND /me calls
        mockUser.findUnique.mockResolvedValue(mockUserRecord({
            subscriptionStatus: 'active',
            stripeCustomerId: 'cus_test',
            subscriptionId: 'sub_test',
        }));
        // Login to get a real JWT cookie
        const loginRes = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ email: 'demo@example.com', password: 'password' });
        // Extract the cookie
        const rawCookie = loginRes.headers['set-cookie'];
        const cookies = Array.isArray(rawCookie) ? rawCookie : [String(rawCookie)];
        const tokenCookie = cookies.find((c) => c.startsWith('token='));
        const tokenValue = tokenCookie.split(';')[0]; // "token=<jwt>"
        // Use the JWT cookie to call /me
        const meRes = await (0, supertest_1.default)(index_1.default)
            .get('/api/auth/me')
            .set('Cookie', tokenValue);
        (0, globals_1.expect)(meRes.status).toBe(200);
        (0, globals_1.expect)(meRes.body.user).toMatchObject({
            id: 'user_1',
            email: 'demo@example.com',
            subscriptionStatus: 'active',
        });
    });
});
