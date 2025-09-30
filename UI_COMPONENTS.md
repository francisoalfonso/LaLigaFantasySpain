# 🧩 UI Components Library - Fantasy La Liga Pro

Catálogo completo de componentes modernos con ejemplos de código para Next.js +
TypeScript + shadcn/ui.

---

## 📋 Tabla de Contenidos

1. [Componentes Base](#componentes-base)
2. [Data Display](#data-display)
3. [Forms & Inputs](#forms--inputs)
4. [Navigation](#navigation)
5. [Feedback](#feedback)
6. [Overlays](#overlays)
7. [Fantasy-Specific Components](#fantasy-specific-components)
8. [Chart Components](#chart-components)
9. [Layout Components](#layout-components)
10. [Animation Patterns](#animation-patterns)

---

## 🎨 Componentes Base

### Button

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-input bg-background hover:bg-accent',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline'
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10'
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'default'
        }
    }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant,
    size,
    isLoading,
    children,
    ...props
}: ButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={buttonVariants({ variant, size })}
            disabled={isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </motion.button>
    );
}
```

**Ejemplo de uso:**

```tsx
<Button variant="default" size="lg">
  Añadir Jugador
</Button>

<Button variant="outline" size="sm" isLoading>
  Guardando...
</Button>
```

---

### Card

```tsx
// components/ui/card.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    gradient?: boolean;
}

export function Card({
    children,
    className,
    hover = true,
    gradient = false
}: CardProps) {
    return (
        <motion.div
            whileHover={hover ? { y: -4, scale: 1.01 } : {}}
            transition={{ duration: 0.2 }}
            className={cn(
                'relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-md',
                gradient &&
                    'before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent',
                className
            )}
        >
            <div className="relative p-6">{children}</div>
        </motion.div>
    );
}

export function CardHeader({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col space-y-1.5', className)}>
            {children}
        </div>
    );
}

export function CardTitle({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <h3
            className={cn(
                'text-2xl font-semibold leading-none tracking-tight',
                className
            )}
        >
            {children}
        </h3>
    );
}

export function CardDescription({ children }: { children: React.ReactNode }) {
    return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function CardContent({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={cn('pt-4', className)}>{children}</div>;
}
```

**Ejemplo de uso:**

```tsx
<Card hover gradient>
    <CardHeader>
        <CardTitle>Lewandowski</CardTitle>
        <CardDescription>Delantero - Barcelona</CardDescription>
    </CardHeader>
    <CardContent>
        <p>Puntos: 85</p>
    </CardContent>
</Card>
```

---

### Badge

```tsx
// components/ui/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/80',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/80',
                outline: 'border border-input',
                success: 'bg-green-500 text-white',
                warning: 'bg-yellow-500 text-white'
            }
        },
        defaultVariants: {
            variant: 'default'
        }
    }
);

export function Badge({
    variant,
    children
}: VariantProps<typeof badgeVariants> & { children: React.ReactNode }) {
    return <div className={badgeVariants({ variant })}>{children}</div>;
}
```

**Ejemplo de uso:**

```tsx
<Badge variant="success">En forma</Badge>
<Badge variant="warning">Lesión menor</Badge>
<Badge variant="destructive">Suspendido</Badge>
```

---

## 📊 Data Display

### StatsCard

```tsx
// components/fantasy/stats-card.tsx
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
}

export function StatsCard({
    title,
    value,
    change,
    icon,
    trend = 'neutral'
}: StatsCardProps) {
    const TrendIcon =
        trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor =
        trend === 'up'
            ? 'text-green-500'
            : trend === 'down'
              ? 'text-red-500'
              : 'text-gray-500';

    return (
        <Card hover gradient>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <motion.h3
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-bold font-display"
                    >
                        {value}
                    </motion.h3>
                    {change !== undefined && (
                        <div
                            className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}
                        >
                            <TrendIcon className="h-4 w-4" />
                            <span>{Math.abs(change)}%</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="rounded-lg bg-primary/10 p-3">{icon}</div>
                )}
            </div>
        </Card>
    );
}
```

**Ejemplo de uso:**

```tsx
import { Target } from 'lucide-react';

<StatsCard
    title="Puntos Totales"
    value="1,245"
    change={12.5}
    trend="up"
    icon={<Target className="h-6 w-6 text-primary" />}
/>;
```

---

### PlayerCard

```tsx
// components/fantasy/player-card.tsx
import { motion } from 'framer-motion';
import { TrendingUp, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlayerCardProps {
    player: {
        id: number;
        name: string;
        team: string;
        position: 'GK' | 'DEF' | 'MID' | 'FWD';
        price: number;
        points: number;
        rating: number;
        image?: string;
        form?: 'excellent' | 'good' | 'average' | 'poor';
    };
    onClick?: () => void;
}

const positionColors = {
    GK: 'bg-purple-500',
    DEF: 'bg-blue-500',
    MID: 'bg-green-500',
    FWD: 'bg-red-500'
};

const formVariants = {
    excellent: 'success',
    good: 'default',
    average: 'warning',
    poor: 'destructive'
} as const;

export function PlayerCard({ player, onClick }: PlayerCardProps) {
    return (
        <Card hover onClick={onClick} className="cursor-pointer">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                    <div
                        className={`w-16 h-16 rounded-full ${positionColors[player.position]} flex items-center justify-center`}
                    >
                        {player.image ? (
                            <img
                                src={player.image}
                                alt={player.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-white">
                                {player.name.charAt(0)}
                            </span>
                        )}
                    </div>
                    <Badge
                        variant="outline"
                        className="absolute -bottom-1 -right-1 text-xs px-1.5"
                    >
                        {player.position}
                    </Badge>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                    <div>
                        <h4 className="font-semibold text-lg">{player.name}</h4>
                        <p className="text-sm text-muted-foreground">
                            {player.team}
                        </p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                                Precio:
                            </span>
                            <span className="font-mono font-semibold">
                                ${player.price}M
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                                Puntos:
                            </span>
                            <span className="font-mono font-semibold">
                                {player.points}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="font-mono font-semibold">
                                {player.rating}
                            </span>
                        </div>
                    </div>

                    {/* Form Badge */}
                    {player.form && (
                        <Badge variant={formVariants[player.form]}>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {player.form}
                        </Badge>
                    )}
                </div>
            </div>
        </Card>
    );
}
```

**Ejemplo de uso:**

```tsx
<PlayerCard
    player={{
        id: 521,
        name: 'Lewandowski',
        team: 'Barcelona',
        position: 'FWD',
        price: 10.5,
        points: 85,
        rating: 8.2,
        form: 'excellent'
    }}
    onClick={() => router.push('/player/521')}
/>
```

---

## 📝 Forms & Inputs

### Input

```tsx
// components/ui/input.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, error, ...props }, ref) => {
        return (
            <div className="space-y-1">
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                            icon && 'pl-10',
                            error &&
                                'border-destructive focus-visible:ring-destructive',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
```

**Ejemplo de uso:**

```tsx
import { Search } from 'lucide-react';

<Input
  placeholder="Buscar jugadores..."
  icon={<Search className="h-4 w-4" />}
/>

<Input
  type="email"
  placeholder="Email"
  error="Email inválido"
/>
```

---

### Select

```tsx
// components/ui/select.tsx
'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

export function Select({
    options,
    value,
    onChange,
    placeholder
}: {
    options: { value: string; label: string }[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <SelectPrimitive.Root value={value} onValueChange={onChange}>
            <SelectPrimitive.Trigger className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <SelectPrimitive.Value placeholder={placeholder} />
                <SelectPrimitive.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    className="relative z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md animate-in fade-in-80"
                    position="popper"
                >
                    <SelectPrimitive.Viewport className="p-1">
                        {options.map(option => (
                            <SelectPrimitive.Item
                                key={option.value}
                                value={option.value}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <SelectPrimitive.ItemIndicator>
                                        <Check className="h-4 w-4" />
                                    </SelectPrimitive.ItemIndicator>
                                </span>
                                <SelectPrimitive.ItemText>
                                    {option.label}
                                </SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                        ))}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
}
```

**Ejemplo de uso:**

```tsx
<Select
    placeholder="Seleccionar posición"
    options={[
        { value: 'GK', label: 'Portero' },
        { value: 'DEF', label: 'Defensa' },
        { value: 'MID', label: 'Centrocampista' },
        { value: 'FWD', label: 'Delantero' }
    ]}
    value={position}
    onChange={setPosition}
/>
```

---

## 🧭 Navigation

### Tabs

```tsx
// components/ui/tabs.tsx
'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';

export function Tabs({
    tabs,
    defaultValue,
    children
}: {
    tabs: { value: string; label: string; icon?: React.ReactNode }[];
    defaultValue: string;
    children: React.ReactNode;
}) {
    return (
        <TabsPrimitive.Root defaultValue={defaultValue} className="w-full">
            <TabsPrimitive.List className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                {tabs.map(tab => (
                    <TabsPrimitive.Trigger
                        key={tab.value}
                        value={tab.value}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>

            {children}
        </TabsPrimitive.Root>
    );
}

export const TabsContent = TabsPrimitive.Content;
```

**Ejemplo de uso:**

```tsx
import { Users, TrendingUp, Calendar } from 'lucide-react';

<Tabs
    tabs={[
        {
            value: 'squad',
            label: 'Plantilla',
            icon: <Users className="h-4 w-4" />
        },
        {
            value: 'stats',
            label: 'Estadísticas',
            icon: <TrendingUp className="h-4 w-4" />
        },
        {
            value: 'fixtures',
            label: 'Partidos',
            icon: <Calendar className="h-4 w-4" />
        }
    ]}
    defaultValue="squad"
>
    <TabsContent value="squad">{/* Contenido plantilla */}</TabsContent>
    <TabsContent value="stats">{/* Contenido estadísticas */}</TabsContent>
</Tabs>;
```

---

## 💬 Feedback

### Toast Notification

```tsx
// components/ui/toast.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

export const useToast = create<ToastStore>(set => ({
    toasts: [],
    addToast: toast =>
        set(state => ({
            toasts: [
                ...state.toasts,
                { ...toast, id: Math.random().toString(36) }
            ]
        })),
    removeToast: id =>
        set(state => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }))
}));

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map(toast => {
                    const Icon = icons[toast.type];
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="flex items-start gap-3 rounded-lg border bg-background p-4 shadow-lg min-w-[300px]"
                        >
                            <Icon
                                className={`h-5 w-5 ${
                                    toast.type === 'success'
                                        ? 'text-green-500'
                                        : toast.type === 'error'
                                          ? 'text-red-500'
                                          : 'text-blue-500'
                                }`}
                            />
                            <div className="flex-1">
                                <h4 className="font-semibold">{toast.title}</h4>
                                {toast.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {toast.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
```

**Ejemplo de uso:**

```tsx
const { addToast } = useToast();

addToast({
    type: 'success',
    title: 'Jugador añadido',
    description: 'Lewandowski ha sido añadido a tu plantilla'
});
```

---

## 🎯 Fantasy-Specific Components

### BargainCard

```tsx
// components/fantasy/bargain-card.tsx
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BargainCardProps {
    player: {
        name: string;
        team: string;
        position: string;
        price: number;
        estimatedPoints: number;
        valueRatio: number;
        nextOpponent: string;
        difficulty: 'easy' | 'medium' | 'hard';
    };
    onAddPlayer: () => void;
}

const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500'
};

export function BargainCard({ player, onAddPlayer }: BargainCardProps) {
    return (
        <Card hover gradient className="border-2 border-primary/20">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            {player.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {player.position} - {player.team}
                        </p>
                    </div>
                    <Badge variant="success" className="text-lg">
                        {player.valueRatio.toFixed(2)}x
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Precio</p>
                        <p className="text-2xl font-bold font-mono flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {player.price}M
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Puntos estimados
                        </p>
                        <p className="text-2xl font-bold font-mono flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            {player.estimatedPoints}
                        </p>
                    </div>
                </div>

                {/* Next Match */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Próximo rival
                        </p>
                        <p className="font-semibold">{player.nextOpponent}</p>
                    </div>
                    <div
                        className={`h-3 w-3 rounded-full ${difficultyColors[player.difficulty]}`}
                    />
                </div>

                {/* Action */}
                <Button className="w-full" onClick={onAddPlayer}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Añadir a Plantilla
                </Button>
            </CardContent>
        </Card>
    );
}
```

---

### EvolutionChart

```tsx
// components/fantasy/evolution-chart.tsx
'use client';

import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';

interface EvolutionChartProps {
    data: {
        gameweek: number;
        price: number;
        points: number;
        rating: number;
    }[];
    playerName: string;
}

export function EvolutionChart({ data, playerName }: EvolutionChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Evolución de {playerName}</CardTitle>
            </CardHeader>
            <CardContent>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={isDark ? '#2a2a2a' : '#e5e7eb'}
                            />
                            <XAxis
                                dataKey="gameweek"
                                stroke={isDark ? '#8a8a8a' : '#6b6b6b'}
                                label={{
                                    value: 'Jornada',
                                    position: 'insideBottom',
                                    offset: -5
                                }}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke={isDark ? '#8a8a8a' : '#6b6b6b'}
                                label={{
                                    value: 'Precio (M)',
                                    angle: -90,
                                    position: 'insideLeft'
                                }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke={isDark ? '#8a8a8a' : '#6b6b6b'}
                                label={{
                                    value: 'Puntos',
                                    angle: 90,
                                    position: 'insideRight'
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark
                                        ? '#1e1e1e'
                                        : '#ffffff',
                                    border: `1px solid ${isDark ? '#3a3a3a' : '#e5e7eb'}`,
                                    borderRadius: '8px'
                                }}
                                labelStyle={{
                                    color: isDark ? '#f5f5f5' : '#1a1a1a'
                                }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="price"
                                stroke="#0066cc"
                                strokeWidth={3}
                                dot={{ fill: '#0066cc', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="points"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </CardContent>
        </Card>
    );
}
```

---

## 🎨 Layout Components

### Dashboard Container

```tsx
// components/layout/dashboard-container.tsx
'use client';

import { motion } from 'framer-motion';

export function DashboardContainer({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-background"
        >
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
                {children}
            </div>
        </motion.div>
    );
}
```

---

### Grid Layout

```tsx
// components/layout/grid.tsx
import { motion } from 'framer-motion';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export function Grid({
    children,
    cols = 3
}: {
    children: React.ReactNode;
    cols?: 1 | 2 | 3 | 4;
}) {
    const colsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={`grid ${colsClass[cols]} gap-6`}
        >
            {children}
        </motion.div>
    );
}

export function GridItem({ children }: { children: React.ReactNode }) {
    return <motion.div variants={item}>{children}</motion.div>;
}
```

**Ejemplo de uso:**

```tsx
<Grid cols={3}>
    <GridItem>
        <PlayerCard player={player1} />
    </GridItem>
    <GridItem>
        <PlayerCard player={player2} />
    </GridItem>
    <GridItem>
        <PlayerCard player={player3} />
    </GridItem>
</Grid>
```

---

## 🎬 Animation Patterns

### Stagger Children

```tsx
// Ejemplo de animación staggered
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

<motion.div variants={container} initial="hidden" animate="show">
    {players.map(player => (
        <motion.div key={player.id} variants={item}>
            <PlayerCard player={player} />
        </motion.div>
    ))}
</motion.div>;
```

---

### Page Transitions

```tsx
// app/layout.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
```

---

### Hover Effects

```tsx
// Hover scale + elevation
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
  className="cursor-pointer"
>
  <Card>{/* content */}</Card>
</motion.div>

// Hover rotate icon
<motion.div
  whileHover={{ rotate: 180 }}
  transition={{ duration: 0.3 }}
>
  <Settings className="h-5 w-5" />
</motion.div>

// Hover gradient shift
<motion.div
  whileHover={{
    background: 'linear-gradient(90deg, #0066cc 0%, #10b981 100%)',
  }}
  transition={{ duration: 0.3 }}
  className="p-6 rounded-lg"
>
  {/* content */}
</motion.div>
```

---

## ✅ Components Checklist

### Base Components

- [x] ✅ Button (con loading state)
- [x] ✅ Card (con hover y gradient)
- [x] ✅ Badge (múltiples variants)
- [x] ✅ Input (con icon y error)
- [x] ✅ Select (Radix UI)

### Data Display

- [x] ✅ StatsCard (con trend indicators)
- [x] ✅ PlayerCard (completo con avatar)
- [x] ✅ BargainCard (chollos Fantasy)
- [x] ✅ EvolutionChart (Recharts)

### Navigation

- [x] ✅ Tabs (con icons)

### Feedback

- [x] ✅ Toast (con Zustand)

### Layout

- [x] ✅ DashboardContainer
- [x] ✅ Grid (staggered animation)

### Animations

- [x] ✅ Stagger children
- [x] ✅ Page transitions
- [x] ✅ Hover effects

---

## 🚀 Implementación

### Paso 1: Instalar Dependencias

```bash
npm install @radix-ui/react-select @radix-ui/react-tabs framer-motion recharts zustand class-variance-authority
```

### Paso 2: Configurar Utils

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

### Paso 3: Usar Componentes

```tsx
// app/dashboard/page.tsx
import { Grid, GridItem } from '@/components/layout/grid';
import { StatsCard } from '@/components/fantasy/stats-card';
import { PlayerCard } from '@/components/fantasy/player-card';
import { Target, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
    return (
        <DashboardContainer>
            <h1 className="text-4xl font-display font-bold mb-8">
                Mi Dashboard Fantasy
            </h1>

            {/* Stats Overview */}
            <Grid cols={3}>
                <GridItem>
                    <StatsCard
                        title="Puntos Totales"
                        value="1,245"
                        change={12.5}
                        trend="up"
                        icon={<Target className="h-6 w-6 text-primary" />}
                    />
                </GridItem>
                <GridItem>
                    <StatsCard
                        title="Jugadores Activos"
                        value="15"
                        change={0}
                        trend="neutral"
                        icon={<Users className="h-6 w-6 text-secondary" />}
                    />
                </GridItem>
                <GridItem>
                    <StatsCard
                        title="Ranking"
                        value="#1,234"
                        change={-5.2}
                        trend="down"
                        icon={<TrendingUp className="h-6 w-6 text-accent" />}
                    />
                </GridItem>
            </Grid>

            {/* Player Cards */}
            <h2 className="text-2xl font-display font-semibold mt-12 mb-6">
                Mi Plantilla
            </h2>
            <Grid cols={3}>
                {players.map(player => (
                    <GridItem key={player.id}>
                        <PlayerCard
                            player={player}
                            onClick={() => router.push(`/player/${player.id}`)}
                        />
                    </GridItem>
                ))}
            </Grid>
        </DashboardContainer>
    );
}
```

---

## 📚 Recursos Adicionales

- **shadcn/ui docs**: https://ui.shadcn.com
- **Radix UI primitives**: https://radix-ui.com
- **Framer Motion docs**: https://framer.com/motion
- **Recharts docs**: https://recharts.org
- **Lucide Icons**: https://lucide.dev

---

**Fecha**: 30 de Septiembre de 2025 **Versión**: 1.0 **Estado**: ✅ Listo para
implementación
