/**
 * Root layout — Server Component.
 *
 * Wraps all pages with:
 *  - HTML lang attribute (set to "en" as the base — actual language is
 *    client-side via LanguageContext since we don't use i18n routing)
 *  - Global CSS
 *  - Client-side context providers (Providers wrapper)
 *  - Persistent Navbar
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';

// Load the Inter font — subset to latin for smaller bundle
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodSearch — Find packaged food products',
  description:
    'Search for packaged food products using Open Food Facts. View nutrition details with a subscription.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/*
          Providers wraps everything with LanguageContext and AuthContext.
          suppressHydrationWarning on <html> prevents a React warning caused
          by the language being set client-side after hydration.
        */}
        <Providers>
          {/* Persistent navigation bar */}
          <Navbar />

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
            <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-400">
              Powered by{' '}
              <a
                href="https://world.openfoodfacts.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Open Food Facts
              </a>
              {' '}— Open data, open source.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
