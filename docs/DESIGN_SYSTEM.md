# TaxSense AI - Design System Documentation

## Overview

TaxSense AI features a comprehensive, production-ready React design system built for consistency across web, mobile, and admin platforms. This design system provides 50+ components, extensive design tokens, and accessibility-first patterns.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Component Library](#component-library)
3. [Getting Started](#getting-started)
4. [Usage Examples](#usage-examples)
5. [Accessibility Guidelines](#accessibility-guidelines)
6. [Theming](#theming)
7. [Responsive Design](#responsive-design)
8. [Contributing](#contributing)

---

## Design Tokens

### Color Tokens

The design system uses a semantic color system with 30+ colors organized by purpose:

#### Primary Colors
- **Primary (Blue)**: `colors.primary` - Main brand color used for primary actions
- **Secondary (Purple)**: `colors.secondary` - Secondary accent color
- **Neutral (Gray)**: `colors.neutral` - Text, borders, backgrounds

#### Semantic Colors
- **Success (Green)**: Used for positive feedback and success states
- **Warning (Amber)**: Used for warnings and caution messages
- **Error (Red)**: Used for errors and destructive actions
- **Info (Blue)**: Used for informational messages

#### Tax-Specific Colors
- **Old Regime (Purple)**: `colors.tax.oldRegime` - Old tax regime color
- **New Regime (Green)**: `colors.tax.newRegime` - New tax regime color
- **Savings (Blue)**: `colors.tax.savings` - Tax savings color
- **Liability (Red)**: `colors.tax.liability` - Tax liability color

**Usage:**
```typescript
import { colors } from '@/design-system/tokens';

const styles = {
  backgroundColor: colors.primary[500],
  color: colors.semantic.textPrimary,
};
```

### Typography Tokens

Consistent typography across all breakpoints:

#### Headings (H1 - H6)
```typescript
typography.heading.h1 // 56px, bold
typography.heading.h2 // 36px, bold
typography.heading.h3 // 30px, semibold
typography.heading.h4 // 24px, semibold
typography.heading.h5 // 20px, semibold
typography.heading.h6 // 16px, semibold
```

#### Body Text
```typescript
typography.body.large         // 18px, regular
typography.body.largeBold    // 18px, bold
typography.body.base         // 16px, regular
typography.body.baseBold     // 16px, bold
typography.body.small        // 14px, regular
typography.body.smallBold    // 14px, bold
```

#### Captions
```typescript
typography.caption.caption      // 12px, regular
typography.caption.captionBold  // 12px, bold
typography.caption.label        // 12px, uppercase, semibold
```

### Spacing Tokens

4px-based spacing scale for consistent layout:

```typescript
spacing.xs    // 4px (tight)
spacing.sm    // 8px (small)
spacing.md    // 16px (medium)
spacing.lg    // 24px (large)
spacing.xl    // 32px (extra large)
spacing.2xl   // 40px
spacing.3xl   // 48px
spacing.4xl   // 64px
```

**Component-Specific Spacing:**
```typescript
componentSpacing.button    // Button-specific padding
componentSpacing.input     // Input field padding
componentSpacing.card      // Card padding
componentSpacing.form      // Form field gaps
```

### Shadow & Elevation Tokens

Shadow layers for depth and hierarchy:

```typescript
elevation.shadow.xs    // Subtle shadow for inputs
elevation.shadow.sm    // Small shadow
elevation.shadow.md    // Medium shadow (cards)
elevation.shadow.lg    // Large shadow (modals)
elevation.shadow.xl    // Extra large shadow
elevation.shadow.2xl   // Maximum shadow (overlay)

// Component-specific shadows
elevation.card.default    // Card default shadow
elevation.card.hover      // Card hover shadow
elevation.button.default  // Button default shadow
```

### Breakpoints

Mobile-first responsive breakpoints:

```typescript
breakpoints.xs   // 320px  - Extra small phones
breakpoints.sm   // 640px  - Small phones
breakpoints.md   // 768px  - Tablets
breakpoints.lg   // 1024px - Small laptops
breakpoints.xl   // 1280px - Desktops
breakpoints.2xl  // 1536px - Large desktops
breakpoints.3xl  // 1920px - Ultra-wide displays
breakpoints.4xl  // 2560px - 4K displays
```

### Motion & Animation Tokens

Standardized animation curves and durations:

```typescript
// Durations
motion.duration.instant    // 0ms
motion.duration.fast       // 100ms
motion.duration.base       // 200ms
motion.duration.slow       // 300ms
motion.duration.slower     // 500ms

// Easing curves
motion.easing.linear       // Linear
motion.easing.easeIn       // Accelerating motion
motion.easing.easeOut      // Decelerating motion
motion.easing.easeInOut    // Smooth acceleration/deceleration
motion.easing.spring       // Spring-like curve

// Transitions
motion.transition.fast     // Fast transition for all properties
motion.transition.base     // Standard transition
motion.transition.colors   // Color-specific transition
motion.transition.shadow   // Shadow-specific transition
```

### Border Radius Tokens

Consistent corner rounding:

```typescript
radii.xs     // 2px
radii.sm     // 4px
radii.md     // 6px
radii.lg     // 8px
radii.xl     // 12px
radii.2xl    // 16px
radii.full   // 9999px (fully rounded/pill)

// Component-specific
componentRadii.button.md    // Medium button radius
componentRadii.card.lg      // Large card radius
componentRadii.modal.default // Modal radius
componentRadii.chip.full    // Pill-shaped chips
```

---

## Component Library

### Base Components (20+)

Fundamental building blocks for all interfaces.

#### Button
```typescript
import { Button } from '@/design-system/components/base';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="secondary" isLoading={isLoading}>
  Loading...
</Button>

<Button variant="outline" icon={<Icon />} iconPosition="left">
  Icon Button
</Button>

<Button variant="ghost" fullWidth>
  Ghost Button
</Button>

<Button variant="danger" isDisabled>
  Disabled Button
</Button>
```

**Button Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: Show loading spinner
- `isDisabled`: Disable button
- `fullWidth`: Expand to full width
- `icon`: Icon element
- `iconPosition`: 'left' | 'right'

#### Input
```typescript
import { Input } from '@/design-system/components/base';

<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  isRequired
  helperText="We'll never share your email"
/>

<Input
  label="Password"
  type="password"
  error="Password is required"
/>

<Input
  label="Search"
  type="search"
  icon={<SearchIcon />}
  iconPosition="left"
/>
```

**Input Props:**
- `label`: Label text
- `type`: Input type (text, email, password, number, date, etc.)
- `error`: Error message
- `isRequired`: Show required indicator
- `helperText`: Helper text below input
- `icon`: Icon element
- `iconPosition`: 'left' | 'right'
- `size`: 'sm' | 'md' | 'lg'

#### Checkbox
```typescript
import { Checkbox } from '@/design-system/components/base';

<Checkbox
  id="terms"
  label="I agree to terms and conditions"
/>

<Checkbox
  label="Remember me"
  defaultChecked
/>
```

#### Badge
```typescript
import { Badge } from '@/design-system/components/base';

<Badge variant="primary">New</Badge>
<Badge variant="success" size="lg">Success</Badge>
<Badge variant="error" icon={<AlertIcon />}>Error</Badge>
<Badge variant="info" onDismiss={handleDismiss}>Dismissible</Badge>
```

#### Card
```typescript
import { Card } from '@/design-system/components/base';

<Card variant="elevated" padding="lg">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

<Card variant="outlined" isHoverable isPressable onClick={handleClick}>
  Clickable card
</Card>
```

### Form Components (15+)

Tax-specific and general form components.

#### AmountInput
```typescript
import { AmountInput } from '@/design-system/components/forms';

<AmountInput
  label="Annual Income"
  currency="INR"
  showCurrencySymbol
  onAmountChange={(amount) => setIncome(amount)}
/>
```

**Upcoming Form Components:**
- `DeductionSelector`: Select from 80C, 80D, 24B, etc.
- `IncomeBreakdownForm`: Multi-source income input
- `ScenarioBuilder`: Compare tax scenarios
- `DatePickerIndian`: Indian format date picker
- `TaxRateSlider`: Interactive tax rate adjustment
- `ProfileForm`: Multi-step profile setup

### Data Display Components (12+)

Tax calculations and comparisons.

#### TaxComparison
```typescript
import { TaxComparison } from '@/design-system/components/data';

<TaxComparison
  data={{
    oldRegime: {
      taxableIncome: 1000000,
      taxLiability: 150000,
      surcharge: 0,
      cess: 7500,
      totalTax: 157500,
      effectiveRate: 15.75,
    },
    newRegime: {
      taxableIncome: 900000,
      taxLiability: 120000,
      surcharge: 0,
      cess: 6000,
      totalTax: 126000,
      effectiveRate: 12.6,
    },
  }}
  isNewRegimeBetter
  savings={31500}
/>
```

**Upcoming Data Components:**
- `TaxBreakdownChart`: Pie/bar charts with Recharts
- `RecommendationCard`: Tax saving recommendations
- `ScenarioComparison`: Multiple scenario comparison
- `AnalyticsCard`: Key metrics display
- `StatCard`: Statistics with trends
- `Table`: Sortable, filterable data table
- `Timeline`: Event or calculation timeline

### Layout Components (10+)

Structure and organization components.

**Upcoming Components:**
- `Container`: Max-width container with padding
- `Grid`: CSS Grid layout
- `Flex`: Flexbox layout wrapper
- `Header`: Page header with navigation
- `Footer`: Page footer
- `Sidebar`: Collapsible sidebar navigation
- `Modal/Dialog`: Modal dialog component
- `Tabs`: Tab navigation
- `Accordion`: Expandable sections

### Feedback Components

User feedback and notification components.

**Upcoming Components:**
- `Toast/Snackbar`: Auto-dismissing notifications
- `Alert`: Info, success, warning, error alerts
- `LoadingSpinner`: Loading indicators
- `ErrorBoundary`: Error boundary wrapper
- `ConfirmationDialog`: Confirmation prompts
- `ProgressBar`: Linear progress indicator

---

## Getting Started

### Installation

The design system is built into the TaxSense AI project:

```typescript
import { Button, Input, Card } from '@/design-system/components';
import { colors, spacing, typography } from '@/design-system/tokens';
import { ThemeProvider, useTheme, useBreakpoint } from '@/design-system';
```

### Basic Setup

Wrap your app with ThemeProvider:

```typescript
import { ThemeProvider } from '@/design-system';

export default function App() {
  return (
    <ThemeProvider initialTheme="light">
      <MainApp />
    </ThemeProvider>
  );
}
```

---

## Usage Examples

### Example 1: Tax Filing Form

```typescript
import { useState } from 'react';
import { Button, Input, Select, Card } from '@/design-system/components';
import { AmountInput } from '@/design-system/components/forms';
import { TaxComparison } from '@/design-system/components/data';
import { spacing, colors } from '@/design-system/tokens';

export function TaxFilingForm() {
  const [income, setIncome] = useState(0);
  const [deductions, setDeductions] = useState(0);

  return (
    <Card variant="elevated" padding="lg">
      <h2>Income Details</h2>
      
      <div style={{ marginBottom: spacing.lg }}>
        <AmountInput
          label="Annual Gross Income"
          onAmountChange={setIncome}
        />
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <AmountInput
          label="Deductions (Section 80C, etc.)"
          onAmountChange={setDeductions}
        />
      </div>

      <Button variant="primary" fullWidth>
        Calculate Tax
      </Button>
    </Card>
  );
}
```

### Example 2: Responsive Layout

```typescript
import { useBreakpoint, useIsMobile } from '@/design-system/hooks';
import { spacing } from '@/design-system/tokens';

export function Dashboard() {
  const breakpoint = useBreakpoint();
  const isMobile = useIsMobile();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: spacing.lg,
    }}>
      <Card>Tax Liability</Card>
      <Card>Savings Potential</Card>
    </div>
  );
}
```

### Example 3: Theme Switching

```typescript
import { useTheme } from '@/design-system';
import { Button } from '@/design-system/components/base';

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <Button
      variant="outline"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </Button>
  );
}
```

---

## Accessibility Guidelines

### Keyboard Navigation

All interactive components support keyboard navigation:
- **Tab**: Move to next focusable element
- **Shift+Tab**: Move to previous focusable element
- **Enter/Space**: Activate buttons and controls
- **Arrow Keys**: Navigate within components (dropdowns, menus, etc.)
- **Escape**: Close modals and dropdowns

### ARIA Labels

Provide semantic labels for screen readers:

```typescript
<Button aria-label="Close dialog" onClick={handleClose}>
  ×
</Button>

<Input aria-describedby="error-message" />
<div id="error-message">This field is required</div>
```

### Color Contrast

All color combinations meet WCAG AA standards (4.5:1 contrast ratio for text).

### Focus Management

Components include focus indicators:
```css
:focus {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
```

### Reduced Motion

Respect user motion preferences:
```typescript
import { usePrefersReducedMotion } from '@/design-system/hooks';

export function AnimatedComponent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1,
        repeat: Infinity,
        type: prefersReducedMotion ? 'linear' : 'spring',
      }}
    />
  );
}
```

---

## Theming

### Light & Dark Modes

Themes automatically adjust colors based on preference:

```typescript
// Light theme (default)
backgroundColor: colors.semantic.bgPrimary // #ffffff
color: colors.semantic.textPrimary         // #171717

// Dark theme
backgroundColor: colors.semantic.bgPrimary // #171717
color: colors.semantic.textPrimary         // #fafafa
```

### Custom Theme

Extend the theme with custom colors:

```typescript
const customTheme = {
  colors: {
    ...colors,
    brandBlue: '#1e40af',
    brandOrange: '#ea580c',
  },
};
```

---

## Responsive Design

### Using Breakpoints

```typescript
import { useBreakpoint } from '@/design-system/hooks';

export function ResponsiveGrid() {
  const breakpoint = useBreakpoint();
  
  const columns = {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns[breakpoint]}, 1fr)`,
      gap: spacing.lg,
    }}>
      {/* Items */}
    </div>
  );
}
```

### Mobile-First Approach

Always start with mobile styles, then enhance for larger screens:

```typescript
const styles: React.CSSProperties = {
  // Mobile (default)
  width: '100%',
  padding: spacing.md,
  fontSize: '0.875rem',
  // Override via media queries or hooks
};
```

---

## Contributing

### Adding New Components

1. Create component in appropriate directory:
   - Base components: `src/design-system/components/base/`
   - Form components: `src/design-system/components/forms/`
   - Layout components: `src/design-system/components/layout/`
   - Data components: `src/design-system/components/data/`
   - Feedback components: `src/design-system/components/feedback/`

2. Use design tokens for all styling:
   ```typescript
   import { colors, spacing, typography, elevation } from '@/design-system/tokens';
   ```

3. Ensure accessibility:
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation support
   - Focus indicators

4. Add component to corresponding `index.ts` file

5. Document in Storybook (coming soon)

### Design Token Guidelines

- Use semantic names (e.g., `textPrimary` instead of `darkGray`)
- Maintain 4px spacing scale
- Test contrast ratios (WCAG AA minimum)
- Provide light/dark theme variations

---

## File Structure

```
src/design-system/
├── tokens/                    # Design tokens
│   ├── colors.ts             # Color palette
│   ├── typography.ts         # Font sizes, weights
│   ├── spacing.ts            # 4px scale spacing
│   ├── elevation.ts          # Shadows, z-index
│   ├── breakpoints.ts        # Responsive breakpoints
│   ├── motion.ts             # Animations, easing
│   ├── radii.ts              # Border radius
│   └── index.ts              # Token exports
├── components/
│   ├── base/                 # Base components (20+)
│   ├── forms/                # Form components (15+)
│   ├── layout/               # Layout components (10+)
│   ├── data/                 # Data display (12+)
│   ├── feedback/             # Feedback components
│   └── index.ts              # Component exports
├── hooks/                     # Reusable hooks
│   ├── useResponsive.ts     # Breakpoint & responsive hooks
│   └── index.ts              # Hook exports
├── utils/                     # Utilities
│   ├── ThemeProvider.tsx     # Theme context
│   └── index.ts              # Utility exports
└── index.ts                  # Main exports
```

---

## Performance

### Component Optimization

- Components use `React.memo` for optimization
- Event handlers use `useCallback` where appropriate
- CSS-in-JS styles avoid unnecessary re-renders

### Bundle Size

Design system is tree-shakeable—only used components are included in builds.

---

## Support

For questions, issues, or feature requests, please refer to the TaxSense AI documentation or create an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: September 2024  
**License**: Proprietary (TaxSense AI)
