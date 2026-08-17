import { env } from './config/env';
import { AuthProvider } from './application/ports/auth-provider';
import { EmailProvider } from './application/ports/email-provider';

import { LoginUseCase } from './application/use-cases/auth/login.usecase';
import { SignupUseCase } from './application/use-cases/auth/signup.usecase';
import { SendMagicLinkUseCase } from './application/use-cases/auth/send-magic-link.usecase';
import { SendPasswordResetUseCase } from './application/use-cases/auth/send-password-reset.usecase';
import { GetProfileUseCase } from './application/use-cases/auth/profile.usecase';
import { TransferAdminUseCase } from './application/use-cases/auth/transfer-admin.usecase';
import { ChangeMyRoleUseCase } from './application/use-cases/auth/change-my-role.usecase';
import { DeleteMyAccountUseCase } from './application/use-cases/auth/delete-my-account.usecase';
import { GetTeamUseCase } from './application/use-cases/team/get-team.usecase';
import { ListMembersUseCase } from './application/use-cases/members/list-members.usecase';
import { CreateMemberUseCase } from './application/use-cases/members/create-member.usecase';
import { UpdateMemberUseCase } from './application/use-cases/members/update-member.usecase';
import { DeleteMemberUseCase } from './application/use-cases/members/delete-member.usecase';
import { GetSlotsUseCase } from './application/use-cases/slots/get-slots.usecase';
import { CreateSlotUseCase } from './application/use-cases/slots/create-slot.usecase';
import { UpdateSlotUseCase } from './application/use-cases/slots/update-slot.usecase';
import { DeleteSlotUseCase } from './application/use-cases/slots/delete-slot.usecase';
import { ListShiftsUseCase } from './application/use-cases/shifts/list-shifts.usecase';
import { ListMemberShiftsUseCase } from './application/use-cases/shifts/list-member-shifts.usecase';
import { CreateShiftUseCase } from './application/use-cases/shifts/create-shift.usecase';
import { CreateShiftsUseCase } from './application/use-cases/shifts/create-shifts.usecase';
import { UpdateShiftUseCase } from './application/use-cases/shifts/update-shift.usecase';
import { DeleteShiftUseCase } from './application/use-cases/shifts/delete-shift.usecase';
import { GetMyShiftsUseCase } from './application/use-cases/shifts/my-shifts.usecase';
import { SuggestShiftUseCase } from './application/use-cases/shifts/suggest-shift.usecase';
import { ListNotificationsUseCase } from './application/use-cases/notifications/list-notifications.usecase';
import { MarkNotificationReadUseCase } from './application/use-cases/notifications/mark-notification-read.usecase';
import { MarkAllNotificationsReadUseCase } from './application/use-cases/notifications/mark-all-notifications-read.usecase';
import { DeleteNotificationUseCase } from './application/use-cases/notifications/delete-notification.usecase';
import { DeleteNotificationsUseCase } from './application/use-cases/notifications/delete-notifications.usecase';
import { GetUserFeaturesUseCase } from './application/use-cases/features/get-user-features.usecase';
import { RunShiftRemindersUseCase } from './application/use-cases/reminders/run-shift-reminders.usecase';
import { ShiftNotifier } from './application/services/shift-notifier';

import { PrismaUserRepository } from './infrastructure/prisma/repositories/prisma-user-repository';
import { PrismaTeamRepository } from './infrastructure/prisma/repositories/prisma-team-repository';
import { PrismaMemberRepository } from './infrastructure/prisma/repositories/prisma-member-repository';
import { PrismaSlotRepository } from './infrastructure/prisma/repositories/prisma-slot-repository';
import { PrismaShiftRepository } from './infrastructure/prisma/repositories/prisma-shift-repository';
import { PrismaFeatureRepository } from './infrastructure/prisma/repositories/prisma-feature-repository';
import { PrismaNotificationRepository } from './infrastructure/prisma/repositories/prisma-notification-repository';
import { PrismaShiftReminderRepository } from './infrastructure/prisma/repositories/prisma-shift-reminder-repository';
import { DevAuthProvider } from './infrastructure/auth/dev-auth-provider';
import { SupabaseAuthProvider } from './infrastructure/auth/supabase-auth-provider';
import { ConsoleEmailProvider } from './infrastructure/email/console-email-provider';
import { ResendEmailProvider } from './infrastructure/email/resend-email-provider';

