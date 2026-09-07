/**
 * Open Food Facts API client.
 *
 * Searches for food products using the Open Food Facts search endpoint.
 * - Passes the selected language code (`lc`) so the API can prioritise
 *   results in that language.
 * - Prefers language-specific name fields (e.g. `product_name_nl`) with
 *   a graceful fallback chain: lang-specific → generic → "Unknown Product".
 * - Extracts nutritional values per 100g from the `nutriments` block.
 * - All fields default to null if missing, so the UI can render gracefully.
 *
 * API docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Nutritional values per 100g of product */
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

/** A normalised product record returned to the client */
export interface Product {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  categories: string | null;
  nutrition: NutritionData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maps our supported language codes to the OFF product_name field prefix */
const LANG_NAME_FIELD: Record<string, string> = {
  en: 'product_name_en',
  nl: 'product_name_nl',
  de: 'product_name_de',
  fr: 'product_name_fr',
};

/** Open Food Facts search endpoint */
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

/**
 * Fields we ask the API to return — requesting only what we need keeps
 * response sizes small and parsing fast.
 */
const REQUESTED_FIELDS = [
  'code',
  '_id',
  'product_name',
  'product_name_en',
  'product_name_nl',
  'product_name_de',
  'product_name_fr',
  'brands',
  'image_front_url',
  'image_url',
  'categories',
  'nutriments',
].join(',');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts a NutritionData object from the raw OFF `nutriments` block.
 * Returns null if nutriments is absent (product not tagged).
 *
 * Note: OFF uses `energy-kcal_100g` (with a hyphen) for kilocalories.
 */
function extractNutrition(nutriments: Record<string, unknown> | null | undefined): NutritionData | null {
  if (!nutriments || Object.keys(nutriments).length === 0) return null;

  const n = (key: string): number | null => {
    const val = nutriments[key];
    return typeof val === 'number' ? val : null;
  };

  return {
    // Some products use the generic "energy_100g" field instead
    energy_kcal: n('energy-kcal_100g') ?? n('energy_100g'),
    fat: n('fat_100g'),
    saturated_fat: n('saturated-fat_100g'),
    carbohydrates: n('carbohydrates_100g'),
    sugars: n('sugars_100g'),
    fiber: n('fiber_100g'),
    proteins: n('proteins_100g'),
    salt: n('salt_100g'),
  };
}

/**
 * Maps a raw OFF product object to our typed Product shape.
 * Tries the language-specific name field first, then falls back through
 * the generic name and finally to "Unknown Product".
 */
function mapProduct(raw: Record<string, unknown>, lang: string): Product {
  const langField = LANG_NAME_FIELD[lang] ?? 'product_name_en';

  const name =
    (raw[langField] as string | undefined) ||
    (raw['product_name'] as string | undefined) ||
    (raw['product_name_en'] as string | undefined) ||
    'Unknown Product';

  return {
    id: (raw['code'] as string) || (raw['_id'] as string) || '',
    name: name.trim(),
    brand: (raw['brands'] as string | null) ?? null,
    imageUrl: (raw['image_front_url'] as string | null) ?? (raw['image_url'] as string | null) ?? null,
    categories: (raw['categories'] as string | null) ?? null,
    nutrition: extractNutrition(raw['nutriments'] as Record<string, unknown> | null),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry {
  timestamp: number;
  products: Product[];
}

const SEARCH_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Searches Open Food Facts for products matching the given query string.
 *
 * @param query - The search term (e.g. "chocolate", "melk")
 * @param lang  - BCP-47 language code: "en" | "nl" | "de" | "fr"
 * @returns     Array of normalised Product objects (empty array on error)
 */
export async function searchProducts(query: string, lang: string = 'en'): Promise<Product[]> {
  const cacheKey = `${query.trim().toLowerCase()}::${lang}`;
  const cached = SEARCH_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.products;
  }

  const response = await axios.get<{ products?: Record<string, unknown>[] }>(OFF_SEARCH_URL, {
    params: {
      search_terms: query,
      lc: lang,          // Language preference — affects result ranking
      action: 'process', // Required by OFF API
      json: 1,           // JSON response format
      page_size: 50,     // Rich page size for catalog pagination
      fields: REQUESTED_FIELDS,
    },
    headers: {
      // Open Food Facts requires identifying the client app
      'User-Agent': 'FoodSearchApp/1.0 (technical-test@example.com)',
    },
    timeout: 10_000, // 10 second timeout
  });

  const rawProducts = response.data?.products ?? [];

  // Filter out products with no barcode (incomplete data) and map to our shape
  const products = rawProducts
    .filter((p) => Boolean(p['code'] || p['_id']))
    .map((p) => mapProduct(p, lang));

  SEARCH_CACHE.set(cacheKey, {
    timestamp: Date.now(),
    products,
  });

  return products;
}
