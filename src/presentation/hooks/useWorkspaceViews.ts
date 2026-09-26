import { useMemo } from 'react';

import { getCommitGraph, type CommitGraph } from '@/application/queries/getCommitGraph';
import {
  getWorkingTreeEntries,
  type WorkingTreeEntry,
} from '@/application/queries/getWorkingTreeEntries';

import { useSession } from './useSession';

export function useCommitGraph(): CommitGraph | null {
  const repository = useSession((state) => state.workspace.repository);
  return useMemo(() => (repository ? getCommitGraph(repository) : null), [repository]);
}

export function useWorkingTreeEntries(): {
  entries: WorkingTreeEntry[];
  isRepository: boolean;
} {
  const workspace = useSession((state) => state.workspace);
  return useMemo(
    () => ({
      entries: getWorkingTreeEntries(workspace),
      isRepository: workspace.repository !== null,
    }),
    [workspace],
  );
}
