/**
 * Design System - Icon Component
 * Renders Material Symbols Outlined icons using the font directly (no createIconSet).
 * Falls back to character mapping for unknown names.
 */

import React from 'react';
import { Platform, Text, TextStyle } from 'react-native';
import glyphMap from '../tokens/MaterialSymbolsOutlined.json';
import { getIconChar, isIconName, type IconName } from '../tokens/icons';

const FONT_FAMILY = Platform.select({
  ios: 'Material Symbols Outlined',
  default: 'MaterialSymbolsOutlined',
});

const typedGlyphMap: Record<string, number> = glyphMap;

export interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

const DEFAULT_SIZE = 24;

export function Icon({ name, size = DEFAULT_SIZE, color, style }: IconProps) {
  const underscoreName = name.replace(/-/g, '_');
  const codepoint = typedGlyphMap[underscoreName];

  if (codepoint != null) {
    return (
      <Text
        style={[
          {
            fontFamily: FONT_FAMILY,
            fontSize: size,
            color,
            fontWeight: 'normal',
            fontStyle: 'normal',
          },
          style,
        ]}
        selectable={false}
      >
        {String.fromCodePoint(codepoint)}
      </Text>
    );
  }

  if (isIconName(name)) {
    const char = getIconChar(name);
    const textStyle: TextStyle = {
      fontSize: size,
      ...(color != null && { color }),
    };
    return <Text style={[textStyle, style]}>{char}</Text>;
  }

  const textStyle: TextStyle = {
    fontSize: size,
    ...(color != null && { color }),
  };
  return <Text style={[textStyle, style]}>{name}</Text>;
}
