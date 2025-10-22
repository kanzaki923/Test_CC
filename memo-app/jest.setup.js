// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Setup fake-indexeddb for testing IndexedDB
import 'fake-indexeddb/auto'

// Polyfill for structuredClone (required by fake-indexeddb)
if (!global.structuredClone) {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val))
}

// Mock react-markdown to avoid ESM issues in Jest
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => {
    return <div data-testid="markdown-content">{children}</div>
  },
}))

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}))

jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: () => {},
}))
