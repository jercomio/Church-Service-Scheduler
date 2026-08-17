import { MemberEntity } from '../entities/member';
import { ShiftEntity } from '../entities/shift';
import { isSameDay } from './date-utils';

export interface RotationCandidate {
  member: MemberEntity;
  score: number;
  totalShifts: number;
}

/**
 * PLAN-06 — Fair rotation: suggest the next assignment to the least solicited
 * active member. The score is the number of shifts in the lookback window
 * (default 30 days); ties are broken by total lifetime shifts, then creation
 * order.
 */
export function suggestNextMember(
  activeMembers: readonly MemberEntity[],
  shiftsInWindow: readonly ShiftEntity[],
  allShifts: readonly ShiftEntity[],
  date: Date,
  options: { lookbackDays?: number } = {},
): RotationCandidate | null {
  const lookbackDays = options.lookbackDays ?? 30;

  const eligible = activeMembers.filter((member) => member.isActive);

  const scored = eligible
    .map((member) => {
      const inWindow = shiftsInWindow.filter(
        (shift) =>
          shift.memberId === member.id &&
          Math.abs(shift.date.getTime() - date.getTime()) <= lookbackDays * 86_400_000,
      ).length;
      const onDate = shiftsInWindow.filter(
        (shift) => shift.memberId === member.id && isSameDay(shift.date, date),
      ).length;
      const totalShifts = allShifts.filter((shift) => shift.memberId === member.id).length;
      return { member, score: inWindow, onDate, totalShifts };
    })
    .filter((candidate) => candidate.onDate === 0);

  if (scored.length === 0) return null;

  scored.sort(
    (a, b) =>
      a.score - b.score || a.totalShifts - b.totalShifts || a.member.id.localeCompare(b.member.id),
  );

  const best = scored[0];
  if (!best) return null;

  return { member: best.member, score: best.score, totalShifts: best.totalShifts };
}
