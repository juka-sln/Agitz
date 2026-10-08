import { MISSION_IDS, type MissionId } from '@/application/learning/missions';

const LINE_COLOR_COUNT = 6;

/** Each badge takes the color of a transit line, in the order of the course. */
function badgeToken(mission: MissionId): string {
  return `line-${MISSION_IDS.indexOf(mission) % LINE_COLOR_COUNT}`;
}

/** A station roundel: filled with its line color once earned, dashed while locked. */
export function BadgeMedal({
  mission,
  earned,
  size = 40,
}: {
  readonly mission: MissionId;
  readonly earned: boolean;
  readonly size?: number;
}) {
  const token = badgeToken(mission);
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold"
      style={{
        width: size,
        height: size,
        background: earned ? `var(--${token})` : 'transparent',
        color: earned ? `var(--${token}-ink)` : 'var(--ink-muted)',
        border: earned ? `3px solid var(--station-fill)` : '3px dashed var(--line-none)',
        boxShadow: earned ? `0 0 0 3px var(--${token})` : undefined,
      }}
    >
      {MISSION_IDS.indexOf(mission) + 1}
    </span>
  );
}
