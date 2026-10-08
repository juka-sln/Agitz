import type { RefObject } from 'react';

import type { CommandDoc } from '@/content/model';

import { useTranslation } from '../../hooks/useTranslation';

import { DocSection, PageHeading, RelatedDocs } from './DocPageParts';
import { RichText } from './RichText';

interface CommandDocPageProps {
  readonly doc: CommandDoc;
  readonly headingRef: RefObject<HTMLHeadingElement>;
  readonly onOpen: (id: string) => void;
}

export function CommandDocPage({ doc, headingRef, onOpen }: CommandDocPageProps) {
  const { t, language } = useTranslation();
  const text = doc.text[language];

  return (
    <article>
      <p className="text-ink-muted text-xs font-semibold">{t(`docs.category.${doc.category}`)}</p>
      <PageHeading headingRef={headingRef} className="mt-1 font-mono">
        {doc.title}
      </PageHeading>
      <p className="text-ink mt-2 text-base">
        <RichText text={text.summary} />
      </p>

      <DocSection title={t('docs.section.description')}>
        <div className="space-y-2">
          {text.description.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      </DocSection>

      <DocSection title={t('docs.section.options')}>
        <dl className="space-y-3">
          {text.options.map((option) => (
            <div key={option.syntax}>
              <dt>
                <code className="text-ink font-mono text-[13px] font-semibold">
                  {option.syntax}
                </code>
              </dt>
              <dd className="text-ink-muted mt-0.5">
                <RichText text={option.text} />
              </dd>
            </div>
          ))}
        </dl>
      </DocSection>

      <DocSection title={t('docs.section.examples')}>
        <ul className="space-y-3">
          {text.examples.map((example) => (
            <li key={example.command}>
              <pre className="bg-terminal text-terminal-ink rounded-md px-3 py-2 font-mono text-[13px] break-all whitespace-pre-wrap">
                <span className="text-terminal-muted select-none">$ </span>
                <code>{example.command}</code>
              </pre>
              <p className="text-ink-muted mt-1">
                <RichText text={example.text} />
              </p>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title={t('docs.section.underTheHood')}>
        <div className="space-y-2">
          {text.underTheHood.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      </DocSection>

      <DocSection title={t('docs.section.pitfalls')}>
        <ul className="marker:text-status-modified list-disc space-y-1.5 pl-5">
          {text.pitfalls.map((pitfall) => (
            <li key={pitfall}>
              <RichText text={pitfall} />
            </li>
          ))}
        </ul>
      </DocSection>

      <RelatedDocs related={doc.related} onOpen={onOpen} />
    </article>
  );
}
