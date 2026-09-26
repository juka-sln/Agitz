import { attachedHead } from '@/domain/entities/Head';
import {
  branchNames,
  currentBranch,
  deleteBranch,
  findBranch,
  getCommit,
  getHeadCommitHash,
  setBranch,
  type Repository,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  BranchAlreadyExistsError,
  BranchNotFoundError,
  BranchNotFullyMergedError,
  CannotDeleteCurrentBranchError,
  CannotForceUpdateCurrentBranchError,
  DetachedHeadRenameError,
  NoBranchNamedError,
} from '@/domain/errors/BranchErrors';
import { GitError } from '@/domain/errors/GitError';
import { InvalidObjectNameError } from '@/domain/errors/RepositoryErrors';
import { isAncestor } from '@/domain/services/history';
import { tryResolveRevision } from '@/domain/services/revision';
import { parseBranchName, type BranchName } from '@/domain/value-objects/BranchName';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';
import { describeCommit } from './support/describeCommit';

export type BranchInput =
  | { readonly action: 'list'; readonly verbose?: boolean }
  | {
      readonly action: 'create';
      readonly name: string;
      readonly startPoint?: string;
      readonly force?: boolean;
    }
  | { readonly action: 'delete'; readonly names: readonly string[]; readonly force?: boolean }
  | {
      readonly action: 'rename';
      readonly oldName?: string;
      readonly newName: string;
      readonly force?: boolean;
    };

export class BranchCommand implements GitCommand<BranchInput> {
  execute(workspace: Workspace, input: BranchInput): CommandOutcome {
    const repository = requireRepository(workspace);
    switch (input.action) {
      case 'list':
        return this.list(workspace, repository, input.verbose === true);
      case 'create':
        return this.create(
          workspace,
          repository,
          input.name,
          input.startPoint,
          input.force === true,
        );
      case 'delete':
        return this.delete(workspace, repository, input.names, input.force === true);
      case 'rename':
        return this.rename(
          workspace,
          repository,
          input.oldName,
          input.newName,
          input.force === true,
        );
    }
  }

  private list(workspace: Workspace, repository: Repository, verbose: boolean): CommandOutcome {
    const { head } = repository;
    const rows: { marker: string; label: string; hash: Hash }[] = branchNames(repository).flatMap(
      (name) => {
        const hash = findBranch(repository, name);
        return hash === undefined
          ? []
          : [{ marker: currentBranch(repository) === name ? '*' : ' ', label: name, hash }];
      },
    );
    if (head.type === 'detached') {
      rows.unshift({
        marker: '*',
        label: `(HEAD detached at ${shortHash(head.commit)})`,
        hash: head.commit,
      });
    }

    const width = Math.max(0, ...rows.map((row) => row.label.length));
    const output = rows
      .map(({ marker, label, hash }) =>
        verbose
          ? `${marker} ${label.padEnd(width)} ${describeCommit(getCommit(repository, hash))}`
          : `${marker} ${label}`,
      )
      .join('\n');

    return succeed(workspace, output, explain('branch.listed', { count: rows.length }));
  }

  private create(
    workspace: Workspace,
    repository: Repository,
    rawName: string,
    startPoint: string | undefined,
    force: boolean,
  ): CommandOutcome {
    const name = parseBranchName(rawName);
    const existing = findBranch(repository, name);

    if (existing !== undefined && !force) {
      throw new BranchAlreadyExistsError(name);
    }
    if (existing !== undefined && currentBranch(repository) === name) {
      throw new CannotForceUpdateCurrentBranchError(name);
    }

    const target = tryResolveRevision(repository, startPoint ?? 'HEAD');
    if (target === null) {
      throw new InvalidObjectNameError(startPoint ?? currentBranch(repository) ?? 'HEAD');
    }

    return succeed(
      { ...workspace, repository: setBranch(repository, name, target) },
      '',
      explain(existing === undefined ? 'branch.created' : 'branch.reset', {
        name,
        commit: shortHash(target),
      }),
    );
  }

  /** Deletes each branch independently: one failure does not prevent the others. */
  private delete(
    workspace: Workspace,
    repository: Repository,
    names: readonly string[],
    force: boolean,
  ): CommandOutcome {
    let next = repository;
    const lines: string[] = [];
    const deleted: string[] = [];
    let firstError: GitError | null = null;

    for (const name of names) {
      try {
        const hash = findBranch(next, name);
        if (hash === undefined) {
          throw new BranchNotFoundError(name);
        }
        if (currentBranch(next) === name) {
          throw new CannotDeleteCurrentBranchError(name, workspace.path);
        }
        const head = getHeadCommitHash(next);
        if (!force && (head === null || !isAncestor(next, hash, head))) {
          throw new BranchNotFullyMergedError(name);
        }
        next = deleteBranch(next, name as BranchName);
        deleted.push(name);
        lines.push(`Deleted branch ${name} (was ${shortHash(hash)}).`);
      } catch (error) {
        if (!(error instanceof GitError)) {
          throw error;
        }
        firstError ??= error;
        lines.push(error.message);
      }
    }

    return {
      workspace: { ...workspace, repository: next },
      output: lines.join('\n'),
      exitCode: firstError === null ? 0 : 1,
      explanation:
        firstError === null
          ? explain('branch.deleted', { names: deleted.join(', '), count: deleted.length })
          : explain(`error.${firstError.code}`, firstError.params),
    };
  }

  private rename(
    workspace: Workspace,
    repository: Repository,
    oldName: string | undefined,
    rawNewName: string,
    force: boolean,
  ): CommandOutcome {
    const current = currentBranch(repository);
    const source = oldName ?? current;
    if (source === null) {
      throw new DetachedHeadRenameError();
    }
    const newName = parseBranchName(rawNewName);
    const hash = findBranch(repository, source);
    const isUnbornCurrent = hash === undefined && source === current;

    if (hash === undefined && !isUnbornCurrent) {
      throw new NoBranchNamedError(source);
    }
    if (newName !== source && findBranch(repository, newName) !== undefined && !force) {
      throw new BranchAlreadyExistsError(newName);
    }

    let next = deleteBranch(repository, source as BranchName);
    if (hash !== undefined) {
      next = setBranch(next, newName, hash);
    }
    if (source === current) {
      next = { ...next, head: attachedHead(newName) };
    }

    return succeed(
      { ...workspace, repository: next },
      '',
      explain('branch.renamed', { from: source, to: newName }),
    );
  }
}
