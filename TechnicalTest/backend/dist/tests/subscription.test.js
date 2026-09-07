"use strict";
/**
 * Subscription route tests.
 *
 * Tests the /api/subscription/* endpoints.
 * - Prisma is mocked (no real DB)
 * - Stripe service is mocked (no real Stripe API calls)
 * - Webhook signature verification is mocked so we can test event processing
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
globals_1.jest.mock('../db', () => ({
    prisma: {
        user: {
            findUnique: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            updateMany: globals_1.jest.fn(),
        },
    },
}));
globals_1.jest.mock('../services/stripe', () => ({
    getOrCreateCustomer: globals_1.jest.fn().mockResolvedValue('cus_test_123'),
    createCheckoutSession: globals_1.jest.fn().mockResolvedValue('https://checkout.stripe.com/pay/cs_test_123'),
    createPortalSession: globals_1.jest.fn().mockResolvedValue('https://billing.stripe.com/p/session/test_123'),
    constructWebhookEvent: globals_1.jest.fn(),
}));
const db_1 = require("../db");
const stripe_1 = require("../services/stripe");
const mockUser = db_1.prisma.user;
const mockGetOrCreateCustomer = stripe_1.getOrCreateCustomer;
const mockCreateCheckoutSession = stripe_1.createCheckoutSession;
const mockCreatePortalSession = stripe_1.createPortalSession;
const mockConstructWebhookEvent = stripe_1.constructWebhookEvent;
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function generateAuthCookie(userId = 'user_1') {
    const token = jsonwebtoken_1.default.sign({ id: userId, email: 'demo@example.com' }, process.env.JWT_SECRET || 'test-jwt-secret-for-jest', { expiresIn: '1h' });
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
(0, globals_1.beforeEach)(() => {
    globals_1.jest.clearAllMocks();
});
// ─────────────────────────────────────────────────────────────────────────────
// Tests — POST /api/subscription/checkout
// ─────────────────────────────────────────────────────────────────────────────
(0, globals_1.describe)('POST /api/subscription/checkout', () => {
    (0, globals_1.it)('returns 401 when unauthenticated', async () => {
        const res = await (0, supertest_1.default)(index_1.default).post('/api/subscription/checkout');
        (0, globals_1.expect)(res.status).toBe(401);
    });
    (0, globals_1.it)('returns 404 when user does not exist in DB', async () => {
        mockUser.findUnique.mockResolvedValueOnce(null);
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/checkout')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(404);
    });
    (0, globals_1.it)('returns checkout URL for authenticated user', async () => {
        mockUser.findUnique.mockResolvedValueOnce(baseUser);
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/checkout')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.url).toContain('stripe.com');
    });
    (0, globals_1.it)('calls Stripe checkout with the configured price ID', async () => {
        mockUser.findUnique.mockResolvedValueOnce(baseUser);
        await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/checkout')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(mockCreateCheckoutSession).toHaveBeenCalledWith('cus_test_123', process.env.STRIPE_PRICE_ID, globals_1.expect.stringContaining('/subscription?success=true'), globals_1.expect.stringContaining('/subscription?canceled=true'));
    });
    (0, globals_1.it)('creates a new Stripe customer when one does not exist', async () => {
        mockUser.findUnique.mockResolvedValueOnce({
            ...baseUser,
            stripeCustomerId: null, // No Stripe customer yet
        });
        mockUser.update.mockResolvedValueOnce({ ...baseUser, stripeCustomerId: 'cus_new_123' });
        mockGetOrCreateCustomer.mockResolvedValueOnce('cus_new_123');
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/checkout')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(mockUser.update).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            data: globals_1.expect.objectContaining({ stripeCustomerId: 'cus_new_123' }),
        }));
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// Tests — POST /api/subscription/portal
// ─────────────────────────────────────────────────────────────────────────────
(0, globals_1.describe)('POST /api/subscription/portal', () => {
    (0, globals_1.it)('returns 401 when unauthenticated', async () => {
        const res = await (0, supertest_1.default)(index_1.default).post('/api/subscription/portal');
        (0, globals_1.expect)(res.status).toBe(401);
    });
    (0, globals_1.it)('returns 404 when user is not found in DB', async () => {
        mockUser.findUnique.mockResolvedValueOnce(null);
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/portal')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(404);
    });
    (0, globals_1.it)('returns 400 when user has no stripeCustomerId', async () => {
        mockUser.findUnique.mockResolvedValueOnce({
            ...baseUser,
            stripeCustomerId: null,
        });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/portal')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.error).toMatch(/no stripe customer/i);
    });
    (0, globals_1.it)('returns portal session URL when user is valid', async () => {
        mockUser.findUnique.mockResolvedValueOnce(baseUser);
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/portal')
            .set('Cookie', generateAuthCookie());
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.url).toContain('billing.stripe.com');
        (0, globals_1.expect)(mockCreatePortalSession).toHaveBeenCalledWith('cus_test_123', globals_1.expect.stringContaining('/subscription'));
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// Tests — POST /api/subscription/webhook
// ─────────────────────────────────────────────────────────────────────────────
(0, globals_1.describe)('POST /api/subscription/webhook', () => {
    (0, globals_1.it)('returns 400 when stripe-signature header is missing', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/webhook')
            .send(Buffer.from('{}'));
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.error).toMatch(/missing stripe-signature/i);
    });
    (0, globals_1.it)('returns 400 when webhook signature is invalid', async () => {
        mockConstructWebhookEvent.mockImplementationOnce(() => {
            throw new Error('Signature verification failed');
        });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/webhook')
            .set('stripe-signature', 'bad_signature')
            .send(Buffer.from('{}'));
        (0, globals_1.expect)(res.status).toBe(400);
    });
    (0, globals_1.it)('activates subscription on checkout.session.completed', async () => {
        mockConstructWebhookEvent.mockReturnValueOnce({
            type: 'checkout.session.completed',
            data: {
                object: {
                    customer: 'cus_test_123',
                    subscription: 'sub_test_123',
                },
            },
        });
        mockUser.updateMany.mockResolvedValueOnce({ count: 1 });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(Buffer.from(JSON.stringify({ type: 'checkout.session.completed' })));
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.received).toBe(true);
        (0, globals_1.expect)(mockUser.updateMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            where: { stripeCustomerId: 'cus_test_123' },
            data: globals_1.expect.objectContaining({
                subscriptionStatus: 'active',
                subscriptionId: 'sub_test_123',
            }),
        }));
    });
    (0, globals_1.it)('updates subscription status on customer.subscription.updated', async () => {
        mockConstructWebhookEvent.mockReturnValueOnce({
            type: 'customer.subscription.updated',
            data: {
                object: {
                    id: 'sub_test_123',
                    customer: 'cus_test_123',
                    status: 'active',
                },
            },
        });
        mockUser.updateMany.mockResolvedValueOnce({ count: 1 });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(Buffer.from(JSON.stringify({ type: 'customer.subscription.updated' })));
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.received).toBe(true);
        (0, globals_1.expect)(mockUser.updateMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            where: { stripeCustomerId: 'cus_test_123' },
            data: globals_1.expect.objectContaining({
                subscriptionStatus: 'active',
                subscriptionId: 'sub_test_123',
            }),
        }));
    });
    (0, globals_1.it)('cancels subscription on customer.subscription.deleted', async () => {
        mockConstructWebhookEvent.mockReturnValueOnce({
            type: 'customer.subscription.deleted',
            data: {
                object: {
                    customer: 'cus_test_123',
                    id: 'sub_test_123',
                },
            },
        });
        mockUser.updateMany.mockResolvedValueOnce({ count: 1 });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(Buffer.from(JSON.stringify({ type: 'customer.subscription.deleted' })));
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(mockUser.updateMany).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            data: globals_1.expect.objectContaining({
                subscriptionStatus: 'canceled',
                subscriptionId: null,
            }),
        }));
    });
    (0, globals_1.it)('acknowledges and ignores unknown event types', async () => {
        mockConstructWebhookEvent.mockReturnValueOnce({
            type: 'payment_intent.created',
            data: { object: {} },
        });
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/subscription/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(Buffer.from(JSON.stringify({ type: 'payment_intent.created' })));
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.received).toBe(true);
        (0, globals_1.expect)(mockUser.updateMany).not.toHaveBeenCalled();
    });
});
