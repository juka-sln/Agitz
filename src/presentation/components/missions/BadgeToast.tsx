import { MISSION_TEXTS } from '@/content/missions';

import { useTranslation } from '../../hooks/useTranslation';
import { useMissionsStore } from '../../stores/missionsStore';
import { useProgressStore } from '../../stores/progressStore';

import { BadgeMedal } from './BadgeMedal';

/**
 * Announces new badges politely, without taking focus or a time limit: it stays until
 * dismissed, and everything it says remains in the course panel afterwards.
 */
export function BadgeToast() {
  const { t, language } = useTranslation();
  const justEarned = useProgressStore((state) => state.justEarned);
  const dismiss = useProgressStore((state) => state.dismiss);
  const openCourse = useMissionsStore((state) => state.open);
  const [first] = justEarned;
  const badges = justEarned.map((mission) => MISSION_TEXTS[mission][language].badge);

  return (
    // The live region is always there, so screen readers notice when it fills.
    <div
      role="status"
      className="pointer-events-none fixed top-14 right-4 z-40 flex w-[min(22rem,calc(100%-2rem))] justify-end"
    >
      {first !== undefined && (
        <div className="toast-enter border-rule bg-surface text-ink pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-3 text-sm shadow-2xl">
          <BadgeMedal mission={first} earned size={36} />
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {badges.length === 1
                ? t('toast.badgeEarned', { badge: badges.join('') })
                : t('toast.badgesEarned', { count: badges.length, badges: badges.join(', ') })}
            </p>
            {justEarned.length === 1 && (
              <p className="text-ink-muted">
                {t('toast.missionDone', { mission: MISSION_TEXTS[first][language].title })}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                openCourse();
                dismiss();
              }}
              className="text-ink mt-1 text-xs font-semibold underline underline-offset-2"
            >
              {t('toast.openCourse')}
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('toast.dismiss')}
            title={t('toast.dismiss')}
            className="text-ink-muted hover:bg-surface-raised hover:text-ink rounded-md p-1"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
