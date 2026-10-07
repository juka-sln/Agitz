import type { ReactNode, RefObject } from 'react';

import { findDoc } from '@/content/docs';

import { useTranslation } from '../../hooks/useTranslation';

import { docTitle } from './docTitle';

interface PageHeadingProps {
  readonly headingRef: RefObject<HTMLHeadingElement>;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Receives focus whenever a page opens, so keyboard and screen reader users land on its title. */
export function PageHeading({ headingRef, children, className = '' }: PageHeadingProps) {
  return (
    <h2
      ref={headingRef}
      tabIndex={-1}
      className={`text-ink text-xl font-bold tracking-tight outline-none ${className}`}
    >
      {children}
    </h2>
  );
}

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-ink-muted mb-2 text-xs font-bold tracking-wider uppercase">{title}</h3>
      {children}
    </section>
  );
}

interface RelatedDocsProps {
  readonly related: readonly string[];
  readonly onOpen: (id: string) => void;
}

export function RelatedDocs({ related, onOpen }: RelatedDocsProps) {
  const { t, language } = useTranslation();
  return (
    <DocSection title={t('docs.related')}>
      <ul className="flex flex-wrap gap-2">
        {related.map((id) => {
          const isCommand = findDoc(id)?.kind === 'command';
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  onOpen(id);
                }}
                className={`border-rule text-ink hover:bg-surface-raised rounded-full border px-3 py-1 text-sm ${isCommand ? 'font-mono' : ''}`}
              >
                {docTitle(id, language)}
              </button>
            </li>
          );
        })}
      </ul>
    </DocSection>
  );
}
