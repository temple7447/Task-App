/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6B73FF';
const tintColorDark = '#9575FF';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Task management colors
    primary: '#6B73FF',
    secondary: '#FF6B6B',
    success: '#4ECDC4',
    warning: '#FFE66D',
    error: '#FF4757',
    cardBackground: '#F8F9FB',
    border: '#E5E5E5',
    placeholder: '#A0A0A0',
    // Task status colors
    pending: '#FFE66D',
    inProgress: '#6B73FF',
    completed: '#4ECDC4',
    cancelled: '#FF6B6B',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Task management colors
    primary: '#9575FF',
    secondary: '#FF8E8E',
    success: '#6DDDD4',
    warning: '#FFE66D',
    error: '#FF6B8A',
    cardBackground: '#1E1E1E',
    border: '#2A2A2A',
    placeholder: '#6A6A6A',
    // Task status colors
    pending: '#FFE66D',
    inProgress: '#9575FF',
    completed: '#6DDDD4',
    cancelled: '#FF8E8E',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
