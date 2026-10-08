import type { Timestamp } from '@/domain/value-objects/Timestamp';

export interface Clock {
  now(): Timestamp;
}
