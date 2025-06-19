import '@testing-library/jest-dom'

// Suppress act() warnings from async state updates in hooks during tests
// These warnings are from internal hook behavior and don't affect functionality
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('An update to') &&
    args[0].includes('was not wrapped in act')
  ) {
    return;
  }
  originalError.call(console, ...args);
};
