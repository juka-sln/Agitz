import { remoteTrackingName } from '@/domain/entities/Remote';
import {
  findRemote,
  remoteBranchesOf,
  remoteNames,
  type Repository,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  InvalidRemoteNameError,
  NoSuchRemoteError,
  RemoteAlreadyExistsError,
} from '@/domain/errors/RemoteErrors';
import { isValidBranchName } from '@/domain/value-objects/BranchName';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';

export type RemoteInput =
  | { readonly action: 'list'; readonly verbose?: boolean }
  | { readonly action: 'add'; readonly name: string; readonly url: string }
  | { readonly action: 'remove'; readonly name: string }
  | { readonly action: 'rename'; readonly oldName: string; readonly newName: string }
  | { readonly action: 'get-url'; readonly name: string }
  | { readonly action: 'set-url'; readonly name: string; readonly url: string };

/** Moves or drops everything attached to a remote: its tracking branches and the upstreams using it. */
function rewriteRemoteReferences(
  repository: Repository,
  name: string,
  newName: string | null,
): Repository {
  const remoteBranches: Record<string, Repository['remoteBranches'][string]> = {};
  const owned = new Set(
    remoteBranchesOf(repository, name).map((branch) => remoteTrackingName(name, branch)),
  );
  for (const [trackingName, hash] of Object.entries(repository.remoteBranches)) {
    if (!owned.has(trackingName)) {
      remoteBranches[trackingName] = hash;
    } else if (newName !== null) {
      remoteBranches[remoteTrackingName(newName, trackingName.slice(name.length + 1))] = hash;
    }
  }
  const upstreams = Object.fromEntries(
    Object.entries(repository.upstreams).flatMap(([branch, upstream]) => {
      if (upstream.remote !== name) {
        return [[branch, upstream]];
      }
      return newName === null ? [] : [[branch, { ...upstream, remote: newName }]];
    }),
  );
  const remotes = Object.fromEntries(
    Object.entries(repository.remotes).flatMap(([remoteName, remote]) => {
      if (remoteName !== name) {
        return [[remoteName, remote]];
      }
      return newName === null ? [] : [[newName, remote]];
    }),
  );
  return { ...repository, remotes, remoteBranches, upstreams };
}

export class RemoteCommand implements GitCommand<RemoteInput> {
  execute(workspace: Workspace, input: RemoteInput): CommandOutcome {
    const repository = requireRepository(workspace);
    switch (input.action) {
      case 'list':
        return this.list(workspace, repository, input.verbose === true);
      case 'add':
        return this.add(workspace, repository, input.name, input.url);
      case 'remove':
        return this.remove(workspace, repository, input.name);
      case 'rename':
        return this.rename(workspace, repository, input.oldName, input.newName);
      case 'get-url':
        return succeed(
          workspace,
          this.requireUrl(repository, input.name),
          explain('remote.listed', { count: 1 }),
        );
      case 'set-url':
        this.requireUrl(repository, input.name);
        return succeed(
          {
            ...workspace,
            repository: {
              ...repository,
              remotes: { ...repository.remotes, [input.name]: { url: input.url } },
            },
          },
          '',
          explain('remote.urlChanged', { name: input.name, url: input.url }),
        );
    }
  }

  private requireUrl(repository: Repository, name: string): string {
    const remote = findRemote(repository, name);
    if (remote === undefined) {
      throw new NoSuchRemoteError(name);
    }
    return remote.url;
  }

  private list(workspace: Workspace, repository: Repository, verbose: boolean): CommandOutcome {
    const names = remoteNames(repository);
    const lines = verbose
      ? names.flatMap((name) => {
          const url = repository.remotes[name]?.url ?? '';
          return [`${name}\t${url} (fetch)`, `${name}\t${url} (push)`];
        })
      : names;
    return succeed(
      workspace,
      lines.join('\n'),
      explain(names.length === 0 ? 'remote.none' : 'remote.listed', { count: names.length }),
    );
  }

  private add(
    workspace: Workspace,
    repository: Repository,
    name: string,
    url: string,
  ): CommandOutcome {
    if (!isValidBranchName(name)) {
      throw new InvalidRemoteNameError(name);
    }
    if (findRemote(repository, name) !== undefined) {
      throw new RemoteAlreadyExistsError(name);
    }
    return succeed(
      {
        ...workspace,
        repository: { ...repository, remotes: { ...repository.remotes, [name]: { url } } },
      },
      '',
      explain('remote.added', { name, url }),
    );
  }

  private remove(workspace: Workspace, repository: Repository, name: string): CommandOutcome {
    this.requireUrl(repository, name);
    return succeed(
      { ...workspace, repository: rewriteRemoteReferences(repository, name, null) },
      '',
      explain('remote.removed', { name }),
    );
  }

  private rename(
    workspace: Workspace,
    repository: Repository,
    oldName: string,
    newName: string,
  ): CommandOutcome {
    this.requireUrl(repository, oldName);
    if (!isValidBranchName(newName)) {
      throw new InvalidRemoteNameError(newName);
    }
    if (findRemote(repository, newName) !== undefined) {
      throw new RemoteAlreadyExistsError(newName);
    }
    return succeed(
      { ...workspace, repository: rewriteRemoteReferences(repository, oldName, newName) },
      '',
      explain('remote.renamed', { from: oldName, to: newName }),
    );
  }
}
