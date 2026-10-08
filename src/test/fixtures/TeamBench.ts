import { CloneCommand } from '@/application/git-commands/CloneCommand';
import type { GitCommand } from '@/application/git-commands/GitCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { RemoteCommand } from '@/application/git-commands/RemoteCommand';
import type { CommandResult } from '@/application/git-commands/runGitCommand';
import {
  createHostedRepository,
  EMPTY_NETWORK,
  findHostedRepository,
  type Network,
} from '@/domain/entities/Network';
import type { Repository } from '@/domain/entities/Repository';
import type { Identity } from '@/domain/value-objects/Identity';

import { ALICE, createTestContext, GitTestBench } from './GitTestBench';

export const BOB: Identity = { name: 'Bob', email: 'bob@example.com' };

export const ORIGIN_URL = 'https://github.com/alice/project.git';

interface NetworkInput {
  readonly network: Network;
}

/** Several workstations sharing one clock and one network with an empty hosted repository. */
export class TeamBench {
  readonly context = createTestContext();

  network: Network = createHostedRepository(EMPTY_NETWORK, ORIGIN_URL);

  readonly alice = new GitTestBench(this.context, ALICE, '/home/alice/project');

  readonly bob = new GitTestBench(this.context, BOB, '/home/bob/project');

  get hosted(): Repository {
    const repository = findHostedRepository(this.network, ORIGIN_URL);
    if (!repository) {
      throw new Error(`No repository hosted at ${ORIGIN_URL}`);
    }
    return repository;
  }

  /** Runs a command that talks to the network and keeps the network it leaves behind. */
  online<TInput extends NetworkInput>(
    bench: GitTestBench,
    command: GitCommand<TInput>,
    input: Omit<TInput, 'network'>,
  ): CommandResult {
    const result = bench.run(command, { ...input, network: this.network } as TInput);
    this.network = result.network ?? this.network;
    return result;
  }

  /** Alice creates the project, publishes `main` with one commit and Bob clones it. */
  share(): this {
    this.alice.init();
    this.alice.commit('feat: initial commit', { 'README.md': 'Hello\n' });
    this.alice.run(new RemoteCommand(), { action: 'add', name: 'origin', url: ORIGIN_URL });
    this.online(this.alice, new PushCommand(), {
      remote: 'origin',
      refspecs: ['main'],
      setUpstream: true,
    });
    this.online(this.bob, new CloneCommand(), { url: ORIGIN_URL });
    return this;
  }
}
