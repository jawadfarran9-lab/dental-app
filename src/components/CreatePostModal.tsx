/**
 * CreatePostModal — Isolated post/reel creation UI.
 * Handles media pick, caption, upload to Storage, then calls createPost().
 */
import { storage } from '@/firebaseConfig';
import { createPost, PostType } from '@/src/services/postCreationService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName?: string;
  initialType?: PostType;
  isDark: boolean;
}

export default function CreatePostModal({
  visible,
  onClose,
  clinicId,
  clinicName,
  initialType = 'post',
  isDark,
}: CreatePostModalProps) {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState<PostType>(initialType);
  const [uploading, setUploading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setMediaUri(null);
      setCaption('');
      setPostType(initialType);
    }
  }, [visible, initialType]);

  // ── Pick media ──
  const pickMedia = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        postType === 'reel'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setMediaUri(result.assets[0].uri);
    }
  }, [postType]);

  // ── Upload to Firebase Storage ──
  const uploadMedia = useCallback(
    async (uri: string): Promise<string> => {
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Failed to read media'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const ext = postType === 'reel' ? 'mp4' : 'jpg';
      const filename = `${Date.now()}.${ext}`;
      const storageRef = ref(storage, `clinics/${clinicId}/media/${filename}`);
      const contentType = postType === 'reel' ? 'video/mp4' : 'image/jpeg';
      const uploadTask = uploadBytesResumable(storageRef, blob, { contentType });

      const downloadURL: string = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (err) => reject(err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          },
        );
      });

      return downloadURL;
    },
    [clinicId, postType],
  );

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!mediaUri) {
      Alert.alert('No Media', 'Please select an image or video first.');
      return;
    }

    setUploading(true);
    try {
      const mediaUrl = await uploadMedia(mediaUri);

      await createPost(clinicId, {
        type: postType,
        mediaUrl,
        thumbnailUrl: postType === 'post' ? mediaUrl : undefined,
        caption: caption.trim() || undefined,
        clinicName: clinicName || undefined,
      });

      onClose();
      Alert.alert('Published', `Your ${postType} has been published.`);
    } catch (err: any) {
      console.error('[CREATE_POST] Error:', err);
      Alert.alert('Upload Failed', 'Could not publish. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [mediaUri, uploadMedia, clinicId, postType, caption, clinicName, onClose]);

  // ── Colors ──
  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBg = isDark ? '#2C2C2E' : '#F5F5F7';
  const text = isDark ? '#F5F5F7' : '#1C1C1E';
  const subtext = isDark ? '#8E8E93' : '#6B7280';
  const accent = '#4A90D9';

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={uploading ? undefined : onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        </Pressable>

        {/* Sheet */}
        <View style={[s.sheet, { backgroundColor: bg }]}>
          {/* Handle */}
          <View style={s.handleWrap}>
            <View style={[s.handle, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
          </View>

          {/* Header */}
          <View style={s.header}>
            <Text style={[s.title, { color: text }]}>
              New {postType === 'reel' ? 'Reel' : 'Post'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={uploading}>
              <Ionicons name="close" size={24} color={subtext} />
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View style={s.typeRow}>
            {(['post', 'reel'] as PostType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  s.typeBtn,
                  { backgroundColor: postType === t ? accent : cardBg },
                ]}
                onPress={() => {
                  setPostType(t);
                  setMediaUri(null);
                }}
                disabled={uploading}
              >
                <Ionicons
                  name={t === 'post' ? 'image-outline' : 'film-outline'}
                  size={18}
                  color={postType === t ? '#FFF' : subtext}
                />
                <Text
                  style={[
                    s.typeBtnText,
                    { color: postType === t ? '#FFF' : text },
                  ]}
                >
                  {t === 'post' ? 'Post' : 'Reel'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Media Picker */}
          <TouchableOpacity
            style={[s.mediaPicker, { backgroundColor: cardBg }]}
            onPress={pickMedia}
            activeOpacity={0.7}
            disabled={uploading}
          >
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={s.preview} contentFit="cover" />
            ) : (
              <View style={s.placeholderWrap}>
                <Ionicons
                  name={postType === 'reel' ? 'videocam-outline' : 'camera-outline'}
                  size={40}
                  color={subtext}
                />
                <Text style={[s.placeholderText, { color: subtext }]}>
                  Tap to select {postType === 'reel' ? 'video' : 'image'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption */}
          <TextInput
            style={[s.captionInput, { backgroundColor: cardBg, color: text }]}
            placeholder="Write a caption..."
            placeholderTextColor={subtext}
            value={caption}
            onChangeText={setCaption}
            maxLength={300}
            multiline
            editable={!uploading}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: accent, opacity: uploading || !mediaUri ? 0.5 : 1 }]}
            onPress={handleSubmit}
            disabled={uploading || !mediaUri}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.submitText}>Publish</Text>
            )}
          </TouchableOpacity>

          {/* Bottom safe area */}
          <View style={{ height: Platform.OS === 'ios' ? 34 : 16 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mediaPicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  captionInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 60,
    maxHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
