import { useEffect, useRef, type KeyboardEvent } from 'react';

import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';
import { useConflictResolution } from '../../hooks/useWorkspaceViews';
import { useDocsStore } from '../../stores/docsStore';
import { useEditorStore } from '../../stores/editorStore';
import { EDITOR_PANEL_ID } from '../layout/panelIds';

import { ConflictOverview } from './ConflictOverview';
import { FileEditor } from './FileEditor';
import { ScenarioCard } from './ScenarioCard';

const toolbarButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink';

/**
 * The file editor and conflict resolver, in the same slide-over as the documentation:
 * it edits the files of the active workstation, and the terminal stays usable beside it.
 */
export function EditorPanel() {
  const { t } = useTranslation();
  const isOpen = useEditorStore((state) => state.isOpen);
  const path = useEditorStore((state) => state.path);
  const open = useEditorStore((state) => state.open);
  const close = useEditorStore((state) => state.close);
  const openDocs = useDocsStore((state) => state.open);
  const userId = useSession((state) => state.activeUser.id);
  const resolution = useConflictResolution();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const returnFocusTo = document.activeElement;
    return () => {
      if (returnFocusTo instanceof HTMLElement && returnFocusTo.isConnected) {
        returnFocusTo.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      headingRef.current?.focus();
    }
  }, [isOpen, path, userId]);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  return (
    // Escape is handled for the whole panel, whichever control has focus inside it.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <aside
      id={EDITOR_PANEL_ID}
      aria-label={t('editor.title')}
      onKeyDown={handleKeyDown}
      className="docs-panel-enter border-rule bg-surface text-ink absolute inset-y-0 right-0 z-20 flex w-full max-w-2xl flex-col border-l text-sm leading-relaxed shadow-2xl"
    >
      <div className="border-rule flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {path !== null && (
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => {
              open(null);
            }}
          >
            <span aria-hidden="true">←</span> {t('editor.overview')}
          </button>
        )}
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => {
            openDocs('resolving-conflicts');
          }}
        >
          {t('github.guide')}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={close}
          title={t('editor.close')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">{t('editor.close')}</span>
        </button>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-8">
        {path !== null ? (
          <FileEditor key={`${userId}:${path}`} path={path} headingRef={headingRef} onOpen={open} />
        ) : resolution !== null ? (
          <ConflictOverview resolution={resolution} headingRef={headingRef} onOpen={open} />
        ) : (
          <div className="flex flex-col gap-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-ink text-base font-bold">
              {t('editor.title')}
            </h2>
            <p className="text-ink-muted">{t('editor.intro')}</p>
            <ScenarioCard onConflict={open} />
          </div>
        )}
      </div>
    </aside>
  );
}
