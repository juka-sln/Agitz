import type { Network } from '@/domain/entities/Network';
import { remoteNames } from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';
import { fetchRemote } from './support/fetchRemote';
import { defaultRemoteName } from './support/remotes';

export interface FetchInput {
  readonly network: Network;
  readonly remote?: string | undefined;
  readonly branches?: readonly string[] | undefined;
  /** `--all`: fetch every configured remote. */
  readonly all?: boolean;
  /** `--prune`: forget remote-tracking branches whose remote branch was deleted. */
  readonly prune?: boolean;
}

export class FetchCommand implements GitCommand<FetchInput> {
  execute(workspace: Workspace, input: FetchInput): CommandOutcome {
    let repository = requireRepository(workspace);
    const configured = remoteNames(repository);
    if (input.remote === undefined && configured.length === 0) {
      return succeed(workspace, '', explain('fetch.noRemote'));
    }

    const remotes =
      input.all === true ? configured : [input.remote ?? defaultRemoteName(repository)];
    const lines: string[] = [];
    let updatedRefs = 0;
    for (const remote of remotes) {
      const result = fetchRemote(repository, input.network, remote, {
        prune: input.prune === true,
        branches:
          input.branches !== undefined && input.branches.length > 0 ? input.branches : undefined,
      });
      repository = result.repository;
      updatedRefs += result.updatedRefs;
      lines.push(...(input.all === true ? [`Fetching ${remote}`] : []), ...result.lines);
    }

    return succeed(
      { ...workspace, repository },
      lines.join('\n'),
      explain(updatedRefs === 0 ? 'fetch.upToDate' : 'fetch.updated', {
        remote: remotes.join(', '),
        count: updatedRefs,
      }),
    );
  }
}
