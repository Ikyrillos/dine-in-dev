# Theme System Documentation

## Overview

This application uses a flexible theme system based on CSS custom properties (CSS variables) and Tailwind CSS. The primary brand color can be easily changed throughout the entire application.

## Current Brand Color

**Primary Color:** `#5a23b1` (Purple)

## How It Works

### 1. CSS Custom Properties
All theme colors are defined in `src/styles.css` using CSS custom properties:

```css
:root {
  --primary: hsl(266.7 65.6% 42.0%);
  --primary-foreground: hsl(210 40% 98%);
  --ring: hsl(266.7 65.6% 42.0%);
  /* ... other colors */
}
```

### 2. Tailwind Integration
The CSS custom properties are mapped to Tailwind colors in the `@theme inline` section, allowing you to use classes like:
- `bg-primary`
- `text-primary`
- `border-primary`
- `hover:bg-primary/90`

### 3. Dark Mode Support
The theme system includes full dark mode support with separate color definitions in the `.dark` selector.

## Changing the Brand Color

### Method 1: Edit CSS (Permanent)
Update the HSL values in `src/styles.css`:

```css
:root {
  --primary: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
  --ring: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
  --sidebar-primary: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
  --sidebar-ring: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
}

.dark {
  --primary: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
  --ring: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
  --sidebar-primary: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
  --sidebar-ring: hsl(YOUR_HUE YOUR_SATURATION% YOUR_LIGHTNESS%);
}
```

### Method 2: JavaScript Utilities (Dynamic)
Use the theme utilities in `src/lib/theme.ts`:

```typescript
import { setPrimaryColor, applyThemePreset } from '@/lib/theme';

// Set custom color
setPrimaryColor('#5a23b1');  // Hex
setPrimaryColor('hsl(266 66% 42%)');  // HSL
setPrimaryColor('rgb(90, 35, 177)');  // RGB

// Apply preset themes
applyThemePreset('tawila');   // #5a23b1
applyThemePreset('blue');     // #3b82f6
applyThemePreset('green');    // #10b981
```

## Components That Use Primary Colors

The following components automatically use the primary color:

### Navigation & Layout
- Restaurant name headings
- Navigation buttons
- Active state indicators

### Buttons
- Primary action buttons
- Submit buttons
- "Order for Table" buttons
- "Confirm Order" buttons

### Interactive Elements
- Selected menu items (border)
- Toggle switches (active state)
- Radio buttons and checkboxes (selected state)
- Focus rings

### Price Display
- Menu item prices
- Cart totals
- Checkout amounts

### Status Indicators
- Table status (occupied tables)
- Success states
- Active selections

## File Structure

```
src/
├── styles.css              # Main theme definitions
├── lib/
│   └── theme.ts            # Theme utilities
└── components/
    ├── LoadingBranded.tsx  # Uses brand colors
    └── ui/                 # UI components using theme
```

## Best Practices

1. **Always use Tailwind classes** like `bg-primary` instead of hardcoded colors
2. **Test both light and dark modes** when changing colors
3. **Ensure sufficient contrast** for accessibility
4. **Use theme utilities** for dynamic color changes
5. **Keep the HSL format** in CSS custom properties for consistency

## Color Conversion

To convert colors to HSL format:

### Hex to HSL
Use the `hexToHsl()` function in `src/lib/theme.ts` or online converters.

Example: `#5a23b1` → `hsl(266.7 65.6% 42.0%)`

### Testing Colors
1. Update the CSS variables
2. Refresh the application
3. Check all primary color usages:
   - Button backgrounds
   - Text colors
   - Border colors
   - Loading animations
   - Focus states

## Accessibility

When changing the primary color, ensure:
- **Contrast ratio ≥ 4.5:1** for text on background
- **Contrast ratio ≥ 3:1** for UI elements
- **Color is not the only indicator** for important information
- **Focus states are clearly visible**

## Troubleshooting

### Colors Not Updating
1. Check if CSS custom properties are properly defined
2. Ensure HSL format is correct (no commas in newer syntax)
3. Verify Tailwind is using the updated CSS variables
4. Clear browser cache

### Dark Mode Issues
1. Update both `:root` and `.dark` selectors
2. Test color contrast in dark mode
3. Verify all primary color references are updated

## Future Enhancements

Potential additions to the theme system:
- Secondary color theming
- Accent color customization
- Font family theming
- Border radius theming
- Component-specific color overrides