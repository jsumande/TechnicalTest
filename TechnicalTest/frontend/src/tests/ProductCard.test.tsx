/**
 * ProductCard component tests for Material UI.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';
import { LanguageProvider } from '@/context/LanguageContext';
import type { Product } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('@/lib/api', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element
    const { fill, ...rest } = props;
    return <img {...rest} alt={props.alt} />;
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const mockProductWithNutrition: Product = {
  id: '3017620422003',
  name: 'Nutella Chocolate Hazelnut Spread',
  brand: 'Ferrero',
  imageUrl: 'https://images.openfoodfacts.org/nutella.jpg',
  categories: 'Spreads, Sweet spreads, Hazelnut spreads',
  nutrition: {
    energy_kcal: 539,
    fat: 30.9,
    saturated_fat: 10.6,
    carbohydrates: 57.5,
    sugars: 56.3,
    fiber: 0,
    proteins: 6.3,
    salt: 0.107,
  },
};

const mockProductNoBrand: Product = {
  ...mockProductWithNutrition,
  brand: null,
  imageUrl: null,
  categories: null,
};

const mockProductNoNutrition: Product = {
  ...mockProductWithNutrition,
  nutrition: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderCard(product: Product, isSubscribed: boolean) {
  return render(
    <LanguageProvider>
      <ProductCard product={product} isSubscribed={isSubscribed} />
    </LanguageProvider>,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ProductCard (Material UI)', () => {
  describe('Basic rendering', () => {
    it('renders the product name', () => {
      renderCard(mockProductWithNutrition, false);
      expect(screen.getByText('Nutella Chocolate Hazelnut Spread')).toBeInTheDocument();
    });

    it('renders the brand name', () => {
      renderCard(mockProductWithNutrition, false);
      expect(screen.getByText('Ferrero')).toBeInTheDocument();
    });

    it('renders a fallback when brand is null', () => {
      renderCard(mockProductNoBrand, false);
      expect(screen.getByText(/Unknown brand/i)).toBeInTheDocument();
    });

    it('renders categories when available', () => {
      renderCard(mockProductWithNutrition, false);
      expect(screen.getByText(/Spreads/)).toBeInTheDocument();
    });

    it('renders image when imageUrl is provided', () => {
      renderCard(mockProductWithNutrition, false);
      const img = screen.getByRole('img', { name: 'Nutella Chocolate Hazelnut Spread' });
      expect(img).toBeInTheDocument();
    });

    it('renders image placeholder when imageUrl is null', () => {
      renderCard(mockProductNoBrand, false);
      expect(screen.getByText(/No image available/i)).toBeInTheDocument();
    });
  });

  describe('Subscription gating', () => {
    it('shows subscription banner when NOT subscribed', () => {
      renderCard(mockProductWithNutrition, false);
      const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });
      expect(subscribeBtn).toBeInTheDocument();
    });

    it('shows nutrition panel when subscribed', () => {
      renderCard(mockProductWithNutrition, true);
      expect(screen.getByText(/Nutrition Facts/i)).toBeInTheDocument();
    });

    it('hides nutrition data from unsubscribed users', () => {
      renderCard(mockProductWithNutrition, false);
      expect(screen.queryByText(/Nutrition Facts/i)).not.toBeInTheDocument();
    });
  });

  describe('Nutrition panel', () => {
    it('renders energy value when subscribed', () => {
      renderCard(mockProductWithNutrition, true);
      expect(screen.getByText('539.0')).toBeInTheDocument();
    });

    it('shows "not available" message when nutrition is null', () => {
      renderCard(mockProductNoNutrition, true);
      expect(
        screen.getByText(/Nutrition information not available for this product/i),
      ).toBeInTheDocument();
    });
  });
});
