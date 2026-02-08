import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import * as Location from 'expo-location';

// ========== Phone Illustration with GPS Icon ==========
const PhoneIllustration = () => (
  <View style={styles.illustrationContainer}>
    {/* Phone with GPS icon */}
    <View style={styles.phoneContainer}>
      {/* Decorative dots around phone */}
      <View style={[styles.decorativeDot, styles.dotTopLeft, { backgroundColor: '#FFD700' }]} />
      <View style={[styles.decorativeDot, styles.dotTopRight, { backgroundColor: '#FF69B4' }]} />
      <View style={[styles.decorativeDot, styles.dotBottomLeft, { backgroundColor: '#32CD32' }]} />
      <View style={[styles.decorativeDot, styles.dotBottomRight, { backgroundColor: '#00CED1' }]} />
      
      <Svg width={80} height={120} viewBox="0 0 80 120">
        <Defs>
          <LinearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E8E8E8" />
            <Stop offset="100%" stopColor="#D0D0D0" />
          </LinearGradient>
          <LinearGradient id="gpsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF6B6B" />
            <Stop offset="100%" stopColor="#FF3366" />
          </LinearGradient>
        </Defs>
        
        {/* Phone body */}
        <Rect
          x="10"
          y="5"
          width="60"
          height="110"
          rx="10"
          ry="10"
          fill="url(#phoneGradient)"
          stroke="#B0B0B0"
          strokeWidth="2"
        />
        
        {/* Phone screen */}
        <Rect
          x="15"
          y="15"
          width="50"
          height="80"
          rx="3"
          ry="3"
          fill="#FFFFFF"
        />
        
        {/* Home button */}
        <Circle cx="40" cy="105" r="5" fill="#C0C0C0" />
        
        {/* GPS Pin Icon on screen */}
        <G transform="translate(25, 30)">
          <Path
            d="M15 0C8.373 0 3 5.373 3 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
            fill="url(#gpsGradient)"
          />
          <Circle cx="15" cy="12" r="5" fill="#FFFFFF" />
        </G>
        
        {/* Camera circle indicator */}
        <Circle cx="40" cy="50" r="8" fill="none" stroke="#E0E0E0" strokeWidth="2" />
      </Svg>
    </View>
  </View>
);

// ========== Bullet Point Component ==========
interface BulletPointProps {
  icon: 'location' | 'info' | 'settings';
  title: string;
  description: string;
}

const BulletIcon = ({ type }: { type: 'location' | 'info' | 'settings' }) => {
  const iconSize = 24;
  
  const icons = {
    location: (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
        {/* Video/Reel icon */}
        <Rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#262626" strokeWidth="1.5" />
        <Path d="M8 9l6 3-6 3V9z" fill="#262626" />
      </Svg>
    ),
    info: (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
        {/* Location pin with circle */}
        <Circle cx="12" cy="10" r="7" fill="none" stroke="#262626" strokeWidth="1.5" />
        <Path d="M12 6v4l2 2" fill="none" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 17v3" fill="none" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 20h8" fill="none" stroke="#262626" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    ),
    settings: (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
        {/* Settings/gear icon */}
        <Circle cx="12" cy="12" r="3" fill="none" stroke="#262626" strokeWidth="1.5" />
        <Path
          d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          fill="none"
          stroke="#262626"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    ),
  };

  return <View style={styles.bulletIcon}>{icons[type]}</View>;
};

const BulletPoint = ({ icon, title, description }: BulletPointProps) => (
  <View style={styles.bulletContainer}>
    <BulletIcon type={icon} />
    <View style={styles.bulletTextContainer}>
      <Text style={styles.bulletTitle}>{title}</Text>
      <Text style={styles.bulletDescription}>{description}</Text>
    </View>
  </View>
);

// ========== Main Screen Component ==========
export default function LocationPermissionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();

  const handleContinue = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      // If we have a returnTo param (coming from story editor), navigate there
      if (params.returnTo) {
        router.replace(params.returnTo as any);
        return;
      }
      
      // Otherwise, navigate to location list screen (original behavior)
      router.replace('/story/location-list');
    } catch (error) {
      console.error('Error requesting location permission:', error);
      // If we have a returnTo param, still navigate there on error
      if (params.returnTo) {
        router.replace(params.returnTo as any);
        return;
      }
      // Otherwise, navigate to list screen on error
      router.replace('/story/location-list');
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={28} color="#262626" />
      </TouchableOpacity>
      
      <View style={styles.content}>
        {/* Illustration */}
        <PhoneIllustration />

        {/* Title */}
        <Text style={styles.title}>
          To see locations nearby, allow access to your location
        </Text>

        {/* Bullet Points */}
        <View style={styles.bulletPointsContainer}>
          <BulletPoint
            icon="location"
            title="How you can use Location Services"
            description="Turning on your device location lets you discover places near you like when adding a location to a post, reel or story."
          />
          
          <BulletPoint
            icon="info"
            title="How we'll use this information"
            description="We'll do things like show you personalized content and places nearby, and help keep your account secure."
          />
          
          <BulletPoint
            icon="settings"
            title="How you can control this"
            description="You can change this anytime in your device settings. Even if Location Services is off, we use things like your IP address to estimate your general location."
          />
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ========== Styles ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  phoneContainer: {
    position: 'relative',
    width: 100,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotTopLeft: {
    top: 10,
    left: 5,
  },
  dotTopRight: {
    top: 5,
    right: 10,
  },
  dotBottomLeft: {
    bottom: 30,
    left: 0,
  },
  dotBottomRight: {
    top: 20,
    right: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#262626',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  bulletPointsContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  bulletIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
    lineHeight: 20,
  },
  bulletDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: '#4F5BD5',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
