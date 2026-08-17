import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
  keyboardShouldPersistTaps?: 'never' | 'always' | 'handled';
}

export function Screen({ children, className, scroll, keyboardShouldPersistTaps }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const container = (
    <View
      className={cn('flex-1 bg-background px-4', className)}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 pb-8"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {children}
      </ScrollView>
    );
  }
  return container;
}
