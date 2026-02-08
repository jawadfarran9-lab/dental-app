import { usePatientGuard } from '@/src/utils/navigationGuards';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import MessageList, { ThreadItem } from '../components/MessageList';

export default function PatientMessages() {
  usePatientGuard();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.messages') || 'Messages'}</Text>
        <Text style={styles.sub}>{t('tabs.chatClinic') || 'Chat with clinic'}</Text>
      </View>

      <MessageList
        items={[
          { id: 'c1', title: 'My Clinic', lastMessage: 'Your next session is tomorrow.', unread: 1, route: `/patient/c1?tab=chat` },
        ] as ThreadItem[]}
        onPress={(item) => router.push(item.route as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, color: '#666', marginTop: 4 },
});
