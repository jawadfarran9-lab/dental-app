/**
 * UsageBlockOverlay
 *
 * Full-screen overlay that blocks app interaction when:
 *   - Daily usage limit is reached
 *   - Sleep mode is active
 *
 * Rendered at root level, sits above everything.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  reason: 'limit' | 'sleep';
}

export default function UsageBlockOverlay({ reason }: Props) {
  const isLimit = reason === 'limit';

  const icon = isLimit ? 'hourglass-outline' : 'moon-outline';
  const title = isLimit ? 'Daily Limit Reached' : 'Sleep Mode Active';
  const message = isLimit
    ? "You've reached your daily usage limit. Take a break and come back tomorrow!"
    : 'Sleep mode is active right now. Rest well and check back later!';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name={icon as any} size={56} color="#3D9EFF" style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={() => BackHandler.exitApp()}>
          <Text style={styles.buttonText}>Close App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2B3F',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3D9EFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
