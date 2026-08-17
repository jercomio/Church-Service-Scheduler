import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/lib/theme-colors';

export interface InputProps extends TextInputProps {
  error?: boolean;
}

const Input = React.forwardRef<React.ComponentRef<typeof TextInput>, InputProps>(
  ({ className, error, ...props }, ref) => {
    const colors = useThemeColors();
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={colors.mutedForeground}
        className={cn(
          'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
          'focus:border-ring',
          error && 'border-destructive',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
