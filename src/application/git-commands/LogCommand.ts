import type { Commit } from '@/domain/entities/Commit';
import { getHeadCommitHash, type Repository } from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { NoCommitsYetError } from '@/domain/errors/RepositoryErrors';
import { listCommitsInLogOrder } from '@/domain/services/history';
import { resolveRevision } from '@/domain/services/revision';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';
import { formatIdentity } from '@/domain/value-objects/Identity';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';
import { formatGitDate } from './support/formatDate';

export interface LogInput {
  readonly revisions?: readonly string[];
  readonly all?: boolean;
  readonly oneline?: boolean;
  readonly maxCount?: number;
}

/** Ref names shown next to each commit, e.g. `HEAD -> main, feature`. */
function collectDecorations(repository: Repository): Map<Hash, string[]> {
  const decorations = new Map<Hash, string[]>();
  const { head } = repository;

  for (const [branch, hash] of Object.entries(repository.branches).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const labels = decorations.get(hash) ?? [];
    if (head.type === 'attached' && head.branch === branch) {
      labels.unshift(`HEAD -> ${branch}`);
    } else {
      labels.push(branch);
    }
    decorations.set(hash, labels);
  }
  if (head.type === 'detached') {
    decorations.set(head.commit, ['HEAD', ...(decorations.get(head.commit) ?? [])]);
  }
  return decorations;
}

function formatFull(commit: Commit, decoration: string): string {
  const lines = [`commit ${commit.hash}${decoration}`];
  if (commit.parents.length > 1) {
    lines.push(`Merge: ${commit.parents.map(shortHash).join(' ')}`);
  }
  lines.push(
    `Author: ${formatIdentity(commit.author)}`,
    `Date:   ${formatGitDate(commit.authoredAt)}`,
    '',
    ...commit.message.split('\n').map((line) => (line === '' ? '' : `    ${line}`)),
  );
  return lines.join('\n');
}

export class LogCommand implements GitCommand<LogInput> {
  execute(workspace: Workspace, input: LogInput): CommandOutcome {
    const repository = requireRepository(workspace);
    const starts = this.startingPoints(repository, input);
    const commits = listCommitsInLogOrder(repository, starts).slice(
      0,
      input.maxCount ?? Number.POSITIVE_INFINITY,
    );
    const decorations = collectDecorations(repository);
    const decorate = (commit: Commit) => {
      const labels = decorations.get(commit.hash);
      return labels ? ` (${labels.join(', ')})` : '';
    };

    const output =
      input.oneline === true
        ? commits
            .map(
              (commit) =>
                `${shortHash(commit.hash)}${decorate(commit)} ${commitSubject(commit.message)}`,
            )
            .join('\n')
        : commits.map((commit) => formatFull(commit, decorate(commit))).join('\n\n');

    return succeed(workspace, output, explain('log.shown', { count: commits.length }));
  }

  private startingPoints(repository: Repository, input: LogInput): Hash[] {
    const starts = (input.revisions ?? []).map((revision) => resolveRevision(repository, revision));
    const head = getHeadCommitHash(repository);

    if (input.all === true) {
      starts.push(...Object.values(repository.branches));
      if (head !== null) {
        starts.push(head);
      }
    } else if (starts.length === 0) {
      if (head === null) {
        throw new NoCommitsYetError(
          repository.head.type === 'attached' ? repository.head.branch : 'HEAD',
        );
      }
      starts.push(head);
    }
    return starts;
  }
}
