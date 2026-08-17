import * as React from 'react';
import { Switch as NativeSwitch } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/lib/theme-colors';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
  const colors = useThemeColors();
  return (
    <NativeSwitch
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      value={checked}
      onValueChange={onCheckedChange}
      trackColor={{
        true: colors.primary,
        false: colors.input,
      }}
      thumbColor={colors.background}
      className={cn(className)}
    />
  );
}
