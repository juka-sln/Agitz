import { useCallback, useMemo, useState } from 'react';

import type { GitHubActions } from '@/application/github-features/GitHubActions';
import type { GitHubProblem, HostingState } from '@/application/github-features/HostingState';

import { useSession } from './useSession';

/** The virtual GitHub as the active user sees it. */
export function useGitHub() {
  const network = useSession((state) => state.network);
  const github = useSession((state) => state.github);
  const actor = useSession((state) => state.activeUser);
  const actions = useSession((state) => state.gitHubActions);
  const hosting = useMemo<HostingState>(() => ({ network, github }), [network, github]);
  return { hosting, actor, actions };
}

type Perform = (actions: GitHubActions, state: HostingState) => HostingState;

/** Runs web actions and keeps the last refusal to display next to the form. */
export function useGitHubAction() {
  const act = useSession((state) => state.act);
  const [problem, setProblem] = useState<GitHubProblem | null>(null);
  const run = useCallback(
    (perform: Perform) => {
      const refused = act(perform);
      setProblem(refused);
      return refused === null;
    },
    [act],
  );
  const clearProblem = useCallback(() => {
    setProblem(null);
  }, []);
  return { problem, run, clearProblem };
}
