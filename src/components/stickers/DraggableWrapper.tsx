import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ───── Snap constants ───── */
const SNAP_THRESHOLD = 6;
const CENTER_SNAP_X = 0; // translateX = 0 is horizontal center
const CENTER_SNAP_Y = Math.round(SCREEN_H * 0.45);
const TOP_SNAP = 80;
const BOTTOM_SNAP = Math.round(SCREEN_H - 160);

/* ───── Bounds constants ───── */
const BOUND_MIN_X = -SCREEN_W / 2 + 30;
const BOUND_MAX_X = SCREEN_W / 2 - 30;
const BOUND_MIN_Y = -20;
const BOUND_MAX_Y = SCREEN_H - 60;

/* ───── Delete zone ───── */
const DELETE_ZONE_TOP = SCREEN_H - 110;

interface Props {
  id: string;
  initialX: number;
  initialY: number;
  initialScale: number;
  initialRotation: number;
  isActive: boolean;
  onTransformEnd: (
    id: string,
    updates: { x: number; y: number; scale: number; rotation: number },
  ) => void;
  onTap?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string) => void;
  onDeleteZoneChange?: (id: string, isOver: boolean) => void;
  onDelete?: (id: string) => void;
  onSnap?: (hGuideY: number | null, vGuideX: number | null) => void;
  onLongPress?: (id: string) => void;
  children: React.ReactNode;
}

/** Generic draggable / pinch-to-scale / rotate wrapper used by every sticker.
 *  S2 upgrade: active state, snap, bounds, press feedback, delete zone. */
