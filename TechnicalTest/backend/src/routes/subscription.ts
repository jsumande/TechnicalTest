/**
 * Subscription routes.
 *
 * POST /api/subscription/checkout — Create a Stripe Checkout session
 * POST /api/subscription/portal   — Create a Stripe Customer Portal session
 * POST /api/subscription/webhook  — Handle incoming Stripe webhook events
 *
 * IMPORTANT: The webhook endpoint uses raw body parsing (set up in index.ts).
 *            All other endpoints require JWT authentication.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import {
  getOrCreateCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  syncUserSubscription,
} from '../services/stripe';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/checkout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout session and returns the hosted checkout URL.
 * The frontend redirects the user to this URL to complete payment.
 *
 * Flow:
 *  1. Get or create a Stripe Customer for this user
 *  2. Save the new customer ID to DB if it was just created
 *  3. Create a Checkout session for the configured STRIPE_PRICE_ID
 *  4. Return the checkout URL
 */
router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get existing customer or create a new one in Stripe
    const customerId = await getOrCreateCustomer(user.email, user.stripeCustomerId);

    // Persist the customer ID if this is the first checkout attempt
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create a Stripe-hosted Checkout session
    const checkoutUrl = await createCheckoutSession(
      customerId,
      process.env.STRIPE_PRICE_ID!,
      `${frontendUrl}/subscription?success=true`,  // After successful payment
      `${frontendUrl}/subscription?canceled=true`, // If user cancels checkout
    );

    return res.status(200).json({ url: checkoutUrl });
  } catch (err: any) {
    console.error('[POST /subscription/checkout] Error:', err);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: err?.message || String(err),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manually synchronises the subscription status with Stripe.
 * Called by the frontend on successful checkout return as a reliable fallback
 * when webhooks are delayed or not forwarded locally.
 */
router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.status(200).json({ subscriptionStatus: user.subscriptionStatus });
    }

    const syncResult = await syncUserSubscription(user.stripeCustomerId);
    if (syncResult) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: syncResult.status,
          subscriptionId: syncResult.subscriptionId,
        },
      });
      return res.status(200).json({ subscriptionStatus: updatedUser.subscriptionStatus });
    }

    return res.status(200).json({ subscriptionStatus: user.subscriptionStatus });
  } catch (err) {
    console.error('[POST /subscription/sync] Error:', err);
    return res.status(500).json({ error: 'Failed to sync subscription status' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/portal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe Customer Portal session for subscription management.
 * Users can update payment methods, view invoices, and cancel here.
 *
 * Requires the user to already have a Stripe customer ID (i.e. they have
 * previously initiated a checkout).
 */
router.post('/portal', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        error: 'No Stripe customer found. Please subscribe first.',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const portalUrl = await createPortalSession(
      user.stripeCustomerId,
      `${frontendUrl}/subscription`, // Return here after closing the portal
    );

    return res.status(200).json({ url: portalUrl });
  } catch (err) {
    console.error('[POST /subscription/portal] Error:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/webhook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles Stripe webhook events to keep our DB in sync with Stripe state.
 *
 * IMPORTANT: This route must receive the RAW request body (Buffer) so
 * Stripe can verify the stripe-signature header. See index.ts for setup.
 *
 * Handled events:
 *   checkout.session.completed        — Initial subscription activated
 *   customer.subscription.updated     — Plan changed or renewed
 *   customer.subscription.deleted     — Subscription cancelled/expired
 *
 * All other events are acknowledged (200) and ignored.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Verify the webhook signature using our Stripe webhook secret
  let event;
  try {
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  // Process the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        /**
         * Fired when a user completes checkout.
         * We activate their subscription in our DB.
         */
        const session = event.data.object as {
          customer: string;
          subscription: string;
        };

        await prisma.user.updateMany({
          where: { stripeCustomerId: session.customer },
          data: {
            subscriptionStatus: 'active',
            subscriptionId: session.subscription,
          },
        });

        console.log(`[Webhook] Activated subscription for customer ${session.customer}`);
        break;
      }

      case 'customer.subscription.updated': {
        /**
         * Fired when a subscription changes (renewal, upgrade, downgrade).
         * Map Stripe statuses to our simplified active/inactive model.
         */
        const subscription = event.data.object as {
          id: string;
          customer: string;
          status: string;
        };

        const status = subscription.status === 'active' ? 'active' : 'inactive';

        await prisma.user.updateMany({
          where: { stripeCustomerId: subscription.customer },
          data: {
            subscriptionStatus: status,
            subscriptionId: subscription.id,
          },
        });

        console.log(`[Webhook] Updated subscription status to "${status}" for customer ${subscription.customer}`);
        break;
      }

      case 'customer.subscription.deleted': {
        /**
         * Fired when a subscription is cancelled or expires.
         * Revoke the user's access to premium features.
         */
        const subscription = event.data.object as {
          customer: string;
        };

        await prisma.user.updateMany({
          where: { stripeCustomerId: subscription.customer },
          data: {
            subscriptionStatus: 'canceled',
            subscriptionId: null,
          },
        });

        console.log(`[Webhook] Cancelled subscription for customer ${subscription.customer}`);
        break;
      }

      default:
        // Acknowledge events we don't need to handle
        break;
    }

    // Acknowledge receipt — Stripe will retry if we don't respond with 2xx
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook] Processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
