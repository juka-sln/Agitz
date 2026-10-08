export interface Timestamp {
  readonly epochSeconds: number;
  /** Offset from UTC in minutes, positive east of Greenwich (e.g. +120 for UTC+02:00). */
  readonly timezoneOffsetMinutes: number;
}

export function formatTimezoneOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `${sign}${hours}${minutes}`;
}