const users = new PrismaUserRepository();
const teams = new PrismaTeamRepository();
const members = new PrismaMemberRepository();
const slots = new PrismaSlotRepository();
const shifts = new PrismaShiftRepository();
const features = new PrismaFeatureRepository();
const notifications = new PrismaNotificationRepository();
const shiftReminders = new PrismaShiftReminderRepository();

export const authProvider: AuthProvider =
  env.authProvider === 'supabase'
    ? new SupabaseAuthProvider(
        env.supabaseUrl,
        env.supabaseServiceRoleKey,
        env.supabaseJwtSecret,
        env.supabaseJwksUrl,
      )
    : new DevAuthProvider(users, env.devJwtSecret);

export const userRepository = users;

export const emailProvider: EmailProvider =
  env.emailProvider === 'resend'
    ? new ResendEmailProvider(env.resendApiKey, env.emailFrom)
    : new ConsoleEmailProvider();

const shiftNotifier = new ShiftNotifier(emailProvider, notifications);

export const useCases = {
  login: new LoginUseCase(authProvider, users),
  signup: new SignupUseCase(authProvider, users, teams, members, slots),
  sendMagicLink: new SendMagicLinkUseCase(authProvider),
  sendPasswordReset: new SendPasswordResetUseCase(authProvider),
  profile: new GetProfileUseCase(users, teams, members, slots, shifts),
  transferAdmin: new TransferAdminUseCase(users, members, teams, notifications),
  changeMyRole: new ChangeMyRoleUseCase(users, members),
  deleteMyAccount: new DeleteMyAccountUseCase(users, members),
  getTeam: new GetTeamUseCase(users, teams, members, slots),
  listMembers: new ListMembersUseCase(users, members, shifts),
  createMember: new CreateMemberUseCase(users, members),
  updateMember: new UpdateMemberUseCase(users, members, teams, notifications),
  deleteMember: new DeleteMemberUseCase(members, shifts, notifications),
  getSlots: new GetSlotsUseCase(users, slots),
  createSlot: new CreateSlotUseCase(users, slots),
  updateSlot: new UpdateSlotUseCase(slots),
  deleteSlot: new DeleteSlotUseCase(slots, shifts),
  createShift: new CreateShiftUseCase(users, members, slots, shifts, shiftNotifier),
  createShifts: new CreateShiftsUseCase(users, members, slots, shifts, shiftNotifier),
  updateShift: new UpdateShiftUseCase(users, members, slots, shifts, shiftNotifier),
  deleteShift: new DeleteShiftUseCase(users, members, slots, shifts, shiftNotifier),
  listShifts: new ListShiftsUseCase(users, members, slots, shifts),
  listMemberShifts: new ListMemberShiftsUseCase(users, members, slots, shifts),
  myShifts: new GetMyShiftsUseCase(users, slots, shifts),
  suggestShift: new SuggestShiftUseCase(users, members, slots, shifts),
  listNotifications: new ListNotificationsUseCase(notifications),
  markNotificationRead: new MarkNotificationReadUseCase(notifications),
  markAllNotificationsRead: new MarkAllNotificationsReadUseCase(notifications),
  deleteNotification: new DeleteNotificationUseCase(notifications),
  deleteNotifications: new DeleteNotificationsUseCase(notifications),
  getFeatures: new GetUserFeaturesUseCase(features),
  runReminders: new RunShiftRemindersUseCase(shifts, members, slots, shiftReminders, emailProvider),
};

export type UseCases = typeof useCases;
