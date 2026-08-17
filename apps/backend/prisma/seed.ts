import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_SLOTS } from '@css/shared';

const prisma = new PrismaClient();

const FEATURES = [
  {
    key: 'auto-rotation',
    name: 'Auto rotation',
    description: 'Suggest the least-solicited member for the next shift',
    enabled: true,
  },
  {
    key: 'month-view',
    name: 'Month view',
    description: 'Monthly overview of the schedule',
    enabled: true,
  },
  {
    key: 'email-reminders',
    name: 'Email reminders',
    description: 'J-7 / J-1 email reminders',
    enabled: true,
  },
  {
    key: 'advanced-settings',
    name: 'Advanced settings',
    description: 'Experimental settings (prepared for future pricing tiers)',
    enabled: false,
    tier: 'pro',
  },
] as const;

async function main(): Promise<void> {
  console.log('[seed] seeding feature flags...');
  for (const feature of FEATURES) {
    await prisma.feature.upsert({
      where: { key: feature.key },
      update: { name: feature.name, description: feature.description, enabled: feature.enabled, tier: feature.tier },
      create: feature as never,
    });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('[seed] users already exist — skipping demo data.');
    return;
  }

  console.log('[seed] creating demo team + members...');
  const email = process.env.SEED_EMAIL ?? 'coordinator@example.com';
  const password = process.env.SEED_PASSWORD ?? 'password123';

  const user = await prisma.user.create({
    data: { email, role: 'COORDINATOR', passwordHash: bcrypt.hashSync(password, 10) },
  });

  const team = await prisma.team.create({ data: { name: 'Video Team' } });

  await prisma.member.create({
    data: { teamId: team.id, userId: user.id, firstName: 'Alex', lastName: 'Roure', email, isActive: true },
  });

  const memberNames: Array<{ firstName: string; lastName: string; email: string }> = [
    { firstName: 'Marie', lastName: 'Johnson', email: 'marie@example.com' },
    { firstName: 'Chris', lastName: 'Nolan', email: 'chris@example.com' },
    { firstName: 'Sam', lastName: 'Doe', email: 'sam@example.com' },
  ];
  for (const member of memberNames) {
    await prisma.member.create({ data: { teamId: team.id, ...member, isActive: true } });
  }

  for (const slot of DEFAULT_SLOTS) {
    await prisma.slot.create({ data: { teamId: team.id, ...slot } });
  }

  console.log(`[seed] demo account: ${email} / ${password}`);
  console.log('[seed] done.');
}

main()
  .catch((err) => {
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