export default function DraggableWrapper({
  id,
  initialX,
  initialY,
  initialScale,
  initialRotation,
  isActive,
  onTransformEnd,
  onTap,
  onDragStart,
  onDragEnd,
  onDeleteZoneChange,
  onDelete,
  onSnap,
  onLongPress,
  children,
}: Props) {
  /* ─── Core animated values ─── */
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const scaleAnim = useRef(new Animated.Value(initialScale)).current;
  const rotationAnim = useRef(new Animated.Value(initialRotation)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  /* ─── Committed values ─── */
  const lastOffset = useRef({ x: initialX, y: initialY });
  const lastScale = useRef(initialScale);
  const lastRotation = useRef(initialRotation);

  /* ─── Pinch tracking ─── */
  const pinchDistance0 = useRef(0);
  const pinchAngle0 = useRef(0);
  const pinchCenter0 = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);

  /* ─── Gesture flags ─── */
  const hasMoved = useRef(false);
  const isDragging = useRef(false);
  const wasOverDeleteZone = useRef(false);

  /* ─── Long-press tracking ─── */
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  /* ─── Geometry helpers ─── */
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touches: any[]) => {
    if (touches.length < 2) return 0;
    return (
      Math.atan2(
        touches[1].pageY - touches[0].pageY,
        touches[1].pageX - touches[0].pageX,
      ) *
      (180 / Math.PI)
    );
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2)
      return { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0 };
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  /* ─── Snap helper ─── */
  const applySnap = useCallback(
    (
      rawX: number,
      rawY: number,
    ): { x: number; y: number; snapH: number | null; snapV: number | null } => {
      let snapH: number | null = null;
      let snapV: number | null = null;
      let sx = rawX;
      let sy = rawY;

      if (Math.abs(rawX - CENTER_SNAP_X) < SNAP_THRESHOLD) {
        sx = CENTER_SNAP_X;
        snapV = SCREEN_W / 2;
      }
      if (Math.abs(rawY - CENTER_SNAP_Y) < SNAP_THRESHOLD) {
        sy = CENTER_SNAP_Y;
        snapH = CENTER_SNAP_Y;
      }
      if (Math.abs(rawY - TOP_SNAP) < SNAP_THRESHOLD) {
        sy = TOP_SNAP;
        snapH = TOP_SNAP;
      }
      if (Math.abs(rawY - BOTTOM_SNAP) < SNAP_THRESHOLD) {
        sy = BOTTOM_SNAP;
        snapH = BOTTOM_SNAP;
      }
      return { x: sx, y: sy, snapH, snapV };
    },
    [],
  );

  /* ─── Bounds clamp (soft, on release) ─── */
  const clampToBounds = useCallback(
    (x: number, y: number) => ({
      x: Math.max(BOUND_MIN_X, Math.min(BOUND_MAX_X, x)),
      y: Math.max(BOUND_MIN_Y, Math.min(BOUND_MAX_Y, y)),
    }),
    [],
  );

  /* ─── Commit gesture to state ─── */
  const commit = useCallback(() => {
    // @ts-ignore — reading private _value
    const rawX: number = pan.x._value;
    // @ts-ignore
    const rawY: number = pan.y._value;
    // @ts-ignore
    const rawScale: number = scaleAnim._value || lastScale.current;
    // @ts-ignore
    const rawRotation: number = rotationAnim._value ?? lastRotation.current;

    const clamped = clampToBounds(rawX, rawY);

    if (clamped.x !== rawX || clamped.y !== rawY) {
      Animated.spring(pan, {
        toValue: clamped,
        useNativeDriver: true,
        tension: 200,
        friction: 22,
      }).start();
    }

    lastOffset.current = clamped;
    lastScale.current = rawScale;
    lastRotation.current = rawRotation;

    onTransformEnd(id, {
      x: clamped.x,
      y: clamped.y,
      scale: rawScale,
      rotation: rawRotation,
    });

    isPinching.current = false;
    pinchDistance0.current = 0;
    onSnap?.(null, null);
  }, [id, onTransformEnd, pan, scaleAnim, rotationAnim, clampToBounds, onSnap]);

  /* ─── PanResponder ─── */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,

        onPanResponderGrant: (evt) => {
          hasMoved.current = false;
          isDragging.current = false;
          wasOverDeleteZone.current = false;
          longPressFired.current = false;

          // Clear any lingering timer
          if (longPressTimer.current) clearTimeout(longPressTimer.current);

          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            isPinching.current = true;
            pinchDistance0.current = getDistance(touches);
            pinchAngle0.current = getAngle(touches);
            pinchCenter0.current = getCenter(touches);
          } else {
            isPinching.current = false;
            // Start long-press timer (single finger only)
            if (onLongPress) {
              longPressTimer.current = setTimeout(() => {
                if (!hasMoved.current && !isPinching.current) {
                  longPressFired.current = true;
                  onLongPress(id);
                }
                longPressTimer.current = null;
              }, 400);
            }
          }

          // S2.6 — Press feedback: subtle lift
          Animated.spring(pressScale, {
            toValue: 0.96,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }).start();
        },

        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;

          if (
            !isDragging.current &&
            (Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4)
          ) {
            isDragging.current = true;
            onDragStart?.(id);
          }
          if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
            hasMoved.current = true;
            // Cancel long-press on move
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }

          if (touches.length >= 2) {
            // Cancel long-press on pinch
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            /* ── Pinch / rotate ── */
            if (!isPinching.current) {
              // Transition from single → pinch: snapshot current state
              isPinching.current = true;
              pinchDistance0.current = getDistance(touches);
              pinchAngle0.current = getAngle(touches);
              pinchCenter0.current = getCenter(touches);
              // @ts-ignore
              lastOffset.current = { x: pan.x._value, y: pan.y._value };
              // @ts-ignore
              lastScale.current = scaleAnim._value || lastScale.current;
              // @ts-ignore
              lastRotation.current = rotationAnim._value ?? lastRotation.current;
            }

            const curDist = getDistance(touches);
            if (pinchDistance0.current > 0) {
              const factor = curDist / pinchDistance0.current;
              scaleAnim.setValue(
                Math.max(0.3, Math.min(3, lastScale.current * factor)),
              );
            }

            const angleDiff = getAngle(touches) - pinchAngle0.current;
            rotationAnim.setValue(lastRotation.current + angleDiff);

            const center = getCenter(touches);
            pan.setValue({
              x: lastOffset.current.x + (center.x - pinchCenter0.current.x),
              y: lastOffset.current.y + (center.y - pinchCenter0.current.y),
            });
          } else if (!isPinching.current) {
            /* ── Single-finger drag ── */
            const rawX = lastOffset.current.x + gestureState.dx;
            const rawY = lastOffset.current.y + gestureState.dy;

            // S2.3 — Snap
            const snapped = applySnap(rawX, rawY);
            pan.setValue({ x: snapped.x, y: snapped.y });
            onSnap?.(snapped.snapH, snapped.snapV);

            // S2.7 — Delete zone proximity
            const screenY = gestureState.moveY;
            const isOverDelete = screenY > DELETE_ZONE_TOP;
            if (isOverDelete !== wasOverDeleteZone.current) {
              wasOverDeleteZone.current = isOverDelete;
              onDeleteZoneChange?.(id, isOverDelete);
            }
          }
        },

        onPanResponderRelease: (_e, g) => {
          // Clear long-press timer
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }

          // S2.6 — Release spring
          Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 15,
          }).start();

          // S2.7 — Delete zone check
          if (wasOverDeleteZone.current) {
            wasOverDeleteZone.current = false;
            onDeleteZoneChange?.(id, false);
            onDelete?.(id);
            if (isDragging.current) {
              isDragging.current = false;
              onDragEnd?.(id);
            }
            return;
          }

          // Snapshot pinch values before commit
          if (isPinching.current) {
            // @ts-ignore
            lastOffset.current = { x: pan.x._value, y: pan.y._value };
            // @ts-ignore
            lastScale.current = scaleAnim._value || lastScale.current;
            // @ts-ignore
            lastRotation.current = rotationAnim._value ?? lastRotation.current;
          }

          commit();

          if (isDragging.current) {
            isDragging.current = false;
            onDragEnd?.(id);
          }

          // Tap detection — suppress if long-press already fired
          if (
            !longPressFired.current &&
            (!hasMoved.current ||
              (Math.abs(g.dx) < 4 && Math.abs(g.dy) < 4))
          ) {
            onTap?.(id);
          }
        },

        onPanResponderTerminate: () => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 15,
          }).start();
          wasOverDeleteZone.current = false;
          onDeleteZoneChange?.(id, false);
          if (isDragging.current) {
            isDragging.current = false;
            onDragEnd?.(id);
          }
          commit();
        },
      }),
    [
      commit,
      id,
      onTap,
      onDragStart,
      onDragEnd,
      onDeleteZoneChange,
      onDelete,
      onSnap,
      onLongPress,
      pan,
      rotationAnim,
      scaleAnim,
      pressScale,
      applySnap,
    ],
  );

  /* ─── Interpolations ─── */
  const rotateInterp = rotationAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const combinedScale = Animated.multiply(scaleAnim, pressScale);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.wrapper,
        {
          zIndex: isActive ? 200 : 100,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: combinedScale },
            { rotate: rotateInterp },
          ],
        },
      ]}
    >
      {children}
      {/* S2.2 — Selection frame overlay */}
      {isActive && (
        <View style={styles.selectionOverlay} pointerEvents="none" />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderWidth: 1.5,
    borderColor: 'rgba(100, 160, 255, 0.5)',
    borderRadius: 10,
    // Soft glow on iOS
    shadowColor: '#6BA4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
