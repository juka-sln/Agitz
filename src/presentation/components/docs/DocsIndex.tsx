import { useState, type RefObject } from 'react';

import { COMMAND_CATEGORIES, COMMAND_DOCS, GUIDE_DOCS } from '@/content/docs';
import type { Doc } from '@/content/model';
import type { Language } from '@/shared/language';

import { useTranslation } from '../../hooks/useTranslation';

import { PageHeading } from './DocPageParts';
import { RichText } from './RichText';

function matches(doc: Doc, query: string, language: Language): boolean {
  if (query === '') {
    return true;
  }
  const text = doc.text[language];
  const title = doc.kind === 'command' ? doc.title : doc.text[language].title;
  return [doc.id, title, text.summary].some((value) => value.toLowerCase().includes(query));
}

interface DocLinkProps {
  readonly title: string;
  readonly summary: string;
  readonly monospace: boolean;
  readonly onClick: () => void;
}

function DocLink({ title, summary, monospace, onClick }: DocLinkProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-surface-raised w-full rounded-md px-2 py-1.5 text-left"
      >
        <span
          className={`text-ink block font-semibold ${monospace ? 'font-mono text-[13px]' : ''}`}
        >
          {title}
        </span>
        <span className="text-ink-muted block text-[13px]">
          <RichText text={summary} />
        </span>
      </button>
    </li>
  );
}

interface DocsIndexProps {
  readonly headingRef: RefObject<HTMLHeadingElement>;
  readonly onOpen: (id: string) => void;
}

export function DocsIndex({ headingRef, onOpen }: DocsIndexProps) {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const commands = COMMAND_DOCS.filter((doc) => matches(doc, normalizedQuery, language));
  const guides = GUIDE_DOCS.filter((doc) => matches(doc, normalizedQuery, language));

  return (
    <div>
      <PageHeading headingRef={headingRef}>{t('docs.title')}</PageHeading>
      <p className="text-ink-muted mt-2">{t('docs.intro')}</p>
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        aria-label={t('docs.search')}
        placeholder={t('docs.search')}
        className="border-rule bg-canvas text-ink placeholder:text-ink-muted mt-4 w-full rounded-md border px-3 py-1.5 text-sm"
      />

      {commands.length === 0 && guides.length === 0 && (
        <p className="text-ink-muted mt-6" role="status">
          {t('docs.noResults', { query: query.trim() })}
        </p>
      )}

      {commands.length > 0 && (
        <section className="mt-6">
          <h3 className="text-ink text-base font-bold">{t('docs.commands')}</h3>
          {COMMAND_CATEGORIES.map((category) => {
            const inCategory = commands.filter((doc) => doc.category === category);
            if (inCategory.length === 0) {
              return null;
            }
            return (
              <div key={category} className="mt-3">
                <h4 className="text-ink-muted px-2 text-xs font-bold tracking-wider uppercase">
                  {t(`docs.category.${category}`)}
                </h4>
                <ul className="mt-1">
                  {inCategory.map((doc) => (
                    <DocLink
                      key={doc.id}
                      title={doc.title}
                      summary={doc.text[language].summary}
                      monospace
                      onClick={() => {
                        onOpen(doc.id);
                      }}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {guides.length > 0 && (
        <section className="mt-6">
          <h3 className="text-ink text-base font-bold">{t('docs.guides')}</h3>
          <ul className="mt-1">
            {guides.map((doc) => (
              <DocLink
                key={doc.id}
                title={doc.text[language].title}
                summary={doc.text[language].summary}
                monospace={false}
                onClick={() => {
                  onOpen(doc.id);
                }}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
