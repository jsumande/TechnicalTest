/** @type {import('jest').Config} */
const nextJest = require('next/jest');

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

/** @type {import('jest').Config} */
const config = {
  // jsdom simulates a browser environment for React component tests
  testEnvironment: 'jsdom',

  // Run @testing-library/jest-dom matchers after test framework is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

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
module.exports = createJestConfig(config);
