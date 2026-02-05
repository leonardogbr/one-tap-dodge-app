const mockI18n = {
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
  changeLanguage: jest.fn(),
};

jest.mock('i18next', () => ({
  __esModule: true,
  default: mockI18n,
  ...mockI18n,
}));
jest.mock('react-i18next', () => ({
  initReactI18next: {},
}));
jest.mock('react-native-localize', () => ({
  getLocales: jest.fn(),
}));

import { initI18n, changeLanguage } from '../src/i18n';
import * as RNLocalize from 'react-native-localize';

describe('i18n', () => {
  beforeEach(() => {
    mockI18n.use.mockClear();
    mockI18n.init.mockClear();
    mockI18n.changeLanguage.mockClear();
  });

  it('initializes using system locale mapping', () => {
    (RNLocalize.getLocales as jest.Mock).mockReturnValue([
      { languageTag: 'pt-PT' },
    ]);

    initI18n('system');

    expect(mockI18n.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: 'pt-BR',
        fallbackLng: 'en',
      })
    );
  });

  it('falls back to English for unsupported system locales', () => {
    (RNLocalize.getLocales as jest.Mock).mockReturnValue([
      { languageTag: 'fr-FR' },
    ]);

    initI18n('system');

    expect(mockI18n.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: 'en',
      })
    );
  });

  it('initializes using explicit locale and falls back on unsupported', () => {
    initI18n('es');
    expect(mockI18n.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: 'es',
      })
    );

    initI18n('fr' as unknown as 'en');
    expect(mockI18n.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: 'en',
      })
    );
  });

  it('changes language based on system or explicit locale', () => {
    (RNLocalize.getLocales as jest.Mock).mockReturnValue([
      { languageTag: 'es-MX' },
    ]);

    changeLanguage('system');
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('es');

    changeLanguage('fr' as unknown as 'en');
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
  });
});
