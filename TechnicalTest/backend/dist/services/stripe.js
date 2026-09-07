"use strict";
/**
 * Stripe service helpers.
 *
 * Centralises all Stripe SDK calls so routes stay thin.
 * Uses test-mode keys from environment variables — never hard-code keys.
 *
 * Stripe docs: https://stripe.com/docs/api
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateCustomer = getOrCreateCustomer;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.constructWebhookEvent = constructWebhookEvent;
const stripe_1 = __importDefault(require("stripe"));
// ─────────────────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Singleton Stripe client.
 * The API version is pinned so we get predictable behaviour even if Stripe
 * releases breaking changes to newer versions.
 */
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    // TypeScript hint so the SDK knows we're running server-side Node
    typescript: true,
});
// ─────────────────────────────────────────────────────────────────────────────
// Customer helpers
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns an existing Stripe customer ID or creates a new customer record.
 * Storing the customer ID in our DB prevents creating duplicate customers
 * for the same email on subsequent checkout attempts.
 *
 * @param email            - The user's email address
 * @param stripeCustomerId - Existing Stripe customer ID (if already stored)
 */
async function getOrCreateCustomer(email, stripeCustomerId) {
    // If we already have a customer ID for this user, reuse it
    if (stripeCustomerId)
        return stripeCustomerId;
    // Otherwise create a new Stripe Customer
    const customer = await stripe.customers.create({ email });
    return customer.id;
}
// ─────────────────────────────────────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Creates a Stripe Checkout session for a monthly subscription.
 *
 * The user is redirected to the returned URL to complete payment.
 * Stripe redirects back to successUrl/cancelUrl after the checkout.
 *
 * @param customerId - Stripe customer ID
 * @param priceId    - Stripe Price ID for the subscription plan
 * @param successUrl - URL to redirect after successful payment
 * @param cancelUrl  - URL to redirect if the user cancels
 * @returns           The Stripe-hosted checkout page URL
 */
async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
    });
    // session.url is guaranteed to be set for hosted checkout sessions
    return session.url;
}
// ─────────────────────────────────────────────────────────────────────────────
// Customer Portal
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Creates a Stripe Customer Portal session so the user can manage or cancel
 * their subscription without us building a custom management UI.
 *
 * Note: The Customer Portal must be enabled and configured in the Stripe
 * Dashboard under Billing → Customer Portal before this will work.
 *
 * @param customerId - Stripe customer ID
 * @param returnUrl  - URL to return to after the user closes the portal
 * @returns           The Stripe-hosted portal URL
 */
async function createPortalSession(customerId, returnUrl) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
    return session.url;
}
// ─────────────────────────────────────────────────────────────────────────────
// Webhooks
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Verifies a Stripe webhook signature and constructs a typed Event object.
 *
 * The raw request body (Buffer) is required — if the body has been parsed
 * as JSON first, the signature check will fail. The route must use
 * `express.raw({ type: 'application/json' })` before calling this.
 *
 * @param payload   - Raw request body buffer
 * @param signature - Value of the `stripe-signature` HTTP header
 * @throws          - StripeSignatureVerificationError if signature is invalid
 */
function constructWebhookEvent(payload, signature) {
    return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
exports.default = stripe;
