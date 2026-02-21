declare module 'react-native-vector-icons' {
  import { ComponentType } from 'react';
  import { TextStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }

  export function createIconSet(
    glyphMap: Record<string, number>,
    fontFamily: string,
    fontFile?: string,
  ): ComponentType<IconProps>;
}
