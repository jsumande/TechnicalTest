"use strict";
/**
 * Search route tests.
 *
 * Tests the /api/search/* endpoints.
 * - Prisma is mocked (no real DB)
 * - Open Food Facts service is mocked (no real HTTP calls)
 * - A real JWT is generated using the test JWT_SECRET from setup.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../index"));
// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────
// Mock Prisma — no database calls in unit tests
globals_1.jest.mock('../db', () => ({
    prisma: {
        recentSearch: {
            create: globals_1.jest.fn().mockResolvedValue({ id: 'search_1' }),
            findMany: globals_1.jest.fn().mockResolvedValue([]),
            deleteMany: globals_1.jest.fn().mockResolvedValue({ count: 0 }),
        },
    },
}));
// Mock Open Food Facts — return deterministic test data
globals_1.jest.mock('../services/openFoodFacts', () => ({
    searchProducts: globals_1.jest.fn().mockResolvedValue([
        {
            id: '3017620422003',
            name: 'Nutella',
            brand: 'Ferrero',
            imageUrl: 'https://images.openfoodfacts.org/nutella.jpg',
            categories: 'Spreads, Sweet spreads',
            nutrition: {
                energy_kcal: 539,
                fat: 30.9,
                saturated_fat: 10.6,
                carbohydrates: 57.5,
                sugars: 56.3,
                fiber: 0,
                proteins: 6.3,
                salt: 0.107,
            },
        },
    ]),
}));
const db_1 = require("../db");
const openFoodFacts_1 = require("../services/openFoodFacts");
const mockRecentSearch = db_1.prisma.recentSearch;
const mockSearchProducts = openFoodFacts_1.searchProducts;
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
/** Generates a valid JWT using the test secret from setup.ts */
function generateAuthCookie(userId = 'user_1') {
    const token = jsonwebtoken_1.default.sign({ id: userId, email: 'demo@example.com' }, process.env.JWT_SECRET || 'test-jwt-secret-for-jest', { expiresIn: '1h' });
    return `token=${token}`;
}
(0, globals_1.beforeEach)(() => {
    globals_1.jest.clearAllMocks();
    // Reset mock to default resolved value
    mockRecentSearch.create.mockResolvedValue({ id: 'search_1' });
    mockRecentSearch.findMany.mockResolvedValue([]);
    mockRecentSearch.deleteMany.mockResolvedValue({ count: 0 });
});
// ─────────────────────────────────────────────────────────────────────────────
// Tests — GET /api/search
// ─────────────────────────────────────────────────────────────────────────────
(0, globals_1.describe)('GET /api/search', () => {
    (0, globals_1.it)('returns 401 when unauthenticated', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/api/search?q=nutella');
        (0, globals_1.expect)(res.status).toBe(401);
    });
    (0, globals_1.it)('returns 400 when query parameter is missing', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/search')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.error).toMatch(/required/i);
    });
    (0, globals_1.it)('returns 400 when query is an empty string', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/search?q=   ')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(400);
    });
    (0, globals_1.it)('returns product list on successful search', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/search?q=nutella&lang=en')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.products).toHaveLength(1);
        (0, globals_1.expect)(res.body.products[0].name).toBe('Nutella');
        (0, globals_1.expect)(res.body.query).toBe('nutella');
        (0, globals_1.expect)(res.body.language).toBe('en');
    });
    (0, globals_1.it)('passes the language code to the search service', async () => {
        await (0, supertest_1.default)(index_1.default)
            .get('/api/search?q=chocolade&lang=nl')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(mockSearchProducts).toHaveBeenCalledWith('chocolade', 'nl');
    });
    (0, globals_1.it)('defaults to "en" for unsupported language codes', async () => {
        await (0, supertest_1.default)(index_1.default)
            .get('/api/search?q=test&lang=xx')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(mockSearchProducts).toHaveBeenCalledWith('test', 'en');
    });
    (0, globals_1.it)('saves the search query to the database', async () => {
        await (0, supertest_1.default)(index_1.default)
            .get('/api/search?q=chocolate&lang=en')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(mockRecentSearch.create).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            data: globals_1.expect.objectContaining({
                query: 'chocolate',
                language: 'en',
                userId: 'user_1',
            }),
        }));
    });
    (0, globals_1.it)('returns 502 when the Open Food Facts API fails', async () => {
        mockSearchProducts.mockRejectedValueOnce(new Error('Network error'));
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/search?q=nutella')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(502);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// Tests — GET /api/search/history
// ─────────────────────────────────────────────────────────────────────────────
(0, globals_1.describe)('GET /api/search/history', () => {
    (0, globals_1.it)('returns 401 when unauthenticated', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/api/search/history');
        (0, globals_1.expect)(res.status).toBe(401);
    });
    (0, globals_1.it)('returns empty array when no history exists', async () => {
        mockRecentSearch.findMany.mockResolvedValueOnce([]);
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/search/history')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.searches).toEqual([]);
    });
    (0, globals_1.it)('returns the user search history', async () => {
        const mockHistory = [
            { id: '1', query: 'nutella', language: 'en', createdAt: new Date().toISOString() },
            { id: '2', query: 'chocolade', language: 'nl', createdAt: new Date().toISOString() },
        ];
        mockRecentSearch.findMany.mockResolvedValueOnce(mockHistory);
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/search/history')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.searches).toHaveLength(2);
        (0, globals_1.expect)(res.body.searches[0].query).toBe('nutella');
    });
});
