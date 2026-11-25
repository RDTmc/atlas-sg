module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db.js',
    '!src/openapi.json'
  ],
  coverageDirectory: '<rootDir>/__tests__/coverage',
  verbose: true,
  testTimeout: 10000,
  setupFiles: []
};
