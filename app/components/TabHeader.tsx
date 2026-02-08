import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export type TabItem = { key: string; label: string };

type Props = {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

export default function TabHeader({ tabs, activeTab, onTabChange }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((t, idx) => {
        const active = t.key === activeTab;
        return (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, active && styles.tabActive, idx !== tabs.length - 1 && styles.tabSpacing]}
            onPress={() => onTabChange(t.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginVertical: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  tabSpacing: { marginRight: 8 },
  tabActive: { backgroundColor: '#E8F1FF', borderColor: '#2E8BFD' },
  tabText: { color: '#333', fontWeight: '600' },
  tabTextActive: { color: '#1B3C73' },
});
