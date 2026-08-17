import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { cn } from '@/lib/utils';

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-2 bg-background py-8', className)}>
      <ActivityIndicator size="large" className="text-primary" />
      {label ? <Text className="text-sm text-muted-foreground">{label}</Text> : null}
    </View>
  );
}
