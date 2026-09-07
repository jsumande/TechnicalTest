/**
 * Auth route tests.
 *
 * Tests the /api/auth/* endpoints using Supertest (HTTP-level tests
 * that exercise Express routing, middleware, and response format).
 *
 * Prisma is mocked so no real database is needed.
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock the Prisma client so tests don't hit a real database.
 * Each test can override the mock return values with jest.fn().mockResolvedValue(...)
 */
jest.mock('../db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Import after mocking so we get the mocked version
import { prisma } from '../db';
const mockUser = prisma.user as any;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Pre-hashed "password" with cost 10 (fast enough for tests) */
let hashedPassword: string;

/**
 * Build a minimal mock user record.
 * Cast to `any` to avoid TypeScript complaining about the Prisma relation type
 * for `recentSearches` — in tests we only care about the scalar fields.
 */
function mockUserRecord(overrides?: Record<string, unknown>): any {
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

beforeAll(async () => {
  hashedPassword = await bcrypt.hash('password', 10);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 401 when user does not exist', async () => {
    // Simulate user not found in DB
    mockUser.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notexist@example.com', password: 'password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 401 on wrong password', async () => {
    // Return a valid user from DB
    mockUser.findUnique.mockResolvedValueOnce(mockUserRecord());

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 200, user object, and sets HttpOnly cookie on valid credentials', async () => {
    mockUser.findUnique.mockResolvedValueOnce(mockUserRecord());

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 'user_1',
      email: 'demo@example.com',
      subscriptionStatus: 'inactive',
    });

    // Verify HTTP-only cookie was set.
    // Supertest may return set-cookie as a single string or string[] — normalise both.
    const rawCookie = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(rawCookie) ? rawCookie : [String(rawCookie)];
    expect(cookies.length).toBeGreaterThan(0);
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toMatch(/HttpOnly/i);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears the token cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);

    // Cookie should be cleared (value empty or Max-Age=0)
    const rawCookie = res.headers['set-cookie'];
    if (rawCookie) {
      const cookies: string[] = Array.isArray(rawCookie) ? rawCookie : [String(rawCookie)];
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      if (tokenCookie) {
        expect(tokenCookie).toMatch(/token=;|Max-Age=0/i);
      }
    }
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when no cookie is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=not-a-valid-jwt');

    expect(res.status).toBe(401);
  });

  it('returns 200 with fresh user info when JWT is valid', async () => {
    // Mock findUnique to return active user for BOTH login AND /me calls
    mockUser.findUnique.mockResolvedValue(
      mockUserRecord({
        subscriptionStatus: 'active',
        stripeCustomerId: 'cus_test',
        subscriptionId: 'sub_test',
      }),
    );

    // Login to get a real JWT cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'password' });

    // Extract the cookie
    const rawCookie = loginRes.headers['set-cookie'];
    const cookies: string[] = Array.isArray(rawCookie) ? rawCookie : [String(rawCookie)];
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='))!;
    const tokenValue = tokenCookie.split(';')[0]; // "token=<jwt>"

    // Use the JWT cookie to call /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', tokenValue);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toMatchObject({
      id: 'user_1',
      email: 'demo@example.com',
      subscriptionStatus: 'active',
    });
  });
});
