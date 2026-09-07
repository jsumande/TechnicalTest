"use strict";
/**
 * Search routes.
 *
 * GET /api/search         — Search Open Food Facts and save to history
 * GET /api/search/history — Return the 10 most recent searches
 *
 * Both routes require authentication (JWT cookie).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const openFoodFacts_1 = require("../services/openFoodFacts");
const db_1 = require("../db");
const router = (0, express_1.Router)();
/** Language codes we support — anything else is normalised to "en" */
const VALID_LANGS = ['en', 'nl', 'de', 'fr'];
/** Maximum number of recent searches kept per user */
const MAX_HISTORY = 50;
// Apply authentication to all search routes
router.use(auth_1.authenticate);
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/search/history  (must be defined BEFORE /api/search to avoid
//                           "history" being matched as a query string)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns the 10 most recent search queries made by the current user.
 * Used to populate the "Recent Searches" chip list on the home page.
 */
router.get('/history', async (req, res) => {
    try {
        const searches = await db_1.prisma.recentSearch.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10, // Only show the 10 most recent
            select: {
                id: true,
                query: true,
                language: true,
                createdAt: true,
            },
        });
        return res.status(200).json({ searches });
    }
    catch (err) {
        console.error('[GET /search/history] Error:', err);
        return res.status(500).json({ error: 'Failed to fetch search history' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/search?q=<query>&lang=<lang>
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Searches Open Food Facts for products matching the query term.
 *
 * Query parameters:
 *   q    - Required. The search term.
 *   lang - Optional. Language code (en/nl/de/fr). Defaults to "en".
 *
 * Side effects:
 *   - Saves the search query to the user's RecentSearch history.
 *   - Trims history to MAX_HISTORY entries (oldest removed).
 */
router.get('/', async (req, res) => {
    const q = req.query.q?.trim();
    const rawLang = req.query.lang;
    // Validate query parameter
    if (!q || q.length === 0) {
        return res.status(400).json({ error: 'Search query parameter "q" is required' });
    }
    // Normalise language to a supported code
    const lang = VALID_LANGS.includes(rawLang)
        ? rawLang
        : 'en';
    try {
        // Call the Open Food Facts API
        const products = await (0, openFoodFacts_1.searchProducts)(q, lang);
        // Persist the search query (fire-and-forget error handling — a failed save
        // should not prevent the search results from being returned)
        try {
            await db_1.prisma.recentSearch.create({
                data: {
                    userId: req.user.id,
                    query: q,
                    language: lang,
                },
            });
            // Prune history: keep only the MAX_HISTORY most recent entries
            const allSearches = await db_1.prisma.recentSearch.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            });
            if (allSearches.length > MAX_HISTORY) {
                const idsToDelete = allSearches.slice(MAX_HISTORY).map((s) => s.id);
                await db_1.prisma.recentSearch.deleteMany({
                    where: { id: { in: idsToDelete } },
                });
            }
        }
        catch (historyErr) {
            // Log but don't fail the request if history persistence fails
            console.warn('[GET /search] Failed to save search history:', historyErr);
        }
        return res.status(200).json({
            products,
            query: q,
            language: lang,
            count: products.length,
        });
    }
    catch (err) {
        console.error('[GET /search] Open Food Facts error:', err);
        return res.status(502).json({
            error: 'Failed to search products. The product database may be temporarily unavailable.',
        });
    }
});
exports.default = router;
