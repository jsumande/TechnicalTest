/**
 * Subscription route tests.
 *
 * Tests the /api/subscription/* endpoints.
 * - Prisma is mocked (no real DB)
 * - Stripe service is mocked (no real Stripe API calls)
 * - Webhook signature verification is mocked so we can test event processing
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('../db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../services/stripe', () => ({
  getOrCreateCustomer: jest.fn<any>().mockResolvedValue('cus_test_123'),
  createCheckoutSession: jest.fn<any>().mockResolvedValue('https://checkout.stripe.com/pay/cs_test_123'),
  createPortalSession: jest.fn<any>().mockResolvedValue('https://billing.stripe.com/p/session/test_123'),
  constructWebhookEvent: jest.fn(),
  syncUserSubscription: jest.fn<any>().mockResolvedValue({ status: 'active', subscriptionId: 'sub_test_123' }),
}));

import { prisma } from '../db';
import {
  getOrCreateCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  syncUserSubscription,
} from '../services/stripe';

const mockUser = prisma.user as any;
const mockGetOrCreateCustomer = getOrCreateCustomer as any;
const mockCreateCheckoutSession = createCheckoutSession as any;
const mockCreatePortalSession = createPortalSession as any;
const mockConstructWebhookEvent = constructWebhookEvent as any;
const mockSyncUserSubscription = syncUserSubscription as any;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateAuthCookie(userId = 'user_1'): string {
  const token = jwt.sign(
    { id: userId, email: 'demo@example.com' },
    process.env.JWT_SECRET || 'test-jwt-secret-for-jest',
    { expiresIn: '1h' },
  );
  return `token=${token}`;
}

const baseUser = {
  id: 'user_1',
  email: 'demo@example.com',
  passwordHash: 'hash',
  stripeCustomerId: 'cus_test_123',
  subscriptionId: 'sub_test_123',
  subscriptionStatus: 'inactive',
  createdAt: new Date(),
  updatedAt: new Date(),
  recentSearches: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — POST /api/subscription/checkout
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/subscription/checkout', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/subscription/checkout');
    expect(res.status).toBe(401);
  });

  it('returns 404 when user does not exist in DB', async () => {
    mockUser.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/subscription/checkout')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(404);
  });

  it('returns checkout URL for authenticated user', async () => {
    mockUser.findUnique.mockResolvedValueOnce(baseUser as any);

    const res = await request(app)
      .post('/api/subscription/checkout')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(200);
    expect(res.body.url).toContain('stripe.com');
  });

  it('calls Stripe checkout with the configured price ID', async () => {
    mockUser.findUnique.mockResolvedValueOnce(baseUser as any);

    await request(app)
      .post('/api/subscription/checkout')
      .set('Cookie', generateAuthCookie());

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      'cus_test_123',
      process.env.STRIPE_PRICE_ID,
      expect.stringContaining('/subscription?success=true'),
      expect.stringContaining('/subscription?canceled=true'),
    );
  });

  it('creates a new Stripe customer when one does not exist', async () => {
    mockUser.findUnique.mockResolvedValueOnce({
      ...baseUser,
      stripeCustomerId: null, // No Stripe customer yet
    } as any);
    mockUser.update.mockResolvedValueOnce({ ...baseUser, stripeCustomerId: 'cus_new_123' } as any);
    mockGetOrCreateCustomer.mockResolvedValueOnce('cus_new_123');

    const res = await request(app)
      .post('/api/subscription/checkout')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(200);
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stripeCustomerId: 'cus_new_123' }),
      }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — POST /api/subscription/portal
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/subscription/portal', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/subscription/portal');
    expect(res.status).toBe(401);
  });

  it('returns 404 when user is not found in DB', async () => {
    mockUser.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/subscription/portal')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(404);
  });

  it('returns 400 when user has no stripeCustomerId', async () => {
    mockUser.findUnique.mockResolvedValueOnce({
      ...baseUser,
      stripeCustomerId: null,
    } as any);

    const res = await request(app)
      .post('/api/subscription/portal')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no stripe customer/i);
  });

  it('returns portal session URL when user is valid', async () => {
    mockUser.findUnique.mockResolvedValueOnce(baseUser as any);

    const res = await request(app)
      .post('/api/subscription/portal')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(200);
    expect(res.body.url).toContain('billing.stripe.com');
    expect(mockCreatePortalSession).toHaveBeenCalledWith(
      'cus_test_123',
      expect.stringContaining('/subscription'),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — POST /api/subscription/sync
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/subscription/sync', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/subscription/sync');
    expect(res.status).toBe(401);
  });

  it('syncs subscription status directly from Stripe and updates DB', async () => {
    mockUser.findUnique.mockResolvedValueOnce({
      ...baseUser,
      stripeCustomerId: 'cus_test_123',
      subscriptionStatus: 'inactive',
    } as any);

    mockSyncUserSubscription.mockResolvedValueOnce({
      status: 'active',
      subscriptionId: 'sub_test_123',
    });

    mockUser.update.mockResolvedValueOnce({
      ...baseUser,
      subscriptionStatus: 'active',
      subscriptionId: 'sub_test_123',
    } as any);

    const res = await request(app)
      .post('/api/subscription/sync')
      .set('Cookie', generateAuthCookie());

    expect(res.status).toBe(200);
    expect(res.body.subscriptionStatus).toBe('active');
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subscriptionStatus: 'active' }),
      }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests — POST /api/subscription/webhook
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/subscription/webhook', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await request(app)
      .post('/api/subscription/webhook')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing stripe-signature/i);
  });

  it('returns 400 when webhook signature is invalid', async () => {
    mockConstructWebhookEvent.mockImplementationOnce(() => {
      throw new Error('Signature verification failed');
    });

    const res = await request(app)
      .post('/api/subscription/webhook')
      .set('stripe-signature', 'bad_signature')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(400);
  });

  it('activates subscription on checkout.session.completed', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test_123',
          subscription: 'sub_test_123',
        },
      },
    } as any);

    mockUser.updateMany.mockResolvedValueOnce({ count: 1 } as any);

    const res = await request(app)
      .post('/api/subscription/webhook')
      .set('stripe-signature', 'valid_signature')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify({ type: 'checkout.session.completed' })));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(mockUser.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: 'cus_test_123' },
        data: expect.objectContaining({
          subscriptionStatus: 'active',
          subscriptionId: 'sub_test_123',
        }),
      }),
    );
  });

  it('updates subscription status on customer.subscription.updated', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active',
        },
      },
    } as any);

    mockUser.updateMany.mockResolvedValueOnce({ count: 1 } as any);

    const res = await request(app)
      .post('/api/subscription/webhook')
      .set('stripe-signature', 'valid_signature')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify({ type: 'customer.subscription.updated' })));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(mockUser.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: 'cus_test_123' },
        data: expect.objectContaining({
          subscriptionStatus: 'active',
          subscriptionId: 'sub_test_123',
        }),
      }),
    );
  });

  it('cancels subscription on customer.subscription.deleted', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_test_123',
          id: 'sub_test_123',
        },
      },
    } as any);

    mockUser.updateMany.mockResolvedValueOnce({ count: 1 } as any);

    const res = await request(app)
      .post('/api/subscription/webhook')
      .set('stripe-signature', 'valid_signature')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify({ type: 'customer.subscription.deleted' })));

    expect(res.status).toBe(200);
    expect(mockUser.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionStatus: 'canceled',
          subscriptionId: null,
        }),
      }),
    );
  });

  it('acknowledges and ignores unknown event types', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'payment_intent.created',
      data: { object: {} },
    } as any);

    const res = await request(app)
      .post('/api/subscription/webhook')
      .set('stripe-signature', 'valid_signature')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify({ type: 'payment_intent.created' })));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(mockUser.updateMany).not.toHaveBeenCalled();
  });
});
