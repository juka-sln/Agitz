import { parseRichText } from './parseRichText';

interface RichTextProps {
  readonly text: string;
  readonly codeClassName?: string;
}

const DEFAULT_CODE_CLASS = 'rounded bg-surface-raised px-1 py-px font-mono text-[0.9em] text-ink';

export function RichText({ text, codeClassName = DEFAULT_CODE_CLASS }: RichTextProps) {
  return (
    <>
      {parseRichText(text).map((segment, index) => {
        // Segments never move within a given text, so their position is a stable key.
        if (segment.kind === 'code') {
          return (
            <code key={index} className={codeClassName}>
              {segment.text}
            </code>
          );
        }
        if (segment.kind === 'strong') {
          return (
            <strong key={index} className="font-semibold">
              {segment.text}
            </strong>
          );
        }
        return <span key={index}>{segment.text}</span>;
      })}
    </>
  );
}
