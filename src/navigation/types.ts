/**
 * Root stack param list — shared for all screens.
 */

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Game: undefined;
  GameOver: {
    score: number;
    isNewBest: boolean;
    runTimeMs: number;
    nearMisses: number;
    coins: number;
    canRevive: boolean;
  };
  Skins: undefined;
  Settings: undefined;
  HowToPlay: undefined;
  Challenges: undefined;
};
