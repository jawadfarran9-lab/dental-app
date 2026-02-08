import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { writeAuditLog } from '@/src/services/auditLogService';
import { createInvite, listInvites, revokeInvite } from '@/src/services/clinicInvitesService';
import {
    changeMemberRole,
    listClinicMembers,
    removeMember,
    setMemberStatus
} from '@/src/services/clinicMembersService';
import { ClinicMember, ClinicRole } from '@/src/types/members';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Simplified roles: only doctor can be added (owner is the account creator)
const ROLE_OPTIONS: ClinicRole[] = ['doctor'];

function roleLabel(role: ClinicRole) {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'doctor':
      return 'Doctor';
    default:
      return role;
  }
}

function RoleBadge({ role }: { role: ClinicRole }) {
  const { colors } = useTheme();
  const palette: Record<ClinicRole, { bg: string; text: string }> = {
    owner: { bg: '#0B6EF3', text: '#fff' },
    doctor: { bg: '#059669', text: '#fff' },
  };
  const tone = palette[role] || { bg: colors.card, text: colors.textPrimary };
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}> 
      <Text style={[styles.badgeText, { color: tone.text }]}>{roleLabel(role)}</Text>
    </View>
  );
}

export default function ClinicTeamScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { clinicId, clinicRole, memberId } = useAuth();

  useClinicRoleGuard(['owner']);

  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'DOCTOR' as ClinicRole,
  });

  const loadMembers = async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const data = await listClinicMembers(clinicId);
      setMembers(data);
      const inviteData = await listInvites(clinicId);
      setInvites(inviteData);
    } catch (error: any) {
      console.error('[TEAM] Load members error', error);
        Alert.alert(t('common.error'), error.message || t('team.failedToLoadTeam'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [clinicId]);

  const handleInvite = async () => {
    if (!clinicId || !clinicRole) return;
    if (!form.displayName.trim() || !form.email.trim()) {
      Alert.alert(t('common.validation'), t('team.nameRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await createInvite({
        clinicId,
        email: form.email.trim(),
        role: form.role,
        invitedBy: memberId || clinicId,
        invitedByName: 'Owner',
      });
      setForm({ displayName: '', email: '', password: '', role: 'DOCTOR' });
      await loadMembers();
      Alert.alert(t('common.success'), t('team.inviteSent'));
    } catch (error: any) {
      console.error('[TEAM] Invite error', error);
      Alert.alert(t('common.error'), error.message || t('team.failedToSendInvite'));
    } finally {
      setSubmitting(false);
    }
  };

  const promptRoleChange = (member: ClinicMember) => {
    Alert.alert(
      t('team.changeRoleTitle'),
      t('team.selectRoleFor', { name: member.displayName || member.email }),
      ROLE_OPTIONS.map((role) => ({
        text: roleLabel(role),
        onPress: () => handleChangeRole(member, role),
      })).concat([{ text: t('common.cancel'), onPress: async () => {} }])
    );
  };

  const handleChangeRole = async (member: ClinicMember, newRole: ClinicRole) => {
    if (!clinicId || !clinicRole) return;
    setSubmitting(true);
    try {
      await changeMemberRole({ clinicId, actingRole: clinicRole, memberId: member.id, newRole });
      await writeAuditLog({
        clinicId,
        actorId: memberId || clinicId,
        actorName: 'Owner',
        action: 'ROLE_CHANGED',
        targetId: member.id,
        targetName: member.displayName,
        details: { newRole },
      });
      await loadMembers();
    } catch (error: any) {
      console.error('[TEAM] Change role error', error);
      Alert.alert(t('common.error'), error.message || t('team.failedToChangeRole'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: ClinicMember) => {
    if (!clinicId || !clinicRole) return;
    const nextStatus = member.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    setSubmitting(true);
    try {
      await setMemberStatus({ clinicId, actingRole: clinicRole, memberId: member.id, status: nextStatus });
      await writeAuditLog({
        clinicId,
        actorId: memberId || clinicId,
        actorName: 'Owner',
        action: 'MEMBER_STATUS_CHANGED',
        targetId: member.id,
        targetName: member.displayName,
        details: { status: nextStatus },
      });
      await loadMembers();
    } catch (error: any) {
      console.error('[TEAM] Status update error', error);
      Alert.alert(t('common.error'), error.message || t('team.failedToUpdateStatus'));
    } finally {
      setSubmitting(false);
    }
  };

  // PHASE T: Remove member (soft delete)
  const handleRemoveMember = async (member: ClinicMember) => {
    if (!clinicId || !clinicRole) return;
    
    Alert.alert(
      t('team.removeMemberTitle'),
      t('team.removeMemberMessage', { name: member.displayName || member.email }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('team.remove'),
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await removeMember({
                clinicId,
                actingRole: clinicRole,
                memberId: member.id,
                actorId: memberId || clinicId,
                actorName: 'Owner',
              });
              await loadMembers();
              Alert.alert(t('common.success'), t('team.memberRemoved'));
            } catch (error: any) {
              console.error('[TEAM] Remove member error', error);
              Alert.alert(t('common.error'), error.message || t('team.failedToRemoveMember'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleRevokeInvite = async (invite: any) => {
    if (!clinicId || !memberId) return;
    setSubmitting(true);
    try {
      await revokeInvite({
        clinicId,
        inviteId: invite.id,
        actorId: memberId,
        actorName: 'Owner',
      });
      await loadMembers();
    } catch (error: any) {
      console.error('[TEAM] Revoke invite error', error);
      Alert.alert(t('common.error'), error.message || t('team.failedToRevokeInvite'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderMember = ({ item }: { item: ClinicMember }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{item.displayName || t('team.noName')}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
        </View>
        <RoleBadge role={item.status === 'DISABLED' ? 'DISABLED' : item.role} />
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.buttonSecondaryBackground }]} onPress={() => promptRoleChange(item)} disabled={submitting || item.id === clinicId}>
          <Text style={[styles.actionText, { color: colors.buttonSecondaryText }]}>{t('team.changeRole')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: item.status === 'DISABLED' ? '#10B981' : '#EF4444' }]}
          onPress={() => handleToggleStatus(item)}
          disabled={submitting || item.id === clinicId}
        >
          <Text style={[styles.actionText, { color: '#fff' }]}>{item.status === 'DISABLED' ? t('team.enable') : t('team.disable')}</Text>
        </TouchableOpacity>
        {/* PHASE T: Remove button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
          onPress={() => handleRemoveMember(item)}
          disabled={submitting || item.id === clinicId}
        >
          <Text style={[styles.actionText, { color: '#fff' }]}>{t('team.remove')}</Text>
        </TouchableOpacity>
      </View>
      {item.id === clinicId ? (
        <Text style={[styles.ownerHint, { color: colors.textSecondary }]}>{t('team.ownerHint')}</Text>
      ) : null}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t('team.title')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('team.subtitle')}</Text>

      <View style={[styles.form, { borderColor: '#e5e7eb' }]}> 
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('team.inviteMember')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
          placeholder={t('team.nameplaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          value={form.displayName}
          onChangeText={(v) => setForm((s) => ({ ...s, displayName: v }))}
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
          placeholder={t('team.emailPlaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          value={form.email}
          onChangeText={(v) => setForm((s) => ({ ...s, email: v }))}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
          placeholder={t('team.temporaryPasswordPlaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          value={form.password}
          onChangeText={(v) => setForm((s) => ({ ...s, password: v }))}
          secureTextEntry
        />
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.rolePill, form.role === role ? styles.rolePillActive : styles.rolePillInactive]}
              onPress={() => setForm((s) => ({ ...s, role }))}
            >
              <Text style={[styles.roleText, form.role === role ? styles.roleTextActive : styles.roleTextInactive]}>{roleLabel(role)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.buttonBackground }]} onPress={handleInvite} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.primaryBtnText, { color: colors.buttonText }]}>{t('team.invite')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('team.pendingInvites')}</Text>
        {loading ? <ActivityIndicator /> : <Text style={[styles.count, { color: colors.textSecondary }]}>{invites.filter((i) => i.status === 'PENDING').length}</Text>}
      </View>

      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <FlatList
          data={invites.filter((i) => i.status === 'PENDING')}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.email, { color: colors.textPrimary }]}>{item.email}</Text>
                  <Text style={[styles.inviteRole, { color: colors.textSecondary }]}>{t('team.roleLabel')}: {roleLabel(item.role)}</Text>
                  <Text style={[styles.inviteStatus, { color: '#F59E0B' }]}>{t('team.statusLabel')}: {item.status}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => handleRevokeInvite(item)}
                disabled={submitting}
              >
                <Text style={[styles.actionText, { color: '#fff' }]}>{t('team.revoke')}</Text>
              </TouchableOpacity>
            </View>
          )}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>{t('team.noPendingInvites')}</Text>}
        />
      )}

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('team.teamMembers')}</Text>
        {loading ? <ActivityIndicator /> : <Text style={[styles.count, { color: colors.textSecondary }]}>{members.length}</Text>}
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>{t('team.noTeamMembers')}</Text>}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { marginBottom: 16, fontSize: 14 },
  form: { padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 20, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 14 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  rolePill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  rolePillActive: { backgroundColor: '#E0E7FF', borderColor: '#3B82F6' },
  rolePillInactive: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB' },
  roleText: { fontSize: 12, fontWeight: '700' },
  roleTextActive: { color: '#1D4ED8' },
  roleTextInactive: { color: '#475569' },
  primaryBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontWeight: '700', fontSize: 15 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  count: { fontSize: 12 },
  card: { padding: 12, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  actionText: { fontWeight: '700' },
  ownerHint: { marginTop: 6, fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 16 },
  inviteRole: { fontSize: 13, marginTop: 2 },
  inviteStatus: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
