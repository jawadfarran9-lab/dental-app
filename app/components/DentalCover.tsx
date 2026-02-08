import { useTheme } from '@/src/context/ThemeContext';
import { useClinicBrandingImage } from '@/src/hooks/useClinicBrandingImage';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBackground, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

/**
 * PHASE S: Customizable Header Image (Branding)
 * - Easy to swap header image
 * - Works with Web + Mobile + Light/Dark + AR/EN
 * - Responsive without covering content
 */

// ⭐ PHASE S: Easy customization point - change this to update header image globally
const HEADER_IMAGE: ImageSourcePropType = require('../../assets/splash-icon.png');

interface DentalCoverProps {
  clinicName?: string | null;
  customImage?: ImageSourcePropType; // PHASE S: Allow per-screen override
  brandingUrl?: string; // PHASE X: Owner-configured hero
}

const DentalCover: React.FC<DentalCoverProps> = ({ clinicName, customImage, brandingUrl }: DentalCoverProps) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const clinicBrandingUrl = useClinicBrandingImage();
  
  // PHASE G: Use clinic name if available, fallback to translated app name
  const displayName = clinicName && clinicName.trim() ? clinicName : t('landing.appName');
  
  // PHASE X: Prefer owner-configured branding, then per-screen override, then global default
  const resolvedBrand = brandingUrl || clinicBrandingUrl;
  const imageSource = customImage || (resolvedBrand ? { uri: resolvedBrand } : HEADER_IMAGE);
  
  return (
    <ImageBackground
      source={imageSource}
      style={styles.cover}
      imageStyle={styles.image}
    >
        <View style={[styles.overlay]}>       
        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.subtitle}>{t('landing.tagline')}</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 260,
    justifyContent: 'flex-end',
  },
  image: {
    resizeMode: 'cover',
  },
  overlay: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  overlayDark: {
    backgroundColor: 'transparent',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#f0f0f0',
    fontSize: 14,
    marginTop: 4,
  },
});

export default DentalCover;
