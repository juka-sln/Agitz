import { useTranslation } from '../../hooks/useTranslation';

interface GraphEmptyStateProps {
  readonly title: string;
  readonly body: string;
  readonly commands: readonly string[];
}

/** A lone dashed line with an empty station: the map before any commit exists. */
function EmptyLine() {
  return (
    <svg width="220" height="40" viewBox="0 0 220 40" aria-hidden="true" className="mb-6">
      <line
        x1="4"
        y1="20"
        x2="196"
        y2="20"
        stroke="var(--line-0)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />
      <circle
        cx="200"
        cy="20"
        r="11"
        fill="var(--station-fill)"
        stroke="var(--line-0)"
        strokeWidth="5"
      />
    </svg>
  );
}

export function GraphEmptyState({ title, body, commands }: GraphEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center px-10" aria-label={t('graph.label')} role="region">
      <div className="max-w-md">
        <EmptyLine />
        <h2 className="text-ink text-xl font-bold">{title}</h2>
        <p className="text-ink-muted mt-2">{body}</p>
        <pre className="bg-surface-raised text-ink mt-4 rounded-lg px-4 py-3 font-mono text-sm">
          {commands.join('\n')}
        </pre>
      </div>
    </div>
  );
}
