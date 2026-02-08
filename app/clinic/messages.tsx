import { useClinicGuard } from '@/src/utils/navigationGuards';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import MessageList, { ThreadItem } from '../components/MessageList';

export default function ClinicMessages() {
  useClinicGuard();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.messages') || 'Messages'}</Text>
        <Text style={styles.sub}>{t('patients.chatWithPatients') || 'Chat with patients'}</Text>
      </View>
      <MessageList
        items={[
          { id: 'p1', title: 'John Doe', lastMessage: 'Thank you, doctor!', unread: 2, route: `/clinic/p1?tab=chat` },
          { id: 'p2', title: 'Jane Smith', lastMessage: 'Can we reschedule?', unread: 0, route: `/clinic/p2?tab=chat` },
        ] as ThreadItem[]}
        onPress={(item: ThreadItem) => router.push(item.route as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
});
