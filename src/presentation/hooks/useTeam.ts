import { useMemo } from 'react';

import type { SimulatedUser } from '@/domain/entities/SimulatedUser';

import { describePrompt } from './usePrompt';
import { useSession } from './useSession';

export interface TeamMember {
  readonly user: SimulatedUser;
  readonly isActive: boolean;
  /** Branch or detached commit on that user's workstation, `null` without a repository. */
  readonly location: string | null;
  /** Color token of the user's avatar, also used to tell authors apart. */
  readonly colorToken: string;
}

const AVATAR_TOKEN_COUNT = 6;
const AVATAR_TOKEN_OFFSET = 3;

export function avatarToken(index: number): string {
  return `line-${(index + AVATAR_TOKEN_OFFSET) % AVATAR_TOKEN_COUNT}`;
}

export function useTeam(): readonly TeamMember[] {
  const users = useSession((state) => state.users);
  const activeUser = useSession((state) => state.activeUser);
  const workspace = useSession((state) => state.workspace);
  const otherWorkstations = useSession((state) => state.otherWorkstations);

  return useMemo(
    () =>
      users.map((user, index) => {
        const isActive = user.id === activeUser.id;
        const userWorkspace = isActive ? workspace : otherWorkstations[user.id]?.workspace;
        return {
          user,
          isActive,
          location: userWorkspace ? describePrompt(userWorkspace).location : null,
          colorToken: avatarToken(index),
        };
      }),
    [users, activeUser, workspace, otherWorkstations],
  );
}
