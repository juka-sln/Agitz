import { hostedRepositoryUrls } from '@/domain/entities/Network';

import { useSession } from './useSession';

const START_STEPS = ['git init', 'echo "# My project" > README.md', 'git status'];

export interface FirstSteps {
  /** Teammates join the shared project by cloning it; the first user starts it from scratch. */
  readonly joinsByCloning: boolean;
  readonly steps: readonly string[];
}

export function useFirstSteps(): FirstSteps {
  const isFirstUser = useSession((state) => state.activeUser.id === state.users[0]?.id);
  const sharedUrl = useSession((state) => hostedRepositoryUrls(state.network)[0]);
  if (isFirstUser || sharedUrl === undefined) {
    return { joinsByCloning: false, steps: START_STEPS };
  }
  return { joinsByCloning: true, steps: [`git clone ${sharedUrl}`, 'git log --oneline'] };
}
