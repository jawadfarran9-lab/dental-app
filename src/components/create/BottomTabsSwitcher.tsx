import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type CreateMode = 'reel' | 'post';

interface BottomTabsSwitcherProps {
  mode: CreateMode;
  onSwitch: (mode: CreateMode) => void;
}

const BottomTabsSwitcher: React.FC<BottomTabsSwitcherProps> = ({ mode, onSwitch }) => {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => onSwitch('post')} hitSlop={8}>
        <Text style={mode === 'post' ? styles.tabActive : styles.tabInactive}>POST</Text>
      </Pressable>
      <Pressable onPress={() => onSwitch('reel')} hitSlop={8}>
        <Text style={mode === 'reel' ? styles.tabActive : styles.tabInactive}>REEL</Text>
      </Pressable>
    </View>
  );
};

export default BottomTabsSwitcher;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 10,
  },
  tabActive: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
    paddingBottom: 4,
  },
  tabInactive: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingBottom: 4,
  },
});
