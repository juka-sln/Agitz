import { attachedHead } from '@/domain/entities/Head';
import { repositoryDirectoryName, type Network } from '@/domain/entities/Network';
import { remoteTrackingName } from '@/domain/entities/Remote';
import {
  createEmptyRepository,
  findBranch,
  getBlobContent,
  getCommit,
  setBranch,
  setUpstream,
} from '@/domain/entities/Repository';
import type { Workspace } from '@/domain/entities/Workspace';
import { CloneDestinationNotEmptyError } from '@/domain/errors/RemoteErrors';
import { parseBranchName } from '@/domain/value-objects/BranchName';
import { shortHash } from '@/domain/value-objects/Hash';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';
import { fetchRemote } from './support/fetchRemote';
import { requireHostedRepository } from './support/remotes';

export interface CloneInput {
  readonly network: Network;
  readonly url: string;
  /** Name of the project folder; derived from the URL when omitted, `.` keeps the current one. */
  readonly directory?: string | undefined;
}

const ORIGIN = 'origin';

/**
 * Copies a hosted repository into the workstation: every commit, a remote named `origin`
 * with one remote-tracking branch per remote branch, and a local copy of the default branch.
 * A workstation holds a single project, so the clone fills its (empty) project folder.
 */
export class CloneCommand implements GitCommand<CloneInput> {
  execute(workspace: Workspace, input: CloneInput): CommandOutcome {
    const directory =
      input.directory === '.'
        ? (workspace.path.split('/').at(-1) ?? '')
        : (input.directory?.replace(/\/+$/, '') ?? repositoryDirectoryName(input.url));
    if (workspace.repository !== null || Object.keys(workspace.files).length > 0) {
      throw new CloneDestinationNotEmptyError(directory);
    }

    const hosted = requireHostedRepository(input.network, input.url);
    const defaultBranch =
      hosted.head.type === 'attached' ? hosted.head.branch : parseBranchName('main');
    const fetched = fetchRemote(
      { ...createEmptyRepository(defaultBranch), remotes: { [ORIGIN]: { url: input.url } } },
      input.network,
      ORIGIN,
    ).repository;
    let repository = setUpstream(fetched, defaultBranch, {
      remote: ORIGIN,
      branch: defaultBranch,
    });

    const tip = findBranch(hosted, defaultBranch);
    const path = `${workspace.path.slice(0, workspace.path.lastIndexOf('/'))}/${directory}`;
    const cloning = `Cloning into '${input.directory === '.' ? '.' : directory}'...`;
    if (tip === undefined) {
      return succeed(
        { ...workspace, path, repository },
        [cloning, 'warning: You appear to have cloned an empty repository.'].join('\n'),
        explain('clone.empty', { url: input.url, branch: defaultBranch }),
      );
    }

    const { tree } = getCommit(repository, tip);
    repository = {
      ...setBranch(repository, defaultBranch, tip),
      head: attachedHead(defaultBranch),
      index: tree,
    };
    const files = Object.fromEntries(
      Object.entries(tree).map(([filePath, blob]) => [filePath, getBlobContent(repository, blob)]),
    );
    return succeed(
      { ...workspace, path, files, repository },
      cloning,
      explain('clone.cloned', {
        url: input.url,
        branch: defaultBranch,
        tracking: remoteTrackingName(ORIGIN, defaultBranch),
        commit: shortHash(tip),
        count: Object.keys(repository.commits).length,
      }),
    );
  }
}
