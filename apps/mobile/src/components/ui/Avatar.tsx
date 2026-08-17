import * as React from 'react';
import { Image, Text, View } from 'react-native';
import { avatarColor, cn, initials } from '@/lib/utils';

export interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  src?: string | null;
}

const sizes = {
  sm: 'h-8 w-8 rounded-full',
  md: 'h-10 w-10 rounded-full',
  lg: 'h-14 w-14 rounded-full',
};

export function Avatar({ firstName, lastName, size = 'md', className, src }: AvatarProps) {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        accessibilityLabel={`${firstName} ${lastName}`}
        className={cn(sizes[size], className)}
      />
    );
  }
  return (
    <View
      style={{ backgroundColor: avatarColor(firstName, lastName) }}
      className={cn(
        'items-center justify-center',
        sizes[size],
        className,
      )}
    >
      <Text
        className={cn(
          'font-semibold text-white',
          size === 'lg' ? 'text-base' : 'text-xs',
        )}
      >
        {initials(firstName, lastName)}
      </Text>
    </View>
  );
}
