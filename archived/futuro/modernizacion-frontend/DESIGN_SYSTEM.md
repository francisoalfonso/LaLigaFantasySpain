# 🎨 Design System - Fantasy La Liga Pro

Sistema de diseño completo para el proyecto Fantasy La Liga Pro con soporte para
**dark mode** y **light mode**.

---

## 📋 Tabla de Contenidos

1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Paleta de Colores](#paleta-de-colores)
3. [Tipografía](#tipografía)
4. [Espaciado y Sizing](#espaciado-y-sizing)
5. [Sombras y Elevación](#sombras-y-elevación)
6. [Border Radius](#border-radius)
7. [Animaciones](#animaciones)
8. [Breakpoints](#breakpoints)
9. [Iconografía](#iconografía)
10. [Implementación en Código](#implementación-en-código)

---

## 🎯 Filosofía de Diseño

### Principios Core

1. **Profesional pero Accesible**: Aspecto deportivo profesional sin intimidar a
   nuevos usuarios
2. **Data-Driven**: Visualización de datos clara y atractiva
3. **Performance First**: Animaciones fluidas sin sacrificar rendimiento
4. **Mobile-First**: Diseñado primero para móvil, escalado a desktop
5. **Accessible**: WCAG 2.1 AA compliance mínimo

### Inspiración Visual

- **DAZN**: Estética deportiva profesional
- **FotMob**: Visualización de datos deportivos clara
- **Stripe Dashboard**: UI limpia y moderna
- **Linear**: Microinteracciones refinadas

---

## 🎨 Paleta de Colores

### Color Tokens - Light Mode

```javascript
const lightColors = {
    // Primary - Azul deportivo principal
    primary: {
        50: '#e6f0ff',
        100: '#b3d4ff',
        200: '#80b8ff',
        300: '#4d9cff',
        400: '#1a80ff',
        500: '#0066cc', // Principal
        600: '#0052a3',
        700: '#003d7a',
        800: '#002952',
        900: '#001429'
    },

    // Secondary - Verde éxito/rendimiento
    secondary: {
        50: '#e8f5e9',
        100: '#c8e6c9',
        200: '#a5d6a7',
        300: '#81c784',
        400: '#66bb6a',
        500: '#4caf50', // Principal
        600: '#43a047',
        700: '#388e3c',
        800: '#2e7d32',
        900: '#1b5e20'
    },

    // Accent - Rojo acción/alertas
    accent: {
        50: '#ffebee',
        100: '#ffcdd2',
        200: '#ef9a9a',
        300: '#e57373',
        400: '#ef5350',
        500: '#ff3333', // Principal
        600: '#e53935',
        700: '#d32f2f',
        800: '#c62828',
        900: '#b71c1c'
    },

    // Neutrals
    neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121'
    },

    // Background
    background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#f1f3f5'
    },

    // Text
    text: {
        primary: '#1a1a1a',
        secondary: '#4a4a4a',
        tertiary: '#6b6b6b',
        disabled: '#9e9e9e'
    },

    // Borders
    border: {
        light: '#e5e7eb',
        medium: '#d1d5db',
        strong: '#9ca3af'
    },

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
};
```

### Color Tokens - Dark Mode

```javascript
const darkColors = {
    // Primary - Azul brillante para dark mode
    primary: {
        50: '#001429',
        100: '#002952',
        200: '#003d7a',
        300: '#0052a3',
        400: '#0066cc',
        500: '#1a80ff', // Principal (más brillante en dark)
        600: '#4d9cff',
        700: '#80b8ff',
        800: '#b3d4ff',
        900: '#e6f0ff'
    },

    // Secondary - Verde vibrante
    secondary: {
        50: '#1b5e20',
        100: '#2e7d32',
        200: '#388e3c',
        300: '#43a047',
        400: '#4caf50',
        500: '#66bb6a', // Principal
        600: '#81c784',
        700: '#a5d6a7',
        800: '#c8e6c9',
        900: '#e8f5e9'
    },

    // Accent - Rojo vibrante
    accent: {
        50: '#b71c1c',
        100: '#c62828',
        200: '#d32f2f',
        300: '#e53935',
        400: '#ff3333',
        500: '#ef5350', // Principal
        600: '#e57373',
        700: '#ef9a9a',
        800: '#ffcdd2',
        900: '#ffebee'
    },

    // Neutrals (invertidos)
    neutral: {
        50: '#212121',
        100: '#424242',
        200: '#616161',
        300: '#757575',
        400: '#9e9e9e',
        500: '#bdbdbd',
        600: '#e0e0e0',
        700: '#eeeeee',
        800: '#f5f5f5',
        900: '#fafafa'
    },

    // Background
    background: {
        primary: '#0a0a0a', // Negro profundo
        secondary: '#141414', // Gris muy oscuro
        tertiary: '#1e1e1e', // Gris oscuro
        elevated: '#242424' // Cards elevadas
    },

    // Text
    text: {
        primary: '#f5f5f5',
        secondary: '#b8b8b8',
        tertiary: '#8a8a8a',
        disabled: '#5a5a5a'
    },

    // Borders
    border: {
        light: '#2a2a2a',
        medium: '#3a3a3a',
        strong: '#4a4a4a'
    },

    // Status colors (más vibrantes en dark)
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa'
};
```

### Semantic Colors (Funcionales)

```javascript
const semanticColors = {
    // Fantasy-specific
    fantasy: {
        excellent: '#10b981', // >80 puntos
        good: '#3b82f6', // 60-80 puntos
        average: '#f59e0b', // 40-60 puntos
        poor: '#ef4444' // <40 puntos
    },

    // Posiciones
    position: {
        goalkeeper: '#8b5cf6', // Violeta
        defender: '#3b82f6', // Azul
        midfielder: '#10b981', // Verde
        forward: '#ef4444' // Rojo
    },

    // Rendimiento
    performance: {
        rising: '#10b981', // Subiendo
        stable: '#3b82f6', // Estable
        falling: '#ef4444' // Bajando
    },

    // Valor/Precio
    value: {
        bargain: '#10b981', // Chollo
        fair: '#3b82f6', // Precio justo
        expensive: '#f59e0b', // Caro
        overpriced: '#ef4444' // Sobrevalorado
    }
};
```

---

## 🔤 Tipografía

### Font Families

```css
/* Primary Font - Inter (UI y texto general) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* Accent Font - Cal Sans (Headlines y énfasis) */
@import url('https://cdn.jsdelivr.net/npm/cal-sans@1.0.1/index.css');

/* Monospace - JetBrains Mono (Código y números) */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

### Type Scale

```javascript
const typography = {
    fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace']
    },

    fontSize: {
        // Mobile-first
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        base: ['1rem', { lineHeight: '1.5rem' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        '5xl': ['3rem', { lineHeight: '1' }], // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }] // 72px
    },

    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900
    },

    letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em'
    }
};
```

### Typography Classes (Tailwind)

```css
/* Headlines - Cal Sans Display Font */
.text-display-xs {
    @apply font-display text-2xl font-bold tracking-tight;
}
.text-display-sm {
    @apply font-display text-3xl font-bold tracking-tight;
}
.text-display-md {
    @apply font-display text-4xl font-bold tracking-tight;
}
.text-display-lg {
    @apply font-display text-5xl font-bold tracking-tight;
}
.text-display-xl {
    @apply font-display text-6xl font-bold tracking-tight;
}

/* Body Text - Inter */
.text-body-xs {
    @apply font-sans text-xs font-normal leading-relaxed;
}
.text-body-sm {
    @apply font-sans text-sm font-normal leading-relaxed;
}
.text-body-base {
    @apply font-sans text-base font-normal leading-relaxed;
}
.text-body-lg {
    @apply font-sans text-lg font-normal leading-relaxed;
}

/* Stats/Numbers - JetBrains Mono */
.text-stat-xs {
    @apply font-mono text-xs font-semibold tabular-nums;
}
.text-stat-sm {
    @apply font-mono text-sm font-semibold tabular-nums;
}
.text-stat-base {
    @apply font-mono text-base font-bold tabular-nums;
}
.text-stat-lg {
    @apply font-mono text-lg font-bold tabular-nums;
}
.text-stat-xl {
    @apply font-mono text-2xl font-bold tabular-nums;
}
```

---

## 📏 Espaciado y Sizing

### Spacing Scale (Tailwind)

```javascript
const spacing = {
    px: '1px',
    0: '0',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem', // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem', // 12px
    3.5: '0.875rem', // 14px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    11: '2.75rem', // 44px
    12: '3rem', // 48px
    14: '3.5rem', // 56px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    28: '7rem', // 112px
    32: '8rem' // 128px
};
```

### Component Spacing Guidelines

```javascript
const componentSpacing = {
    // Cards
    card: {
        padding: 'p-6', // 24px
        gap: 'gap-4', // 16px
        marginBottom: 'mb-6' // 24px
    },

    // Buttons
    button: {
        paddingX: 'px-6', // 24px horizontal
        paddingY: 'py-3', // 12px vertical
        gap: 'gap-2' // 8px (icon + text)
    },

    // Inputs
    input: {
        padding: 'px-4 py-3', // 16px horizontal, 12px vertical
        gap: 'gap-2' // 8px (icon + input)
    },

    // Sections
    section: {
        paddingY: 'py-16', // 64px vertical
        gap: 'gap-12' // 48px entre secciones
    },

    // Container
    container: {
        paddingX: 'px-4 md:px-6 lg:px-8', // Responsive
        maxWidth: 'max-w-7xl' // 1280px
    }
};
```

---

## 🌑 Sombras y Elevación

### Shadow Scale

```javascript
const shadows = {
    // Light Mode
    light: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
    },

    // Dark Mode (más sutiles)
    dark: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.6)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.7), 0 8px 10px -6px rgb(0 0 0 / 0.7)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.8)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)'
    },

    // Colored shadows (for buttons/cards)
    colored: {
        primary: '0 10px 25px -5px rgb(0 102 204 / 0.3)',
        secondary: '0 10px 25px -5px rgb(76 175 80 / 0.3)',
        accent: '0 10px 25px -5px rgb(255 51 51 / 0.3)'
    }
};
```

### Elevation System

```javascript
const elevation = {
    0: 'shadow-none', // Flush con background
    1: 'shadow-sm', // Inputs, small cards
    2: 'shadow-md', // Cards, dropdowns
    3: 'shadow-lg', // Dialogs, popovers
    4: 'shadow-xl', // Modals
    5: 'shadow-2xl' // Tooltips, notifications
};
```

---

## 🔲 Border Radius

```javascript
const borderRadius = {
    none: '0',
    sm: '0.25rem', // 4px - Inputs, small buttons
    md: '0.375rem', // 6px - DEFAULT
    lg: '0.5rem', // 8px - Cards
    xl: '0.75rem', // 12px - Large cards
    '2xl': '1rem', // 16px - Hero sections
    '3xl': '1.5rem', // 24px - Special elements
    full: '9999px' // Pills, avatars
};
```

### Component Radius Guidelines

```javascript
const componentRadius = {
    button: 'rounded-lg', // 8px
    card: 'rounded-xl', // 12px
    input: 'rounded-lg', // 8px
    badge: 'rounded-full', // Pill shape
    avatar: 'rounded-full', // Circle
    modal: 'rounded-2xl', // 16px
    image: 'rounded-lg' // 8px
};
```

---

## 🎬 Animaciones

### Timing Functions

```javascript
const easing = {
    // Standard easings
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Custom easings (more natural)
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};
```

### Duration Scale

```javascript
const duration = {
    instant: '75ms', // Micro-interactions
    fast: '150ms', // Hovers, focus
    normal: '300ms', // DEFAULT - transitions
    slow: '500ms', // Complex animations
    slower: '700ms', // Page transitions
    slowest: '1000ms' // Hero animations
};
```

### Animation Presets (Framer Motion)

```javascript
const animations = {
    // Fade in
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
    },

    // Slide up
    slideUp: {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -20, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' }
    },

    // Scale
    scale: {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
        transition: { duration: 0.2 }
    },

    // Card hover
    cardHover: {
        whileHover: {
            y: -4,
            scale: 1.02,
            transition: { duration: 0.2 }
        },
        whileTap: { scale: 0.98 }
    },

    // Button hover
    buttonHover: {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { duration: 0.15 }
    },

    // Stagger children
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    }
};
```

---

## 📱 Breakpoints

### Responsive Breakpoints (Tailwind)

```javascript
const breakpoints = {
    xs: '475px', // Extra small devices
    sm: '640px', // Small devices (mobile landscape)
    md: '768px', // Medium devices (tablets)
    lg: '1024px', // Large devices (laptops)
    xl: '1280px', // Extra large devices (desktops)
    '2xl': '1536px' // 2XL devices (large desktops)
};
```

### Usage Examples

```jsx
// Tailwind classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Custom media queries
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
const isDesktop = useMediaQuery('(min-width: 1025px)');
```

---

## 🎨 Iconografía

### Icon System

```javascript
const icons = {
    library: 'lucide-react', // Main icon library
    size: {
        xs: 12,
        sm: 16,
        base: 20,
        lg: 24,
        xl: 32,
        '2xl': 48
    },
    strokeWidth: {
        thin: 1,
        normal: 1.5,
        medium: 2,
        bold: 2.5
    }
};
```

### Icon Usage

```tsx
import { TrendingUp, User, BarChart3 } from 'lucide-react';

