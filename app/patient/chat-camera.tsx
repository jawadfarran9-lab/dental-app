import { patientDb } from '@/firebaseConfig';
import { usePatientAuthReady } from '@/src/hooks/usePatientAuthReady';
import { sendImageMessage, sendVideoMessage } from '@/src/services/chatImages';
import { openDeviceSettings, useMicrophonePermission } from '@/src/hooks/useDevicePermissions';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ResizeMode, Video } from 'expo-av';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

const CAPTURE_OUTER = 80;
const CAPTURE_INNER = 64;

const fmtSec = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const MAX_ZOOM_RATIO = 5;
const MAX_CAMERA_ZOOM = 0.5; // cap so we never hit the device's extreme hardware max
const safeZoom = (z: number) => Math.max(0, Math.min(MAX_CAMERA_ZOOM, z));
const mapZoomToCamera = (t: number) =>
  safeZoom((Math.max(t, 1) - 1) / (MAX_ZOOM_RATIO - 1));
const ZOOM_PRESET_VALUES = [
  { label: '1', value: mapZoomToCamera(1) },
  { label: '2', value: mapZoomToCamera(2) },
  { label: '3', value: mapZoomToCamera(3) },
] as const;
const ZOOM_1X = ZOOM_PRESET_VALUES[0].value;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

const HUE_STOPS: { t: number; c: [number, number, number] }[] = [
  { t: 0, c: [255, 255, 255] },
  { t: 0.10, c: [255, 59, 48] },
  { t: 0.22, c: [255, 149, 0] },
  { t: 0.34, c: [255, 204, 0] },
  { t: 0.46, c: [52, 199, 89] },
  { t: 0.58, c: [0, 199, 190] },
  { t: 0.70, c: [61, 158, 255] },
  { t: 0.82, c: [175, 82, 222] },
  { t: 0.92, c: [255, 45, 85] },
  { t: 1, c: [0, 0, 0] },
];
function colorAt(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 0; i < HUE_STOPS.length - 1; i++) {
    const a = HUE_STOPS[i]; const b = HUE_STOPS[i + 1];
    if (x >= a.t && x <= b.t) {
      const f = b.t === a.t ? 0 : (x - a.t) / (b.t - a.t);
      const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * f);
      const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * f);
      const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * f);
      return `rgb(${r}, ${g}, ${bl})`;
    }
  }
  return '#000000';
}

const WHEEL_D = 110;
const WHEEL_R = WHEEL_D / 2;
const WHEEL_RING = 17;
const WHEEL_INNER = WHEEL_R - WHEEL_RING;
const WHEEL_MID = (WHEEL_R + WHEEL_INNER) / 2;
const WHEEL_SEGMENTS = 90;
const WHEEL_CENTER_R = 31;
const WHEEL_THUMB_R = 9;

function wheelSegmentPath(i: number): string {
  const cx = WHEEL_R, cy = WHEEL_R;
  const a0 = (i / WHEEL_SEGMENTS) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((i + 1) / WHEEL_SEGMENTS) * 2 * Math.PI - Math.PI / 2 + 0.02;
  const ox0 = cx + WHEEL_R * Math.cos(a0), oy0 = cy + WHEEL_R * Math.sin(a0);
  const ox1 = cx + WHEEL_R * Math.cos(a1), oy1 = cy + WHEEL_R * Math.sin(a1);
  const ix1 = cx + WHEEL_INNER * Math.cos(a1), iy1 = cy + WHEEL_INNER * Math.sin(a1);
  const ix0 = cx + WHEEL_INNER * Math.cos(a0), iy0 = cy + WHEEL_INNER * Math.sin(a0);
  return `M ${ox0} ${oy0} A ${WHEEL_R} ${WHEEL_R} 0 0 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${WHEEL_INNER} ${WHEEL_INNER} 0 0 0 ${ix0} ${iy0} Z`;
}

const WHEEL_SEG_DATA = Array.from({ length: WHEEL_SEGMENTS }, (_, i) => ({ d: wheelSegmentPath(i), c: colorAt((i + 0.5) / WHEEL_SEGMENTS) }));

function ColorWheel({ color, t }: { color: string; t: number }) {
  const cx = WHEEL_R, cy = WHEEL_R;
  const ta = t * 2 * Math.PI - Math.PI / 2;
  const thumbX = cx + WHEEL_MID * Math.cos(ta);
  const thumbY = cy + WHEEL_MID * Math.sin(ta);
  return (
    <Svg width={WHEEL_D} height={WHEEL_D}>
      {WHEEL_SEG_DATA.map((s, i) => (
        <Path key={i} d={s.d} fill={s.c} />
      ))}
      <Circle cx={cx} cy={cy} r={WHEEL_CENTER_R} fill={color} stroke="rgba(255,255,255,0.9)" strokeWidth={3} />
      <Circle cx={thumbX} cy={thumbY} r={WHEEL_THUMB_R} fill={color} stroke="#FFFFFF" strokeWidth={3} />
    </Svg>
  );
}

const FONT_OPTIONS: { key: string; family?: string }[] = [
  { key: 'system' },
  { key: 'poppins', family: 'Poppins_600SemiBold' },
  { key: 'montserrat', family: 'Montserrat_700Bold' },
  { key: 'playfair', family: 'PlayfairDisplay_700Bold' },
  { key: 'pacifico', family: 'Pacifico_400Regular' },
  { key: 'bebas', family: 'BebasNeue_400Regular' },
  { key: 'caveat', family: 'Caveat_700Bold' },
  { key: 'lobster', family: 'Lobster_400Regular' },
  { key: 'oswald', family: 'Oswald_600SemiBold' },
];

const TRASH_CX = SCREEN_WIDTH / 2;
const TRASH_CY = SCREEN_H - 130;
const TRASH_R = 56;
const BACK_CX = SCREEN_WIDTH / 2;
const BACK_CY = 150;
const BACK_R = 56;

function isWhitish(c?: string): boolean {
  if (!c) return false;
  let r: number, g: number, b: number;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(c);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else if (rgb) {
    r = parseInt(rgb[1], 10);
    g = parseInt(rgb[2], 10);
    b = parseInt(rgb[3], 10);
  } else {
    return false;
  }
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return min >= 220 && (max - min) <= 18;
}

function parseRGB(c?: string): [number, number, number] | null {
  if (!c) return null;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(c);
  if (rgb) return [parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10)];
  return null;
}
function lightenColor(c: string, f: number): string {
  const p = parseRGB(c);
  if (!p) return c;
  const [r, g, b] = p;
  const l = (v: number) => Math.round(v + (255 - v) * f);
  return `rgb(${l(r)}, ${l(g)}, ${l(b)})`;
}

