import { isClinicOwner } from '@/src/utils/roleUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, useColorScheme, View } from 'react-native';

// ========== Orbiting Stars Component ==========
const OrbitingStars: React.FC<{ active: boolean }> = ({ active }) => {
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      // Scale in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();

      // Continuous orbital rotation around the tab
      const orbitLoop = Animated.loop(
        Animated.timing(orbitAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Smooth cubic easing
          useNativeDriver: true,
        })
      );
      orbitLoop.start();

      return () => orbitLoop.stop();
    } else {
      // Scale out
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      orbitAnim.setValue(0);
    }
  }, [active]);

  // Full 360° rotation for orbital movement
  const orbitRotation = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.orbitContainer,
        {
          transform: [{ rotate: orbitRotation }],
          opacity: scaleAnim,
        },
      ]}
    >
      {/* Star 1: Just above icon, offset right */}
      <Animated.Text
        style={[
          styles.orbitStar,
          styles.star1,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        ⭐
      </Animated.Text>
      {/* Star 2: Right above star 1 (vertical pair) */}
      <Animated.Text
        style={[
          styles.orbitStar,
          styles.star2,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        ⭐
      </Animated.Text>
    </Animated.View>
  );
};

// ========== Premium Tab Icon with Glow Effect ==========
const TabIcon: React.FC<{
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  isDark: boolean;
}> = ({ name, focused, color, isDark }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const glowAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.05 : 0.95,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View 
      style={[
        styles.iconContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* Frosted glass background for active state */}
      {focused && (
        <Animated.View 
          style={[
            styles.iconGlow,
            { 
              opacity: glowAnim,
              backgroundColor: isDark ? 'rgba(61, 158, 255, 0.3)' : 'rgba(61, 158, 255, 0.18)',
            }
          ]} 
        />
      )}
      {/* Orbiting stars decoration */}
      <OrbitingStars active={focused} />
      <Ionicons 
        name={focused ? name : `${name}-outline` as keyof typeof Ionicons.glyphMap} 
        size={focused ? 26 : 24} 
        color={focused ? '#3D9EFF' : color} 
        style={focused ? styles.iconShadow : undefined}
      />
    </Animated.View>
  );
};

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const [isClinic, setIsClinic] = useState(false);

  // Check role on mount only
  useEffect(() => {
    const checkRole = async () => {
      const clinic = await isClinicOwner();
      setIsClinic(clinic);
    };
    checkRole();
  }, []);

  // Premium glassmorphism colors
  const activeColor = '#3D9EFF'; // Bright blue
  const inactiveColor = isDark ? '#7A8BA3' : '#A0AAB8'; // Soft grey

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            borderWidth: 0,
            paddingBottom: 16,
            paddingTop: 8,
            paddingHorizontal: 4,
            // Soft glow shadow
            shadowColor: '#3D9EFF',
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 20,
          },
          tabBarBackground: () => (
            <View style={styles.tabBarBackground}>
              {/* Sky blue gradient matching app background */}
              <LinearGradient
                colors={isDark 
                  ? ['rgba(30, 50, 80, 0.95)', 'rgba(25, 45, 75, 0.98)']
                  : ['#E8F4FC', '#DCF0FC', '#D6EFFF']
                }
                locations={isDark ? [0, 1] : [0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Subtle inner glow overlay */}
              <LinearGradient
                colors={isDark
                  ? ['rgba(100, 150, 220, 0.1)', 'rgba(80, 130, 200, 0.05)']
                  : ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)']
                }
                locations={isDark ? [0, 1] : [0, 0.4, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Soft border effect */}
              <View style={[
                styles.tabBarBorder,
                { borderColor: isDark ? 'rgba(100, 140, 200, 0.3)' : 'rgba(180, 215, 245, 0.8)' }
              ]} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            letterSpacing: 0.3,
          },
          tabBarIconStyle: {
            marginBottom: -2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
            minWidth: 64,
            minHeight: 44, // Minimum tap target
          },
          headerShown: false,
        }}
        initialRouteName="home"
      >
        {/* 1. Home */}
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="home" focused={focused} color={color} isDark={isDark} />
            ),
          }}
        />

        {/* 2. Clinic */}
        <Tabs.Screen
          name="clinic"
          options={{
            title: 'Clinic',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="briefcase" focused={focused} color={color} isDark={isDark} />
            ),
          }}
        />

        {/* 3. Subscribe */}
        <Tabs.Screen
          name="subscription"
          options={{
            title: 'Subscription',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="star" focused={focused} color={color} isDark={isDark} />
            ),
          }}
        />

        {/* 4. AI Pro */}
        <Tabs.Screen
          name="ai"
          options={{
            title: 'AI Pro',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="sparkles" focused={focused} color={color} isDark={isDark} />
            ),
          }}
        />

        {/* 5. Clinics (public discovery) */}
        <Tabs.Screen
          name="clinics"
          options={{
            title: 'Clinics',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="grid" focused={focused} color={color} isDark={isDark} />
            ),
          }}
        />

        {/* Hidden: create screen (for routing only) */}
        <Tabs.Screen
          name="create"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabBarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 64,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  iconGlow: {
    position: 'absolute',
    width: 66,
    height: 58,
    borderRadius: 16,
    shadowColor: '#3D9EFF',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  iconShadow: {
    textShadowColor: '#3D9EFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  orbitContainer: {
    position: 'absolute',
    width: 50,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitStar: {
    position: 'absolute',
    fontSize: 7,
    color: '#3D9EFF',
    textShadowColor: '#3D9EFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  star1: {
    // Bottom-right star: inside glow area
    bottom: 2,
    right: 2,
  },
  star2: {
    // Top-right star: inside glow area, diagonal from star1
    top: 2,
    right: 6,
  },
});
