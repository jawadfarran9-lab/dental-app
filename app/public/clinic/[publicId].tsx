import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import PatientRatingGate, { PatientRatingGateHandle } from '@/src/controllers/PatientRatingGate';
import { fetchPublishedClinic, PublicClinic } from '@/src/services/publicClinics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Story = { id: string; title: string; color: string };
type MediaItem = { id: string; label: string; source: any };

const heroFallback = require('../../../assets/splash-icon.png');

export default function PublicClinicProfile() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const router = useRouter();
  const { publicId } = useLocalSearchParams<{ publicId: string }>();
  const styles = useMemo(() => createStyles(colors, isRTL), [colors, isRTL]);
  
  // Clinic data state
  const [clinic, setClinic] = useState<PublicClinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Rating modal ref and state
  const ratingGateRef = useRef<PatientRatingGateHandle>(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load clinic data
  useEffect(() => {
    const loadClinic = async () => {
      if (!publicId) {
        setError('No clinic ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const clinicData = await fetchPublishedClinic(publicId as string);
        
        if (!clinicData) {
          setError('Clinic not found or not published');
          setLoading(false);
          return;
        }

        setClinic(clinicData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading clinic:', err);
        setError('Failed to load clinic data');
        setLoading(false);
      }
    };

    loadClinic();
  }, [publicId]);

  // Detect scroll to bottom
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 120;
    if (contentSize.height - layoutMeasurement.height - contentOffset.y < paddingToBottom) {
      setHasReachedBottom(true);
    }
  };

  // Show rating on blur/unfocus (when leaving the screen)
  useEffect(() => {
    if (hasReachedBottom && clinic) {
      // Trigger once when navigating away
      ratingGateRef.current?.openOnceForView();
    }
  }, [hasReachedBottom, clinic]);

  // Profile data (derived from clinic or fallback)
  const profile = useMemo(() => {
    if (!clinic) {
      return {
        name: isRTL ? 'ابتسامة برايت' : 'Bright Smiles Dental',
        handle: '@brightsmiles.dxb',
        location: isRTL ? 'دبي، الإمارات' : 'Dubai, UAE',
        about: isRTL
          ? 'رعاية لطيفة للأسنان للعائلات مع تجربة مرضى مريحة وموثوقة.'
          : 'Gentle, family-first dental care with a warm, trusted patient experience.',
        services: isRTL
          ? ['تنظيف احترافي', 'تقويم شفاف', 'زراعة الأسنان', 'تبييض متقدم']
          : ['Pro cleanings', 'Clear aligners', 'Dental implants', 'Advanced whitening'],
        hours: isRTL ? 'الاثنين - السبت • 9 ص - 6 م' : 'Mon - Sat • 9:00 - 18:00',
        address: isRTL ? 'بوليفارد وسط المدينة، دبي' : 'Downtown Boulevard, Dubai',
        heroImage: heroFallback,
        avatar: heroFallback,
        specialty: null,
        averageRating: null,
        totalReviews: null,
      };
    }

    // Use actual clinic data
    return {
      name: clinic.name || (isRTL ? 'عيادة أسنان' : 'Dental Clinic'),
      handle: `@${clinic.name?.toLowerCase().replace(/\s+/g, '') || 'clinic'}`,
      location: clinic.address || (isRTL ? 'الموقع غير متوفر' : 'Location not available'),
      about: clinic.address || (isRTL ? 'عيادة أسنان متخصصة' : 'Professional dental clinic'),
      services: clinic.specialty 
        ? [t(`discover.specialty.${clinic.specialty}`)]
        : isRTL
          ? ['خدمات أسنان شاملة']
          : ['Comprehensive dental services'],
      hours: isRTL ? 'الاثنين - السبت • 9 ص - 6 م' : 'Mon - Sat • 9:00 - 18:00',
      address: clinic.address || (isRTL ? 'العنوان غير متوفر' : 'Address not available'),
      heroImage: clinic.heroImage ? { uri: clinic.heroImage } : heroFallback,
      avatar: clinic.heroImage ? { uri: clinic.heroImage } : heroFallback,
      specialty: clinic.specialty,
      averageRating: clinic.averageRating,
      totalReviews: clinic.totalReviews,
      isPro: clinic.tier === 'pro',
    };
  }, [clinic, isRTL, t]);

  const infoCards = [
    { key: 'about', label: t('clinicProfile.about'), value: profile.about, icon: 'information-circle' as const },
    { key: 'services', label: t('clinicProfile.services'), value: profile.services.join(' • '), icon: 'medkit' as const },
    { key: 'hours', label: t('clinicProfile.hours'), value: profile.hours, icon: 'time' as const },
    { key: 'location', label: t('clinicProfile.location'), value: profile.address, icon: 'location' as const },
  ];

  const stories: Story[] = [
    { id: 's1', title: 'Tour', color: '#fef3c7' },
    { id: 's2', title: 'Before/After', color: '#e0f2fe' },
    { id: 's3', title: 'Team', color: '#ede9fe' },
    { id: 's4', title: 'Care Tips', color: '#dcfce7' },
  ];

  const media: MediaItem[] = [
    { id: 'm1', label: 'Lounge', source: heroFallback },
    { id: 'm2', label: 'Smile 1', source: heroFallback },
    { id: 'm3', label: 'Smile 2', source: heroFallback },
    { id: 'm4', label: 'Invisalign', source: heroFallback },
    { id: 'm5', label: 'Implant', source: heroFallback },
    { id: 'm6', label: 'Team', source: heroFallback },
  ];

  const [activeNav, setActiveNav] = useState<'home' | 'reels' | 'discover' | 'profile' | 'add'>('profile');

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.buttonBackground} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading') || 'Loading...'}
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !clinic) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
          {isRTL ? 'عيادة غير متوفرة' : 'Clinic Not Available'}
        </Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {error || (isRTL ? 'لم يتم العثور على العيادة أو لم يتم نشرها' : 'Clinic not found or not published')}
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.buttonBackground }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.buttonText} />
          <Text style={[styles.backButtonText, { color: colors.buttonText }]}>
            {isRTL ? 'رجوع' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <PatientRatingGate
      ref={ratingGateRef}
      clinicName={clinic.name}
      clinicId={clinic.clinicId}
      enabled={true}
      onSubmit={(rating, note) => {
        // TODO: Send rating to backend via API
      }}
      onSkip={() => {
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={400}>
        <ImageBackground source={profile.heroImage} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <View style={styles.topRow}>
              <Text style={styles.subtitle}>{t('clinicProfile.subtitle')}</Text>
              {profile.isPro && (
                <View style={styles.proBadge}>
                  <Ionicons name="flash" size={14} color="#fef3c7" />
                  <Text style={styles.proText}>{t('clinicProfile.pro')}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRow}>
              <View style={styles.avatarWrapper}>
                <Image source={profile.avatar} style={styles.avatar} />
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.heroTitle}>{profile.name}</Text>
                <Text style={styles.handle}>{profile.handle}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#e5e7eb" />
                  <Text style={styles.locationText}>{profile.location}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.followBtn} activeOpacity={0.8}>
                <Text style={styles.followText}>{t('clinicProfile.follow')}</Text>
              </TouchableOpacity>
              {clinic.phone || clinic.whatsapp ? (
                <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#0a7ea4" />
                  <Text style={styles.contactText}>{t('clinicProfile.contact')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            
            {/* Rating stars display */}
            {profile.averageRating && profile.averageRating > 0 ? (
              <View style={styles.ratingRow}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={
                        star <= Math.floor(profile.averageRating!)
                          ? 'star'
                          : star === Math.ceil(profile.averageRating!) && profile.averageRating! % 1 >= 0.5
                          ? 'star-half'
                          : 'star-outline'
                      }
                      size={16}
                      color="#fef3c7"
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {profile.averageRating.toFixed(1)} • {profile.totalReviews || 0} {t('discover.reviews')}
                </Text>
              </View>
            ) : null}
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.statRow}>
            {[{ label: isRTL ? 'المنشورات' : 'Posts', value: '152' }, { label: isRTL ? 'المتابعون' : 'Followers', value: '8.4K' }, { label: isRTL ? 'يتابع' : 'Following', value: '210' }].map((item) => (
              <View key={item.label} style={styles.statItem}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoGrid}>
            {infoCards.map((card) => (
              <View key={card.key} style={[styles.infoCard, { borderColor: colors.cardBorder, backgroundColor: colors.inputBackground }]}> 
                <View style={styles.infoHeader}>
                  <Ionicons name={card.icon} size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{card.label}</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={3}>
                  {card.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('clinicProfile.stories')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
            {stories.map((story) => (
              <TouchableOpacity key={story.id} style={[styles.storyCard, { backgroundColor: story.color }]}> 
                <View style={styles.storyRing}>
                  <View style={[styles.storyInner, { backgroundColor: colors.inputBackground }]} />
                </View>
                <Text style={[styles.storyText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {story.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('clinicProfile.media')}</Text>
            <Ionicons name="grid" size={16} color={colors.textSecondary} />
          </View>
          <View style={styles.mediaGrid}>
            {media.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.mediaTile, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]} activeOpacity={0.8}>
                <ImageBackground source={item.source} style={styles.mediaImage} imageStyle={styles.mediaImageStyle}>
                  <View style={styles.mediaOverlay}>
                    <Text style={styles.mediaLabel}>{item.label}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
            {t('clinicProfile.footerNote')}
          </Text>
        </View>
        </ScrollView>

        <View style={[styles.bottomNav, { borderColor: colors.cardBorder, backgroundColor: colors.inputBackground }]}>
        {[
          { key: 'home', icon: 'home-outline', label: t('clinicProfile.nav.home') },
          { key: 'reels', icon: 'play-circle-outline', label: t('clinicProfile.nav.reels') },
          { key: 'add', icon: 'add-circle-outline', label: t('clinicProfile.nav.add') },
          { key: 'discover', icon: 'compass-outline', label: t('clinicProfile.nav.discover') },
          { key: 'profile', icon: 'person-circle-outline', label: t('clinicProfile.nav.profile') },
        ].map((item) => {
          const active = activeNav === item.key;
          return (
            <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => setActiveNav(item.key as any)}>
              <Ionicons name={item.icon as any} size={22} color={active ? colors.buttonBackground : colors.textSecondary} />
              <Text style={[styles.navLabel, { color: active ? colors.buttonBackground : colors.textSecondary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        </View>
      </View>
    </PatientRatingGate>
  );
}

const createStyles = (colors: any, isRTL: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 120 },
    
    // Loading & Error states
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
    errorTitle: { fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
    errorText: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    backButton: { 
      marginTop: 24, 
      paddingHorizontal: 20, 
      paddingVertical: 12, 
      borderRadius: 12, 
      flexDirection: isRTL ? 'row-reverse' : 'row', 
      alignItems: 'center', 
      gap: 8 
    },
    backButtonText: { fontSize: 14, fontWeight: '700' },
    
    // Hero section
    hero: { height: 320, width: '100%', backgroundColor: colors.cardBorder },
    heroImage: { opacity: 0.95 },
    heroOverlay: { flex: 1, padding: 16, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
    topRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    subtitle: { color: '#e5e7eb', fontWeight: '700', letterSpacing: 0.3 },
    proBadge: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.26)',
    },
    proText: { color: '#fef3c7', fontWeight: '800', fontSize: 12 },
    headerRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarWrapper: {
      width: 72,
      height: 72,
      borderRadius: 36,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
    titleBlock: { flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' },
    heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    handle: { color: '#e5e7eb', marginTop: 2, fontWeight: '600' },
    locationRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    locationText: { color: '#e5e7eb', fontWeight: '700' },
    actionRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: 14,
    },
    followBtn: {
      flex: 1,
      backgroundColor: '#fefefe',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    followText: { fontWeight: '800', color: '#111827' },
    contactBtn: {
      flex: 1,
      backgroundColor: '#e0f2fe',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      gap: 6,
    },
    contactText: { fontWeight: '800', color: '#0a7ea4' },
    
    // Rating display
    ratingRow: { 
      flexDirection: isRTL ? 'row-reverse' : 'row', 
      alignItems: 'center', 
      gap: 8, 
      marginTop: 10,
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    starsContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 2 },
    ratingText: { color: '#fef3c7', fontWeight: '700', fontSize: 13 },
    body: { padding: 18, gap: 16 },
    statRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 12,
      justifyContent: 'space-evenly',
    },
    statItem: { alignItems: 'center' },
    statValue: { fontWeight: '800', fontSize: 17, color: colors.textPrimary },
    statLabel: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    infoCard: { flexBasis: '48%', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
    infoHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoLabel: { fontWeight: '700', fontSize: 13 },
    infoValue: { fontWeight: '700', lineHeight: 18 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    sectionTitle: { fontWeight: '800', fontSize: 17 },
    storiesRow: { gap: 12, paddingVertical: 8 },
    storyCard: {
      width: 88,
      borderRadius: 16,
      padding: 10,
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    storyRing: {
      width: 54,
      height: 54,
      borderRadius: 27,
      borderWidth: 2,
      borderColor: '#0ea5e9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyInner: { width: 44, height: 44, borderRadius: 22 },
    storyText: { fontWeight: '700', fontSize: 12, textAlign: 'center' },
    mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    mediaTile: { flexBasis: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
    mediaImage: { flex: 1 },
    mediaImageStyle: { resizeMode: 'cover' },
    mediaOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.28)',
      justifyContent: 'flex-end',
      padding: 8,
    },
    mediaLabel: { color: '#f9fafb', fontWeight: '800', fontSize: 12 },
    footerNote: { textAlign: 'center', marginTop: 8, fontSize: 12 },
    bottomNav: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
    },
    navItem: { alignItems: 'center', gap: 4 },
    navLabel: { fontSize: 12, fontWeight: '700' },
  });
