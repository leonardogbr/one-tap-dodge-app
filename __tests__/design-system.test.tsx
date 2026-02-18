/**
 * Design System Tests
 * Tests for design system tokens and components
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, Button, Card } from '../src/design-system';
import { spacing, borderRadius, typography, darkColors, lightColors } from '../src/design-system/tokens';

// Mock useTheme hook
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#0d1117',
      backgroundLight: '#161b22',
      backgroundCard: '#21262d',
      primary: '#38e8ff',
      primaryDim: '#38e8ff40',
      onPrimary: '#000',
      text: '#e6edf3',
      textMuted: '#8b949e',
      danger: '#f85149',
      success: '#3fb950',
      obstacle: '#e53935',
    },
    isDark: true,
  }),
}));

// Mock useSafeAreaInsets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock PressableScale
jest.mock('../src/components/PressableScale', () => ({
  PressableScale: ({ children, onPress, style, disabled }: any) => {
    const React = require('react');
    const { TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} style={style}>
        {children}
      </TouchableOpacity>
    );
  },
}));

describe('Design System Tokens', () => {
  describe('Spacing', () => {
    it('should have correct spacing values', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
    });
  });

  describe('Border Radius', () => {
    it('should have correct border radius values', () => {
      expect(borderRadius.xs).toBe(4);
      expect(borderRadius.sm).toBe(8);
      expect(borderRadius.md).toBe(12);
      expect(borderRadius.lg).toBe(16);
      expect(borderRadius.xl).toBe(20);
      expect(borderRadius.full).toBe(999);
    });
  });

  describe('Typography', () => {
    it('should have correct typography variants', () => {
      expect(typography.h1.fontSize).toBe(32);
      expect(typography.h1.fontWeight).toBe('800');
      expect(typography.body.fontSize).toBe(16);
      expect(typography.button.fontSize).toBe(18);
      expect(typography.button.fontWeight).toBe('700');
    });
  });

  describe('Colors', () => {
    it('should have dark colors defined', () => {
      expect(darkColors.background).toBe('#0d1117');
      expect(darkColors.primary).toBe('#38e8ff');
      expect(darkColors.text).toBe('#e6edf3');
    });

    it('should have light colors defined', () => {
      expect(lightColors.background).toBe('#f0f4f8');
      expect(lightColors.primary).toBe('#0ea5e9');
      expect(lightColors.text).toBe('#1e293b');
    });
  });
});

describe('Design System Components', () => {
  describe('Text', () => {
    it('should render text with default variant', () => {
      const tree = ReactTestRenderer.create(<Text>Hello World</Text>);
      expect(tree).toBeTruthy();
    });

    it('should render text with h1 variant', () => {
      const tree = ReactTestRenderer.create(<Text variant="h1">Title</Text>);
      expect(tree).toBeTruthy();
    });

    it('should render text with primary color', () => {
      const tree = ReactTestRenderer.create(<Text color="primary">Primary Text</Text>);
      expect(tree).toBeTruthy();
    });
  });

  describe('Button', () => {
    it('should render button with title', () => {
      const onPress = jest.fn();
      const tree = ReactTestRenderer.create(<Button title="Click Me" onPress={onPress} />);
      expect(tree).toBeTruthy();
    });

    it('should render button with icon', () => {
      const onPress = jest.fn();
      const tree = ReactTestRenderer.create(<Button title="Click" onPress={onPress} icon="▶" />);
      expect(tree).toBeTruthy();
    });

    it('should render disabled button', () => {
      const onPress = jest.fn();
      const tree = ReactTestRenderer.create(<Button title="Disabled" onPress={onPress} disabled />);
      expect(tree).toBeTruthy();
    });

    it('should render button with different variants', () => {
      const onPress = jest.fn();
      const primaryTree = ReactTestRenderer.create(<Button title="Primary" onPress={onPress} variant="primary" />);
      const secondaryTree = ReactTestRenderer.create(<Button title="Secondary" onPress={onPress} variant="secondary" />);
      expect(primaryTree).toBeTruthy();
      expect(secondaryTree).toBeTruthy();
    });
  });

  describe('Card', () => {
    it('should render card with children', () => {
      const tree = ReactTestRenderer.create(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );
      expect(tree).toBeTruthy();
    });

    it('should render card with different variants', () => {
      const defaultTree = ReactTestRenderer.create(
        <Card variant="default">
          <Text>Default</Text>
        </Card>
      );
      const elevatedTree = ReactTestRenderer.create(
        <Card variant="elevated">
          <Text>Elevated</Text>
        </Card>
      );
      expect(defaultTree).toBeTruthy();
      expect(elevatedTree).toBeTruthy();
    });
  });
});
