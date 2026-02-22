global.__DEV__ = false;

jest.mock(
  'react-native/Libraries/Animated/NativeAnimatedHelper',
  () => ({}),
  { virtual: true }
);

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('react-native-sound', () => {
  function Sound(_file, _bundle, cb) {
    this.play = jest.fn();
    this.stop = jest.fn((c) => c && c());
    this.setVolume = jest.fn();
    this.setNumberOfLoops = jest.fn();
    this.release = jest.fn();
    Promise.resolve().then(() => cb && cb(null));
  }
  Sound.MAIN_BUNDLE = '';
  Sound.setCategory = jest.fn();
  return Sound;
});
