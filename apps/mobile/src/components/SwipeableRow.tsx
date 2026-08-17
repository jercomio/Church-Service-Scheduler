import * as React from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';

const ACTION_WIDTH = 80;

export interface SwipeableRowProps {
  children: React.ReactNode;
  onPress: () => void;
  onDelete: () => void;
  accessibilityLabel?: string;
}

export function SwipeableRow({
  children,
  onPress,
  onDelete,
  accessibilityLabel = 'Delete item',
}: SwipeableRowProps) {
  const [translateX] = React.useState(() => new Animated.Value(0));
  const [isOpen, setIsOpen] = React.useState(false);

  const animateTo = (toValue: number, open: boolean) => {
    setIsOpen(open);
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 24,
    }).start();
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      const base = isOpen ? -ACTION_WIDTH : 0;
      const next = Math.max(-ACTION_WIDTH, Math.min(0, base + g.dx));
      translateX.setValue(next);
    },
    onPanResponderRelease: (_, g) => {
      const base = isOpen ? -ACTION_WIDTH : 0;
      const next = base + g.dx;
      animateTo(next < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0, next < -ACTION_WIDTH / 2);
    },
    onPanResponderTerminate: () => animateTo(0, false),
  });

  return (
    <View className="overflow-hidden rounded-md bg-card">
      <View className="absolute inset-y-0 right-0 w-20 items-center justify-center bg-destructive">
        <Pressable
          onPress={onDelete}
          hitSlop={4}
          accessibilityLabel={accessibilityLabel}
          className="h-full w-full items-center justify-center active:opacity-80"
        >
          <Trash2 size={20} className="text-destructive-foreground" />
        </Pressable>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        className="bg-card"
        style={{ transform: [{ translateX }] }}
      >
        <Pressable
          onPress={() => {
            if (isOpen) {
              animateTo(0, false);
            } else {
              onPress();
            }
          }}
          className="active:bg-muted"
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}
