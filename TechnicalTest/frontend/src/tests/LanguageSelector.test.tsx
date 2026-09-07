/**
 * LanguageSelector component tests for Material UI.
 *
 * Tests that the MUI language selector renders correctly and that selecting
 * a language updates the context (and therefore translated text).
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

function TestHarness({ translationKey }: { translationKey: string }) {
  const { t } = useLanguage();
  return (
    <>
      <LanguageSelector />
      <p data-testid="translated">{t(translationKey)}</p>
    </>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('LanguageSelector (Material UI)', () => {
  it('renders without crashing', () => {
    renderWithProvider(<LanguageSelector />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('defaults to English', () => {
    renderWithProvider(<LanguageSelector />);
    // In MUI Select, the current value is displayed as text inside the combobox
    expect(screen.getByRole('combobox')).toHaveTextContent(/English/i);
  });

  it('shows all four language options when opened', () => {
    renderWithProvider(<LanguageSelector />);
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    expect(screen.getByRole('option', { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Nederlands/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Deutsch/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Français/i })).toBeInTheDocument();
  });

  it('updates the translation context when language is changed to Dutch', () => {
    renderWithProvider(<TestHarness translationKey="search.button" />);

    expect(screen.getByTestId('translated').textContent).toBe('Search');

    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    const dutchOption = screen.getByRole('option', { name: /Nederlands/i });
    fireEvent.click(dutchOption);

    expect(screen.getByTestId('translated').textContent).toBe('Zoeken');
  });

  it('updates the translation context when language is changed to German', () => {
    renderWithProvider(<TestHarness translationKey="search.button" />);

    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    const germanOption = screen.getByRole('option', { name: /Deutsch/i });
    fireEvent.click(germanOption);

    expect(screen.getByTestId('translated').textContent).toBe('Suchen');
  });

  it('updates the translation context when language is changed to French', () => {
    renderWithProvider(<TestHarness translationKey="search.button" />);

    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    const frenchOption = screen.getByRole('option', { name: /Français/i });
    fireEvent.click(frenchOption);

    expect(screen.getByTestId('translated').textContent).toBe('Rechercher');
  });
});
