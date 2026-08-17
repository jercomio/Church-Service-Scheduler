import * as React from 'react';
import { Text, type TextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'flex-row items-center self-start rounded-full px-2.5 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border bg-transparent text-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        success: 'bg-success text-success-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends TextProps, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<React.ComponentRef<typeof Text>, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(badgeVariants({ variant }), 'text-xs font-medium', className)}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
