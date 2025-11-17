module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/test/**/*.test.ts', '**/test/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/client/**', // Exclude client code from coverage
  ],
  testTimeout: 15000,
  verbose: true,
  // Show console.log output during tests
  silent: false,
  // Don't hide console output
  setupFilesAfterEnv: [],
};
