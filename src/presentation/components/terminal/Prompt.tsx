import type { Workspace } from '@/domain/entities/Workspace';

import { describePrompt } from '../../hooks/usePrompt';

export function Prompt({ workspace }: { workspace: Workspace }) {
  const { user, directory, location, state } = describePrompt(workspace);
  return (
    <span className="shrink-0 pr-[1ch] select-none">
      <span className="text-terminal-success">{user}@agitz</span>{' '}
      <span className="text-terminal-accent">{directory}</span>
      {location !== null && (
        <span className="text-terminal-warning">
          {' '}
          ({location}
          {state !== null && <span className="text-terminal-error">|{state}</span>})
        </span>
      )}
      <span className="text-terminal-muted"> $</span>
    </span>
  );
}
