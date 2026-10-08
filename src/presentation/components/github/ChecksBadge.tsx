import type { CheckConclusion } from '@/domain/entities/WorkflowRun';

import { useTranslation } from '../../hooks/useTranslation';

/** The green tick or red cross GitHub draws next to a commit once CI has run on it. */
export function ChecksBadge({ conclusion }: { readonly conclusion: CheckConclusion | null }) {
  const { t } = useTranslation();
  if (conclusion === null) {
    return null;
  }
  const passed = conclusion === 'success';
  return (
    <span
      title={passed ? t('github.checks.passed') : t('github.checks.failed')}
      className={`inline-flex items-center text-xs font-bold ${passed ? 'text-status-staged' : 'text-status-deleted'}`}
    >
      <span aria-hidden="true">{passed ? '✓' : '✗'}</span>
      <span className="sr-only">
        {passed ? t('github.checks.passed') : t('github.checks.failed')}
      </span>
    </span>
  );
}
