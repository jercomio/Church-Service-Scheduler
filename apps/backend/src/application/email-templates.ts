/** Creates the subject/body of an email based on a shift change. */
export interface ShiftEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function buildShiftAssignedEmail(params: {
  memberName: string;
  slotLabel: string;
  dateLabel: string;
  timeLabel: string;
}): ShiftEmailTemplate {
  const { memberName, slotLabel, dateLabel, timeLabel } = params;
  const subject = `You're scheduled: ${slotLabel} on ${dateLabel}`;
  const text = [
    `Hi ${memberName},`,
    '',
    `You have been assigned to "${slotLabel}" on ${dateLabel} (${timeLabel}).`,
    '',
    'Thank you for serving!',
    '— Church Service Scheduler',
  ].join('\n');
  return { subject, html: emailHtml(subject, text), text };
}

export function buildShiftUpdatedEmail(params: {
  memberName: string;
  slotLabel: string;
  dateLabel: string;
  timeLabel: string;
}): ShiftEmailTemplate {
  const { memberName, slotLabel, dateLabel, timeLabel } = params;
  const subject = `Shift updated: ${slotLabel} on ${dateLabel}`;
  const text = [
    `Hi ${memberName},`,
    '',
    `Your assignment has been updated to "${slotLabel}" on ${dateLabel} (${timeLabel}).`,
    '',
    'Thank you for serving!',
    '— Church Service Scheduler',
  ].join('\n');
  return { subject, html: emailHtml(subject, text), text };
}

export function buildShiftCancelledEmail(params: {
  memberName: string;
  slotLabel: string;
  dateLabel: string;
}): ShiftEmailTemplate {
  const { memberName, slotLabel, dateLabel } = params;
  const subject = `Shift cancelled: ${slotLabel} on ${dateLabel}`;
  const text = [
    `Hi ${memberName},`,
    '',
    `Your assignment "${slotLabel}" on ${dateLabel} has been cancelled.`,
    '',
    '— Church Service Scheduler',
  ].join('\n');
  return { subject, html: emailHtml(subject, text), text };
}

export function buildReminderEmail(params: {
  memberName: string;
  slotLabel: string;
  dateLabel: string;
  timeLabel: string;
  daysBefore: number;
}): ShiftEmailTemplate {
  const { memberName, slotLabel, dateLabel, timeLabel, daysBefore } = params;
  const subject =
    daysBefore === 1
      ? `Reminder: serving tomorrow — ${slotLabel}`
      : `Reminder: serving ${slotLabel} on ${dateLabel}`;
  const text = [
    `Hi ${memberName},`,
    '',
    `Reminder (${daysBefore === 1 ? '1 day' : `${daysBefore} days`} before):`,
    `You are serving "${slotLabel}" on ${dateLabel} at ${timeLabel}.`,
    '',
    'Thank you for serving!',
    '— Church Service Scheduler',
  ].join('\n');
  return { subject, html: emailHtml(subject, text), text };
}

function emailHtml(subject: string, text: string): string {
  const lines = text
    .split('\n')
    .map((line) => `<p style="margin:0 0 8px;color:#333">${escapeHtml(line)}</p>`)
    .join('');
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#6d28d9">${escapeHtml(subject)}</h2>
  ${lines}
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
