import { createHostedRepository, EMPTY_NETWORK, type Network } from '@/domain/entities/Network';
import { createSimulatedUser, type SimulatedUser } from '@/domain/entities/SimulatedUser';

/** The empty repository waiting on the virtual GitHub, created by the first user. */
export const SHARED_REPOSITORY_URL = 'https://github.com/alice/project.git';

export interface TeamSetup {
  /** The first user is the active one when the session starts. */
  readonly users: readonly SimulatedUser[];
  readonly network: Network;
}

/** Alice owns the shared repository; Bob joins her to rehearse clone, pull, push and conflicts. */
export function createDefaultTeam(): TeamSetup {
  return {
    users: [createSimulatedUser('Alice'), createSimulatedUser('Bob')],
    network: createHostedRepository(EMPTY_NETWORK, SHARED_REPOSITORY_URL),
  };
}
