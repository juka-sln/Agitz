import { useMemo } from 'react';

import { getHostedRepositories } from '@/application/queries/getHostedRepositories';
import { shortHash } from '@/domain/value-objects/Hash';

import { useSession } from '../../hooks/useSession';
import { useTranslation } from '../../hooks/useTranslation';

/** What the virtual GitHub holds right now, so pushes from any workstation are visible at once. */
export function HostedRepositories() {
  const { t } = useTranslation();
  const network = useSession((state) => state.network);
  const repositories = useMemo(() => getHostedRepositories(network), [network]);

  return (
    <section aria-labelledby="hosted-title" className="border-rule border-t px-4 py-3">
      <h2 id="hosted-title" className="text-ink text-sm font-bold">
        GitHub
      </h2>
      <ul className="mt-1.5 flex flex-col gap-2">
        {repositories.map((repository) => (
          <li key={repository.url} className="text-xs">
            <p className="text-ink font-mono font-semibold">
              {repository.url.split('/').map((part, index) => (
                // Lets the URL wrap after a slash rather than in the middle of a name.
                <span key={index}>
                  {index > 0 && '/'}
                  {index > 0 && <wbr />}
                  {part}
                </span>
              ))}
            </p>
            {repository.branches.length === 0 ? (
              <p className="text-ink-muted mt-0.5">{t('hosted.empty')}</p>
            ) : (
              <ul className="mt-0.5" aria-label={t('hosted.branches')}>
                {repository.branches.map((branch) => (
                  <li
                    key={branch.name}
                    className="text-ink-muted flex justify-between gap-2 font-mono"
                  >
                    <span className="text-ink truncate">
                      {branch.name}
                      {branch.isDefault && (
                        <span className="sr-only"> ({t('hosted.default')})</span>
                      )}
                    </span>
                    <span>{shortHash(branch.tip)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
