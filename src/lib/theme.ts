/**
 * Theme Configuration System
 *
 * This file provides utilities for managing the application's theme colors.
 * The primary color system is built on CSS custom properties for maximum flexibility.
 *
 * Usage Examples:
 *
 * // Change primary color dynamically
 * import { setPrimaryColor, applyThemePreset } from '@/lib/theme';
 *
 * // Set custom color
 * setPrimaryColor('#5a23b1');
 *
 * // Apply preset theme
 * applyThemePreset('tawila');
 *
 * // Get current primary color
 * const currentColor = getPrimaryColor();
 *
 * Note: All components using Tailwind classes like 'bg-primary', 'text-primary',
 * 'border-primary', etc. will automatically use the updated colors.
 */

export const theme = {
  colors: {
    // Primary brand color - #5a23b1
    primary: {
      hex: '#5a23b1',
      hsl: 'hsl(266.7 65.6% 42.0%)',
      rgb: 'rgb(90, 35, 177)',
    },
  },
} as const;

/**
 * Utility function to change the primary brand color dynamically
 * @param color - The new primary color in any valid CSS format (hex, hsl, rgb)
 */
export function setPrimaryColor(color: string) {
  // Convert hex to HSL if needed
  let hslColor = color;

  if (color.startsWith('#')) {
    hslColor = hexToHsl(color);
  } else if (color.startsWith('rgb')) {
    hslColor = rgbToHsl(color);
  }

  // Update CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--primary', hslColor);
  root.style.setProperty('--ring', hslColor);
  root.style.setProperty('--sidebar-primary', hslColor);
  root.style.setProperty('--sidebar-ring', hslColor);
}

/**
 * Get current primary color from CSS custom property
 */
export function getPrimaryColor() {
  const root = getComputedStyle(document.documentElement);
  return root.getPropertyValue('--primary').trim();
}

/**
 * Convert hex color to HSL format for CSS custom properties
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  // Convert to HSL format for CSS
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `hsl(${hDeg} ${sPercent}% ${lPercent}%)`;
}

/**
 * Convert RGB color to HSL format for CSS custom properties
 */
function rgbToHsl(rgb: string): string {
  // Extract RGB values from string like "rgb(90, 35, 177)"
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;

  const r = parseInt(match[1]) / 255;
  const g = parseInt(match[2]) / 255;
  const b = parseInt(match[3]) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `hsl(${hDeg} ${sPercent}% ${lPercent}%)`;
}

/**
 * Predefined theme presets
 */
export const themePresets = {
  tawila: '#5a23b1',    // Current Tawila brand color
  purple: '#8b5cf6',    // Violet
  blue: '#3b82f6',      // Blue
  green: '#10b981',     // Emerald
  orange: '#f59e0b',    // Amber
  red: '#ef4444',       // Red
  pink: '#ec4899',      // Pink
  indigo: '#6366f1',    // Indigo
} as const;

/**
 * Apply a theme preset
 */
export function applyThemePreset(preset: keyof typeof themePresets) {
  setPrimaryColor(themePresets[preset]);
}