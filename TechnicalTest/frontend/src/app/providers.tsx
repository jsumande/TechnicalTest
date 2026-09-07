'use client';

/**
 * Client-side providers wrapper.
 *
 * Next.js App Router layout components are Server Components by default.
 * Context providers and ThemeProvider must be Client Components ('use client').
 * This wrapper allows layout.tsx (a Server Component) to render providers
 * without turning the entire layout into a Client Component.
 */

import { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Composes all context and theme providers in the correct order:
 *  1. ThemeProvider & CssBaseline — MUI styling foundation
 *  2. LanguageProvider — makes t() available for i18n
 *  3. AuthProvider — provides session and subscription state
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
