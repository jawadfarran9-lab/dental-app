import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import ReelOptionsSheet from './ReelOptionsSheet';
import ReelShareSheet from './ReelShareSheet';

interface ReelActionsProps {
  reelId: string;
  clinicId: string;
  liked: boolean;
  likeCount: number;
  menuOpen: boolean;
  muted: boolean;
  onLike: () => void;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onMuteToggle: () => void;
  onHide: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ReelActions = ({
  reelId,
  clinicId,
  liked,
  likeCount,
  menuOpen,
  muted,
  onLike,
  onMenuOpen,
  onMenuClose,
  onMuteToggle,
  onHide,
}: ReelActionsProps) => {
  // ---- Heart animation ----
  const heartScale = useRef(new Animated.Value(1)).current;
  const [shareOpen, setShareOpen] = useState(false);

  const animateHeart = useCallback(() => {
    heartScale.setValue(1);
    Animated.spring(heartScale, {
      toValue: 1.25,
      friction: 3,
      tension: 150,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });
  }, [heartScale]);

  const handleHeartPress = useCallback(() => {
    animateHeart();
    onLike();
  }, [animateHeart, onLike]);

  // ---- Like count animation ----
  const countScale = useRef(new Animated.Value(1)).current;

  const animateCount = useCallback(() => {
    countScale.setValue(0.8);
    Animated.spring(countScale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [countScale]);

  const handleLikeTap = useCallback(() => {
    handleHeartPress();
    animateCount();
  }, [handleHeartPress, animateCount]);

  // ---- Button press feedback (scale 1→0.92→1) ----
  const shareScale = useRef(new Animated.Value(1)).current;
  const menuScale = useRef(new Animated.Value(1)).current;
  const muteScale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback((anim: Animated.Value) => {
    Animated.timing(anim, {
      toValue: 0.92,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const pressOut = useCallback((anim: Animated.Value) => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  // ---- Share ----
  const handleShareOpen = useCallback(() => {
    setShareOpen(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* Heart */}
      <AnimatedPressable
        onPress={handleLikeTap}
        onPressIn={() => pressIn(heartScale)}
        hitSlop={10}
        style={{ transform: [{ scale: heartScale }], alignItems: 'center' }}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={28}
          color={liked ? '#FF3040' : '#fff'}
          style={liked ? styles.likedGlow : undefined}
        />
        <Animated.Text
          style={[styles.countLabel, { transform: [{ scale: countScale }] }]}
        >
          {likeCount}
        </Animated.Text>
      </AnimatedPressable>

      {/* Share */}
      <AnimatedPressable
        onPress={handleShareOpen}
        onPressIn={() => pressIn(shareScale)}
        onPressOut={() => pressOut(shareScale)}
        hitSlop={10}
        style={{ transform: [{ scale: shareScale }] }}
      >
        <Ionicons name="share-social-outline" size={26} color="#fff" />
      </AnimatedPressable>

      {/* Mute / Unmute */}
      <AnimatedPressable
        onPress={onMuteToggle}
        onPressIn={() => pressIn(muteScale)}
        onPressOut={() => pressOut(muteScale)}
        hitSlop={10}
        style={{ transform: [{ scale: muteScale }] }}
      >
        <Ionicons
          name={muted ? 'volume-mute-outline' : 'volume-high-outline'}
          size={24}
          color="#fff"
        />
      </AnimatedPressable>

      {/* 3 dots */}
      <AnimatedPressable
        onPress={onMenuOpen}
        onPressIn={() => pressIn(menuScale)}
        onPressOut={() => pressOut(menuScale)}
        hitSlop={10}
        style={{ transform: [{ scale: menuScale }] }}
      >
        <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
      </AnimatedPressable>

      <ReelOptionsSheet
        visible={menuOpen}
        reelId={reelId}
        clinicId={clinicId}
        onClose={onMenuClose}
        onHide={onHide}
      />

      <ReelShareSheet
        visible={shareOpen}
        reelId={reelId}
        onClose={() => setShareOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 194,
    alignItems: 'center',
    gap: 24,
  },
  countLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },  likedGlow: {
    shadowColor: '#FF3040',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },});

export default ReelActions;
