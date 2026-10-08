import { useEffect, useRef, type KeyboardEvent } from 'react';

import { findProject, projectFullName } from '@/domain/entities/GitHub';

import { useGitHub } from '../../hooks/useGitHub';
import { useTranslation } from '../../hooks/useTranslation';
import { useDocsStore } from '../../stores/docsStore';
import { useGitHubStore } from '../../stores/githubStore';
import { GITHUB_PANEL_ID } from '../layout/panelIds';
import { Avatar } from '../team/Avatar';

import { RepositoryList } from './RepositoryList';
import { RepositoryPage } from './RepositoryPage';
import { useAvatarToken } from './useAvatarToken';

const toolbarButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink';

/**
 * The virtual github.com, in a slide-over like the documentation: every action is made as
 * the active teammate, and pushes from the terminal show up here at once.
 */
export function GitHubPanel() {
  const { t } = useTranslation();
  const { hosting, actor } = useGitHub();
  const avatarToken = useAvatarToken();
  const isOpen = useGitHubStore((state) => state.isOpen);
  const repository = useGitHubStore((state) => state.repository);
  const view = useGitHubStore((state) => state.view);
  const open = useGitHubStore((state) => state.open);
  const close = useGitHubStore((state) => state.close);
  const openDocs = useDocsStore((state) => state.open);
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
  }, [isOpen, repository, view]);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  const project = repository === null ? undefined : findProject(hosting.github, repository);

  return (
    // Escape is handled for the whole panel, whichever control has focus inside it.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <aside
      id={GITHUB_PANEL_ID}
      aria-label="GitHub"
      onKeyDown={handleKeyDown}
      className="docs-panel-enter border-rule bg-surface text-ink absolute inset-y-0 right-0 z-20 flex w-full max-w-2xl flex-col border-l text-sm leading-relaxed shadow-2xl"
    >
      <div className="border-rule flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {project !== undefined && (
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => {
              open(null);
            }}
          >
            <span aria-hidden="true">←</span> {t('github.allRepositories')}
          </button>
        )}
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => {
            openDocs('github-collaboration');
          }}
        >
          {t('github.guide')}
        </button>
        <span className="flex-1" />
        <span className="text-ink-muted flex items-center gap-1.5 text-xs">
          <Avatar name={actor.identity.name} colorToken={avatarToken(actor.id)} />
          {t('github.signedInAs', { login: actor.id })}
        </span>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={close}
          title={t('github.close')}
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
          <span className="sr-only">{t('github.close')}</span>
        </button>
      </div>
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-8">
        {project === undefined ? (
          <RepositoryList headingRef={headingRef} />
        ) : (
          <RepositoryPage
            key={project.url}
            project={project}
            title={projectFullName(project)}
            headingRef={headingRef}
          />
        )}
      </div>
    </aside>
  );
}
