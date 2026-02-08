/**
 * AI Pro Badge Component
 * Small indicator badge showing AI Pro status
 */

import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

interface AIProBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

export function AIProBadge({
  size = 'small',
  showLabel = true,
  animated = false,
}: AIProBadgeProps) {
  const { colors } = useTheme();
  
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.primary },
        animated && styles.animated,
      ]}
    >
      <Ionicons
        name="star"
        size={styles.iconSize}
        color={colors.primary}
      />
      {showLabel && (
        <Text style={[styles.label, { color: colors.primary }]}>
          PRO
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: any, size: string) => {
  const sizeConfig = {
    small: { height: 20, iconSize: 12, fontSize: 10, gap: 2 },
    medium: { height: 28, iconSize: 14, fontSize: 12, gap: 4 },
    large: { height: 36, iconSize: 18, fontSize: 14, gap: 6 },
  };

  const config = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.small;

  return {
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      height: config.height,
      paddingHorizontal: config.height * 0.4,
      borderRadius: config.height / 2,
      borderWidth: 1.5,
      backgroundColor: colors.primary + '10',
      gap: config.gap,
    },
    iconSize: config.iconSize,
    label: {
      fontSize: config.fontSize,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
    animated: {
      shadowColor: '#fff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  };
};
