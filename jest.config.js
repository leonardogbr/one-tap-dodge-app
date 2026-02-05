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
    '<rootDir>/src/theme/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
