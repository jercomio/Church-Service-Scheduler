import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { Animated, Dimensions, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface SlidePageProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Full-screen page that slides in over the current view from the right and
 * slides back out to the right on close. Rendered inside a Modal window, so it
 * covers every other layer of that window (sheet included).
 */
export function SlidePage({ visible, onClose, title, children }: SlidePageProps) {
  const translateX = useMemo(() => new Animated.Value(SCREEN_WIDTH), []);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      translateX.setValue(SCREEN_WIDTH);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateX]);

  return (
    <Animated.View
      className="absolute inset-0 z-50 bg-background"
      style={{
        transform: [{ translateX }],
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: { width: -6, height: 0 },
        elevation: 12,
      }}
    >
      <View
        className="flex-row items-center justify-between border-b border-border px-4 py-3"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          className="rounded-full p-1 active:bg-muted"
          accessibilityLabel="Close"
        >
          <X size={20} className="text-muted-foreground" />
        </Pressable>
      </View>
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        {children}
      </View>
    </Animated.View>
  );
}
