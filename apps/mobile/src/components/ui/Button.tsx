import * as React from 'react';
import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-md px-4 active:opacity-80 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent underline-offset-4',
      },
      size: {
        default: 'h-11',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-12 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('text-base font-medium leading-none', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-base',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends Omit<PressableProps, 'children'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children?: React.ReactNode;
}

function renderTextChildren(children: React.ReactNode, className?: string) {
  if (typeof children === 'string' || typeof children === 'number') {
    return <Text className={className}>{children}</Text>;
  }
  if (Array.isArray(children)) {
    const nodes: React.ReactNode[] = [];
    let buffer: string[] = [];
    const flush = () => {
      if (buffer.length > 0) {
        nodes.push(
          <Text key={nodes.length} className={className}>
            {buffer.join('')}
          </Text>,
        );
        buffer = [];
      }
    };
    for (const child of children) {
      if (typeof child === 'string' || typeof child === 'number') {
        buffer.push(String(child));
      } else {
        flush();
        nodes.push(child);
      }
    }
    flush();
    return nodes;
  }
  return children;
}

const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          className={cn(
            size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
            buttonTextVariants({ variant }),
          )}
        />
      ) : null}
      {children != null
        ? renderTextChildren(children, cn(buttonTextVariants({ variant, size })))
        : null}
    </Pressable>
  ),
);
Button.displayName = 'Button';

export { Button, buttonVariants, buttonTextVariants };
