import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface AnimatedStarProps {
  size?: number;
  icon?: string;
  imageUri?: string;
  showAddIcon?: boolean;
  isAnimated?: boolean;
  borderWidth?: number;
}

// Create a star path for SVG
const createStarPath = (cx: number, cy: number, outerRadius: number, innerRadius: number, points: number = 5): string => {
  const step = Math.PI / points;
  let path = '';
  
  for (let i = 0; i < 2 * points; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  path += ' Z';
  return path;
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient as any);

export const AnimatedStar: React.FC<AnimatedStarProps> = ({
  size = 70,
  icon,
  imageUri,
  showAddIcon = false,
  isAnimated = true,
  borderWidth = 3,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimated) {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isAnimated]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  const contentSize = size * 0.6;
  
  // Rainbow colors for the gradient
  const rainbowColors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3', // Violet
    '#FF0000', // Red (to complete the loop)
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Animated rainbow border */}
      <Animated.View 
        style={[
          styles.borderContainer, 
          { 
            width: size, 
            height: size,
            transform: [{ rotate }],
          }
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B6B" />
              <Stop offset="14%" stopColor="#FECA57" />
              <Stop offset="28%" stopColor="#48DBFB" />
              <Stop offset="42%" stopColor="#FF9FF3" />
              <Stop offset="57%" stopColor="#54A0FF" />
              <Stop offset="71%" stopColor="#5F27CD" />
              <Stop offset="85%" stopColor="#FF6B6B" />
              <Stop offset="100%" stopColor="#FECA57" />
            </LinearGradient>
          </Defs>
          <Path
            d={createStarPath(size / 2, size / 2, outerRadius - 2, innerRadius + 8)}
            fill="url(#rainbowGradient)"
          />
        </Svg>
      </Animated.View>

      {/* Inner content (static) */}
      <View style={[styles.innerContainer, { width: contentSize, height: contentSize }]}>
        <View style={[styles.innerContent, { 
          width: contentSize - 4, 
          height: contentSize - 4,
          backgroundColor: '#F8FAFC',
        }]}>
          {showAddIcon ? (
            <View style={styles.addIconContainer}>
              <Text style={styles.addIcon}>➕</Text>
            </View>
          ) : imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={[styles.image, { width: contentSize - 8, height: contentSize - 8 }]} 
            />
          ) : icon ? (
            <Text style={[styles.icon, { fontSize: contentSize * 0.5 }]}>{icon}</Text>
          ) : (
            <View style={[styles.placeholder, { 
              width: contentSize - 8, 
              height: contentSize - 8,
            }]} />
          )}
        </View>
      </View>
    </View>
  );
};

// Mini version for post headers
export const MiniAnimatedStar: React.FC<{
  size?: number;
  icon?: string;
  imageUri?: string;
}> = ({ size = 40, icon, imageUri }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  const contentSize = size * 0.55;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View 
        style={[
          styles.borderContainer, 
          { 
            width: size, 
            height: size,
            transform: [{ rotate }],
          }
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="rainbowGradientMini" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B6B" />
              <Stop offset="14%" stopColor="#FECA57" />
              <Stop offset="28%" stopColor="#48DBFB" />
              <Stop offset="42%" stopColor="#FF9FF3" />
              <Stop offset="57%" stopColor="#54A0FF" />
              <Stop offset="71%" stopColor="#5F27CD" />
              <Stop offset="85%" stopColor="#FF6B6B" />
              <Stop offset="100%" stopColor="#FECA57" />
            </LinearGradient>
          </Defs>
          <Path
            d={createStarPath(size / 2, size / 2, outerRadius - 1, innerRadius + 4)}
            fill="url(#rainbowGradientMini)"
          />
        </Svg>
      </Animated.View>

      <View style={[styles.innerContainer, { width: contentSize, height: contentSize }]}>
        <View style={[styles.innerContentRound, { 
          width: contentSize, 
          height: contentSize,
          backgroundColor: '#F8FAFC',
          borderRadius: contentSize / 2,
        }]}>
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={{ width: contentSize - 4, height: contentSize - 4, borderRadius: (contentSize - 4) / 2 }} 
            />
          ) : icon ? (
            <Text style={{ fontSize: contentSize * 0.45 }}>{icon}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  borderContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  innerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  innerContentRound: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: 6,
  },
  icon: {
    textAlign: 'center',
  },
  placeholder: {
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  addIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 20,
  },
});

export default AnimatedStar;
