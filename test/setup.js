import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Set up jsdom environment globally
globalThis.document = window.document;
globalThis.navigator = window.navigator;
globalThis.window = window;

// Mock browser APIs not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});