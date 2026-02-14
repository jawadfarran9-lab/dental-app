import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useClinic } from '@/src/context/ClinicContext';
import {
  fetchQuestionResponses,
  markQuestionResponseRead,
} from '@/src/services/questionResponseService';
import { QuestionResponse } from '@/src/types/questionResponse';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clinicId } = useClinic();

  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId) return;
    try {
      const data = await fetchQuestionResponses(clinicId);
      setResponses(data);
    } catch (e) {
      console.error('[Notifications] Failed to load responses:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleTap = useCallback(
    async (item: QuestionResponse) => {
      // Mark as read
      if (!item.isRead && clinicId) {
        try {
          await markQuestionResponseRead(clinicId, item.id);
          setResponses((prev) =>
            prev.map((r) => (r.id === item.id ? { ...r, isRead: true } : r)),
          );
        } catch (e) {
          console.error('[Notifications] Failed to mark read:', e);
        }
      }

      // Navigate to story editor with reply payload
      router.push({
        pathname: '/story/edit',
        params: {
          replyText: item.responseText,
          questionStickerId: item.questionStickerId,
          responseId: item.id,
        },
      });
    },
    [clinicId, router],
  );

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  };

  const renderItem = ({ item }: { item: QuestionResponse }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      activeOpacity={0.7}
      onPress={() => handleTap(item)}
    >
      <View style={styles.cardRow}>
        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}

        <View style={styles.cardContent}>
          <Text style={styles.responseText} numberOfLines={2}>
            {item.responseText}
          </Text>
          <Text style={styles.metaText}>
            {formatTime(item.createdAt)} · Story response
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : responses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color="#555" />
          <Text style={styles.emptyText}>No responses yet</Text>
        </View>
      ) : (
        <FlatList
          data={responses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#777',
    fontSize: 15,
    marginTop: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    backgroundColor: '#1C2230',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  responseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  metaText: {
    color: '#888',
    fontSize: 12,
  },
});
