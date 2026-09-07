# 🥦 FoodSearch — Technical Test

A full-stack food product search & catalog application built with **Next.js 14**, **Material UI**, **Express**, **Prisma**, **MySQL 8 (Docker)**, and **Stripe**.

Users can search for packaged food products (powered by the Open Food Facts API), view basic product information in 4 languages, sort and filter items dynamically in Grid or List view, and unlock detailed nutritional data with a monthly Stripe subscription.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started & Setup](#getting-started--setup)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Running Tests](#running-tests)
7. [Stripe Setup](#stripe-setup)
8. [Internationalization (i18n) Approach](#internationalization-i18n-approach)
9. [Technical Decisions & Architecture](#technical-decisions--architecture)
10. [Known Limitations](#known-limitations)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) · React 18 · TypeScript · Material UI (MUI) · Emotion |
| **Backend** | Express 4 · TypeScript · Prisma ORM · In-memory TTL Cache |
| **Database** | MySQL 8 (via Docker Compose) |
| **Authentication** | JWT stored in HTTP-only, SameSite cookies |
| **Payments** | Stripe Checkout + Webhooks + Direct Sync Fallback |
| **Product Database** | Open Food Facts REST API |
| **Testing** | Jest · Supertest · React Testing Library |

---

## Project Structure

```
TechnicalTest/
├── docker-compose.yml             # MySQL 8 service container configuration
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # User + RecentSearch models
│   ├── src/
│   │   ├── index.ts               # Express app entry point & middleware
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── seed.ts                # Demo user seeder (demo@example.com)
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT authentication middleware
│   │   │   └── subscription.ts   # Subscription access guard
│   │   ├── routes/
│   │   │   ├── auth.ts            # Login / logout / me
│   │   │   ├── search.ts          # Product search + search history
│   │   │   └── subscription.ts   # Stripe checkout / portal / sync / webhook
│   │   ├── services/
│   │   │   ├── openFoodFacts.ts  # Open Food Facts API client + 5-min TTL Cache
│   │   │   └── stripe.ts         # Stripe helpers & direct subscription sync
│   │   └── tests/
│   │       ├── setup.ts           # Test environment mocks
│   │       ├── auth.test.ts       # Authentication route tests (12 tests)
│   │       ├── search.test.ts     # Search & history route tests (11 tests)
│   │       └── subscription.test.ts # Subscription & webhook tests (14 tests)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx         # Root layout with MUI theme & context providers
    │   │   ├── providers.tsx      # Client-side context wrapper
    │   │   ├── page.tsx           # Catalog search, pagination, filtering & view toggle
    │   │   ├── login/page.tsx     # Sign-in form
    │   │   └── subscription/page.tsx # Subscription status & Stripe portal management
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── LanguageSelector.tsx # EN / NL / DE / FR switcher
    │   │   ├── SearchBar.tsx        # Search input with loading states
    │   │   ├── CatalogToolbar.tsx   # Dynamic category filters, sorting & grid/list toggle
    │   │   ├── ProductCard.tsx      # Pro-grade compact card & list row with nutrition preview
    │   │   ├── ProductDetailModal.tsx # Quick-view dialog with full specs & macro meter
    │   │   ├── ProductSkeleton.tsx  # Shimmer skeleton loading placeholder
    │   │   ├── NutritionPanel.tsx   # Per-100g nutritional facts table
    │   │   ├── SubscriptionBanner.tsx # Compact subscription CTA for free users
    │   │   └── RecentSearches.tsx   # Clickable search history chips
    │   ├── context/
    │   │   ├── AuthContext.tsx      # User session state & refresh handler
    │   │   └── LanguageContext.tsx  # Active language & translation helper
    │   ├── i18n/
    │   │   ├── en.ts · nl.ts · de.ts · fr.ts # Translation dictionaries
    │   │   └── index.ts
    │   ├── lib/api.ts               # Axios instance with credentials
    │   ├── types/index.ts
    │   └── tests/
    │       ├── LanguageSelector.test.tsx
    │       └── ProductCard.test.tsx
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

---

## Getting Started & Setup

### Prerequisites

- **Node.js** 18+
- **Docker Desktop** (for MySQL)
- **npm** 9+

---

### Step 1: Start MySQL via Docker

From the project root:

```bash
docker compose up -d
```

This spins up a dedicated MySQL 8 container with healthchecks:
- **Port:** `3309` (mapped from container `3306` to prevent conflicts with local MySQL)
- **Database:** `foodsearch`
- **Username:** `root`
- **Password:** `password`

To stop the container when done:
```bash
docker compose down
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`):
```bash
cd backend
cp .env.example .env
```

Ensure `DATABASE_URL` is set to:
```env
DATABASE_URL="mysql://root:password@localhost:3309/foodsearch"
JWT_SECRET="replace-with-a-strong-random-secret"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
```

#### Frontend (`frontend/.env.local`):
```bash
cd ../frontend
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

### Step 3: Install Dependencies & Seed Database

```bash
# Backend setup
cd backend
npm install
npx prisma db push
npm run seed

# Frontend setup
cd ../frontend
npm install
```

> **Demo Credentials:**
> - **Email:** `demo@example.com`
> - **Password:** `password`

---

## Running the Application

Open two terminal windows:

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

Navigate to **http://localhost:3000** and sign in with the demo credentials.

---

## Running Tests

All test suites use mocks for external services (Open Food Facts, Prisma, Stripe) so tests run instantly and offline without requiring active databases or API keys.

```bash
# Backend Test Suite (37 tests across Auth, Search, and Subscriptions)
cd backend
npm test

# Frontend Test Suite (17 tests across Components, i18n, and Subscription Gating)
cd frontend
npm test
```

---

## Stripe Setup

1. **Stripe Test Mode:** Sign up at [stripe.com](https://stripe.com) and ensure **Test Mode** is toggled ON.
2. **Create a Recurring Subscription Product:**
   - Go to **Product Catalogue** → **+ Add Product**
   - Name: `FoodSearch Pro`
   - Pricing: **Recurring · Monthly** (e.g. `$4.99 / month`)
   - Copy the resulting **Price ID** (`price_...`) into `STRIPE_PRICE_ID` in `backend/.env`.
3. **API Keys:**
   - Copy **Secret Key** (`sk_test_...`) to `STRIPE_SECRET_KEY` in `backend/.env`.
   - Copy **Publishable Key** (`pk_test_...`) to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `frontend/.env.local`.
4. **Local Webhook Forwarding (Optional):**
   ```bash
   stripe listen --forward-to localhost:4000/api/subscription/webhook
   ```
   *(Note: The app also includes a fallback sync endpoint `POST /api/subscription/sync` that automatically syncs subscription status directly with Stripe when returning from checkout, even if the Stripe CLI is not running!)*

---

## Internationalization (i18n) Approach

### Strategy: Type-Safe Lightweight i18n
Rather than adding heavy runtime dependencies, we implemented a typed custom i18n system tailored for multi-language food metadata:

1. **4 Supported Languages:** English (`en`), Dutch (`nl`), German (`de`), and French (`fr`).
2. **Canonical Schema Typing:** `en.ts` defines the canonical `Translations` interface. `nl.ts`, `de.ts`, and `fr.ts` implement this interface, guaranteeing zero missing translation keys at compile time.
3. **Dynamic Placeholder Interpolation:** Supports parameter replacement via `{{key}}` syntax (e.g. `{{count}} products found`).
4. **Instant Context Switching & LocalStorage Persistence:** `LanguageContext` synchronises language changes across all UI components and stores user preference in `localStorage`.
5. **Open Food Facts API Routing & Name Fallbacks:**
   - Passes the active language code (`lc`) to Open Food Facts to prioritize search rankings in that language.
   - Fallback hierarchy for product titles:
     `product_name_{lang} → product_name → product_name_en → "Unknown Product"`

---

## Technical Decisions & Architecture

### 1. Catalog Production Design & Proportions
- **Compact Card Proportions:** Designed with a 135px media frame and structured padding to prevent oversized cards, ensuring high-density browsing comparable to top grocery e-commerce platforms.
- **Responsive 4-Column Grid:** Automatically switches between 1-column (mobile), 2-column (tablet), 3-column (laptop), and 4-column (desktop).
- **Grid vs. List View Toggle:** Allows users to switch between visual card browsing and a dense, horizontal row comparison view.
- **Quick View Modal:** Users can click "Quick View" to inspect high-resolution product photography, barcode ID, full category chips, and macro breakdown without navigating away.

### 2. Dual-Layer Caching Strategy
- **Frontend In-Memory Cache:** `useRef<Map<string, Product[]>>` caches recent search queries client-side, making category filter toggles, pagination changes, and repeat queries instantaneous with 0 loading delay.
- **Backend 5-Minute TTL Cache:** [`openFoodFacts.ts`](file:///c:/Users/ptiadmin/Desktop/TechnicalTest/backend/src/services/openFoodFacts.ts) maintains an in-memory cache of API query responses for 5 minutes and queries 50 items per term, reducing external API latency to `< 5ms`.

### 3. Catalog Pagination
- Integrated Material UI `<Pagination />` component displaying 12 items per page with page range metrics (e.g. *Showing 1–12 of 48 products*) and smooth scroll-to-top on page change.

### 4. Dynamic Category Extraction & Sorting
- Category filter pills are dynamically derived from the returned result set and sorted by item frequency.
- Client-side sorting allows sorting by *Relevance*, *Name (A→Z / Z→A)*, *Highest Calories*, *Lowest Sugar*, and *Highest Protein*.

### 5. Robust Stripe Subscription Sync
- In addition to standard Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`), a dedicated `POST /api/subscription/sync` route checks the Stripe API directly upon checkout return. This guarantees immediate activation even during local development without Stripe CLI webhook tunneling.

### 6. Security & Session Management
- **HTTP-Only Cookies:** JWT authentication tokens are stored in `HttpOnly`, `SameSite=Lax` cookies, shielding authentication tokens from client-side XSS attacks.
- **Real-Time Subscription Verification:** Protected endpoints (`/api/auth/me`, `/api/subscription/sync`) query the database on each request to prevent stale JWT claims.

---

## Known Limitations

| Area | Current Behavior & Production Considerations |
|---|---|
| **Single Demo User** | The application is configured with a seeded demo user (`demo@example.com`). In a full production deployment, a user registration flow and password reset service would be added. |
| **Open Food Facts Data Quality** | Open Food Facts is an open community database; some products may have incomplete category tags or missing localized titles in certain languages. |
| **In-Memory Cache Distribution** | The current search cache is stored in-memory per Node process. In a distributed multi-instance deployment, Redis would be used for shared caching. |
| **Stripe Webhook Idempotency** | Webhook events update the database idempotently via `updateMany`. In enterprise scale, logging processed Stripe event IDs prevents duplicate processing. |
| **HTTPS in Development** | Cookies are configured without the `Secure` flag in `development` mode to support `localhost` testing over HTTP. The `Secure` flag is automatically enabled when `NODE_ENV=production`. |
