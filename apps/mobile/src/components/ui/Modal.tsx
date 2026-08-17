import * as React from 'react';
import { Modal as RNModal, Pressable, ScrollView, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Rendered above the sheet, covering the whole modal window (e.g. slide pages). */
  overlay?: React.ReactNode;
  /** Window-level transition. Sheets default to sliding up from the bottom. */
  animationType?: 'none' | 'fade' | 'slide';
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  overlay,
  animationType = 'slide',
}: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType={animationType} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close" />
        <View className="max-h-[80%] rounded-t-xl border border-border bg-background p-4 pb-8">
          <View className="mb-2 h-1 w-10 self-center rounded-full bg-muted" />
          <View className="mb-3 flex-row items-center justify-between">
            {title ? <Text className="text-lg font-semibold text-foreground">{title}</Text> : <View />}
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="rounded-full p-1 active:bg-muted"
              accessibilityLabel="Close modal"
            >
              <X size={20} className="text-muted-foreground" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
        {overlay}
      </View>
    </RNModal>
  );
}

export function SheetItem({
  label,
  subtitle,
  onPress,
  selected,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center justify-between rounded-md border border-transparent bg-background px-3 py-3 active:bg-muted',
        selected && 'border-primary bg-accent',
      )}
    >
      <View className="flex-1">
        <Text className="text-base text-foreground">{label}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-muted-foreground">{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}
