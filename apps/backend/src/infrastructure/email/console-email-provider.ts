import { EmailProvider, EmailMessage } from '../../application/ports/email-provider';

/**
 * Development email provider — prints to stdout. Switch `EMAIL_PROVIDER=resend`
 * (with RESEND_API_KEY) to send real emails.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log('[email] -----------------------------');
    console.log(`[email] to: ${message.to}`);
    console.log(`[email] subject: ${message.subject}`);
    if (message.text) console.log(`[email] body:\n${message.text}`);
    console.log('[email] -----------------------------');
  }
}
