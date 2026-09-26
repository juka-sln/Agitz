import { formatTimezoneOffset, type Timestamp } from '@/domain/value-objects/Timestamp';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const twoDigits = (value: number) => String(value).padStart(2, '0');

/** Git's default date format, e.g. `Sat Sep 26 12:04:05 2026 +0200`, in the author's timezone. */
export function formatGitDate(timestamp: Timestamp): string {
  const local = new Date((timestamp.epochSeconds + timestamp.timezoneOffsetMinutes * 60) * 1000);
  const time = [local.getUTCHours(), local.getUTCMinutes(), local.getUTCSeconds()]
    .map(twoDigits)
    .join(':');

  return [
    DAYS[local.getUTCDay()] ?? '',
    MONTHS[local.getUTCMonth()] ?? '',
    local.getUTCDate(),
    time,
    local.getUTCFullYear(),
    formatTimezoneOffset(timestamp.timezoneOffsetMinutes),
  ].join(' ');
}
