import type { Clock } from '@/application/ports/Clock';
import type { Timestamp } from '@/domain/value-objects/Timestamp';

export class SystemClock implements Clock {
  now(): Timestamp {
    const date = new Date();
    return {
      epochSeconds: Math.floor(date.getTime() / 1000),
      timezoneOffsetMinutes: -date.getTimezoneOffset(),
    };
  }
}
