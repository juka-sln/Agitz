import type { RefObject } from 'react';

import type { GuideBlock, GuideDoc } from '@/content/model';

import { useTranslation } from '../../hooks/useTranslation';

import { DocSection, PageHeading, RelatedDocs } from './DocPageParts';
import { RichText } from './RichText';

function GuideBlockView({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className="list-disc space-y-1.5 pl-5">
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'code':
      return (
        <pre className="bg-terminal text-terminal-ink overflow-x-auto rounded-md px-3 py-2 font-mono text-[13px]">
          <code>{block.code}</code>
        </pre>
      );
  }
}

interface GuideDocPageProps {
  readonly doc: GuideDoc;
  readonly headingRef: RefObject<HTMLHeadingElement>;
  readonly onOpen: (id: string) => void;
}

export function GuideDocPage({ doc, headingRef, onOpen }: GuideDocPageProps) {
  const { t, language } = useTranslation();
  const text = doc.text[language];

  return (
    <article>
      <p className="text-ink-muted text-xs font-semibold">{t('docs.guide')}</p>
      <PageHeading headingRef={headingRef} className="mt-1">
        {text.title}
      </PageHeading>
      <p className="text-ink mt-2 text-base">
        <RichText text={text.summary} />
      </p>

      {text.sections.map((section) => (
        <DocSection key={section.heading} title={section.heading}>
          <div className="space-y-3">
            {section.blocks.map((block, index) => (
              // Blocks are static content, so their position is a stable key.
              <GuideBlockView key={index} block={block} />
            ))}
          </div>
        </DocSection>
      ))}

      <RelatedDocs related={doc.related} onOpen={onOpen} />
    </article>
  );
}
