import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarDays, ChevronDown, ChevronRight, ChevronUp, MapPin, Phone, Plus, Search, Shield, Trash2 } from 'lucide-react-native';
import type { MemberDto, ShiftDto } from '@css/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal, SheetItem } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { FormField } from '@/components/ui/FormField';
import { useCreateMember, useDeleteMember, useDeleteShift, useUpdateMember } from '@/hooks/mutations';
import { useMembers, useMemberShifts, seedMemberShiftsFromCache } from '@/hooks/queries';
import { AssignmentSummary } from '@/components/AssignmentSummary';
import { MonthBarChart } from '@/components/MonthBarChart';
import { SlidePage } from '@/components/SlidePage';
import { formatLongDate } from '@/lib/date';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function MembersScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMembers();
  const createMember = useCreateMember();
  const deleteMember = useDeleteMember();
  const deleteShift = useDeleteShift();
  const updateMember = useUpdateMember();

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [detailMember, setDetailMember] = useState<MemberDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDeleteAssignments, setShowDeleteAssignments] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftDto | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const memberShifts = useMemberShifts(detailMember?.id ?? null);

  const filtered = (data ?? [])
    .filter((m) => {
      const q = query.trim().toLowerCase();
      return (
        !q ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, undefined, {
        sensitivity: 'base',
      }),
    );

  const canDeleteMember =
    !!detailMember &&
    !!user &&
    detailMember.userId !== user.id &&
    (user.role === 'ADMIN' || (user.role === 'COORDINATOR' && detailMember.role === 'MEMBER'));

  const assignmentCount = memberShifts.data?.length ?? 0;
  const hasAssignments = assignmentCount > 0;
  const isAdmin = user?.role === 'ADMIN';
  const assignmentLabel = `${assignmentCount} assignment${assignmentCount === 1 ? '' : 's'}`;

  const currentYear = new Date().getFullYear();
  const yearShifts = (memberShifts.data ?? []).filter((shift) =>
    shift.date.startsWith(`${currentYear}-`),
  );

  function onCreate() {
    if (creating) return;
    setError(null);
    setCreating(true);
    createMember.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      },
      {
        onSettled: () => setCreating(false),
        onError: (e) =>
          Alert.alert(
            'Could not add the member',
            e instanceof ApiError ? e.message : 'Please try again.',
          ),
      },
    );
    setModalOpen(false);
    setFirstName('');
    setLastName('');
    setEmail('');
  }

  function confirmDeleteShift(shiftId: string) {
    Alert.alert(
      'Remove assignment',
      `Remove ${detailMember?.firstName ?? ''} ${detailMember?.lastName ?? ''} from this assignment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSelectedShift(null);
            void deleteShift.mutateAsync(shiftId);
          },
        },
      ],
    );
  }

  function openDeleteConfirm() {
    setShowDeleteAssignments(false);
    setConfirmDelete(true);
  }

  function closeDeleteConfirm() {
    setConfirmDelete(false);
  }

  function closeDetail() {
    if (selectedShift) {
      setSelectedShift(null);
      return;
    }
    if (showAssignments) {
      setShowAssignments(false);
      return;
    }
    setRolePickerOpen(false);
    setConfirmDelete(false);
    setDetailMember(null);
  }

  function executeDeleteMember() {
    if (!detailMember) return;
    setConfirmDelete(false);
    setDetailMember(null);
    deleteMember.mutate(detailMember.id, {
      onError: (e) =>
        Alert.alert(
          'Could not delete the member',
          e instanceof ApiError ? e.message : 'Please try again.',
        ),
    });
  }

  async function onChangeRole(nextRole: 'COORDINATOR' | 'MEMBER') {
    if (!detailMember) return;
    if (detailMember.role === nextRole) {
      setRolePickerOpen(false);
      return;
    }
    const previousRole = detailMember.role;
    setRoleError(null);
    setDetailMember((m) => (m ? { ...m, role: nextRole } : m));
    setRolePickerOpen(false);
    try {
      await updateMember.mutateAsync({ id: detailMember.id, input: { role: nextRole } });
    } catch (e) {
      setDetailMember((m) => (m ? { ...m, role: previousRole } : m));
      setRoleError(e instanceof ApiError ? e.message : 'Could not change the role.');
    }
  }

  const roleLabel = (role?: string) =>
    role === 'ADMIN' ? 'Admin' : role === 'COORDINATOR' ? 'Coordinator' : 'Member';

  function openPhone(phone: string) {
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {
      Alert.alert('Cannot make a call', 'No phone app is available on this device.');
    });
  }

  function openAddress(address: string) {
    const query = encodeURIComponent(address);
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${query}`
        : `geo:0,0?q=${query}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot open maps', 'No map application is available on this device.');
    });
  }

  const canChangeRole =
    !!detailMember &&
    !!user &&
    user.role === 'ADMIN' &&
    detailMember.userId !== user.id &&
    detailMember.role !== 'ADMIN';

  return (
    <Screen className="pt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Members</Text>
        <Button size="sm" onPress={() => setModalOpen(true)}>
          <Plus size={16} className="text-primary-foreground" />
          Add
        </Button>
      </View>

      <View className="mt-4 flex-row items-center gap-2 rounded-md border border-input bg-background px-3">
        <Search size={16} className="text-muted-foreground" />
        <Input
          className="border-0 h-10 flex-1 px-0"
          value={query}
          onChangeText={setQuery}
          placeholder="Search members…"
        />
      </View>

      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No members found"
          description="Add a member to your team to start planning services."
        />
      ) : (
        <View className="mt-4 gap-3">
          {filtered.map((member) => (
            <Pressable
              key={member.id}
              onPress={() => {
                setRolePickerOpen(false);
                setShowAssignments(false);
                setSelectedShift(null);
                seedMemberShiftsFromCache(member.id);
                setDetailMember(member);
              }}
              className="active:opacity-80"
            >
              <Card>
                <CardContent className="flex-row items-center gap-3">
                  <Avatar
                    firstName={member.firstName}
                    lastName={member.lastName}
                    src={member.avatarUrl}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground">
                      {member.firstName} {member.lastName}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {member.email ?? 'No email on file'}
                    </Text>
                    <Badge variant="secondary" className="mt-1">
                      {member.shiftCount ?? 0} {member.shiftCount === 1 ? 'shift' : 'shifts'}
                    </Badge>
                  </View>
                  <View className="items-end gap-1">
                    <Badge variant={member.isActive ? 'success' : 'muted'} className="self-end">
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {member.role === 'ADMIN' ? (
                      <Badge variant="destructive" className="self-end">
                        Admin
                      </Badge>
                    ) : member.role === 'COORDINATOR' ? (
                      <Badge variant="outline" className="self-end">
                        Coordinator
                      </Badge>
                    ) : null}
                  </View>
                </CardContent>
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title="Add member">
        <View className="gap-4">
          <FormField label="First name" value={firstName} onChangeText={setFirstName} placeholder="Jane" />
          <FormField label="Last name" value={lastName} onChangeText={setLastName} placeholder="Doe" />
          <FormField
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="jane@church.org"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
          <Button onPress={onCreate} disabled={!firstName || !lastName} loading={creating}>
            Add member
          </Button>
        </View>
      </Modal>

      <Modal
        visible={detailMember !== null}
        onClose={closeDetail}
        animationType="fade"
        overlay={<>
        <SlidePage
          visible={detailMember !== null}
          onClose={closeDetail}
          title={confirmDelete ? 'Delete member' : 'Member details'}
        >
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            <View className="gap-4 p-4">
              {detailMember ? (
            confirmDelete ? (
              <>
                <Text className="text-sm text-foreground">
                  Delete {detailMember.firstName} {detailMember.lastName}
                  {hasAssignments ? ` and their ${assignmentLabel}` : ''}? This cannot be undone.
                </Text>

                {hasAssignments ? (
                  <>
                    <Text className="text-sm text-muted-foreground">
                      Deleting permanently removes all their assignments.
                    </Text>

                    <Pressable
                      onPress={() => setShowDeleteAssignments((v) => !v)}
                      className="flex-row items-center justify-between rounded-md border border-input bg-background px-3 py-3 active:bg-muted"
                    >
                      <View className="flex-row items-center gap-2">
                        <CalendarDays size={16} className="text-muted-foreground" />
                        <Text className="text-sm font-medium text-foreground">
                          {showDeleteAssignments ? 'Hide' : 'Show'} assignments
                        </Text>
                      </View>
                      {showDeleteAssignments ? (
                        <ChevronUp size={18} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={18} className="text-muted-foreground" />
                      )}
                    </Pressable>

                    {showDeleteAssignments ? (
                      <View className="rounded-md bg-muted px-3 py-3">
                        <AssignmentSummary shifts={memberShifts.data ?? []} />
                      </View>
                    ) : null}
                  </>
                ) : null}

                <View className="flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={closeDeleteConfirm}
                    disabled={deleteMember.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onPress={executeDeleteMember}
                    loading={deleteMember.isPending}
                  >
                    <Trash2 size={16} className="text-destructive-foreground" />
                    Delete member
                  </Button>
                </View>
              </>
            ) : (
            <>
              <View className="flex-row items-center gap-3">
                <Avatar
                  firstName={detailMember.firstName}
                  lastName={detailMember.lastName}
                  size="lg"
                  src={detailMember.avatarUrl}
                />
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    {detailMember.firstName} {detailMember.lastName}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {detailMember.email ?? 'No email on file'}
                  </Text>
                </View>
                <Badge variant={detailMember.isActive ? 'success' : 'muted'}>
                  {detailMember.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </View>

              <View className="flex-row items-center justify-between gap-3">
                <View className="gap-0.5">
                  <Text className="text-sm font-medium text-foreground">Role</Text>
                  <Badge
                    variant={
                      detailMember.role === 'ADMIN'
                        ? 'destructive'
                        : detailMember.role === 'COORDINATOR'
                          ? 'outline'
                          : 'secondary'
                    }
                    className="self-start"
                  >
                    {roleLabel(detailMember.role)}
                  </Badge>
                </View>
                {canChangeRole ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setRolePickerOpen((v) => !v)}
                  >
                    <Shield size={14} className="text-foreground" />
                    Change role
                  </Button>
                ) : null}
              </View>

              {rolePickerOpen ? (
                <View className="gap-2">
                  <Text className="text-sm text-muted-foreground">
                    Assign a new role to {detailMember.firstName} {detailMember.lastName}.
                    Everyone in the team will be notified of this change.
                  </Text>
                  <SheetItem
                    label="Coordinator"
                    subtitle="Manage the schedule, members and service slots"
                    selected={detailMember.role === 'COORDINATOR'}
                    onPress={() => void onChangeRole('COORDINATOR')}
                  />
                  <SheetItem
                    label="Member"
                    subtitle="View your Home dashboard and assignments only"
                    selected={detailMember.role === 'MEMBER'}
                    onPress={() => void onChangeRole('MEMBER')}
                  />
                  {roleError ? <Text className="text-sm text-destructive">{roleError}</Text> : null}
                </View>
              ) : null}

              {user?.role === 'ADMIN' && (detailMember.phone || detailMember.address) ? (
                <View className="gap-1">
                  <Text className="text-sm font-medium text-foreground">Contact</Text>
                  <View className="gap-2">
                    {detailMember.phone ? (
                      <Pressable
                        onPress={() => detailMember.phone && openPhone(detailMember.phone)}
                        className="flex-row items-center gap-2 active:opacity-70"
                      >
                        <Phone size={14} className="text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          {detailMember.phone}
                        </Text>
                      </Pressable>
                    ) : null}
                    {detailMember.address ? (
                      <Pressable
                        onPress={() =>
                          detailMember.address && openAddress(detailMember.address)
                        }
                        className="flex-row items-center gap-2 active:opacity-70"
                      >
                        <MapPin size={14} className="text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          {detailMember.address}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">
                    Assignments · {currentYear}
                  </Text>
                  <Badge variant="secondary">{assignmentLabel}</Badge>
                </View>

                {memberShifts.isLoading ? (
                  <Spinner />
                ) : (
                  <View className="gap-2">
                    <MonthBarChart
                      shifts={memberShifts.data ?? []}
                      year={currentYear}
                      onSelectShift={setSelectedShift}
                    />
                    <Text className="text-center text-xs text-muted-foreground">
                      {yearShifts.length === 0
                        ? 'No assignments this year. Tap below to see all assignments.'
                        : 'Tap a highlighted day to see the assignment.'}
                    </Text>
                  </View>
                )}

                <Button variant="outline" onPress={() => setShowAssignments(true)}>
                  <CalendarDays size={16} className="text-foreground" />
                  View all assignments
                </Button>
              </View>

              {canDeleteMember && hasAssignments ? (
                isAdmin ? (
                  <>
                    <View className="gap-1 rounded-md bg-destructive/10 px-3 py-3">
                      <Text className="text-sm font-medium text-destructive">
                        This member has {assignmentLabel}.
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        Deleting removes all their assignments permanently. Only an admin can
                        delete a member with assignments.
                      </Text>
                    </View>
                    <Button variant="destructive" onPress={openDeleteConfirm}>
                      <Trash2 size={16} className="text-destructive-foreground" />
                      Delete member and {assignmentLabel}
                    </Button>
                  </>
                ) : (
                  <View className="gap-1 rounded-md bg-destructive/10 px-3 py-3">
                    <Text className="text-sm font-medium text-destructive">
                      This member has {assignmentLabel}.
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      A member with assignments cannot be deleted. Only an admin can delete a
                      member and all their assignments.
                    </Text>
                  </View>
                )
              ) : canDeleteMember ? (
                <Button variant="destructive" onPress={openDeleteConfirm}>
                  <Trash2 size={16} className="text-destructive-foreground" />
                  Delete member
                </Button>
              ) : null}
            </>
            )
            ) : null}
          </View>
        </ScrollView>
      </SlidePage>

      <SlidePage
        visible={showAssignments}
        onClose={() => setShowAssignments(false)}
        title="Assignments"
      >
        <ScrollView className="flex-1">
          <View className="gap-2 p-4">
            {memberShifts.isLoading ? (
              <Spinner />
            ) : (memberShifts.data ?? []).length === 0 ? (
              <View className="items-center justify-center gap-2 rounded-md bg-muted px-4 py-10">
                <CalendarDays size={24} className="text-muted-foreground" />
                <Text className="text-sm text-muted-foreground">
                  {detailMember?.firstName} has no assignments yet.
                </Text>
              </View>
            ) : (
              [...(memberShifts.data ?? [])]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((shift) => (
                  <Pressable
                    key={shift.id}
                    onPress={() => setSelectedShift(shift)}
                    className="flex-row items-center gap-3 rounded-md bg-muted px-3 py-3 active:opacity-80"
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">
                        {formatLongDate(shift.date)}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {shift.slot?.label ?? 'Service'}
                        {shift.slot
                          ? ` · ${shift.slot.startTime} – ${shift.slot.endTime}`
                          : ''}
                      </Text>
                    </View>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </Pressable>
                ))
            )}
          </View>
        </ScrollView>
      </SlidePage>

      <SlidePage
        visible={selectedShift !== null}
        onClose={() => setSelectedShift(null)}
        title="Assignment"
      >
        {selectedShift ? (
          <ScrollView className="flex-1">
            <View className="gap-4 p-4">
              <View className="flex-row items-center gap-3">
                <Avatar
                  firstName={
                    selectedShift.member?.firstName ?? detailMember?.firstName ?? ''
                  }
                  lastName={
                    selectedShift.member?.lastName ?? detailMember?.lastName ?? ''
                  }
                  size="lg"
                  src={selectedShift.member?.avatarUrl ?? detailMember?.avatarUrl}
                />
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    {selectedShift.member?.firstName ?? detailMember?.firstName}{' '}
                    {selectedShift.member?.lastName ?? detailMember?.lastName}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {selectedShift.member?.email ?? detailMember?.email ?? 'Member'}
                  </Text>
                </View>
              </View>

              <View className="gap-1 rounded-md bg-muted p-4">
                <Text className="text-sm font-medium text-foreground">
                  {formatLongDate(selectedShift.date)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {selectedShift.slot?.label ?? 'Service'}
                  {selectedShift.slot
                    ? ` · ${selectedShift.slot.startTime} – ${selectedShift.slot.endTime}`
                    : ''}
                </Text>
              </View>

              <Button
                variant="destructive"
                onPress={() => confirmDeleteShift(selectedShift.id)}
              >
                <Trash2 size={16} className="text-destructive-foreground" />
                Remove assignment
              </Button>
            </View>
          </ScrollView>
        ) : null}
      </SlidePage>
      </>
      }
      >
        {null}
      </Modal>
    </Screen>
  );
}
