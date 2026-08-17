import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),

  authProvider: (process.env.AUTH_PROVIDER ?? 'dev') as 'dev' | 'supabase',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
  supabaseJwksUrl: process.env.SUPABASE_JWKS_URL ?? '',
  devJwtSecret: process.env.DEV_JWT_SECRET ?? 'dev-secret-change-me',

  emailProvider: (process.env.EMAIL_PROVIDER ?? 'console') as 'console' | 'resend',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'Church Scheduler <onboarding@resend.dev>',

  cronSecret: process.env.CRON_SECRET ?? 'cron-secret-change-me',
  remindCron: process.env.REMIND_CRON ?? '0 8 * * *',
};
