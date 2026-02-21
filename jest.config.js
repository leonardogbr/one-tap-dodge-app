module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/engine/**/*.ts',
    '!<rootDir>/src/engine/types.ts',
    '<rootDir>/src/state/**/*.ts',
    '<rootDir>/src/services/**/*.ts',
    '<rootDir>/src/hooks/usePersistedStore.ts',
    '<rootDir>/src/hooks/useTheme.ts',
    '<rootDir>/src/i18n/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
