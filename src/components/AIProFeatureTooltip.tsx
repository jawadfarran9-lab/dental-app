/**
 * AI Pro Feature Tooltip
 * Displays tooltip when hovering over AI Pro feature in chat
 */

import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface AIProFeatureTooltipProps {
  visible: boolean;
  message?: string;
  autoHide?: boolean;
  duration?: number;
  position?: 'top' | 'bottom';
}

export function AIProFeatureTooltip({
  visible,
  message = 'AI Pro features enabled',
  autoHide = true,
  duration = 3000,
  position = 'top',
}: AIProFeatureTooltipProps) {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(visible);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  
  const styles = useMemo(() => createStyles(colors, position), [colors, position]);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (autoHide) {
        const timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setIsVisible(false));
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [visible, fadeAnim, autoHide, duration]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
      ]}
    >
      <View style={[styles.tooltip, { backgroundColor: colors.primary }]}>
        <View style={styles.content}>
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={[styles.arrow, { borderTopColor: colors.primary }]} />
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: any, position: string) => {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position === 'top' ? 10 : undefined,
      bottom: position === 'bottom' ? 10 : undefined,
      alignItems: 'center',
      zIndex: 1000,
    },
    tooltip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    message: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    arrow: {
      position: 'absolute',
      bottom: -6,
      width: 12,
      height: 6,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
  });
};
