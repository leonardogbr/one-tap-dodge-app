/**
 * Design System - Icon Component
 * Renders Material Icons or MaterialCommunityIcons via react-native-vector-icons.
 * Use `community` prop for icons from the MaterialCommunityIcons set (e.g. "target", "bullseye").
 * Falls back to character mapping for unknown names.
 */

import React from 'react';
import { Text, TextStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getIconChar, isIconName, type IconName } from '../tokens/icons';

export interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: TextStyle;
  /** Use MaterialCommunityIcons set instead of MaterialIcons. */
  community?: boolean;
}

const DEFAULT_SIZE = 24;

/** Material Icons use hyphens; our tokens use underscores. */
function toMaterialIconName(name: string): string {
  return name.replace(/_/g, '-');
}

export function Icon({ name, size = DEFAULT_SIZE, color, style, community }: IconProps) {
  if (community) {
    return (
      <MaterialCommunityIcons
        name={toMaterialIconName(name)}
        size={size}
        color={color}
        style={style}
      />
    );
  }
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
