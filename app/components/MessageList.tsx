import React from 'react';
import { FlatList, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import UnreadBadge from './UnreadBadge';

export type ThreadItem = {
  id: string;
  title: string; // patient name or clinic name
  lastMessage: string;
  unread?: number;
  route: string; // navigation target
};

type Props = {
  items: ThreadItem[];
  onPress?: (item: ThreadItem) => void;
};

export default function MessageList({ items, onPress }: Props) {
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => onPress?.(item)}>
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <UnreadBadge count={item.unread ?? 0} />
            </View>
            <Text style={styles.sub} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No messages yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { color: '#666', marginTop: 4 },
  chevron: { fontSize: 24, color: '#999', marginLeft: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
});
