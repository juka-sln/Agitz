import type { Commit } from '@/domain/entities/Commit';
import {
  findIssue,
  findProject,
  replaceIssue,
  replacePullRequest,
  type GitHub,
} from '@/domain/entities/GitHub';
import { storeHostedRepository } from '@/domain/entities/Network';
import {
  findClosingReferences,
  type MergeMethod,
  type PullRequest,
} from '@/domain/entities/PullRequest';
import { addCommit, setBranch, type Repository } from '@/domain/entities/Repository';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';
import type { Tree } from '@/domain/entities/Tree';
import { GitHubRuleError } from '@/domain/errors/GitHubErrors';
import { commitSubject, createCommitMessage } from '@/domain/value-objects/CommitMessage';
import type { Hash } from '@/domain/value-objects/Hash';

import type { GitCommandContext } from '../git-commands/GitCommand';
import { mergeTrees } from '../git-commands/support/mergeTrees';
import { createCommitObject } from '../git-commands/support/objects';

import type { HostingState } from './HostingState';
import { getPullRequestStatus, treeOf, type BranchComparison } from './support/comparePullRequest';
import { GITHUB_IDENTITY } from './support/hosting';
import { requirePullRequest, type PullRequestReference } from './support/pullRequests';

export interface MergePullRequestInput extends PullRequestReference {
  readonly method: MergeMethod;
  readonly actor: SimulatedUser;
}

interface MergeOutcome {
  readonly repository: Repository;
  readonly tip: Hash;
}

/**
 * The green button: integrates the head branch into the base branch on the server, as a
 * merge commit, a single squashed commit, or by replaying each commit on top of the base.
 */
export class MergePullRequest {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(state: HostingState, input: MergePullRequestInput): HostingState {
    const pullRequest = requirePullRequest(state, input);
    const status = getPullRequestStatus(this.context.hasher, state, pullRequest);
    const [blocker] = status.blockers;
    if (blocker !== undefined || status.comparison === null) {
      throw new GitHubRuleError('mergeBlocked', { reason: blocker?.kind ?? 'branchMissing' });
    }
    const comparison = status.comparison;
    const merged = this.integrate(state, pullRequest, comparison, input);
    const repository = setBranch(merged.repository, pullRequest.base, merged.tip);

    const github = replacePullRequest(state.github, {
      ...pullRequest,
      state: 'merged',
      merge: {
        method: input.method,
        by: input.actor,
        commit: merged.tip,
        headCommit: comparison.headTip,
        baseCommit: comparison.baseTip,
      },
    });
    return {
      network: storeHostedRepository(state.network, pullRequest.repository, repository),
      github: this.closeReferencedIssues(github, pullRequest),
    };
  }

  private integrate(
    state: HostingState,
    pullRequest: PullRequest,
    comparison: BranchComparison,
    { method, actor }: MergePullRequestInput,
  ): MergeOutcome {
    if (method === 'rebase') {
      return this.rebase(comparison);
    }
    const merged = this.mergeTree(comparison.repository, {
      base: treeOf(comparison.repository, comparison.mergeBase),
      ours: treeOf(comparison.repository, comparison.baseTip),
      theirs: treeOf(comparison.repository, comparison.headTip),
    });
    const owner = findProject(state.github, pullRequest.head.repository)?.owner ?? actor.id;
    const message =
      method === 'merge'
        ? `Merge pull request #${String(pullRequest.number)} from ${owner}/${pullRequest.head.branch}\n\n${pullRequest.title}`
        : [
            `${pullRequest.title} (#${String(pullRequest.number)})`,
            '',
            ...comparison.commits.map((commit) => `* ${commitSubject(commit.message)}`),
          ].join('\n');
    return this.commit(merged.repository, {
      tree: merged.tree,
      parents: method === 'merge' ? [comparison.baseTip, comparison.headTip] : [comparison.baseTip],
      message,
      author: method === 'merge' ? actor : pullRequest.author,
    });
  }

  /** Replays each commit of the branch on top of the base, keeping its author and message. */
  private rebase(comparison: BranchComparison): MergeOutcome {
    let repository = comparison.repository;
    let tip = comparison.baseTip;
    for (const commit of comparison.commits.filter((candidate) => candidate.parents.length === 1)) {
      const merged = this.mergeTree(repository, {
        base: treeOf(repository, commit.parents[0] ?? null),
        ours: treeOf(repository, tip),
        theirs: commit.tree,
      });
      const replayed = this.replay(merged.repository, commit, merged.tree, tip);
      repository = replayed.repository;
      tip = replayed.tip;
    }
    return { repository, tip };
  }

  private mergeTree(
    repository: Repository,
    trees: { readonly base: Tree; readonly ours: Tree; readonly theirs: Tree },
  ): { readonly repository: Repository; readonly tree: Tree } {
    const result = mergeTrees(this.context.hasher, repository, trees, {
      ours: 'base',
      theirs: 'head',
    });
    if (Object.keys(result.conflicts).length > 0) {
      throw new GitHubRuleError('mergeBlocked', { reason: 'conflicts' });
    }
    return { repository: result.repository, tree: result.tree };
  }

  private replay(repository: Repository, original: Commit, tree: Tree, parent: Hash): MergeOutcome {
    const commit = createCommitObject(this.context.hasher, {
      tree,
      parents: [parent],
      message: original.message,
      author: original.author,
      timestamp: original.authoredAt,
      committer: { identity: GITHUB_IDENTITY, timestamp: this.context.clock.now() },
    });
    return { repository: addCommit(repository, commit), tip: commit.hash };
  }

  private commit(
    repository: Repository,
    draft: {
      readonly tree: Tree;
      readonly parents: readonly Hash[];
      readonly message: string;
      readonly author: SimulatedUser;
    },
  ): MergeOutcome {
    const now = this.context.clock.now();
    const commit = createCommitObject(this.context.hasher, {
      tree: draft.tree,
      parents: draft.parents,
      message: createCommitMessage(draft.message),
      author: draft.author.identity,
      timestamp: now,
      committer: { identity: GITHUB_IDENTITY, timestamp: now },
    });
    return { repository: addCommit(repository, commit), tip: commit.hash };
  }

  /** `Closes #3` in the description closes issue #3 of the base repository. */
  private closeReferencedIssues(github: GitHub, pullRequest: PullRequest): GitHub {
    let next = github;
    for (const number of findClosingReferences(`${pullRequest.title}\n${pullRequest.body}`)) {
      const issue = findIssue(next, pullRequest.repository, number);
      if (issue?.state === 'open') {
        next = replaceIssue(next, {
          ...issue,
          state: 'closed',
          closedByPullRequest: pullRequest.number,
        });
      }
    }
    return next;
  }
}
