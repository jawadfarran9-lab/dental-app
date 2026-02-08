/**
 * AnnotatorToolbar Component
 * 
 * Annotation tools toolbar for the image viewer.
 * Provides pen, text, eraser tools, undo/redo, clear, and save actions.
 */

import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

// ========== Tool Types ==========
export type AnnotationTool = 'pen' | 'text' | 'eraser';

// ========== Props Interface ==========
interface AnnotatorToolbarProps {
  currentTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
}

// ========== Tool Configuration ==========
const TOOLS: { id: AnnotationTool; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'pen', icon: 'brush', label: 'Draw' },
  { id: 'text', icon: 'text', label: 'Text' },
  { id: 'eraser', icon: 'close-circle-outline', label: 'Eraser' },
];

export default function AnnotatorToolbar({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onClearAll,
  onSave,
  canUndo,
  canRedo,
  isSaving,
}: AnnotatorToolbarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Drawing Tools */}
      <View style={styles.toolsSection}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              currentTool === tool.id && {
                backgroundColor: colors.accentBlue,
              },
            ]}
            onPress={() => onToolChange(tool.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tool.icon}
              size={22}
              color={currentTool === tool.id ? '#FFFFFF' : colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

      {/* History Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, !canUndo && styles.actionButtonDisabled]}
          onPress={onUndo}
          disabled={!canUndo}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-undo"
            size={22}
            color={canUndo ? colors.textSecondary : colors.cardBorder}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !canRedo && styles.actionButtonDisabled]}
          onPress={onRedo}
          disabled={!canRedo}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-redo"
            size={22}
            color={canRedo ? colors.textSecondary : colors.cardBorder}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onClearAll}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.accentBlue }]}
        onPress={onSave}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toolsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
