import * as React from 'react';
import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center gap-2 py-10 px-6', className)}>
      {Icon ? (
        <View className="mb-2 rounded-full bg-muted p-3">
          <Icon size={24} className="text-muted-foreground" />
        </View>
      ) : null}
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-muted-foreground">{description}</Text>
      ) : null}
    </View>
  );
}
