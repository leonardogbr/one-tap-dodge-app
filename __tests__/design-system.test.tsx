/**
 * Design System Tests
 * Tests for design system tokens and components
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text, Button, Card } from '../src/design-system';
import { spacing, borderRadius, typography, darkColors, lightColors, TIER_COLORS, TIER_COLORS_LIGHT } from '../src/design-system/tokens';

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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/components/PressableScale', () => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  return {
    PressableScale: ({ children, onPress, style, disabled }: any) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} style={style}>
        {children}
      </TouchableOpacity>
    ),
  };
});

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
      expect(typography.h1.fontSize).toBe(36);
      expect(typography.h1.fontWeight).toBe('700');
      expect(typography.body.fontSize).toBe(16);
      expect(typography.button.fontSize).toBe(18);
      expect(typography.button.fontWeight).toBe('700');
    });
  });

  describe('Colors', () => {
    it('should have dark colors defined', () => {
      expect(darkColors.background).toBe('#070A12');
      expect(darkColors.primary).toBe('#38E8FF');
      expect(darkColors.text).toBe('#E6EDF3');
    });

    it('should have light colors defined', () => {
      expect(lightColors.background).toBe('#F4F7FF');
      expect(lightColors.primary).toBe('#00B4D8');
      expect(lightColors.text).toBe('#1E2633');
    });

    it('should have tier colors for all tiers', () => {
      const tiers = ['starter', 'bronze', 'silver', 'gold', 'elite', 'platinum'] as const;
      for (const tier of tiers) {
        expect(TIER_COLORS[tier]).toBeDefined();
        expect(TIER_COLORS[tier]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('should have light-mode overrides for low-contrast tiers', () => {
      expect(TIER_COLORS_LIGHT.starter).toBeDefined();
      expect(TIER_COLORS_LIGHT.silver).toBeDefined();
      expect(TIER_COLORS_LIGHT.starter).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(TIER_COLORS_LIGHT.silver).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('light overrides should be darker than their tier counterparts', () => {
      const hexToLuminance = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b;
      };

      expect(hexToLuminance(TIER_COLORS_LIGHT.starter!)).toBeLessThan(
        hexToLuminance(TIER_COLORS.starter),
      );
      expect(hexToLuminance(TIER_COLORS_LIGHT.silver!)).toBeLessThan(
        hexToLuminance(TIER_COLORS.silver),
      );
    });
  });

});

describe('Design System Components', () => {
  describe('Text', () => {
    it('should render text with default variant', () => {
      let tree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        tree = ReactTestRenderer.create(<Text>Hello World</Text>);
      });
      expect(tree!).toBeTruthy();
    });

    it('should render text with h1 variant', () => {
      let tree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        tree = ReactTestRenderer.create(<Text variant="h1">Title</Text>);
      });
      expect(tree!).toBeTruthy();
    });

    it('should render text with primary color', () => {
      let tree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        tree = ReactTestRenderer.create(<Text color="primary">Primary Text</Text>);
      });
      expect(tree!).toBeTruthy();
    });
  });

  describe('Button', () => {
    it('should render button with title', () => {
      const onPress = jest.fn();
      let tree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        tree = ReactTestRenderer.create(<Button title="Click Me" onPress={onPress} />);
      });
      expect(tree!).toBeTruthy();
    });

    it('should render button with icon', () => {
      const onPress = jest.fn();
      let tree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        tree = ReactTestRenderer.create(<Button title="Click" onPress={onPress} icon="play_arrow" />);
      });
      expect(tree!).toBeTruthy();
    });

    it('should render disabled button', () => {
      const onPress = jest.fn();
      let tree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        tree = ReactTestRenderer.create(<Button title="Disabled" onPress={onPress} disabled />);
      });
      expect(tree!).toBeTruthy();
    });

    it('should render button with different variants', () => {
      const onPress = jest.fn();
      let primaryTree: ReactTestRenderer.ReactTestRenderer;
      let secondaryTree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        primaryTree = ReactTestRenderer.create(<Button title="Primary" onPress={onPress} variant="primary" />);
        secondaryTree = ReactTestRenderer.create(<Button title="Secondary" onPress={onPress} variant="secondary" />);
      });
      expect(primaryTree!).toBeTruthy();
      expect(secondaryTree!).toBeTruthy();
    });
  });

  describe('Card', () => {
    it('should render card with children', () => {
      let tree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        tree = ReactTestRenderer.create(
          <Card>
            <Text>Card Content</Text>
          </Card>
        );
      });
      expect(tree!).toBeTruthy();
    });

    it('should render card with different variants', () => {
      let defaultTree: ReactTestRenderer.ReactTestRenderer;
      let elevatedTree: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        defaultTree = ReactTestRenderer.create(
          <Card variant="default">
            <Text>Default</Text>
          </Card>
        );
        elevatedTree = ReactTestRenderer.create(
          <Card variant="elevated">
            <Text>Elevated</Text>
          </Card>
        );
      });
      expect(defaultTree!).toBeTruthy();
      expect(elevatedTree!).toBeTruthy();
    });
  });
});
