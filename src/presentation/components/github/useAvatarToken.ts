import { useCallback } from 'react';

import { useSession } from '../../hooks/useSession';
import { avatarToken } from '../../hooks/useTeam';

/** The avatar color of a teammate from their login, the same everywhere in the interface. */
export function useAvatarToken(): (login: string) => string {
  const users = useSession((state) => state.users);
  return useCallback(
    (login: string) => {
      const index = users.findIndex((user) => user.id === login);
      return index === -1 ? 'line-none' : avatarToken(index);
    },
    [users],
  );
}
