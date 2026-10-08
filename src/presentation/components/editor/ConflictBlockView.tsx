import type { ConflictBlock, ConflictChoice } from '@/domain/services/conflictMarkers';

import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../github/ui';

function MarkerLine({ text }: { readonly text: string }) {
  return <div className="text-ink-muted px-3 select-none">{text}</div>;
}

function Side({
  title,
  label,
  lines,
  tone,
}: {
  readonly title: string;
  readonly label: string;
  readonly lines: readonly string[];
  readonly tone: 'ours' | 'theirs' | 'base';
}) {
  const { t } = useTranslation();
  const toneClass = {
    ours: 'border-(--line-0) bg-(--line-0)/10',
    theirs: 'border-(--line-3) bg-(--line-3)/10',
    base: 'border-rule bg-surface-raised',
  }[tone];

  return (
    <div className={`border-l-4 ${toneClass}`}>
      <p className="text-ink px-3 pt-1 font-sans text-xs font-semibold">
        {title} <span className="text-ink-muted font-mono font-normal">{label}</span>
      </p>
      {lines.length === 0 ? (
        <div className="text-ink-muted px-3 pb-1 font-sans text-xs italic">
          {t('editor.conflict.empty')}
        </div>
      ) : (
        <div className="px-3 pb-1">
          {lines.map((line, index) => (
            // A side is never reordered: the position of a line is its identity.
            <div key={index}>{line === '' ? ' ' : line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/** One conflict with the markers Git wrote, both versions and a button per way to settle it. */
export function ConflictBlockView({
  block,
  index,
  count,
  onResolve,
}: {
  readonly block: ConflictBlock;
  readonly index: number;
  readonly count: number;
  readonly onResolve: (choice: ConflictChoice) => void;
}) {
  const { t } = useTranslation();
  const headingId = `conflict-${String(index)}`;

  return (
    <section
      aria-labelledby={headingId}
      className="border-status-deleted my-2 overflow-hidden rounded-md border"
    >
      <div className="border-rule bg-surface-raised flex flex-wrap items-center gap-1.5 border-b px-3 py-1.5 font-sans">
        <h3 id={headingId} className="text-ink mr-auto text-xs font-bold">
          {t('editor.conflict.heading', { index: index + 1, count })}
        </h3>
        <Button
          onClick={() => {
            onResolve('ours');
          }}
        >
          {t('editor.accept.ours')}
        </Button>
        <Button
          onClick={() => {
            onResolve('theirs');
          }}
        >
          {t('editor.accept.theirs')}
        </Button>
        <Button
          onClick={() => {
            onResolve('both');
          }}
        >
          {t('editor.accept.both')}
        </Button>
      </div>
      <div className="py-1 font-mono text-xs leading-5 break-all whitespace-pre-wrap">
        <MarkerLine text={`<<<<<<< ${block.oursLabel}`} />
        <Side
          title={t('editor.conflict.ours')}
          label={block.oursLabel}
          lines={block.ours}
          tone="ours"
        />
        {block.base !== null && (
          <>
            <MarkerLine text="|||||||" />
            <Side title={t('editor.conflict.base')} label="" lines={block.base} tone="base" />
          </>
        )}
        <MarkerLine text="=======" />
        <Side
          title={t('editor.conflict.theirs')}
          label={block.theirsLabel}
          lines={block.theirs}
          tone="theirs"
        />
        <MarkerLine text={`>>>>>>> ${block.theirsLabel}`} />
      </div>
    </section>
  );
}
