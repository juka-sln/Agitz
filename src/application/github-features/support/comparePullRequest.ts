import type { Commit } from '@/domain/entities/Commit';
import { findBranchProtection } from '@/domain/entities/Network';
import {
  summarizeReviews,
  type BranchLocation,
  type PullRequest,
} from '@/domain/entities/PullRequest';
import { findBranch, getCommit, type Repository } from '@/domain/entities/Repository';
import { EMPTY_TREE, type Tree } from '@/domain/entities/Tree';
import type { WorkflowRun } from '@/domain/entities/WorkflowRun';
import {
  collectReachableCommits,
  findMergeBase,
  listCommitsInLogOrder,
} from '@/domain/services/history';
import { diffTrees, type TreeChange } from '@/domain/services/treeDiff';
import type { Hash } from '@/domain/value-objects/Hash';

import { mergeTrees } from '../../git-commands/support/mergeTrees';
import { transferObjects } from '../../git-commands/support/remotes';
import type { ObjectHasher } from '../../ports/ObjectHasher';
import type { HostingState } from '../HostingState';
import { findLatestRun } from '../runWorkflows';

import { requireRepositoryData } from './hosting';

/** The two branches of a pull request, brought together in the base repository. */
export interface BranchComparison {
  /** The base repository, with the head branch's objects copied in when it lives in a fork. */
  readonly repository: Repository;
  readonly baseTip: Hash;
  readonly headTip: Hash;
  readonly mergeBase: Hash | null;
  /** Commits of the head branch missing from the base branch, oldest first. */
  readonly commits: readonly Commit[];
  /** What merging would change on the base branch: from the merge base to the head tip. */
  readonly changes: readonly TreeChange[];
}

export function treeOf(repository: Repository, hash: Hash | null): Tree {
  return hash === null ? EMPTY_TREE : getCommit(repository, hash).tree;
}

/** `null` when one of the branches does not exist (anymore). */
export function compareBranches(
  state: HostingState,
  baseUrl: string,
  base: string,
  head: BranchLocation,
): BranchComparison | null {
  const baseRepository = requireRepositoryData(state, baseUrl);
  const headRepository = requireRepositoryData(state, head.repository);
  const baseTip = findBranch(baseRepository, base);
  const headTip = findBranch(headRepository, head.branch);
  if (baseTip === undefined || headTip === undefined) {
    return null;
  }
  const repository = transferObjects(headRepository, baseRepository, [headTip]);
  const inBase = collectReachableCommits(repository, [baseTip]);
  const mergeBase = findMergeBase(repository, baseTip, headTip);
  return {
    repository,
    baseTip,
    headTip,
    mergeBase,
    commits: listCommitsInLogOrder(repository, [headTip])
      .filter((commit) => !inBase.has(commit.hash))
      .reverse(),
    changes: diffTrees(treeOf(repository, mergeBase), treeOf(repository, headTip)),
  };
}

/** Paths that a three-way merge of the two branches could not reconcile. */
export function findMergeConflicts(hasher: ObjectHasher, comparison: BranchComparison): string[] {
  const { repository, baseTip, headTip, mergeBase } = comparison;
  const result = mergeTrees(
    hasher,
    repository,
    {
      base: treeOf(repository, mergeBase),
      ours: treeOf(repository, baseTip),
      theirs: treeOf(repository, headTip),
    },
    { ours: 'base', theirs: 'head' },
  );
  return Object.keys(result.conflicts).sort();
}

export type MergeBlocker =
  | { readonly kind: 'closed' }
  | { readonly kind: 'branchMissing' }
  | { readonly kind: 'nothingToMerge' }
  | { readonly kind: 'conflicts'; readonly paths: readonly string[] }
  | { readonly kind: 'approvals'; readonly required: number; readonly current: number }
  | { readonly kind: 'changesRequested'; readonly reviewers: readonly string[] }
  | { readonly kind: 'checks'; readonly run: WorkflowRun | null };

export interface PullRequestStatus {
  readonly comparison: BranchComparison | null;
  readonly checks: WorkflowRun | null;
  readonly approvedBy: readonly string[];
  readonly changesRequestedBy: readonly string[];
  /** Everything preventing the merge button from being used; empty when it can be merged. */
  readonly blockers: readonly MergeBlocker[];
}

/** What GitHub's merge box shows for an open pull request. */
export function getPullRequestStatus(
  hasher: ObjectHasher,
  state: HostingState,
  pullRequest: PullRequest,
): PullRequestStatus {
  const comparison =
    pullRequest.state === 'merged'
      ? null
      : compareBranches(state, pullRequest.repository, pullRequest.base, pullRequest.head);
  const { approvedBy, changesRequestedBy } = summarizeReviews(pullRequest);
  const checks =
    comparison === null
      ? null
      : findLatestRun(state.github.workflowRuns, pullRequest.head.repository, comparison.headTip);
  const blockers: MergeBlocker[] = [];

  if (pullRequest.state !== 'open') {
    blockers.push({ kind: 'closed' });
  } else if (comparison === null) {
    blockers.push({ kind: 'branchMissing' });
  } else if (comparison.commits.length === 0) {
    blockers.push({ kind: 'nothingToMerge' });
  } else {
    const conflicts = findMergeConflicts(hasher, comparison);
    if (conflicts.length > 0) {
      blockers.push({ kind: 'conflicts', paths: conflicts });
    }
    const protection = findBranchProtection(
      state.network,
      pullRequest.repository,
      pullRequest.base,
    );
    if (protection !== undefined) {
      if (approvedBy.length < protection.requiredApprovals) {
        blockers.push({
          kind: 'approvals',
          required: protection.requiredApprovals,
          current: approvedBy.length,
        });
      }
      if (protection.requiredApprovals > 0 && changesRequestedBy.length > 0) {
        blockers.push({ kind: 'changesRequested', reviewers: changesRequestedBy });
      }
      if (protection.requireStatusChecks && checks?.conclusion !== 'success') {
        blockers.push({ kind: 'checks', run: checks });
      }
    }
  }
  return { comparison, checks, approvedBy, changesRequestedBy, blockers };
}
