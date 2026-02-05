/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('../src/hooks/usePersistedStore', () => ({
  usePersistedStore: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children?: unknown }) => children ?? null,
}));

jest.mock('../src/services/ads', () => ({
  initAds: jest.fn(),
}));

jest.mock('../src/i18n', () => ({
  initI18n: jest.fn(),
  changeLanguage: jest.fn(),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
