import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, AlertButton, Pressable, Text, View } from 'react-native';
import {
  Camera,
  ChevronRight,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trash2,
  UserCog,
} from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal, SheetItem } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useProfile } from '@/hooks/queries';
import {
  useChangeMyRole,
  useDeleteMyAccount,
  useTransferAdmin,
  useUpdateMember,
} from '@/hooks/mutations';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { ApiError } from '@/lib/api';
import { ROLE } from '@css/shared';

type PendingAction = 'delete' | 'role' | null;

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { mode, toggle } = useThemeStore();
  const { data: profile, isLoading } = useProfile();
  const updateMember = useUpdateMember();
  const transferAdmin = useTransferAdmin();
  const changeMyRole = useChangeMyRole();
  const deleteMyAccount = useDeleteMyAccount();
  const [loggingOut, setLoggingOut] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<'COORDINATOR' | 'MEMBER' | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return <Spinner />;
  }

  const member =
    profile?.team?.members.find((m) => m.userId === profile.user.id) ?? null;
  const role = member?.role ?? user?.role;
  const roleLabel =
    role === ROLE.ADMIN ? 'Admin' : role === ROLE.COORDINATOR ? 'Coordinator' : 'Member';
  const isAdmin = role === ROLE.ADMIN;

  const currentUserId = profile?.user.id;
  const adminCandidates = (profile?.team?.members ?? []).filter(
    (m) => m.userId !== currentUserId && m.role !== 'ADMIN',
  );

  function openProfile() {
    if (!member) return;
    setFormFirstName(member.firstName);
    setFormLastName(member.lastName);
    setFormPhone(member.phone ?? '');
    setFormAddress(member.address ?? '');
    setAvatarUrl(member.avatarUrl ?? null);
    setRemoveAvatar(false);
    setSaveError(null);
    setModalOpen(true);
  }

  function applyImageResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    setAvatarUrl(`data:${mime};base64,${asset.base64}`);
    setRemoveAvatar(false);
  }

  function removeAvatarPhoto() {
    setAvatarUrl(null);
    setRemoveAvatar(true);
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    applyImageResult(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      }),
    );
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
      return;
    }
    applyImageResult(
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      }),
    );
  }

  function openPhotoSourcePicker() {
    const options: AlertButton[] = [
      { text: 'Photo library', onPress: () => void pickPhoto() },
      { text: 'Take a photo', onPress: () => void takePhoto() },
    ];
    if (avatarUrl) {
      options.push({
        text: 'Remove photo',
        style: 'destructive',
        onPress: removeAvatarPhoto,
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', 'Choose a photo source', options);
  }

  function onSave() {
    if (!member || saving) return;
    setSaveError(null);
    setSaving(true);
    updateMember.mutate(
      {
        id: member.id,
        input: {
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim(),
          avatarUrl: removeAvatar ? '' : (avatarUrl ?? undefined),
        },
      },
      {
        onSettled: () => setSaving(false),
        onError: (e) =>
          Alert.alert(
            'Could not save your profile',
            e instanceof ApiError ? e.message : 'Please try again.',
          ),
      },
    );
    setModalOpen(false);
  }

  function openRoleChoice() {
    setRoleTarget(null);
    setAdminError(null);
    setRoleModalOpen(true);
  }

  function chooseRole(nextRole: 'COORDINATOR' | 'MEMBER') {
    setRoleTarget(nextRole);
    setRoleModalOpen(false);
    setSelectedAdminId(null);
    setAdminError(null);
    setPendingAction('role');
    setAdminModalOpen(true);
  }

  function startDeleteFlow() {
    Alert.alert(
      'Delete account',
      'You must assign the ADMIN role to another member before deleting your account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setSelectedAdminId(null);
            setAdminError(null);
            setPendingAction('delete');
            setAdminModalOpen(true);
          },
        },
      ],
    );
  }

  async function confirmTransfer() {
    if (!selectedAdminId || !pendingAction) return;
    setSubmitting(true);
    setAdminError(null);
    try {
      await transferAdmin.mutateAsync(selectedAdminId);

      if (pendingAction === 'delete') {
        await deleteMyAccount.mutateAsync();
        await logout();
        return;
      }

      if (roleTarget) {
        const res = await changeMyRole.mutateAsync(roleTarget);
        setUser(res.user);
      }
      setAdminModalOpen(false);
      setPendingAction(null);
      setRoleTarget(null);
    } catch (e) {
      setAdminError(e instanceof ApiError ? e.message : 'Could not complete the transfer.');
    } finally {
      setSubmitting(false);
    }
  }

  const pendingActionLabel =
    pendingAction === 'delete'
      ? 'before deleting your account'
      : roleTarget
        ? `before changing your role to ${roleTarget === 'COORDINATOR' ? 'Coordinator' : 'Member'}`
        : '';

  const isDark = mode === 'dark';

  return (
    <Screen scroll className="pt-4">
      <Text className="text-2xl font-bold text-foreground">Settings</Text>

      <Pressable onPress={openProfile} className="mt-4 active:opacity-80">
        <Card>
          <CardContent className="flex-row items-center gap-3">
            <Avatar
              firstName={member?.firstName ?? profile?.user.email?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
              lastName={member?.lastName ?? '?'}
              size="lg"
              src={member?.avatarUrl}
            />
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {member
                  ? `${member.firstName} ${member.lastName}`
                  : profile?.user.email ?? user?.email ?? 'Guest'}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {member?.email ?? profile?.user.email ?? user?.email ?? ''}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {profile?.team?.name ?? 'No team'} · {roleLabel}
              </Text>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </CardContent>
        </Card>
      </Pressable>

      {isAdmin ? (
        <>
          <Text className="mt-6 mb-2 text-sm font-medium text-muted-foreground">Administration</Text>
          <Card>
            <Pressable onPress={openRoleChoice} className="active:opacity-70">
              <CardContent className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <UserCog size={18} className="text-muted-foreground" />
                  <View>
                    <Text className="text-base text-foreground">Change my role</Text>
                    <Text className="text-sm text-muted-foreground">
                      Step down to Coordinator or Member
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} className="text-muted-foreground" />
              </CardContent>
            </Pressable>
            <Pressable onPress={startDeleteFlow} className="active:opacity-70">
              <CardContent className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Trash2 size={18} className="text-destructive" />
                  <View>
                    <Text className="text-base text-destructive">Delete account</Text>
                    <Text className="text-sm text-muted-foreground">
                      Transfer ADMIN first, then remove your profile
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} className="text-destructive" />
              </CardContent>
            </Pressable>
          </Card>
        </>
      ) : null}

      <Text className="mt-6 mb-2 text-sm font-medium text-muted-foreground">Appearance</Text>
      <Card>
        <CardContent className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            {isDark ? (
              <Moon size={18} className="text-muted-foreground" />
            ) : (
              <Sun size={18} className="text-muted-foreground" />
            )}
            <Text className="text-base text-foreground">Dark mode</Text>
          </View>
          <Switch checked={isDark} onCheckedChange={() => void toggle()} />
        </CardContent>
      </Card>

      <Text className="mt-6 mb-2 text-sm font-medium text-muted-foreground">Account</Text>
      <Card>
        <Pressable
          onPress={async () => {
            setLoggingOut(true);
            await logout();
          }}
          className="active:opacity-70"
        >
          <CardContent className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <LogOut size={18} className="text-destructive" />
              <Text className="text-base text-destructive">Sign out</Text>
            </View>
            <ChevronRight size={18} className="text-muted-foreground" />
          </CardContent>
        </Pressable>
      </Card>

      {loggingOut ? <Spinner label="Signing out…" /> : null}

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title="My profile">
        <View className="gap-4">
          <View className="items-center gap-2">
            <Avatar
              firstName={formFirstName || '?'}
              lastName={formLastName}
              size="lg"
              src={avatarUrl}
            />
            <Button size="sm" variant="outline" onPress={openPhotoSourcePicker}>
              <Camera size={14} className="text-foreground" />
              Change photo
            </Button>
            <Text className="text-xs text-muted-foreground">
              {roleLabel} · {profile?.team?.name ?? 'No team'}
            </Text>
          </View>

          <View className="gap-3">
            <FormField label="First name" value={formFirstName} onChangeText={setFormFirstName} placeholder="Jane" />
            <FormField label="Last name" value={formLastName} onChangeText={setFormLastName} placeholder="Doe" />
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Email</Text>
              <Text className="text-sm text-muted-foreground">
                {member?.email ?? profile?.user.email ?? user?.email ?? '—'}
              </Text>
            </View>
            <FormField
              label="Phone (optional)"
              value={formPhone}
              onChangeText={setFormPhone}
              placeholder="+1 555 123 4567"
              keyboardType="phone-pad"
            />
            <FormField
              label="Address (optional)"
              value={formAddress}
              onChangeText={setFormAddress}
              placeholder="12 Church Street"
              autoCapitalize="words"
            />
          </View>

          {saveError ? <Text className="text-sm text-destructive">{saveError}</Text> : null}

          <Button
            onPress={() => void onSave()}
            disabled={!formFirstName.trim() || !formLastName.trim()}
            loading={saving}
          >
            Save profile
          </Button>
        </View>
      </Modal>

      <Modal visible={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Change my role">
        <View className="gap-4">
          <Text className="text-sm text-muted-foreground">
            You must assign the ADMIN role to another member before stepping down.
          </Text>
          <SheetItem
            label="Coordinator"
            subtitle="Manage the schedule, members and service slots"
            onPress={() => chooseRole('COORDINATOR')}
          />
          <SheetItem
            label="Member"
            subtitle="View your Home dashboard and assignments only"
            onPress={() => chooseRole('MEMBER')}
          />
        </View>
      </Modal>

      <Modal visible={adminModalOpen} onClose={() => !submitting && setAdminModalOpen(false)} title="Assign a new admin">
        <View className="gap-4">
          <View className="flex-row items-center gap-2">
            <Shield size={16} className="text-primary" />
            <Text className="flex-1 text-sm text-muted-foreground">
              Choose a member to become the new ADMIN {pendingActionLabel}.
            </Text>
          </View>

          {adminCandidates.length === 0 ? (
            <View className="items-center gap-2 rounded-md bg-muted px-4 py-6">
              <Text className="text-sm text-muted-foreground">
                No other members available.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {adminCandidates.map((candidate) => (
                <Pressable
                  key={candidate.id}
                  onPress={() => setSelectedAdminId(candidate.id)}
                  className={
                    selectedAdminId === candidate.id
                      ? 'rounded-md border border-primary bg-accent px-3 py-3'
                      : 'rounded-md border border-transparent bg-background px-3 py-3 active:bg-muted'
                  }
                >
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      firstName={candidate.firstName}
                      lastName={candidate.lastName}
                      size="sm"
                      src={candidate.avatarUrl}
                    />
                    <View className="flex-1">
                      <Text className="text-base text-foreground">
                        {candidate.firstName} {candidate.lastName}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {candidate.email ?? 'No email on file'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {adminError ? <Text className="text-sm text-destructive">{adminError}</Text> : null}

          <Button
            onPress={() => void confirmTransfer()}
            disabled={!selectedAdminId || submitting}
            loading={submitting}
          >
            Transfer admin and {pendingAction === 'delete' ? 'delete my account' : 'change my role'}
          </Button>
        </View>
      </Modal>
    </Screen>
  );
}
