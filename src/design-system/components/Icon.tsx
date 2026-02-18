/**
 * Design System - Icon Component
 * Renders Material Icons (Material Symbols–aligned names) via react-native-vector-icons.
 * Falls back to character mapping for unknown names.
 */

import React from 'react';
import { Text, TextStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getIconChar, isIconName, type IconName } from '../tokens/icons';

export interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

const DEFAULT_SIZE = 24;

/** Material Icons use hyphens; our tokens use underscores. */
function toMaterialIconName(name: string): string {
  return name.replace(/_/g, '-');
}

export function Icon({ name, size = DEFAULT_SIZE, color, style }: IconProps) {
  if (isIconName(name)) {
    return (
      <MaterialIcons
        name={toMaterialIconName(name) as never}
        size={size}
        color={color}
        style={style}
      />
    );
  }
  const char = getIconChar(name);
  const textStyle: TextStyle = {
    fontSize: size,
    ...(color != null && { color }),
  };
  return <Text style={[textStyle, style]}>{char}</Text>;
}
