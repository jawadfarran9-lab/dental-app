import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Frame sizing
const FRAME_PADDING = 24; // outer margin from screen edges
const FRAME_INNER_PADDING = 12; // white spacing inside the black frame around the image
const FRAME_WIDTH = SCREEN_WIDTH - FRAME_PADDING * 2;
const IMAGE_WIDTH = FRAME_WIDTH - FRAME_INNER_PADDING * 2;
const IMAGE_HEIGHT = IMAGE_WIDTH; // square image area

export default function FrameEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    imageUri: string;
    editUri?: string;
    editWidth?: string;
    editHeight?: string;
    editMediaType?: string;
    clinicName?: string;
  }>();

  const clinicName = params.clinicName || 'My Clinic';
  const [caption, setCaption] = useState('');

  const imageUri = params.imageUri;

  // Generate time once on mount
  const timeString = useMemo(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            if (!imageUri) {
              router.back();
              return;
            }
            // Navigate back to the EXISTING edit screen (don't create a new one)
            router.navigate({
              pathname: '/story/edit',
              params: {
                uri: params.editUri || '',
                width: params.editWidth || '',
                height: params.editHeight || '',
                mediaType: params.editMediaType || '',
                frameImageUri: imageUri,
                frameCaption: caption,
                frameTime: timeString,
                frameClinicName: clinicName,
              },
            });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Frame Container */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <View style={styles.frameOuter}>
          {/* Black frame with inner white padding */}
          <View style={styles.frameInner}>
            {imageUri ? (
              <ExpoImage
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <Ionicons name="image-outline" size={48} color="#666" />
              </View>
            )}
          </View>

          {/* Info below image, inside the black frame */}
          <View style={styles.infoContainer}>
            <Text style={styles.username}>{clinicName}</Text>
            <Text style={styles.time}>{timeString}</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={caption}
              onChangeText={setCaption}
              maxLength={150}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerButton: {
    padding: 4,
  },
  doneButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: FRAME_PADDING,
  },
  frameOuter: {
    width: FRAME_WIDTH,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  frameInner: {
    margin: FRAME_INNER_PADDING,
    marginBottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },
  infoContainer: {
    paddingHorizontal: FRAME_INNER_PADDING + 4,
    paddingTop: 12,
    paddingBottom: 16,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  time: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  captionInput: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 10,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
});
