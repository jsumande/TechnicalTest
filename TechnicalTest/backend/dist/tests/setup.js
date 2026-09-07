"use strict";
/**
 * Test environment setup.
 *
 * This file is loaded by Jest BEFORE any test file runs (via jest.config.ts
 * `setupFiles`). It sets all environment variables that the application code
 * reads at module initialisation time so tests don't require a real .env file.
 */
// JWT secret used to sign and verify tokens in auth tests
process.env.JWT_SECRET = 'test-jwt-secret-for-jest';
// Fake Stripe credentials — the Stripe SDK is mocked anyway but these
// prevent "missing env variable" validation errors during module loading
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake_secret_for_tests';
process.env.STRIPE_PRICE_ID = 'price_test_fake_123';
// Application URLs
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '4001'; // Use a different port to avoid conflicts with dev server
// Set test environment
process.env.NODE_ENV = 'test';
