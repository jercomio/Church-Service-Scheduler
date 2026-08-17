import { describe, expect, it } from 'vitest';
import { MemberEntity } from '../../src/domain/entities/member';
import { ShiftEntity } from '../../src/domain/entities/shift';
import { suggestNextMember } from '../../src/domain/services/rotation.service';
import { addDaysUtc, fromDateOnly } from '../../src/domain/services/date-utils';

function makeMember(id: string): MemberEntity {
  return {
    id,
    teamId: 'team-1',
    userId: null,
    firstName: 'F',
    lastName: id.toUpperCase(),
    email: `${id}@example.com`,
    isActive: true,
    role: 'MEMBER',
    createdAt: new Date(),
  };
}

function makeShift(memberId: string, offsetDays: number): ShiftEntity {
  return {
    id: `${memberId}-${offsetDays}`,
    slotId: 'slot-1',
    memberId,
    date: addDaysUtc(DATE, offsetDays),
    createdAt: new Date(),
  };
}

const DATE = fromDateOnly('2026-09-06'); // Sunday

describe('rotation.service (PLAN-06)', () => {
  const members = [makeMember('m1'), makeMember('m2'), makeMember('m3')];

  it('suggests the member with the fewest shifts in the lookback window', () => {
    // m1 has 5 shifts in window, m2 has 1, m3 has 0
    const inWindow = [
      makeShift('m1', -20),
      makeShift('m1', -15),
      makeShift('m1', -10),
      makeShift('m1', -5),
      makeShift('m1', -2),
      makeShift('m2', -7),
    ];
    const suggestion = suggestNextMember(members, inWindow, inWindow, DATE);
    expect(suggestion?.member.id).toBe('m3');
  });

  it('breaks ties by total lifetime shifts', () => {
    // m2 and m3 both have 0 in window; m3 has fewer lifetime shifts
    const inWindow = [makeShift('m1', -2), makeShift('m1', -8)];
    const allShifts = [...inWindow, makeShift('m2', -40), makeShift('m2', -38)];
    const suggestion = suggestNextMember(members, inWindow, allShifts, DATE);
    expect(suggestion?.member.id).toBe('m3');
  });

  it('never suggests a member already assigned on that day', () => {
    const inWindow = [
      makeShift('m3', 0),
      makeShift('m3', 0),
      makeShift('m3', 0),
      makeShift('m2', -3),
      makeShift('m2', -5),
    ];
    // m3 has many shifts but all on the target day → filtered out
    const suggestion = suggestNextMember(members, inWindow, inWindow, DATE);
    expect(suggestion?.member.id).toBe('m1');
  });

  it('excludes inactive members', () => {
    const inactive = { ...makeMember('m3'), isActive: false };
    const all = [makeMember('m1'), makeMember('m2'), inactive];
    const suggestion = suggestNextMember(all, [], [], DATE);
    expect(suggestion?.member.id).not.toBe('m3');
  });

  it('returns null when every active member is already booked that day', () => {
    const inWindow = [makeShift('m1', 0), makeShift('m2', 0), makeShift('m3', 0)];
    expect(suggestNextMember(members, inWindow, inWindow, DATE)).toBeNull();
  });
});
