/**
 * Shared TypeScript types used across the frontend.
 * These mirror the shapes returned by the backend API.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Language & Auth
// ─────────────────────────────────────────────────────────────────────────────

/** Supported language codes for the language selector */
export type Language = 'en' | 'nl' | 'de' | 'fr';

/** Stripe subscription state for the demo user */
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled';

/** The demo user profile returned by /api/auth/me */
export interface User {
  id: string;
  email: string;
  subscriptionStatus: SubscriptionStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────────────────────

/** Per-100g nutritional values (all values may be null if not provided by Open Food Facts) */
export interface NutritionData {
  energy_kcal: number | null;
  fat: number | null;
  saturated_fat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
}

/** A food product from Open Food Facts, normalised by the backend */
export interface Product {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  categories: string | null;
  /** Nutrition data — only present when Open Food Facts has tagged this product */
  nutrition: NutritionData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search History
// ─────────────────────────────────────────────────────────────────────────────

/** A single entry in the user's recent search history */
export interface RecentSearch {
  id: string;
  query: string;
  language: Language;
  createdAt: string; // ISO 8601 string from JSON
}

// ─────────────────────────────────────────────────────────────────────────────
// API Response shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchResponse {
  products: Product[];
  query: string;
  language: Language;
  count: number;
}

export interface HistoryResponse {
  searches: RecentSearch[];
}

export interface AuthMeResponse {
  user: User;
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalResponse {
  url: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
