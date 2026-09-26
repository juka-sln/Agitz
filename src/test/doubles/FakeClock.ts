import type { Clock } from '@/application/ports/Clock';
import type { Timestamp } from '@/domain/value-objects/Timestamp';

/** Starts on 2026-01-15 10:00:00 UTC+01:00 and moves one minute forward on every call. */
export class FakeClock implements Clock {
  private epochSeconds: number;

  private readonly timezoneOffsetMinutes: number;

  constructor(epochSeconds = 1_768_467_600, timezoneOffsetMinutes = 60) {
    this.epochSeconds = epochSeconds;
    this.timezoneOffsetMinutes = timezoneOffsetMinutes;
  }

  now(): Timestamp {
    const timestamp = {
      epochSeconds: this.epochSeconds,
      timezoneOffsetMinutes: this.timezoneOffsetMinutes,
    };
    this.epochSeconds += 60;
    return timestamp;
  }
}
