import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { findDoc } from '@/content/docs';

import { useTranslation } from '../../hooks/useTranslation';
import { selectCurrentPage, useDocsStore } from '../../stores/docsStore';

import { CommandDocPage } from './CommandDocPage';
import { DocsIndex } from './DocsIndex';
import { GuideDocPage } from './GuideDocPage';

export const DOCS_PANEL_ID = 'docs-panel';

const toolbarButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink';

function ToolbarIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={toolbarButtonClass} onClick={onClick} title={label}>
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

/**
 * Slide-over panel on the right. It is not modal: the terminal stays usable while reading,
 * so focus moves into the panel when a page opens and goes back where it was on close.
 */
export function DocsPanel() {
  const { t } = useTranslation();
  const isOpen = useDocsStore((state) => state.isOpen);
  const pageId = useDocsStore(selectCurrentPage);
  const canGoBack = useDocsStore((state) => state.history.length > 1);
  const open = useDocsStore((state) => state.open);
  const back = useDocsStore((state) => state.back);
  const close = useDocsStore((state) => state.close);

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
  }, [isOpen, pageId]);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  const doc = pageId === null ? undefined : findDoc(pageId);

  return (
    // Escape is handled for the whole panel, whichever control has focus inside it.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <aside
      id={DOCS_PANEL_ID}
      aria-label={t('docs.title')}
      onKeyDown={handleKeyDown}
      className="docs-panel-enter border-rule bg-surface text-ink absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l text-sm leading-relaxed shadow-2xl"
    >
      <div className="border-rule flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {canGoBack && (
          <ToolbarButton label={t('docs.back')} onClick={back}>
            <ToolbarIcon path="M10 3 5 8l5 5" />
          </ToolbarButton>
        )}
        {pageId !== null && (
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => {
              open(null);
            }}
          >
            {t('docs.home')}
          </button>
        )}
        <span className="flex-1" />
        <ToolbarButton label={t('docs.close')} onClick={close}>
          <ToolbarIcon path="M4 4l8 8M12 4l-8 8" />
        </ToolbarButton>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-8">
        {doc === undefined ? (
          <DocsIndex headingRef={headingRef} onOpen={open} />
        ) : doc.kind === 'command' ? (
          <CommandDocPage doc={doc} headingRef={headingRef} onOpen={open} />
        ) : (
          <GuideDocPage doc={doc} headingRef={headingRef} onOpen={open} />
        )}
      </div>
    </aside>
  );
}
