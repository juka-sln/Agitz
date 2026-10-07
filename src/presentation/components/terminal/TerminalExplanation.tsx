import type { Explanation } from '@/application/git-commands/GitCommand';

import { useExplanation } from '../../hooks/useExplanation';
import { useTranslation } from '../../hooks/useTranslation';
import { docTitle } from '../docs/docTitle';
import { RichText } from '../docs/RichText';

interface TerminalExplanationProps {
  readonly explanation: Explanation;
  readonly docId: string | null;
  readonly onLearnMore: (docId: string) => void;
}

/** What the last command did, in plain words, under its output. */
export function TerminalExplanation({ explanation, docId, onLearnMore }: TerminalExplanationProps) {
  const { t, language } = useTranslation();
  const text = useExplanation(explanation);
  if (text === '') {
    return null;
  }

  return (
    <p className="border-terminal-accent text-terminal-muted mt-1 mb-2 max-w-3xl border-l-2 pl-3 font-sans text-[13px] leading-relaxed">
      <RichText text={text} codeClassName="whitespace-nowrap font-mono text-terminal-ink" />
      {docId !== null && (
        <>
          {' '}
          <button
            type="button"
            onClick={() => {
              onLearnMore(docId);
            }}
            className="text-terminal-accent font-semibold whitespace-nowrap underline-offset-2 hover:underline"
          >
            <span aria-hidden="true">ⓘ </span>
            {t('terminal.learnMore')}{' '}
            <span className="sr-only">
              {t('terminal.learnMoreTarget', { command: docTitle(docId, language) })}
            </span>
          </button>
        </>
      )}
    </p>
  );
}
