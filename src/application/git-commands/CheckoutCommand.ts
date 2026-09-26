import type { Commit } from '@/domain/entities/Commit';
import { attachedHead, detachedHead, type Head } from '@/domain/entities/Head';
import {
  findBranch,
  getBlobContent,
  getCommit,
  getHeadCommitHash,
  setBranch,
  type Repository,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { BranchAlreadyExistsError, InvalidStartPointError } from '@/domain/errors/BranchErrors';
import { UnresolvedIndexError } from '@/domain/errors/OperationErrors';
import { InvalidReferenceError } from '@/domain/errors/RepositoryErrors';
import { PathspecNotKnownError } from '@/domain/errors/WorkingTreeErrors';
import { checkoutTree } from '@/domain/services/checkoutTree';
import { collectReachableCommits, listCommitsInLogOrder } from '@/domain/services/history';
import { parsePathspec } from '@/domain/services/pathspec';
import { resolveRevision, tryResolveRevision } from '@/domain/services/revision';
import { computeStatus } from '@/domain/services/status';
import { parseBranchName, type BranchName } from '@/domain/value-objects/BranchName';
import { compareByteOrder } from '@/domain/value-objects/FilePath';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import {
  explain,
  succeed,
  type CommandOutcome,
  type Explanation,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { describeCommit, pluralize } from './support/describeCommit';
import { formatLocalChanges } from './support/formatStatus';
import { hashTree } from './support/objects';

export interface CheckoutInput {
  /** Arguments before `--`: a branch or commit to switch to, optionally followed by paths. */
  readonly targets: readonly string[];
  /** Arguments after `--`, always interpreted as paths. */
  readonly paths?: readonly string[] | undefined;
  /** `-b <name>`: create a branch at the target (HEAD by default) and switch to it. */
  readonly newBranch?: string | undefined;
  /** `--detach`: detach HEAD even when the target is a branch. */
  readonly detach?: boolean;
}

type SwitchKind = 'branch' | 'newBranch' | 'detach' | 'forceDetach';

interface SwitchMove {
  readonly head: Head;
  readonly commit: Hash;
  /** The revision as the user typed it, echoed in the detached HEAD advice. */
  readonly target: string;
  readonly kind: SwitchKind;
}

const ORPHAN_LIST_LIMIT = 4;

const DETACHED_HEAD_ADVICE = [
  "You are in 'detached HEAD' state. You can look around, make experimental",
  'changes and commit them, and you can discard any commits you make in this',
  'state without impacting any branches by switching back to a branch.',
  '',
  'If you want to create a new branch to retain commits you create, you may',
  'do so (now or later) by using -c with the switch command. Example:',
  '',
  '  git switch -c <new-branch-name>',
  '',
  'Or undo this operation with:',
  '',
  '  git switch -',
  '',
  'Turn off this advice by setting config variable advice.detachedHead to false',
];

export class CheckoutCommand implements GitCommand<CheckoutInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: CheckoutInput): CommandOutcome {
    const repository = requireRepository(workspace);
    const [first, ...rest] = input.targets;

    if (input.newBranch !== undefined) {
      return this.createBranchAndSwitch(workspace, repository, input.newBranch, first);
    }
    if (input.paths !== undefined && input.paths.length > 0) {
      if (first !== undefined && tryResolveRevision(repository, first) === null) {
        throw new InvalidReferenceError(first);
      }
      return this.restorePaths(workspace, repository, first, [...rest, ...input.paths]);
    }
    if (first === undefined) {
      return input.detach === true
        ? this.switchTo(workspace, repository, 'HEAD', true)
        : this.showLocalChanges(workspace, repository);
    }
    if (tryResolveRevision(repository, first) === null) {
      return this.restorePaths(workspace, repository, undefined, input.targets);
    }
    return rest.length > 0
      ? this.restorePaths(workspace, repository, first, rest)
      : this.switchTo(workspace, repository, first, input.detach === true);
  }

  private showLocalChanges(workspace: Workspace, repository: Repository): CommandOutcome {
    const changes = formatLocalChanges(computeStatus(repository, workspace.files));
    return succeed(workspace, changes.join('\n'), explain('checkout.nothingToDo'));
  }

  private switchTo(
    workspace: Workspace,
    repository: Repository,
    target: string,
    detach: boolean,
  ): CommandOutcome {
    this.ensureResolvedIndex(repository);
    const isHead = target === 'HEAD' || target === '@';
    if (isHead && !detach) {
      return this.showLocalChanges(workspace, repository);
    }

    const branchHash = detach || isHead ? undefined : findBranch(repository, target);
    if (branchHash !== undefined) {
      return this.moveHead(workspace, repository, repository, {
        head: attachedHead(target as BranchName),
        commit: branchHash,
        target,
        kind: 'branch',
      });
    }

    const commit = resolveRevision(repository, target);
    return this.moveHead(workspace, repository, repository, {
      head: detachedHead(commit),
      commit,
      target,
      kind: detach ? 'forceDetach' : 'detach',
    });
  }

  private createBranchAndSwitch(
    workspace: Workspace,
    repository: Repository,
    rawName: string,
    startPoint: string | undefined,
  ): CommandOutcome {
    const name = parseBranchName(rawName);
    this.ensureResolvedIndex(repository);
    if (findBranch(repository, name) !== undefined) {
      throw new BranchAlreadyExistsError(name);
    }

    const start =
      startPoint === undefined
        ? getHeadCommitHash(repository)
        : tryResolveRevision(repository, startPoint);
    if (startPoint !== undefined && start === null) {
      throw new InvalidStartPointError(startPoint, name);
    }
    if (start === null) {
      return succeed(
        { ...workspace, repository: { ...repository, head: attachedHead(name) } },
        `Switched to a new branch '${name}'`,
        explain('checkout.createdBranch', { branch: name }),
      );
    }

    return this.moveHead(workspace, repository, setBranch(repository, name, start), {
      head: attachedHead(name),
      commit: start,
      target: name,
      kind: 'newBranch',
    });
  }

  private ensureResolvedIndex(repository: Repository): void {
    const conflicted = Object.keys(repository.unmerged).sort(compareByteOrder);
    if (conflicted.length > 0) {
      throw new UnresolvedIndexError(conflicted);
    }
  }

  /**
   * Updates the working tree, index and HEAD, then prints what Git prints:
   * local changes carried over, any commits left behind, and the switch message.
   */
  private moveHead(
    workspace: Workspace,
    previous: Repository,
    base: Repository,
    move: SwitchMove,
  ): CommandOutcome {
    const { index, files } = checkoutTree(
      previous,
      workspace.files,
      getCommit(previous, move.commit).tree,
      'checkout',
    );
    const next: Repository = { ...base, head: move.head, index };
    const leftBehind = this.commitsLeftBehind(previous, next, move.commit);

    const lines = [
      ...(move.head.type === 'attached' ? formatLocalChanges(computeStatus(next, files)) : []),
      ...this.leavingDetachedHeadMessage(previous, move.commit, leftBehind),
      ...this.switchMessage(previous, move),
    ];

    return succeed(
      { ...workspace, files, repository: next },
      lines.join('\n'),
      this.explainSwitch(previous, move, leftBehind.length),
    );
  }

  private commitsLeftBehind(previous: Repository, next: Repository, target: Hash): Commit[] {
    const { head } = previous;
    if (head.type !== 'detached' || head.commit === target) {
      return [];
    }
    const kept = collectReachableCommits(next, [...Object.values(next.branches), target]);
    return listCommitsInLogOrder(previous, [head.commit]).filter(
      (commit) => !kept.has(commit.hash),
    );
  }

  private leavingDetachedHeadMessage(
    previous: Repository,
    target: Hash,
    leftBehind: readonly Commit[],
  ): string[] {
    const { head } = previous;
    if (head.type !== 'detached' || head.commit === target) {
      return [];
    }
    if (leftBehind.length === 0) {
      return [`Previous HEAD position was ${describeCommit(getCommit(previous, head.commit))}`];
    }

    const listed = leftBehind
      .slice(0, ORPHAN_LIST_LIMIT)
      .map((commit) => `  ${describeCommit(commit)}`);
    if (leftBehind.length > ORPHAN_LIST_LIMIT) {
      listed.push(` ... and ${leftBehind.length - ORPHAN_LIST_LIMIT} more.`);
    }
    return [
      `Warning: you are leaving ${pluralize(leftBehind.length, 'commit')} behind, not connected to`,
      'any of your branches:',
      '',
      ...listed,
      '',
      `If you want to keep ${leftBehind.length === 1 ? 'it' : 'them'} by creating a new branch, this may be a good time`,
      'to do so with:',
      '',
      ` git branch <new-branch-name> ${shortHash(head.commit)}`,
      '',
    ];
  }

  private switchMessage(previous: Repository, move: SwitchMove): string[] {
    const { head } = move;
    if (head.type === 'attached') {
      if (move.kind === 'newBranch') {
        return [`Switched to a new branch '${head.branch}'`];
      }
      const alreadyOn = previous.head.type === 'attached' && previous.head.branch === head.branch;
      return [alreadyOn ? `Already on '${head.branch}'` : `Switched to branch '${head.branch}'`];
    }

    if (previous.head.type === 'detached' && previous.head.commit === head.commit) {
      return [];
    }
    const advice =
      previous.head.type === 'attached' && move.kind === 'detach'
        ? [`Note: switching to '${move.target}'.`, '', ...DETACHED_HEAD_ADVICE, '']
        : [];
    return [...advice, `HEAD is now at ${describeCommit(getCommit(previous, head.commit))}`];
  }

  private explainSwitch(previous: Repository, move: SwitchMove, leftBehind: number): Explanation {
    const params = { commit: shortHash(move.commit), leftBehind };
    const { head } = move;
    if (head.type === 'detached') {
      return explain('checkout.detached', params);
    }
    if (move.kind === 'newBranch') {
      return explain('checkout.createdBranch', { ...params, branch: head.branch });
    }
    const alreadyOn = previous.head.type === 'attached' && previous.head.branch === head.branch;
    return explain(alreadyOn ? 'checkout.alreadyOn' : 'checkout.switchedBranch', {
      ...params,
      branch: head.branch,
    });
  }

  /** `git checkout [<commit>] -- <paths>`: overwrite files from the index or from a commit. */
  private restorePaths(
    workspace: Workspace,
    repository: Repository,
    source: string | undefined,
    rawPathspecs: readonly string[],
  ): CommandOutcome {
    const sourceTree =
      source === undefined
        ? repository.index
        : getCommit(repository, resolveRevision(repository, source)).tree;
    const available = Object.keys(sourceTree);

    const matched = new Set<string>();
    for (const pathspec of rawPathspecs.map((raw) => parsePathspec(raw, workspace.path))) {
      const matches = available.filter(pathspec.matches);
      if (matches.length === 0) {
        throw new PathspecNotKnownError(pathspec.original);
      }
      matches.forEach((path) => matched.add(path));
    }

    const files: Record<string, string> = { ...workspace.files };
    const index: Record<string, Hash> = { ...repository.index };
    for (const path of [...matched].sort(compareByteOrder)) {
      const blob = sourceTree[path];
      if (blob !== undefined) {
        files[path] = getBlobContent(repository, blob);
        if (source !== undefined) {
          index[path] = blob;
        }
      }
    }

    const origin =
      source === undefined ? 'the index' : shortHash(hashTree(this.context.hasher, sourceTree));
    return succeed(
      { ...workspace, files, repository: { ...repository, index } },
      `Updated ${pluralize(matched.size, 'path')} from ${origin}`,
      explain('checkout.restoredPaths', { count: matched.size, source: source ?? 'index' }),
    );
  }
}
