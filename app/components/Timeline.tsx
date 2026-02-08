import { useTheme } from '@/src/context/ThemeContext';
import { PatientMedia, PatientSession, TimelineEntry } from '@/src/types/media';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type FilterType = 'all' | 'sessions' | 'images' | 'annotations';

interface TimelineProps {
  entries: TimelineEntry[];
  medias: PatientMedia[];
  sessions: PatientSession[];
  onSelectMedia: (media: PatientMedia) => void;
  onSelectSession?: (session: PatientSession) => void;
  onExportSession?: (session: PatientSession) => void;
  isLoading?: boolean;
  isClinic?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  entries,
  medias,
  sessions,
  onSelectMedia,
  onSelectSession,
  onExportSession,
  isLoading = false,
  isClinic = false,
}: TimelineProps) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Filter timeline entries based on selected filter
  const filteredEntries = useMemo(() => {
    if (filterType === 'all') return entries;
    
    if (filterType === 'sessions') {
      return entries.filter(e => e.type === 'session');
    }
    
    if (filterType === 'images') {
      return entries.filter(e => e.type === 'image_upload');
    }
    
    if (filterType === 'annotations') {
      return entries.filter(e => e.type === 'image_annotated');
    }
    
    return entries;
  }, [entries, filterType]);

  const toggleSessionExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getMediaById = (mediaId?: string) => {
    return medias.find((m) => m.id === mediaId);
  };

  const getSessionById = (sessionId?: string) => {
    return sessions.find((s: PatientSession) => s.id === sessionId);
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return 'event';
      case 'session':
        return 'folder';
      case 'image_upload':
        return 'image';
      case 'image_annotated':
        return 'edit';
      default:
        return 'info';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.buttonSecondaryBackground,
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.buttonSecondaryBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    filterButtonActive: {
      backgroundColor: colors.buttonBackground,
      borderColor: colors.buttonBackground,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterButtonTextActive: {
      color: colors.buttonText,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    timelineItem: {
      marginVertical: 8,
      marginHorizontal: 16,
      paddingHorizontal: 12,
      flexDirection: 'row',
      gap: 12,
    },
    timelineLeft: {
      width: 40,
      alignItems: 'center',
      paddingTop: 4,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.buttonBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timelineConnector: {
      flex: 1,
      width: 2,
      backgroundColor: colors.cardBorder,
      marginTop: 4,
    },
    timelineRight: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    timelineDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    timelineDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    sessionInfo: {
      backgroundColor: colors.buttonSecondaryBackground,
      borderLeftWidth: 3,
      borderLeftColor: colors.buttonBackground,
      paddingLeft: 12,
      paddingVertical: 8,
      marginTop: 8,
      borderRadius: 4,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    sessionMediaCount: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    expandButton: {
      padding: 4,
    },
    exportButton: {
      padding: 8,
      borderRadius: 6,
    },
    sessionMediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    sessionMediaItem: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    sessionMediaImage: {
      width: '100%',
      height: '100%',
    },
    annotatedBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: colors.buttonBackground,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
    },
    annotatedBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: colors.buttonText,
    },
    relatedImages: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    imageTag: {
      backgroundColor: colors.buttonSecondaryBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    imageTagText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    viewButton: {
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.buttonBackground,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    viewButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.buttonText,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.buttonBackground} />
        </View>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="timeline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>{t('noTimelineEntries')}</Text>
        </View>
      </View>
    );
  }

  const renderSessionMedia = (session: PatientSession, isExpanded: boolean) => {
    if (!isExpanded || !session.mediaIds || session.mediaIds.length === 0) {
      return null;
    }

    const sessionMedia = session.mediaIds
      .map(id => medias.find(m => m.id === id))
      .filter(Boolean) as PatientMedia[];

    return (
      <View style={styles.sessionMediaGrid}>
        {sessionMedia.map((media) => (
          <TouchableOpacity
            key={media.id}
            style={styles.sessionMediaItem}
            onPress={() => onSelectMedia(media)}
          >
            <Image
              source={{ uri: media.annotatedUrl || media.originalUrl }}
              style={styles.sessionMediaImage}
            />
            {media.hasAnnotation && (
              <View style={styles.annotatedBadge}>
                <Text style={styles.annotatedBadgeText}>A</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTimelineItem = ({ item, index }: { item: TimelineEntry; index: number }) => {
    const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isLastItem = index === filteredEntries.length - 1;

    let content = null;

    if (item.type === 'session') {
      const session = getSessionById(item.relatedSessionId);
      if (session) {
        const isExpanded = expandedSessions.has(session.id);
        content = (
          <>
            <View style={styles.sessionHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.timelineTitle}>{session.title}</Text>
                  {/* PHASE AA-3: Visual edit indicator */}
                  {session.lastEditedAt && session.lastEditedAt !== session.createdAt && (
                    <View style={{ backgroundColor: colors.buttonBackground, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.buttonText }}>edited</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timelineDate}>{dateStr}</Text>
                {session.description && (
                  <Text style={styles.timelineDescription}>{session.description}</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {isClinic && onExportSession && (
                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => onExportSession(session)}
                  >
                    <MaterialIcons
                      name="file-download"
                      size={20}
                      color={colors.buttonBackground}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => toggleSessionExpanded(session.id)}
                >
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionMediaCount}>
                {session.mediaIds.length} {session.mediaIds.length === 1 ? t('image') : t('images')}
              </Text>
            </View>
            {renderSessionMedia(session, isExpanded)}
          </>
        );
      }
    } else if (item.type === 'image_upload' || item.type === 'image_annotated') {
      const media = getMediaById(item.relatedMediaId);
      if (media) {
        content = (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>
                  {item.type === 'image_annotated'
                    ? t('imageAnnotated')
                    : t('imageUploaded')}
                </Text>
                <Text style={styles.timelineDate}>{dateStr}</Text>
              </View>
              {media.hasAnnotation && (
                <View style={styles.annotatedBadge}>
                  <Text style={styles.annotatedBadgeText}>{t('annotated')}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onSelectMedia(media)}
            >
              <Text style={styles.viewButtonText}>{t('view')}</Text>
            </TouchableOpacity>
          </>
        );
      }
    } else {
      content = (
        <>
          <Text style={styles.timelineTitle}>{item.title}</Text>
          <Text style={styles.timelineDate}>{dateStr}</Text>
          {item.description && (
            <Text style={styles.timelineDescription}>{item.description}</Text>
          )}
        </>
      );
    }

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={getTimelineIcon(item.type)}
              size={20}
              color="#000"
            />
          </View>
          {!isLastItem && <View style={styles.timelineConnector} />}
        </View>
        <View style={styles.timelineRight}>{content}</View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={{ gap: 8 }}
      >
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
            {t('all')} ({entries.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'sessions' && styles.filterButtonActive]}
          onPress={() => setFilterType('sessions')}
        >
          <Text style={[styles.filterButtonText, filterType === 'sessions' && styles.filterButtonTextActive]}>
            {t('sessions')} ({entries.filter(e => e.type === 'session').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'images' && styles.filterButtonActive]}
          onPress={() => setFilterType('images')}
        >
          <Text style={[styles.filterButtonText, filterType === 'images' && styles.filterButtonTextActive]}>
            {t('images')} ({entries.filter(e => e.type === 'image_upload').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'annotations' && styles.filterButtonActive]}
          onPress={() => setFilterType('annotations')}
        >
          <Text style={[styles.filterButtonText, filterType === 'annotations' && styles.filterButtonTextActive]}>
            {t('annotations')} ({entries.filter(e => e.type === 'image_annotated').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Timeline List */}
      <FlatList
        data={filteredEntries}
        renderItem={renderTimelineItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default Timeline;
