// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgres://username:password@localhost:5432/test_db';

// Override console.log for cleaner test output
const originalLog = console.log;
console.log = (...args) => {
  if (!args[0]?.includes('Server is running')) {
    originalLog.apply(console, args);
  }
};

module.exports = {};
