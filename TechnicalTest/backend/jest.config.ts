import type { Config } from 'jest';

/**
 * Jest configuration for the backend.
 * Uses ts-jest to compile TypeScript on-the-fly during tests.
 * setupFiles loads environment variables before any test runs.
 */
const config: Config = {
  // Use ts-jest preset to handle TypeScript without a separate compile step
  preset: 'ts-jest',

  // Node environment for backend tests (not jsdom)
  testEnvironment: 'node',

  // Only look for tests inside src/
  roots: ['<rootDir>/src'],

  // Match any file ending in .test.ts
  testMatch: ['**/*.test.ts'],

  // Supported file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Load environment variables before tests run (but after jest environment is set up)
  setupFiles: ['<rootDir>/src/tests/setup.ts'],

  // Collect coverage from all source files except the seed script
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/seed.ts',
    '!src/tests/**',
  ],

  // Use the modern 'transform' config instead of deprecated 'globals' approach
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};

export default config;
