import * as React from 'react';
import { Text, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  containerClassName?: string;
  rightElement?: React.ReactNode;
}

export const FormField = React.forwardRef<
  React.ComponentRef<typeof Input>,
  FormFieldProps
>(({ label, error, containerClassName, rightElement, ...props }, ref) => (
  <View className={cn('gap-1.5', containerClassName)}>
    <Text className="text-sm font-medium text-foreground">{label}</Text>
    <View className="relative">
      <Input ref={ref} error={!!error} className={cn(rightElement && 'pr-11')} {...props} />
      {rightElement ? (
        <View className="absolute inset-y-0 right-0 justify-center px-2">{rightElement}</View>
      ) : null}
    </View>
    {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
  </View>
));
FormField.displayName = 'FormField';
