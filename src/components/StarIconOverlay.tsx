import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type ClinicType = 'dental' | 'laser' | 'beauty';

type StarIconOverlayProps = {
  clinicType: ClinicType;
  size: number;
};

/**
 * Renders a small clinic-type icon badge at the bottom-right
 * of the star avatar. Pure, static, no animation.
 */
const StarIconOverlay: React.FC<StarIconOverlayProps> = ({ clinicType, size }) => {
  const badgeSize = Math.round(size * 0.22);
  const iconSize = Math.round(badgeSize * 0.55);
  const halfIcon = iconSize / 2;

  return (
    <View
      style={[
        overlayStyles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          bottom: size * 0.02,
          right: size * 0.02,
        },
      ]}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 16 16">
        {clinicType === 'dental' && (
          /* Minimal tooth silhouette */
          <Path
            d="M8 1.5C6.2 1.5 4.5 2.8 4.5 4.8c0 1.2.4 2 .8 3.2.5 1.5.7 3.2 1.2 4.5.2.5.5.8.8.8s.5-.2.7-.6c.3-.6.5-1.2.7-1.2s.4.6.7 1.2c.2.4.4.6.7.6s.6-.3.8-.8c.5-1.3.7-3 1.2-4.5.4-1.2.8-2 .8-3.2 0-2-1.7-3.3-3.5-3.3z"
            fill="#FFFFFF"
            opacity={0.95}
          />
        )}
        {clinicType === 'laser' && (
          /* Subtle beam / ray icon */
          <>
            <Path
              d="M3 13L13 3"
              stroke="#FFFFFF"
              strokeWidth={1.6}
              strokeLinecap="round"
              fill="none"
              opacity={0.95}
            />
            <Circle cx="13" cy="3" r="2" fill="#FFFFFF" opacity={0.8} />
            <Path
              d="M5 9L9 5"
              stroke="#FFFFFF"
              strokeWidth={1}
              strokeLinecap="round"
              fill="none"
              opacity={0.5}
            />
          </>
        )}
        {clinicType === 'beauty' && (
          /* Small 4-point sparkle */
          <Path
            d="M8 1L9.2 6.2 14.5 8 9.2 9.8 8 15 6.8 9.8 1.5 8 6.8 6.2Z"
            fill="#FFFFFF"
            opacity={0.95}
          />
        )}
      </Svg>
    </View>
  );
};

const overlayStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 58, 95, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default React.memo(StarIconOverlay);
