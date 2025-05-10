# DentaMind Branding System

This document explains how to use the DentaMind branding system to create consistent, on-brand components and interfaces.

## Core Brand Components

### 1. BrandProvider

The `BrandProvider` is the central component for accessing brand assets, colors, and styles.

```jsx
import { BrandProvider, useBrand } from './components/ui/BrandProvider';

// Wrap your app with the provider
function App() {
  return (
    <BrandProvider>
      <YourApp />
    </BrandProvider>
  );
}

// Use the brand in your components
function YourComponent() {
  const { colors, Logo, typography } = useBrand();
  
  return (
    <div style={{ backgroundColor: colors.bgDark }}>
      <Logo type="full" size="md" />
      <h1 className={typography.h1}>Your Title</h1>
    </div>
  );
}
```

### 2. Logo Components

```jsx
import { Logo } from './components/ui/BrandProvider';

// Logo variations
<Logo type="full" size="md" /> // Full logo with icon and text
<Logo type="icon" size="md" /> // Icon only
<Logo type="text" size="md" /> // Text only

// Size options: 'xs', 'sm', 'md', 'lg', 'xl'
<Logo type="full" size="lg" />

// Invert colors (for light backgrounds)
<Logo type="full" invertColors={true} />
```

### 3. Brand UI Components

#### BrandButton

```jsx
import BrandButton from './components/ui/BrandButton';

// Variants
<BrandButton variant="primary">Primary Button</BrandButton>
<BrandButton variant="secondary">Secondary Button</BrandButton>
<BrandButton variant="outline">Outline Button</BrandButton>
<BrandButton variant="ghost">Ghost Button</BrandButton>
<BrandButton variant="danger">Danger Button</BrandButton>

// Sizes
<BrandButton size="xs">Extra Small</BrandButton>
<BrandButton size="sm">Small</BrandButton>
<BrandButton size="md">Medium</BrandButton>
<BrandButton size="lg">Large</BrandButton>

// With icons
<BrandButton startIcon={<SomeIcon />}>With Icon</BrandButton>
<BrandButton endIcon={<SomeIcon />}>With Icon</BrandButton>

// States
<BrandButton loading={true}>Loading...</BrandButton>
<BrandButton disabled={true}>Disabled</BrandButton>
```

#### BrandCard

```jsx
import BrandCard from './components/ui/BrandCard';

// Basic
<BrandCard>Your content here</BrandCard>

// With header
<BrandCard 
  title="Card Title"
  subtitle="Optional subtitle"
  icon={<SomeIcon />}
>
  Your content here
</BrandCard>

// Variants
<BrandCard variant="default">Default</BrandCard>
<BrandCard variant="elevated">With Shadow</BrandCard>
<BrandCard variant="outlined">With Outline</BrandCard>
<BrandCard variant="highlighted">Dark Theme</BrandCard>

// With footer
<BrandCard
  footer={<div>Footer content</div>}
>
  Main content
</BrandCard>

// Interactive card
<BrandCard onClick={() => console.log('clicked')}>
  Clickable card
</BrandCard>

// With highlight
<BrandCard highlight="success">Success highlight</BrandCard>
<BrandCard highlight="warning">Warning highlight</BrandCard>
<BrandCard highlight="error">Error highlight</BrandCard>
<BrandCard highlight="info">Info highlight</BrandCard>
<BrandCard highlight="primary">Primary highlight</BrandCard>
```

#### BrandedSpinner

```jsx
import BrandedSpinner from './components/ui/BrandedSpinner';

// Basic
<BrandedSpinner />

// Sizes
<BrandedSpinner size="xs" />
<BrandedSpinner size="sm" />
<BrandedSpinner size="md" />
<BrandedSpinner size="lg" />

// Variants
<BrandedSpinner variant="primary" /> // Green
<BrandedSpinner variant="light" /> // White
<BrandedSpinner variant="dark" /> // Dark

// With label
<BrandedSpinner label="Loading data" />
```

## Brand Colors

```jsx
import { useBrand } from './components/ui/BrandProvider';

function YourComponent() {
  const { colors } = useBrand();
  
  return (
    <div>
      {/* Primary brand colors */}
      <div style={{ backgroundColor: colors.primary }}>Primary</div>
      <div style={{ backgroundColor: colors.primaryDark }}>Primary Dark</div>
      <div style={{ backgroundColor: colors.primaryLight }}>Primary Light</div>
      
      {/* Background colors */}
      <div style={{ backgroundColor: colors.bgDark }}>Background Dark</div>
      <div style={{ backgroundColor: colors.bgMedium }}>Background Medium</div>
      <div style={{ backgroundColor: colors.bgLight }}>Background Light</div>
      
      {/* Text colors */}
      <div style={{ color: colors.textLight }}>Text Light</div>
      <div style={{ color: colors.textDark }}>Text Dark</div>
      <div style={{ color: colors.textMuted }}>Text Muted</div>
      
      {/* Accent colors */}
      <div style={{ backgroundColor: colors.success }}>Success</div>
      <div style={{ backgroundColor: colors.warning }}>Warning</div>
      <div style={{ backgroundColor: colors.error }}>Error</div>
      <div style={{ backgroundColor: colors.info }}>Info</div>
    </div>
  );
}
```

## Typography

```jsx
import { useBrand } from './components/ui/BrandProvider';

function YourComponent() {
  const { typography } = useBrand();
  
  return (
    <div>
      <h1 className={typography.h1}>Heading 1</h1>
      <h2 className={typography.h2}>Heading 2</h2>
      <h3 className={typography.h3}>Heading 3</h3>
      <h4 className={typography.h4}>Heading 4</h4>
      <h5 className={typography.h5}>Heading 5</h5>
      <p className={typography.body}>Body text</p>
      <p className={typography.small}>Small text</p>
      <p className={typography.tiny}>Tiny text</p>
    </div>
  );
}
```

## Tailwind Classes

```jsx
// Use the dentamind prefix for direct access to brand colors

// Background colors
<div className="bg-dentamind-primary">Primary background</div>
<div className="bg-dentamind-black">Black background</div>
<div className="bg-dentamind-gray-dark">Dark gray background</div>

// Text colors
<p className="text-dentamind-primary">Primary text</p>
<p className="text-dentamind-white">White text</p>
<p className="text-dentamind-gray-light">Light gray text</p>

// Border colors
<div className="border border-dentamind-primary">Primary border</div>

// Shadows
<div className="shadow-dentamind">Brand shadow</div>
<div className="shadow-dentamind-lg">Large brand shadow</div>
```

## Best Practices

1. **Color Contrast**: Always ensure sufficient contrast for accessibility. Use white or black text on colored backgrounds for readability.

2. **Logo Usage**: Maintain proper spacing around the logo. Don't distort the logo or change its colors outside the approved variations.

3. **Typography Consistency**: Stick to the provided typography scales for consistency across the application.

4. **Brand Voice**: Maintain the professional but approachable tone in all UX copy. Be clear, concise, and focused on clinical accuracy.

5. **AI Branding**: When referencing AI capabilities, use the green primary color to highlight AI-powered features.

## Accessibility Guidelines

- Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.
- When using the primary green color, ensure adequate contrast with a dark background.
- Don't rely solely on color to convey information; always provide alternative visual cues. 