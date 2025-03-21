import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global objects like localStorage, fetch, etc.
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock environment variables
vi.mock('process', () => ({
  env: {
    OPENAI_API_KEY: 'test-api-key',
    REDDIT_CLIENT_ID: 'test-client-id',
    REDDIT_CLIENT_SECRET: 'test-client-secret',
    REDDIT_USERNAME: 'test-username',
    REDDIT_PASSWORD: 'test-password',
  },
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});