function DraggableText({ item, index, active, liveTx, liveTy, liveRot, liveScale, onMeasure }: {
  item: { text: string; color: string; align: 'left' | 'center' | 'right'; bg: 'none' | 'white' | 'dim' | 'black'; font?: string; dx: number; dy: number; rot: number; scale: number };
  index: number;
  active: boolean;
  liveTx: any; liveTy: any; liveRot: any; liveScale: any;
  onMeasure: (i: number, layout: { x: number; y: number; width: number; height: number }) => void;
}) {
  const aStyle = useAnimatedStyle(() => {
    if (active) {
      return { transform: [{ translateX: liveTx.value }, { translateY: liveTy.value }, { rotateZ: `${liveRot.value}rad` }, { scale: liveScale.value }] as any };
    }
    return { transform: [{ translateX: item.dx }, { translateY: item.dy }, { rotateZ: `${item.rot}rad` }, { scale: item.scale }] as any };
  }, [active, item.dx, item.dy, item.rot, item.scale]);
  const isWhiteColor = isWhitish(item.color);
  const eff = item.bg === 'none' ? item.color : (item.bg === 'dim' || item.bg === 'white') ? (isWhiteColor ? '#000000' : item.color) : (item.bg === 'black' ? (isWhiteColor ? '#FFFFFF' : item.color) : '#000000');
  const bg = item.bg === 'white' ? '#FFFFFF' : item.bg === 'dim' ? (isWhiteColor ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') : item.bg === 'black' ? (isWhiteColor ? '#000000' : lightenColor(item.color, 0.6)) : 'transparent';
  return (
    <Animated.View onLayout={(e) => onMeasure(index, e.nativeEvent.layout)} style={[{
      maxWidth: '100%',
      marginVertical: 4,
      borderRadius: 12,
      paddingHorizontal: item.bg === 'none' ? 0 : 14,
      paddingVertical: item.bg === 'none' ? 0 : 6,
      backgroundColor: bg,
      flexShrink: 0,
    }, active ? { shadowColor: '#FFFFFF', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } } : null, aStyle]}>
      <Text style={[styles.textOverlayItem, { color: eff, textAlign: item.align, textShadowColor: item.bg === 'none' ? 'rgba(0,0,0,0.35)' : 'transparent', fontFamily: item.font }]}>{item.text}</Text>
    </Animated.View>
  );
}
const DIAL_WIDTH = SCREEN_WIDTH * 0.85;
const DIAL_HEIGHT = 48;
const DIAL_ARC_RADIUS = SCREEN_WIDTH * 1.2;
const DIAL_CENTER_Y = DIAL_ARC_RADIUS;
const DIAL_STOPS = [
  { label: '1', zoom: mapZoomToCamera(1) },
  { label: '2', zoom: mapZoomToCamera(2) },
  { label: '3', zoom: mapZoomToCamera(3) },
] as const;
const DIAL_TOTAL_ANGLE = 60;
const zoomToAngle = (z: number): number =>
  -DIAL_TOTAL_ANGLE / 2 + z * DIAL_TOTAL_ANGLE;

type TickMark = {
  angle: number;
  height: number;
  isLabel: boolean;
  label?: string;
  zoom: number;
};
const generateDialTicks = (): TickMark[] => {
  const numTicks = 61;
  const step = MAX_CAMERA_ZOOM / numTicks;
  const stopIndexToLabel = new Map<number, string>();
  DIAL_STOPS.forEach((s) => {
    const bestIndex = Math.round(s.zoom / step);
    stopIndexToLabel.set(bestIndex, s.label);
  });
  const ticks: TickMark[] = [];
  for (let i = 0; i <= numTicks; i++) {
    const zoom = (i / numTicks) * MAX_CAMERA_ZOOM;
    const angle = zoomToAngle(zoom);
    const label = stopIndexToLabel.get(i);
    const isMajor = i % 10 === 0;
    ticks.push({
      angle,
      height: label ? 14 : isMajor ? 10 : 6,
      isLabel: !!label,
      label,
      zoom,
    });
  }
  return ticks;
};
const DIAL_TICKS = generateDialTicks();

const zoomToDisplayLabel = (z: number): string => {
  const multiplier = Math.max(z, 0) * (MAX_ZOOM_RATIO - 1) + 1;
  if (multiplier >= 10) return Math.round(multiplier).toString();
  return multiplier.toFixed(1);
};

