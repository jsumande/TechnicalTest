/**
 * Search route tests.
 *
 * Tests the /api/search/* endpoints.
 * - Prisma is mocked (no real DB)
 * - Open Food Facts service is mocked (no real HTTP calls)
 * - A real JWT is generated using the test JWT_SECRET from setup.ts
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

// Mock Prisma — no database calls in unit tests
jest.mock('../db', () => ({
  prisma: {
    recentSearch: {
      create: jest.fn<any>().mockResolvedValue({ id: 'search_1' }),
      findMany: jest.fn<any>().mockResolvedValue([]),
      deleteMany: jest.fn<any>().mockResolvedValue({ count: 0 }),
    },
  },
}));

// Mock Open Food Facts — return deterministic test data
jest.mock('../services/openFoodFacts', () => ({
  searchProducts: jest.fn<any>().mockResolvedValue([
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

import { prisma } from '../db';
import { searchProducts } from '../services/openFoodFacts';

const mockRecentSearch = prisma.recentSearch as any;
const mockSearchProducts = searchProducts as any;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Generates a valid JWT using the test secret from setup.ts */
function generateAuthCookie(userId = 'user_1'): string {
  const token = jwt.sign(
    { id: userId, email: 'demo@example.com' },
    process.env.JWT_SECRET || 'test-jwt-secret-for-jest',
    { expiresIn: '1h' },
  );
  return `token=${token}`;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Reset mock to default resolved value
  mockRecentSearch.create.mockResolvedValue({ id: 'search_1' } as any);
  mockRecentSearch.findMany.mockResolvedValue([]);
  mockRecentSearch.deleteMany.mockResolvedValue({ count: 0 } as any);
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — GET /api/search
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/search', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/search?q=nutella');

    expect(res.status).toBe(401);
  });

  it('returns 400 when query parameter is missing', async () => {
    const res = await request(app)
      .get('/api/search')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 400 when query is an empty string', async () => {
    const res = await request(app)
      .get('/api/search?q=   ')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(400);
  });

  it('returns product list on successful search', async () => {
    const res = await request(app)
      .get('/api/search?q=nutella&lang=en')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Nutella');
    expect(res.body.query).toBe('nutella');
    expect(res.body.language).toBe('en');
  });

  it('passes the language code to the search service', async () => {
    await request(app)
      .get('/api/search?q=chocolade&lang=nl')
      .set('Cookie', generateAuthCookie());

    expect(mockSearchProducts).toHaveBeenCalledWith('chocolade', 'nl');
  });

  it('defaults to "en" for unsupported language codes', async () => {
    await request(app)
      .get('/api/search?q=test&lang=xx')
      .set('Cookie', generateAuthCookie());

    expect(mockSearchProducts).toHaveBeenCalledWith('test', 'en');
  });

  it('saves the search query to the database', async () => {
    await request(app)
      .get('/api/search?q=chocolate&lang=en')
      .set('Cookie', generateAuthCookie());

    expect(mockRecentSearch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          query: 'chocolate',
          language: 'en',
          userId: 'user_1',
        }),
      }),
    );
  });

  it('returns 502 when the Open Food Facts API fails', async () => {
    mockSearchProducts.mockRejectedValueOnce(new Error('Network error'));

    const res = await request(app)
      .get('/api/search?q=nutella')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(502);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — GET /api/search/history
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/search/history', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/search/history');

    expect(res.status).toBe(401);
  });

  it('returns empty array when no history exists', async () => {
    mockRecentSearch.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/search/history')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(200);
    expect(res.body.searches).toEqual([]);
  });

  it('returns the user search history', async () => {
    const mockHistory = [
      { id: '1', query: 'nutella', language: 'en', createdAt: new Date().toISOString() },
      { id: '2', query: 'chocolade', language: 'nl', createdAt: new Date().toISOString() },
    ];

    mockRecentSearch.findMany.mockResolvedValueOnce(mockHistory as any);

    const res = await request(app)
      .get('/api/search/history')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(200);
    expect(res.body.searches).toHaveLength(2);
    expect(res.body.searches[0].query).toBe('nutella');
  });
});
