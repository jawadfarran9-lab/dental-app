import type { GestureResponderEvent } from 'react-native';

// Fallback types if navigation packages aren't available
type BottomTabBarButtonProps = any;
type PlatformPressableProps = any;

let BottomTabBarButton: any;
let PlatformPressableComponent: any;

try {
  const bottomTabs = require('@react-navigation/bottom-tabs');
  BottomTabBarButton = bottomTabs.BottomTabBarButtonProps;
} catch (e) {
  // Navigation package not available
}

try {
  const elements = require('@react-navigation/elements');
  PlatformPressableComponent = elements.PlatformPressable;
} catch (e) {
  // Elements package not available
}

let Haptics: any;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
}

export function HapticTab(props: BottomTabBarButtonProps) {
  const Component = PlatformPressableComponent || 'div';
  
  return (
    <Component
      {...props}
      onPressIn={(ev: GestureResponderEvent) => {
        if (process.env.EXPO_OS === 'ios' && Haptics) {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
