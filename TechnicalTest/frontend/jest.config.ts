import type { Config } from 'jest';
import nextJest from 'next/jest.js';

/**
 * Create a Jest configuration using Next.js' helper.
 * This automatically:
 *  - Compiles Next.js app with the correct babel/SWC transforms
 *  - Sets up module aliases (@/) from tsconfig.json
 *  - Mocks CSS and image imports
 */
const createJestConfig = nextJest({
  // Path to the Next.js app root (where next.config.ts lives)
  dir: './',
});

const config: Config = {
  // jsdom simulates a browser environment for React component tests
  testEnvironment: 'jsdom',

  // Run @testing-library/jest-dom matchers (toBeInTheDocument, etc.) before each test suite
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Resolve @/ imports to src/ (mirrors tsconfig paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Match test files in src/tests/
  testMatch: ['<rootDir>/src/tests/**/*.test.tsx', '<rootDir>/src/tests/**/*.test.ts'],

  // Coverage from all source files except generated ones
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/app/layout.tsx',
    '!src/**/*.d.ts',
  ],
};

// createJestConfig wraps our config to inject Next.js transforms
export default createJestConfig(config);
