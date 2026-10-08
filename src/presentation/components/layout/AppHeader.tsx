import { MISSION_IDS } from '@/application/learning/missions';

import { useTranslation } from '../../hooks/useTranslation';
import { useConflictResolution } from '../../hooks/useWorkspaceViews';
import { useDocsStore } from '../../stores/docsStore';
import { useEditorStore } from '../../stores/editorStore';
import { useGitHubStore } from '../../stores/githubStore';
import { useMissionsStore } from '../../stores/missionsStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { selectCompletedMissions, useProgressStore } from '../../stores/progressStore';
import { useShortcutsStore } from '../../stores/shortcutsStore';
import { ariaKeyShortcut } from '../shortcuts/globalShortcuts';

import { DOCS_PANEL_ID, EDITOR_PANEL_ID, GITHUB_PANEL_ID, MISSIONS_PANEL_ID } from './panelIds';

/** Two transit lines forking at a station: the branch in its simplest form. */
function LogoMark() {
  return (
    <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true">
      <path d="M3 16 H27" stroke="var(--line-0)" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M11 16 L17 6 H27"
        fill="none"
        stroke="var(--line-1)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="11"
        cy="16"
        r="3.5"
        fill="var(--station-fill)"
        stroke="var(--line-0)"
        strokeWidth="2.5"
      />
      <circle
        cx="25"
        cy="6"
        r="3.5"
        fill="var(--station-fill)"
        stroke="var(--line-1)"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  return theme === 'dark' ? (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The octocat silhouette would be a brand mark: a pull request icon says the same thing. */
function PullRequestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 7.5v9M18 16.5V9a3 3 0 0 0-3-3h-4m2-2.5L10.5 6 13 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 21V4M5 4h11l-2 4 2 4H5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="2.5"
        y="6"
        width="19"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.5 10h1M10.5 10h1M14.5 10h1M8 14h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const buttonClass =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink';

export function AppHeader() {
  const { t } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const toggleTheme = usePreferencesStore((state) => state.toggleTheme);
  const toggleLanguage = usePreferencesStore((state) => state.toggleLanguage);
  const isDocsOpen = useDocsStore((state) => state.isOpen);
  const toggleDocs = useDocsStore((state) => state.toggle);
  const isGitHubOpen = useGitHubStore((state) => state.isOpen);
  const toggleGitHub = useGitHubStore((state) => state.toggle);
  const isEditorOpen = useEditorStore((state) => state.isOpen);
  const toggleEditor = useEditorStore((state) => state.toggle);
  const conflictCount = useConflictResolution()?.files.length ?? 0;
  const openShortcuts = useShortcutsStore((state) => state.open);
  const isMissionsOpen = useMissionsStore((state) => state.isOpen);
  const toggleMissions = useMissionsStore((state) => state.toggle);
  const missionsDone = useProgressStore((state) => selectCompletedMissions(state).length);

  return (
    <header className="border-rule bg-surface flex h-12 items-center justify-between border-b px-3 sm:px-4">
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <h1 className="text-ink text-lg font-bold tracking-tight max-sm:sr-only">Agitz</h1>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          className={`${buttonClass} gap-1.5`}
          onClick={toggleMissions}
          aria-keyshortcuts={ariaKeyShortcut('toggleMissions')}
          aria-expanded={isMissionsOpen}
          aria-controls={isMissionsOpen ? MISSIONS_PANEL_ID : undefined}
        >
          <FlagIcon />
          <span className="sr-only sm:not-sr-only">{t('header.missions')}</span>
          <span className="bg-surface-raised text-ink rounded-full px-1.5 text-xs font-bold">
            <span aria-hidden="true">
              {missionsDone}/{MISSION_IDS.length}
            </span>
            <span className="sr-only">
              {t('header.missionsProgress', { done: missionsDone, total: MISSION_IDS.length })}
            </span>
          </span>
        </button>
        <button
          type="button"
          className={`${buttonClass} gap-1.5`}
          onClick={toggleEditor}
          aria-keyshortcuts={ariaKeyShortcut('toggleEditor')}
          aria-expanded={isEditorOpen}
          aria-controls={isEditorOpen ? EDITOR_PANEL_ID : undefined}
        >
          <PencilIcon />
          <span className="sr-only sm:not-sr-only">{t('header.editor')}</span>
          {conflictCount > 0 && (
            <span className="bg-status-deleted text-canvas rounded-full px-1.5 text-xs font-bold">
              <span aria-hidden="true">{conflictCount}</span>
              <span className="sr-only">{t('header.conflicts', { count: conflictCount })}</span>
            </span>
          )}
        </button>
        <button
          type="button"
          className={`${buttonClass} gap-1.5`}
          onClick={toggleGitHub}
          aria-keyshortcuts={ariaKeyShortcut('toggleGitHub')}
          aria-expanded={isGitHubOpen}
          aria-controls={isGitHubOpen ? GITHUB_PANEL_ID : undefined}
        >
          <PullRequestIcon />
          <span className="sr-only sm:not-sr-only">{t('header.github')}</span>
        </button>
        <button
          type="button"
          className={`${buttonClass} gap-1.5`}
          onClick={toggleDocs}
          aria-keyshortcuts={ariaKeyShortcut('toggleDocs')}
          aria-expanded={isDocsOpen}
          aria-controls={isDocsOpen ? DOCS_PANEL_ID : undefined}
        >
          <BookIcon />
          <span className="sr-only sm:not-sr-only">{t('header.docs')}</span>
        </button>
        {/* Touch screens have no keyboard to use the shortcuts with. */}
        <button
          type="button"
          className={`${buttonClass} max-sm:hidden`}
          onClick={openShortcuts}
          aria-keyshortcuts="?"
          title={t('header.shortcuts')}
        >
          <KeyboardIcon />
          <span className="sr-only">{t('header.shortcuts')}</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={toggleLanguage}
          title={t('header.languageSwitch')}
        >
          <span aria-hidden="true">{t('header.languageShort')}</span>
          <span className="sr-only">{t('header.languageSwitch')}</span>
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={toggleTheme}
          title={theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')}
        >
          <ThemeIcon theme={theme} />
          <span className="sr-only">
            {theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')}
          </span>
        </button>
      </div>
    </header>
  );
}
