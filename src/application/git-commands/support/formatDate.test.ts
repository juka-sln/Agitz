import { formatGitDate } from './formatDate';

describe('formatGitDate', () => {
  it('formats the date in the author timezone like git log', () => {
    // 2026-09-26T10:04:05Z
    expect(formatGitDate({ epochSeconds: 1_790_417_045, timezoneOffsetMinutes: 120 })).toBe(
      'Sat Sep 26 12:04:05 2026 +0200',
    );
  });

  it('handles negative offsets and single-digit days', () => {
    // 2026-03-02T01:00:00Z
    expect(formatGitDate({ epochSeconds: 1_772_413_200, timezoneOffsetMinutes: -330 })).toBe(
      'Sun Mar 1 19:30:00 2026 -0530',
    );
  });
});
