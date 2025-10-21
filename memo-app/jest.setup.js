// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Setup fake-indexeddb for testing IndexedDB
import 'fake-indexeddb/auto'

// Polyfill for structuredClone (required by fake-indexeddb)
if (!global.structuredClone) {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val))
}