export default function PatientChatCameraScreen() {
  usePatientGuard();
  const patientAuthReady = usePatientAuthReady();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [patientId, setPatientId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    if (!patientAuthReady) return;
    let cancelled = false;
    (async () => {
      try {
        const storedPatientId = await AsyncStorage.getItem('patientId');
        const storedClinicId = await AsyncStorage.getItem('patientClinicId');
        if (!storedPatientId || !storedClinicId) {
          router.replace('/patient' as any);
          return;
        }
        if (cancelled) return;
        setPatientId(storedPatientId);
        setClinicId(storedClinicId);
        try {
          const snap = await getDoc(
            doc(patientDb, 'clinics', storedClinicId, 'patients', storedPatientId),
          );
          if (!cancelled && snap.exists()) {
            const data = snap.data() as any;
            setPatientName((data?.name as string) ?? '');
          }
        } catch (err) {
          console.error('[patient-chat-camera] name fetch error', err);
        }
      } catch (err) {
        console.error('[patient-chat-camera] auth load error', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, patientAuthReady]);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [camMode, setCamMode] = useState<'picture' | 'video'>('picture');
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mic = useMicrophonePermission();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [hdQuality, setHdQuality] = useState<'sd' | 'hd'>('sd');
  const [hdSheetOpen, setHdSheetOpen] = useState(false);
  const [prevMediaW, setPrevMediaW] = useState(0);
  const [prevMediaH, setPrevMediaH] = useState(0);
  const [textMode, setTextMode] = useState(false);
  const [texts, setTexts] = useState<{ text: string; color: string; align: 'left' | 'center' | 'right'; bg: 'none' | 'white' | 'dim' | 'black'; font?: string; dx: number; dy: number; rot: number; scale: number }[]>([]);
  const [textValue, setTextValue] = useState('');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const textColorRef = useRef<string>('#FFFFFF');
  const lastHapticT = useRef(-1);
  const [textThumbT, setTextThumbT] = useState(0);
  const [showTextColorSlider, setShowTextColorSlider] = useState(false);
  const [textAlignMode, setTextAlignMode] = useState<'left' | 'center' | 'right'>('center');
  const [textBg, setTextBg] = useState<'none' | 'white' | 'dim' | 'black'>('none');
  const [textFont, setTextFont] = useState<string | undefined>(undefined);
  const [kbHeight, setKbHeight] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const liveTx = useSharedValue(0);
  const liveTy = useSharedValue(0);
  const liveRot = useSharedValue(0);
  const liveScale = useSharedValue(1);
  const baseTx = useSharedValue(0);
  const baseTy = useSharedValue(0);
  const baseRot = useSharedValue(0);
  const baseScale = useSharedValue(1);
  const ptrs = useSharedValue(0);
  const didManip = useSharedValue(false);
  const overTrashSV = useSharedValue(false);
  const [overTrash, setOverTrash] = useState(false);
  const overBackSV = useSharedValue(false);
  const [overBack, setOverBack] = useState(false);
  const guideXSV = useSharedValue(false);
  const guideYSV = useSharedValue(false);
  const rotSnappedSV = useSharedValue(false);
  const [guideX, setGuideX] = useState(false);
  const [guideY, setGuideY] = useState(false);
  const activeSV = useSharedValue(-1);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hitBoxesSV = useSharedValue<{ index: number; cx: number; cy: number; hw: number; hh: number; dx: number; dy: number; rot: number; scale: number }[]>([]);
  const pillLayouts = useRef<Record<number, { x: number; y: number; w: number; h: number }>>({});
  const pushHistory = () => {};
  useEffect(() => {
    if (recording) {
      setRecordSec(0);
      timerRef.current = setInterval(() => setRecordSec((s) => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setRecordSec(0);
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [recording]);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const h = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { s.remove(); h.remove(); };
  }, []);
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM_1X);
  const [activePreset, setActivePreset] = useState(0);
  const zoomAtPinchStartRef = useRef(0);
  const zoomLevelRef = useRef(zoomLevel);
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);
  const dialZoomAtDragStartRef = useRef(0);

  const zoomUiOpacity = useSharedValue(1);
  const zoomTextScale = useSharedValue(1);
  const zoomTextOpacity = useSharedValue(1);
  const arrowBounce = useSharedValue(0);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoomUiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: zoomUiOpacity.value,
  }));
  const zoomTextAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomTextScale.value }],
    opacity: zoomTextOpacity.value,
  }));
  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowBounce.value }],
  }));

  const isInteractingRef = useRef(false);

  const scheduleHide = useCallback(() => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    autoHideTimerRef.current = setTimeout(() => {
      if (!isInteractingRef.current) {
        zoomUiOpacity.value = withTiming(0, { duration: 400 });
      }
    }, 1500);
  }, [zoomUiOpacity]);

  const showAndHold = useCallback(() => {
    zoomUiOpacity.value = 1;
    zoomTextScale.value = withSequence(
      withTiming(1.15, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    arrowBounce.value = withSequence(
      withTiming(3, { duration: 60 }),
      withSpring(0, { damping: 10, stiffness: 300 }),
    );
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
  }, [zoomUiOpacity, zoomTextScale, arrowBounce]);

  const onZoomInteraction = useCallback(() => {
    zoomUiOpacity.value = 1;
    zoomTextScale.value = withSequence(
      withTiming(1.15, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    zoomTextOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(1, { duration: 150 }),
    );
    arrowBounce.value = withSequence(
      withTiming(3, { duration: 60 }),
      withSpring(0, { damping: 10, stiffness: 300 }),
    );
    scheduleHide();
  }, [zoomUiOpacity, zoomTextScale, zoomTextOpacity, arrowBounce, scheduleHide]);

  useEffect(() => {
    autoHideTimerRef.current = setTimeout(() => {
      zoomUiOpacity.value = withTiming(0, { duration: 400 });
    }, 1500);
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (momentumAnimRef.current !== null) {
        cancelAnimationFrame(momentumAnimRef.current);
        momentumAnimRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastCrossedPresetRef = useRef(-1);
  const hapticTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  const hapticTickIfCrossed = useCallback((zoom: number) => {
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      if (Math.abs(zoom - ZOOM_PRESET_VALUES[i].value) < 0.015) {
        if (lastCrossedPresetRef.current !== i) {
          lastCrossedPresetRef.current = i;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        return;
      }
    }
    lastCrossedPresetRef.current = -1;
  }, []);

  const MAGNETIC_RANGE = 0.025;
  const MAGNETIC_STRENGTH = 0.45;
  const applyMagneticSnap = useCallback((zoom: number): number => {
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      const dist = Math.abs(zoom - ZOOM_PRESET_VALUES[i].value);
      if (dist < MAGNETIC_RANGE && dist > 0.001) {
        return zoom + (ZOOM_PRESET_VALUES[i].value - zoom) * MAGNETIC_STRENGTH;
      }
    }
    return zoom;
  }, []);

  const PRESET_SNAP_TOLERANCE = 0.02;
  const syncPresetHighlight = useCallback((zoom: number) => {
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      if (Math.abs(zoom - ZOOM_PRESET_VALUES[i].value) < PRESET_SNAP_TOLERANCE) {
        setActivePreset(i);
        return;
      }
    }
    setActivePreset(-1);
  }, []);

  const momentumAnimRef = useRef<number | null>(null);
  const momentumZoomRef = useRef(0);
  const cancelMomentum = useCallback(() => {
    if (momentumAnimRef.current !== null) {
      cancelAnimationFrame(momentumAnimRef.current);
      momentumAnimRef.current = null;
    }
  }, []);

  const onPinchStart = useCallback(() => {
    zoomAtPinchStartRef.current = zoomLevel;
  }, [zoomLevel]);

  const onPinchUpdate = useCallback((delta: number) => {
    setZoomLevel(safeZoom(zoomAtPinchStartRef.current + delta));
    setActivePreset(-1);
  }, []);

  const onPinchInteractStart = useCallback(() => {
    cancelMomentum();
    isInteractingRef.current = true;
    showAndHold();
  }, [showAndHold, cancelMomentum]);

  const onPinchInteractEnd = useCallback(() => {
    isInteractingRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          'worklet';
          runOnJS(onPinchStart)();
          runOnJS(onPinchInteractStart)();
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(onPinchUpdate)((e.scale - 1) * 0.3);
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(onPinchInteractEnd)();
        }),
    [onPinchStart, onPinchUpdate, onPinchInteractStart, onPinchInteractEnd],
  );

  const onDialDragStart = useCallback(() => {
    cancelMomentum();
    dialZoomAtDragStartRef.current = zoomLevel;
    isInteractingRef.current = true;
    showAndHold();
  }, [zoomLevel, showAndHold, cancelMomentum]);

  const onDialDragUpdate = useCallback((translationX: number) => {
    const linearDelta = translationX / DIAL_WIDTH;
    const startZoom = dialZoomAtDragStartRef.current;
    const linearTarget = startZoom + linearDelta;
    const clamped = Math.max(0, Math.min(MAX_CAMERA_ZOOM, linearTarget));
    const eased =
      clamped < startZoom
        ? clamped
        : startZoom + (clamped - startZoom) * (1 + clamped * 0.4);
    const raw = safeZoom(eased);
    const newZoom = applyMagneticSnap(raw);
    setZoomLevel(newZoom);
    hapticTickIfCrossed(newZoom);
    setActivePreset(-1);
  }, [applyMagneticSnap, hapticTickIfCrossed]);

  const onDialDragEnd = useCallback((velocityX: number) => {
    lastCrossedPresetRef.current = -1;
    const SNAP_THRESHOLD = 0.03;
    const settle = (z: number) => {
      for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
        if (Math.abs(z - ZOOM_PRESET_VALUES[i].value) < SNAP_THRESHOLD) {
          setZoomLevel(ZOOM_PRESET_VALUES[i].value);
          setActivePreset(i);
          isInteractingRef.current = false;
          scheduleHide();
          return;
        }
      }
      syncPresetHighlight(z);
      isInteractingRef.current = false;
      scheduleHide();
    };
    for (let i = 0; i < ZOOM_PRESET_VALUES.length; i++) {
      if (Math.abs(zoomLevelRef.current - ZOOM_PRESET_VALUES[i].value) < SNAP_THRESHOLD) {
        setZoomLevel(ZOOM_PRESET_VALUES[i].value);
        setActivePreset(i);
        isInteractingRef.current = false;
        scheduleHide();
        return;
      }
    }
    const VELOCITY_SCALE = 0.00004;
    const FRICTION = 0.92;
    const MIN_VELOCITY = 0.0001;
    let vel = velocityX * VELOCITY_SCALE;
    momentumZoomRef.current = zoomLevelRef.current;
    isInteractingRef.current = true;
    const tick = () => {
      vel *= FRICTION;
      if (Math.abs(vel) < MIN_VELOCITY) {
        momentumAnimRef.current = null;
        settle(momentumZoomRef.current);
        return;
      }
      const next = safeZoom(momentumZoomRef.current + vel);
      momentumZoomRef.current = next;
      setZoomLevel(next);
      hapticTickIfCrossed(next);
      momentumAnimRef.current = requestAnimationFrame(tick);
    };
    if (Math.abs(vel) > MIN_VELOCITY) {
      momentumAnimRef.current = requestAnimationFrame(tick);
    } else {
      settle(zoomLevelRef.current);
    }
  }, [scheduleHide, syncPresetHighlight, hapticTickIfCrossed]);

  const dialPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          runOnJS(onDialDragStart)();
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(onDialDragUpdate)(e.translationX);
        })
        .onEnd((e) => {
          'worklet';
          runOnJS(onDialDragEnd)(e.velocityX);
        }),
    [onDialDragStart, onDialDragUpdate, onDialDragEnd],
  );

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const flipCamera = () => {
    cancelMomentum();
    setFacing((f) => (f === 'front' ? 'back' : 'front'));
    setZoomLevel(ZOOM_1X);
    setActivePreset(0);
    onZoomInteraction();
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !ready || taking) return;
    if (!clinicId || !patientId) {
      Alert.alert('Missing info', 'Cannot send right now.');
      return;
    }
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;
      setCaption('');
      setPreviewIsVideo(false);
      setPrevMediaW(photo.width ?? 0);
      setPrevMediaH(photo.height ?? 0);
      setPreviewUri(photo.uri);
    } catch (err) {
      console.error('[patient-chat-camera] capture error', err);
      Alert.alert('Capture failed', 'Please try again.');
    } finally {
      setTaking(false);
    }
  };

  const boxFor = (mw: number, mh: number) => {
    const a = (mw > 0 ? mw : SCREEN_WIDTH) / (mh > 0 ? mh : SCREEN_H);
    const ca = SCREEN_WIDTH / SCREEN_H;
    let bw = SCREEN_WIDTH, bh = SCREEN_H;
    if (a >= ca) { bw = SCREEN_WIDTH; bh = SCREEN_WIDTH / a; } else { bh = SCREEN_H; bw = SCREEN_H * a; }
    return { baseW: bw, baseH: bh, offX: (SCREEN_WIDTH - bw) / 2, offY: (SCREEN_H - bh) / 2 };
  };

  const pickTextColorAtAngle = (x: number, y: number) => {
    const dx = x - WHEEL_R;
    const dy = y - WHEEL_R;
    let ang = Math.atan2(dy, dx) + Math.PI / 2;
    ang = ((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const t = ang / (2 * Math.PI);
    if (Math.abs(t - lastHapticT.current) > 0.045) { lastHapticT.current = t; Haptics.selectionAsync(); }
    const c = colorAt(t);
    textColorRef.current = c;
    setTextThumbT(t);
    setTextColor(c);
  };
  const textColorPan = useMemo(
    () => Gesture.Pan().minDistance(0)
      .onBegin((e) => { runOnJS(pickTextColorAtAngle)(e.x, e.y); })
      .onUpdate((e) => { runOnJS(pickTextColorAtAngle)(e.x, e.y); }),
    []
  );
  const enterTextMode = () => { setTextValue(''); setShowTextColorSlider(false); setTextAlignMode('center'); setTextBg('none'); setTextFont(undefined); setTextColor('#FFFFFF'); textColorRef.current = '#FFFFFF'; setTextThumbT(0); lastHapticT.current = -1; setEditingIndex(null); setTextMode(true); };
  const enterEditText = (i: number) => {
    const t = texts[i];
    if (!t) return;
    setEditingIndex(i);
    setTextValue(t.text);
    setTextColor(t.color);
    textColorRef.current = t.color;
    setTextAlignMode(t.align);
    setTextBg(t.bg);
    setTextFont(t.font);
    setShowTextColorSlider(false);
    setTextMode(true);
  };
  const commitText = () => {
    const t = textValue.trim();
    if (editingIndex !== null || t) pushHistory();
    if (editingIndex !== null) {
      setTexts((prev) => {
        if (!t) return prev.filter((_, idx) => idx !== editingIndex);
        return prev.map((item, idx) => idx === editingIndex ? { ...item, text: t, color: textColorRef.current, align: textAlignMode, bg: textBg, font: textFont } : item);
      });
      setEditingIndex(null);
    } else if (t) {
      setTexts((prev) => [...prev, { text: t, color: textColorRef.current, align: textAlignMode, bg: textBg, font: textFont, dx: 0, dy: 0, rot: 0, scale: 1 }]);
    }
    setTextValue('');
    setShowTextColorSlider(false);
    setTextMode(false);
  };
  const bringToFront = (i: number, dx: number, dy: number, rot: number, scale: number) => {
    pushHistory();
    setTexts((prev) => {
      const upd = prev.map((t, idx) => (idx === i ? { ...t, dx, dy, rot, scale } : t));
      if (i >= upd.length - 1) return upd;
      const item = upd[i];
      return [...upd.slice(0, i), ...upd.slice(i + 1), item];
    });
  };
  const sendToBack = (i: number, dx: number, dy: number, rot: number, scale: number) => {
    pushHistory();
    setTexts((prev) => {
      const upd = prev.map((t, idx) => (idx === i ? { ...t, dx, dy, rot, scale } : t));
      if (i === 0) return upd;
      const item = upd[i];
      return [item, ...upd.slice(0, i), ...upd.slice(i + 1)];
    });
  };

  const rebuildHitBoxes = () => {
    const boxes: { index: number; cx: number; cy: number; hw: number; hh: number; dx: number; dy: number; rot: number; scale: number }[] = [];
    texts.forEach((t, i) => {
      const L = pillLayouts.current[i];
      if (L) {
        boxes.push({
          index: i,
          cx: L.x + L.w / 2 + t.dx,
          cy: L.y + L.h / 2 + t.dy,
          hw: (L.w / 2) * t.scale + 22,
          hh: (L.h / 2) * t.scale + 22,
          dx: t.dx, dy: t.dy, rot: t.rot, scale: t.scale,
        });
      } else {
        boxes.push({
          index: i,
          cx: SCREEN_WIDTH / 2 + t.dx,
          cy: SCREEN_H / 2 + t.dy,
          hw: 80 * t.scale + 22,
          hh: 30 * t.scale + 22,
          dx: t.dx, dy: t.dy, rot: t.rot, scale: t.scale,
        });
      }
    });
    hitBoxesSV.value = boxes;
  };
  const onPillMeasure = (i: number, L: { x: number; y: number; width: number; height: number }) => {
    pillLayouts.current[i] = { x: L.x, y: L.y, w: L.width, h: L.height };
    rebuildHitBoxes();
  };
  useEffect(() => { rebuildHitBoxes(); }, [texts]);

  const grabHaptic = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const deleteText = (i: number) => { pushHistory(); setTexts((prev) => prev.filter((_, idx) => idx !== i)); };
  const trashHaptic = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  const snapHaptic = () => { Haptics.selectionAsync(); };

  const manipGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown((e, sm) => {
        if (activeSV.value >= 0) {
          if (e.allTouches.length > 1) return;
          activeSV.value = -1;
          didManip.value = false;
          ptrs.value = 0;
          overTrashSV.value = false;
          overBackSV.value = false;
          guideXSV.value = false;
          guideYSV.value = false;
          rotSnappedSV.value = false;
          runOnJS(setActiveIndex)(null);
          runOnJS(setOverTrash)(false);
          runOnJS(setOverBack)(false);
          runOnJS(setGuideX)(false);
          runOnJS(setGuideY)(false);
        }
        const boxes = hitBoxesSV.value;
        const tch = e.changedTouches[0];
        if (!tch) { sm.fail(); return; }
        let found = -1; let fdx = 0, fdy = 0, frot = 0, fscale = 1;
        for (let k = 0; k < boxes.length; k++) {
          const b = boxes[k];
          if (Math.abs(tch.x - b.cx) <= b.hw && Math.abs(tch.y - b.cy) <= b.hh) { found = b.index; fdx = b.dx; fdy = b.dy; frot = b.rot; fscale = b.scale; break; }
        }
        if (found >= 0) {
          activeSV.value = found;
          baseTx.value = fdx; baseTy.value = fdy; ptrs.value = 1; didManip.value = false;
          liveTx.value = fdx; liveTy.value = fdy; liveRot.value = frot; liveScale.value = fscale;
          runOnJS(setActiveIndex)(found);
          runOnJS(grabHaptic)();
          sm.activate();
        } else {
          sm.fail();
        }
      })
      .onUpdate((e) => {
        if (activeSV.value < 0) return;
        if (e.numberOfPointers !== ptrs.value) {
          ptrs.value = e.numberOfPointers;
          baseTx.value = liveTx.value - e.translationX;
          baseTy.value = liveTy.value - e.translationY;
        }
        let vx = baseTx.value + e.translationX;
        let vy = baseTy.value + e.translationY;
        const snapX = Math.abs(vx) < 12;
        const snapY = Math.abs(vy) < 12;
        if (snapX) vx = 0;
        if (snapY) vy = 0;
        liveTx.value = vx;
        liveTy.value = vy;
        if (Math.abs(e.translationX) + Math.abs(e.translationY) > 6) didManip.value = true;
        if (snapX !== guideXSV.value) { guideXSV.value = snapX; runOnJS(setGuideX)(snapX); if (snapX) { runOnJS(snapHaptic)(); } }
        if (snapY !== guideYSV.value) { guideYSV.value = snapY; runOnJS(setGuideY)(snapY); if (snapY) { runOnJS(snapHaptic)(); } }
        const dxT = e.absoluteX - TRASH_CX, dyT = e.absoluteY - TRASH_CY;
        const overNow = (dxT * dxT + dyT * dyT) < (TRASH_R * TRASH_R);
        if (overNow !== overTrashSV.value) {
          overTrashSV.value = overNow;
          runOnJS(setOverTrash)(overNow);
          if (overNow) { runOnJS(trashHaptic)(); }
        }
        const dxB = e.absoluteX - BACK_CX, dyB = e.absoluteY - BACK_CY;
        const overBackNow = (dxB * dxB + dyB * dyB) < (BACK_R * BACK_R);
        if (overBackNow !== overBackSV.value) {
          overBackSV.value = overBackNow;
          runOnJS(setOverBack)(overBackNow);
          if (overBackNow) { runOnJS(trashHaptic)(); }
        }
      })
      .onFinalize(() => {
        const idx = activeSV.value;
        if (idx >= 0) {
          if (didManip.value) {
            if (overTrashSV.value) { runOnJS(deleteText)(idx); }
            else if (overBackSV.value) { runOnJS(sendToBack)(idx, liveTx.value, liveTy.value, liveRot.value, liveScale.value); }
            else { runOnJS(bringToFront)(idx, liveTx.value, liveTy.value, liveRot.value, liveScale.value); }
          } else {
            runOnJS(enterEditText)(idx);
          }
        }
        activeSV.value = -1;
        didManip.value = false;
        ptrs.value = 0;
        overTrashSV.value = false;
        overBackSV.value = false;
        guideXSV.value = false;
        guideYSV.value = false;
        rotSnappedSV.value = false;
        runOnJS(setOverTrash)(false);
        runOnJS(setOverBack)(false);
        runOnJS(setGuideX)(false);
        runOnJS(setGuideY)(false);
        runOnJS(setActiveIndex)(null);
      });
    const rotation = Gesture.Rotation()
      .onStart(() => { baseRot.value = liveRot.value; })
      .onUpdate((e) => {
        if (activeSV.value < 0) return;
        const raw = baseRot.value + e.rotation;
        const nearest = Math.round(raw / (Math.PI / 2)) * (Math.PI / 2);
        const snapped = Math.abs(raw - nearest) < 0.12;
        liveRot.value = snapped ? nearest : raw;
        didManip.value = true;
        if (snapped !== rotSnappedSV.value) { rotSnappedSV.value = snapped; if (snapped) { runOnJS(snapHaptic)(); } }
      });
    const pinch = Gesture.Pinch()
      .onStart(() => { baseScale.value = liveScale.value; })
      .onUpdate((e) => {
        if (activeSV.value < 0) return;
        liveScale.value = Math.max(0.4, Math.min(4, baseScale.value * e.scale));
        didManip.value = true;
      });
    return Gesture.Simultaneous(pan, rotation, pinch);
  }, [texts]);
  const cycleTextAlign = () => setTextAlignMode((m) => (m === 'center' ? 'left' : m === 'left' ? 'right' : 'center'));
  const cycleTextBg = () => setTextBg((m) => (m === 'none' ? 'white' : m === 'white' ? 'dim' : m === 'dim' ? 'black' : 'none'));

  const resetTextStyle = () => {
    setTextColor('#FFFFFF');
    textColorRef.current = '#FFFFFF';
    setTextThumbT(0);
    setTextBg('none');
    setTextAlignMode('center');
    setTextFont(undefined);
  };
  const textIsDefault = textBg === 'none' && textAlignMode === 'center' && textFont === undefined && textColor === '#FFFFFF';

  const buildTexts = () => {
    if (texts.length === 0) return undefined;
    const mediaW = prevMediaW > 0 ? prevMediaW : SCREEN_WIDTH;
    const mediaH = prevMediaH > 0 ? prevMediaH : SCREEN_H;
    const aspect = mediaW / mediaH;
    const containerAspect = SCREEN_WIDTH / SCREEN_H;
    let baseW = SCREEN_WIDTH;
    let baseH = SCREEN_H;
    if (aspect >= containerAspect) { baseW = SCREEN_WIDTH; baseH = SCREEN_WIDTH / aspect; }
    else { baseH = SCREEN_H; baseW = SCREEN_H * aspect; }
    const items = texts.map((t) => ({
      text: t.text,
      color: t.color,
      align: t.align,
      bg: t.bg,
      font: t.font ?? null,
      nx: 0.5 + t.dx / baseW,
      ny: 0.5 + t.dy / baseH,
      size: (32 * t.scale) / baseW,
      rot: t.rot,
    }));
    return { items };
  };

  const handleSendPreview = async () => {
    if (!previewUri || sending) return;
    if (!clinicId || !patientId) { Alert.alert('Missing info', 'Cannot send right now.'); return; }
    setSending(true);
    try {
      const builtTexts = buildTexts();
      if (previewIsVideo) {
        await sendVideoMessage({
          clinicId,
          patientId,
          patientName,
          localUri: previewUri,
          caption: caption.trim() || undefined,
          from: 'patient',
          senderName: 'Patient',
          senderType: 'patient',
          texts: builtTexts,
        }, patientDb);
      } else {
        await sendImageMessage({
          clinicId,
          patientId,
          patientName,
          localUri: previewUri,
          caption: caption.trim() || undefined,
          from: 'patient',
          senderName: 'Patient',
          senderType: 'patient',
          hd: hdQuality === 'hd',
          texts: builtTexts,
        }, patientDb);
      }
      router.back();
    } catch (err) {
      console.error('[patient-chat-camera] send error', err);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
    setPreviewIsVideo(false);
    setCaption('');
  };

  const handleRecordToggle = async () => {
    if (!cameraRef.current || !ready) return;
    if (!clinicId || !patientId) { Alert.alert('Missing info', 'Cannot send right now.'); return; }
    if (recording) { cameraRef.current.stopRecording(); return; }
    if (mic.status !== 'granted') {
      const res = await mic.request();
      if (res !== 'granted') { if (!mic.canAskAgain) openDeviceSettings(); return; }
    }
    try {
      setRecording(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      setRecording(false);
      if (video?.uri) {
        setCaption('');
        setPreviewIsVideo(true);
        setPreviewUri(video.uri);
      }
    } catch (err) {
      console.error('[patient-chat-camera] record error', err);
      setRecording(false);
      Alert.alert('Upload failed', 'Please try again.');
    }
  };

  if (!permission) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!permission.granted) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <View style={styles.permCard}>
            <Ionicons name="camera" size={28} color="#FFFFFF" />
            <Text style={styles.permTitle}>Camera access required</Text>
            <Text style={styles.permSub}>
              Allow camera access to take a photo for this conversation.
            </Text>
            <Pressable style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Grant Permission</Text>
            </Pressable>
            <Pressable style={styles.permClose} onPress={handleClose}>
              <Text style={styles.permCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {!previewUri && (
        <>
      <CameraView
        key={`${facing}-${camMode}`}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode={camMode}
        zoom={zoomLevel}
        onCameraReady={() => { setReady(true); showAndHold(); scheduleHide(); }}
      />

      {recording && (
        <View style={[styles.recPillWrap, { top: insets.top + 8 }]} pointerEvents="none">
          <View style={styles.recPill}>
            <View style={styles.recDot} />
            <Text style={styles.recTime}>{fmtSec(recordSec)}</Text>
          </View>
        </View>
      )}

      <GestureDetector gesture={pinchGesture}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
      </GestureDetector>

      <Pressable
        onPress={handleClose}
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        hitSlop={10}
      >
        <Ionicons name="close" size={26} color="#FFFFFF" />
      </Pressable>

      <Pressable
        onPress={flipCamera}
        style={[styles.flipBtn, { bottom: insets.bottom + 36 }]}
        hitSlop={10}
      >
        <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
      </Pressable>

      <Animated.View
        style={[styles.dialContainer, zoomUiAnimatedStyle, { bottom: insets.bottom + 150 }]}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.dialReadout, zoomTextAnimatedStyle]}>
          <Text style={styles.dialReadoutText}>
            {zoomToDisplayLabel(zoomLevel)}x
          </Text>
        </Animated.View>

        <Animated.View style={[styles.dialIndicator, arrowAnimatedStyle]} pointerEvents="none">
          <View style={styles.trailGlow} />
          <Svg width={12} height={10} viewBox="0 0 12 10">
            <SvgText
              x={6}
              y={9}
              fontSize={10}
              fill="#FFD700"
              textAnchor="middle"
            >
              ▼
            </SvgText>
          </Svg>
        </Animated.View>

        <GestureDetector gesture={dialPanGesture}>
          <View style={styles.dialTrack}>
            <Svg
              width={DIAL_WIDTH}
              height={DIAL_ARC_RADIUS * 2}
              viewBox={`${-DIAL_WIDTH / 2} 0 ${DIAL_WIDTH} ${DIAL_ARC_RADIUS * 2}`}
              style={{ position: 'absolute', top: 0 }}
            >
              <G rotation={-zoomToAngle(zoomLevel)} origin={`0,${DIAL_CENTER_Y}`}>
                {DIAL_TICKS.map((tick, idx) => (
                  <G
                    key={idx}
                    rotation={tick.angle}
                    origin={`0,${DIAL_CENTER_Y}`}
                  >
                    <Line
                      x1={0}
                      y1={0}
                      x2={0}
                      y2={tick.height}
                      stroke={tick.isLabel ? '#FFD700' : '#FFFFFF'}
                      strokeWidth={tick.isLabel ? 2 : 1}
                      opacity={tick.isLabel ? 1 : 0.6}
                    />
                    {tick.isLabel && tick.label && (
                      <SvgText
                        x={0}
                        y={tick.height + 12}
                        fontSize={10}
                        fill="#FFD700"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {tick.label}
                      </SvgText>
                    )}
                  </G>
                ))}
              </G>
            </Svg>
          </View>
        </GestureDetector>

        <View style={styles.zoomPresetsRow}>
          {ZOOM_PRESET_VALUES.map((preset, index) => {
            const active = index === activePreset;
            return (
              <Pressable
                key={preset.label}
                onPress={() => {
                  setZoomLevel(preset.value);
                  setActivePreset(index);
                  hapticTap();
                  onZoomInteraction();
                }}
                style={[
                  styles.zoomPresetButton,
                  active && styles.zoomPresetButtonActive,
                ]}
                hitSlop={6}
              >
                <Text
                  style={[
                    styles.zoomPresetText,
                    active && styles.zoomPresetTextActive,
                  ]}
                >
                  {preset.label}x
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <View
        style={[styles.captureButtonContainer, { bottom: insets.bottom + 64 }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={camMode === 'picture' ? handleTakePhoto : handleRecordToggle}
          disabled={(!ready || taking) && !recording}
        >
          <View style={styles.captureOuter}>
            <View style={[styles.captureInnerButton, recording && styles.captureInnerRecording]} />
          </View>
        </Pressable>
      </View>

      <View
        style={[styles.modeToggleContainer, { bottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        <View style={styles.modeToggleRow}>
          <Pressable
            onPress={() => setCamMode('picture')}
            style={[styles.modeSegment, camMode === 'picture' && styles.modeSegmentActive]}
            hitSlop={8}
            disabled={recording}
          >
            <Text style={[styles.modeSegmentText, camMode === 'picture' && styles.modeSegmentTextActive]}>Photo</Text>
          </Pressable>
          <Pressable
            onPress={() => setCamMode('video')}
            style={[styles.modeSegment, camMode === 'video' && styles.modeSegmentActive]}
            hitSlop={8}
            disabled={recording}
          >
            <Text style={[styles.modeSegmentText, camMode === 'video' && styles.modeSegmentTextActive]}>Video</Text>
          </Pressable>
        </View>
      </View>
        </>
      )}

      {previewUri && (
        <View style={styles.previewOverlay}>
          {previewIsVideo ? (
            <Video
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              useNativeControls={false}
              onReadyForDisplay={(e) => { setPrevMediaW(e.naturalSize.width); setPrevMediaH(e.naturalSize.height); }}
            />
          ) : (
            <ExpoImage
              key="prev-image"
              source={{ uri: previewUri }}
              style={styles.previewImage}
              contentFit="contain"
              onLoad={(e) => { setPrevMediaW(e.source?.width ?? 0); setPrevMediaH(e.source?.height ?? 0); }}
            />
          )}

          {texts.length > 0 && !textMode ? (
            <View style={styles.textOverlayWrap} pointerEvents="box-none">
              {texts.map((t, i) => (
                <DraggableText key={`txt_${i}`} item={t} index={i} active={activeIndex === i} liveTx={liveTx} liveTy={liveTy} liveRot={liveRot} liveScale={liveScale} onMeasure={onPillMeasure} />
              ))}
            </View>
          ) : null}
          {texts.length > 0 && !textMode && (
            <GestureDetector gesture={manipGesture}>
              <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
            </GestureDetector>
          )}
          {activeIndex !== null && !textMode && (
            <View pointerEvents="none" style={{ position: 'absolute', left: TRASH_CX - 32, top: TRASH_CY - 32, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: overTrash ? 'rgba(255,59,48,0.92)' : 'rgba(0,0,0,0.45)', transform: [{ scale: overTrash ? 1.18 : 1 }] }}>
              <Ionicons name="trash" size={28} color="#FFFFFF" />
            </View>
          )}
          {activeIndex !== null && !textMode && (
            <View pointerEvents="none" style={{ position: 'absolute', left: BACK_CX - 32, top: BACK_CY - 32, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: overBack ? 'rgba(61,158,255,0.92)' : 'rgba(0,0,0,0.45)', transform: [{ scale: overBack ? 1.18 : 1 }] }}>
              <Ionicons name="layers-outline" size={26} color="#FFFFFF" />
            </View>
          )}
          {guideX && activeIndex !== null && !textMode && (
            <View pointerEvents="none" style={{ position: 'absolute', left: SCREEN_WIDTH / 2 - 0.75, top: 0, bottom: 0, width: 1.5, backgroundColor: 'rgba(80,200,255,0.95)' }} />
          )}
          {guideY && activeIndex !== null && !textMode && (
            <View pointerEvents="none" style={{ position: 'absolute', top: SCREEN_H / 2 - 0.75, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(80,200,255,0.95)' }} />
          )}

          {!textMode && (
            <View style={[styles.previewTopBar, { top: insets.top + 8 }]} pointerEvents="box-none">
              <Pressable onPress={handleRetake} style={styles.previewIconBtn} hitSlop={8}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
              <View style={styles.previewTopRight}>
                {!previewIsVideo && (
                  <Pressable onPress={() => setHdSheetOpen(true)} style={styles.previewIconBtn} hitSlop={8}>
                    <Text style={[styles.previewBtnText, hdQuality === 'hd' && { color: '#1E6FD9' }]}>HD</Text>
                  </Pressable>
                )}
                <Pressable onPress={enterTextMode} style={styles.previewIconBtn} hitSlop={8}>
                  <Text style={styles.previewBtnText}>Aa</Text>
                </Pressable>
              </View>
            </View>
          )}
          <Modal visible={hdSheetOpen} transparent animationType="slide" onRequestClose={() => setHdSheetOpen(false)}>
            <Pressable onPress={() => setHdSheetOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <Pressable onPress={() => {}} style={{ backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10, paddingBottom: insets.bottom + 16, paddingHorizontal: 20 }}>
                <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 14 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginBottom: 8 }}>Photo quality</Text>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setHdQuality('sd'); setHdSheetOpen(false); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
                  <Ionicons name={hdQuality === 'sd' ? 'radio-button-on' : 'radio-button-off'} size={22} color={hdQuality === 'sd' ? '#1E6FD9' : 'rgba(255,255,255,0.6)'} />
                  <View style={{ marginLeft: 14 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Standard quality</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>Faster to send · smaller file</Text>
                  </View>
                </Pressable>
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setHdQuality('hd'); setHdSheetOpen(false); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
                  <Ionicons name={hdQuality === 'hd' ? 'radio-button-on' : 'radio-button-off'} size={22} color={hdQuality === 'hd' ? '#1E6FD9' : 'rgba(255,255,255,0.6)'} />
                  <View style={{ marginLeft: 14 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>HD quality</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>Best detail · larger file</Text>
                  </View>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
          {!textMode && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.previewBottom, { bottom: insets.bottom + 24 }]}>
              <View style={styles.previewCaptionRow}>
                <Ionicons name="camera-outline" size={20} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.previewCaptionInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                />
              </View>
              <View style={styles.previewSendRow}>
                <View style={styles.previewWhoChip}><Text style={styles.previewWhoText}>You</Text></View>
                <Pressable onPress={handleSendPreview} disabled={sending} style={[styles.previewSendBtn, sending && { opacity: 0.6 }]} hitSlop={8}>
                  <Ionicons name="send" size={22} color="#FFFFFF" />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          )}

          {textMode && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[styles.textInputWrap, { alignItems: textAlignMode === 'left' ? 'flex-start' : textAlignMode === 'right' ? 'flex-end' : 'center' }]}
              pointerEvents="box-none"
            >
              <TextInput
                style={[styles.textInputField, {
                  color: textBg === 'none' ? textColor : (textBg === 'dim' || textBg === 'white') ? (isWhitish(textColor) ? '#000000' : textColor) : (textBg === 'black' ? (isWhitish(textColor) ? '#FFFFFF' : textColor) : '#000000'),
                  backgroundColor: textBg === 'white' ? '#FFFFFF' : textBg === 'dim' ? (isWhitish(textColor) ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') : textBg === 'black' ? (isWhitish(textColor) ? '#000000' : lightenColor(textColor, 0.6)) : 'transparent',
                  borderRadius: 12,
                  paddingHorizontal: textBg === 'none' ? 0 : 14,
                  paddingVertical: textBg === 'none' ? 0 : 6,
                  textShadowColor: textBg === 'none' ? 'rgba(0,0,0,0.35)' : 'transparent',
                  fontFamily: textFont,
                }]}
                value={textValue}
                onChangeText={setTextValue}
                placeholder="Add text"
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoFocus
                multiline
                textAlign={textAlignMode}
              />
            </KeyboardAvoidingView>
          )}

          {textMode && (
            <View style={[styles.drawBar, { top: insets.top + 8 }]} pointerEvents="box-none">
              <Pressable onPress={commitText} style={styles.drawDoneBtn} hitSlop={8}>
                <Ionicons name="checkmark" size={26} color="#FFFFFF" />
              </Pressable>
              <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Pressable onPress={cycleTextAlign} style={styles.drawIconBtn} hitSlop={8}><MaterialIcons name={textAlignMode === 'left' ? 'format-align-left' : textAlignMode === 'right' ? 'format-align-right' : 'format-align-center'} size={22} color="#FFFFFF" /></Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable onPress={resetTextStyle} disabled={textIsDefault} style={[styles.drawIconBtn, { opacity: textIsDefault ? 0.35 : 1 }]} hitSlop={8}><MaterialIcons name="format-color-reset" size={22} color="#FFFFFF" /></Pressable>
                <Pressable onPress={cycleTextBg} style={styles.drawIconBtn} hitSlop={8}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>A+</Text></Pressable>
                <Pressable onPress={() => setShowTextColorSlider((v) => !v)} style={styles.drawIconBtn} hitSlop={8}>
                  <MaterialIcons name="brush" size={22} color={textColor} />
                </Pressable>
              </View>
            </View>
          )}

          {textMode && showTextColorSlider && (
            <View style={[styles.colorWheelWrap, { top: insets.top + 74 }]}>
              <GestureDetector gesture={textColorPan}>
                <View style={{ width: WHEEL_D, height: WHEEL_D, shadowColor: textColor, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }}>
                  <ColorWheel color={textColor} t={textThumbT} />
                </View>
              </GestureDetector>
            </View>
          )}

          {textMode && (
            <View style={[styles.fontRowWrap, { bottom: kbHeight + 10 }]} pointerEvents="box-none">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.fontRowContent}
              >
                {FONT_OPTIONS.map((f) => {
                  const active = textFont === f.family;
                  return (
                    <Pressable key={f.key} onPress={() => setTextFont(f.family)} style={[styles.fontChip, active && styles.fontChipActive]}>
                      <Text style={{ fontFamily: f.family, color: active ? '#111111' : '#FFFFFF', fontSize: 18, fontWeight: '600' }}>Aa</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  closeBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  flipBtn: {
    position: 'absolute',
    right: 22,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  captureButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  captureOuter: {
    width: CAPTURE_OUTER,
    height: CAPTURE_OUTER,
    borderRadius: CAPTURE_OUTER / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerButton: {
    width: CAPTURE_INNER,
    height: CAPTURE_INNER,
    borderRadius: CAPTURE_INNER / 2,
    backgroundColor: '#FFFFFF',
  },
  captureInnerRecording: { backgroundColor: '#FF3B30', borderRadius: 10 },

  recPillWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 11 },
  recPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  recTime: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },

  modeToggleContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  modeToggleRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 2 },
  modeSegment: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  modeSegmentActive: { backgroundColor: '#FFFFFF' },
  modeSegmentText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' },
  modeSegmentTextActive: { color: '#111111' },

  previewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000', zIndex: 50, overflow: 'visible' },
  previewImage: { width: SCREEN_WIDTH, height: SCREEN_H },
  previewTopBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  previewTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  previewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  previewBottom: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 12 },
  previewCaptionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12 },
  previewCaptionInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 6, maxHeight: 100 },
  previewSendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewWhoChip: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  previewWhoText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  previewSendBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },

  drawBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  drawDoneBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E6FD9', alignItems: 'center', justifyContent: 'center' },
  drawIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  colorWheelWrap: { position: 'absolute', right: 12 },
  textInputWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  textInputField: { fontSize: 32, fontWeight: '700', textAlign: 'center', minWidth: 80, lineHeight: 40, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  textOverlayWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, overflow: 'visible' },
  textOverlayItem: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginVertical: 4, lineHeight: 40, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  fontRowWrap: { position: 'absolute', left: 0, right: 0 },
  fontRowContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  fontChip: { minWidth: 44, height: 44, borderRadius: 22, paddingHorizontal: 14, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  fontChipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },

  dialContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  dialReadout: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialReadoutText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 13,
  },
  dialIndicator: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 14,
    marginBottom: -2,
  },
  trailGlow: {
    position: 'absolute',
    bottom: -2,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: '#FFD700',
    opacity: 0.5,
  },
  dialTrack: {
    width: DIAL_WIDTH,
    height: DIAL_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  zoomPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  zoomPresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomPresetButtonActive: {
    borderColor: '#FFD700',
  },
  zoomPresetText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  zoomPresetTextActive: {
    color: '#FFD700',
  },

  permCard: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    gap: 10,
  },
  permTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  permSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
  permBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E6FD9',
  },
  permBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  permClose: { marginTop: 4, paddingHorizontal: 12, paddingVertical: 8 },
  permCloseText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
});
