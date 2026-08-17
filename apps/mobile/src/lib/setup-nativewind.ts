import { cssInterop } from 'nativewind';
import * as lucide from 'lucide-react-native';

for (const [, component] of Object.entries(lucide)) {
  if (typeof component === 'object' && component !== null) {
    cssInterop(component, {
      className: { target: 'style', nativeStyleToProp: { color: true } },
    });
  }
}

export type { LucideIcon } from 'lucide-react-native';
