"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = searchProducts;
const axios_1 = __importDefault(require("axios"));
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
/** Maps our supported language codes to the OFF product_name field prefix */
const LANG_NAME_FIELD = {
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
function extractNutrition(nutriments) {
    if (!nutriments || Object.keys(nutriments).length === 0)
        return null;
    const n = (key) => {
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
function mapProduct(raw, lang) {
    const langField = LANG_NAME_FIELD[lang] ?? 'product_name_en';
    const name = raw[langField] ||
        raw['product_name'] ||
        raw['product_name_en'] ||
        'Unknown Product';
    return {
        id: raw['code'] || raw['_id'] || '',
        name: name.trim(),
        brand: raw['brands'] ?? null,
        imageUrl: raw['image_front_url'] ?? raw['image_url'] ?? null,
        categories: raw['categories'] ?? null,
        nutrition: extractNutrition(raw['nutriments']),
    };
}
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
async function searchProducts(query, lang = 'en') {
    const response = await axios_1.default.get(OFF_SEARCH_URL, {
        params: {
            search_terms: query,
            lc: lang, // Language preference — affects result ranking
            action: 'process', // Required by OFF API
            json: 1, // JSON response format
            page_size: 24, // Max results per page
            fields: REQUESTED_FIELDS,
        },
        headers: {
            // Open Food Facts requires identifying the client app
            'User-Agent': 'FoodSearchApp/1.0 (technical-test@example.com)',
        },
        timeout: 10000, // 10 second timeout
    });
    const rawProducts = response.data?.products ?? [];
    // Filter out products with no barcode (incomplete data) and map to our shape
    return rawProducts
        .filter((p) => Boolean(p['code'] || p['_id']))
        .map((p) => mapProduct(p, lang));
}
