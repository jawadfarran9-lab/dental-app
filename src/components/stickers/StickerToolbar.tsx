import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
}

/** Minimal floating toolbar for the active sticker. */
export default React.memo(function StickerToolbar({
  onDelete,
  onDuplicate,
  onBringToFront,
}: Props) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.btn}
        onPress={onDuplicate}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="copy-outline" size={18} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.separator} />
      <TouchableOpacity
        style={styles.btn}
        onPress={onBringToFront}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="layers-outline" size={18} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.separator} />
      <TouchableOpacity
        style={styles.btn}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.88)',
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