// Standard size
<TrendingUp size={20} strokeWidth={1.5} />

// Custom
<User className="w-6 h-6 stroke-[1.5]" />
```

---

## 💻 Implementación en Código

### Tailwind Config (Next.js)

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... más colores
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cal-sans)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### CSS Variables (globals.css)

```css
@layer base {
    :root {
        /* Light Mode */
        --background: 0 0% 100%;
        --foreground: 0 0% 10%;
        --card: 0 0% 100%;
        --card-foreground: 0 0% 10%;
        --primary: 211 100% 40%;
        --primary-foreground: 0 0% 100%;
        --secondary: 123 38% 57%;
        --secondary-foreground: 0 0% 100%;
        --accent: 0 100% 60%;
        --accent-foreground: 0 0% 100%;
        --border: 0 0% 90%;
        --input: 0 0% 90%;
        --ring: 211 100% 40%;
    }

    .dark {
        /* Dark Mode */
        --background: 0 0% 4%;
        --foreground: 0 0% 96%;
        --card: 0 0% 8%;
        --card-foreground: 0 0% 96%;
        --primary: 211 100% 60%;
        --primary-foreground: 0 0% 100%;
        --secondary: 123 38% 65%;
        --secondary-foreground: 0 0% 100%;
        --accent: 0 100% 65%;
        --accent-foreground: 0 0% 100%;
        --border: 0 0% 16%;
        --input: 0 0% 16%;
        --ring: 211 100% 60%;
    }
}
```

### Dark Mode Implementation

```tsx
// app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}

// components/theme-toggle.tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
    );
}
```

---

## ✅ Design Tokens Checklist

- [x] ✅ Paleta de colores completa (light + dark)
- [x] ✅ Semantic colors para Fantasy
- [x] ✅ Typography scale con 3 font families
- [x] ✅ Spacing system completo
- [x] ✅ Shadow system (light + dark)
- [x] ✅ Border radius scale
- [x] ✅ Animation timings y easings
- [x] ✅ Breakpoints responsive
- [x] ✅ Icon system
- [x] ✅ Implementación Tailwind + next-themes

---

## 🎯 Siguiente Paso

Ver **UI_COMPONENTS.md** para ejemplos concretos de componentes usando este
design system.

---

**Fecha**: 30 de Septiembre de 2025 **Versión**: 1.0 **Estado**: ✅ Listo para
implementación
