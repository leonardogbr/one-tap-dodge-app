let initI18n: typeof import('../src/i18n').initI18n;
let changeLanguage: typeof import('../src/i18n').changeLanguage;
let RNLocalize: { getLocales: jest.Mock };
let mockI18n: {
  use: jest.Mock;
  init: jest.Mock;
  changeLanguage: jest.Mock;
};

const loadModules = () => {
  jest.resetModules();
  jest.doMock('i18next', () => {
    mockI18n = {
      use: jest.fn().mockReturnThis(),
      init: jest.fn(),
      changeLanguage: jest.fn(),
    };
    return { __esModule: true, default: mockI18n, ...mockI18n };
  });
  jest.doMock('react-i18next', () => ({
    initReactI18next: {},
  }));
  jest.doMock('react-native-localize', () => ({
    getLocales: jest.fn(),
  }));
  const i18nModule = require('../src/i18n');
  initI18n = i18nModule.initI18n;
  changeLanguage = i18nModule.changeLanguage;
  RNLocalize = require('react-native-localize');
};

describe('i18n', () => {
  beforeEach(() => {
    loadModules();
    jest.clearAllMocks();
  });

  it('initializes using system locale mapping', () => {
    RNLocalize.getLocales.mockReturnValue([
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
    RNLocalize.getLocales.mockReturnValue([
      { languageTag: 'fr-FR' },
    ]);

    initI18n('system');

    expect(mockI18n.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: 'en',
      })
    );
  });

  it('defaults to English when device locales are missing', () => {
    RNLocalize.getLocales.mockReturnValue([]);

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
    RNLocalize.getLocales.mockReturnValue([
      { languageTag: 'es-MX' },
    ]);

    changeLanguage('system');
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('es');

    changeLanguage('fr' as unknown as 'en');
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
  });
});
