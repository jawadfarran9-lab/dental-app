import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface Props {
  visible: boolean;
  isOver: boolean;
}

/** Trash pill that slides up when a sticker is being dragged. */
export default React.memo(function DeleteZone({ visible, isOver }: Props) {
  const translateY = useRef(new Animated.Value(80)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 80,
      useNativeDriver: true,
      tension: 220,
      friction: 20,
    }).start();
  }, [visible, translateY]);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isOver ? 1.12 : 1,
      useNativeDriver: true,
      tension: 260,
      friction: 12,
    }).start();
  }, [isOver, scale]);

  return (
    <Animated.View
      style={[
        styles.zone,
        {
          transform: [{ translateY }, { scale }],
          backgroundColor: isOver
            ? 'rgba(255, 59, 48, 0.88)'
            : 'rgba(60, 60, 60, 0.75)',
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons
        name={isOver ? 'trash' : 'trash-outline'}
        size={20}
        color="#FFF"
      />
      <Text style={styles.label}>{isOver ? 'Release to delete' : 'Drag here to delete'}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
