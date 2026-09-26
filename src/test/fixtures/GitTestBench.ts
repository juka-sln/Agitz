import { AddCommand } from '@/application/git-commands/AddCommand';
import { CommitCommand } from '@/application/git-commands/CommitCommand';
import type { GitCommand, GitCommandContext } from '@/application/git-commands/GitCommand';
import { InitCommand } from '@/application/git-commands/InitCommand';
import { runGitCommand, type CommandResult } from '@/application/git-commands/runGitCommand';
import type { Commit } from '@/domain/entities/Commit';
import { getCommit, getHeadCommitHash, type Repository } from '@/domain/entities/Repository';
import {
  createWorkspace,
  deletePath,
  requireRepository,
  writeFile,
  type Workspace,
} from '@/domain/entities/Workspace';
import type { Identity } from '@/domain/value-objects/Identity';
import { FakeClock } from '@/test/doubles/FakeClock';
import { FakeObjectHasher } from '@/test/doubles/FakeObjectHasher';

export const ALICE: Identity = { name: 'Alice', email: 'alice@example.com' };

export const WORKSPACE_PATH = '/home/alice/project';

export function createTestContext(): GitCommandContext {
  return { hasher: new FakeObjectHasher(), clock: new FakeClock() };
}

/** Holds a workspace across successive commands, like a terminal session. */
export class GitTestBench {
  readonly context: GitCommandContext = createTestContext();

  workspace: Workspace = createWorkspace(WORKSPACE_PATH, ALICE);

  get repository(): Repository {
    return requireRepository(this.workspace);
  }

  get headCommit(): Commit {
    const hash = getHeadCommitHash(this.repository);
    if (hash === null) {
      throw new Error('HEAD does not point to any commit yet');
    }
    return getCommit(this.repository, hash);
  }

  write(files: Readonly<Record<string, string>>): this {
    for (const [path, content] of Object.entries(files)) {
      this.workspace = writeFile(this.workspace, path, content);
    }
    return this;
  }

  remove(path: string): this {
    this.workspace = deletePath(this.workspace, path);
    return this;
  }

  init(): this {
    this.run(new InitCommand(), {});
    return this;
  }

  /** Writes the given files, stages everything and commits. */
  commit(message: string, files: Readonly<Record<string, string>> = {}): CommandResult {
    this.write(files);
    this.run(new AddCommand(this.context), { pathspecs: [], all: true });
    return this.run(new CommitCommand(this.context), { messages: [message] });
  }

  run<TInput>(command: GitCommand<TInput>, input: TInput): CommandResult {
    const result = runGitCommand(this.workspace, (workspace) => command.execute(workspace, input));
    this.workspace = result.workspace;
    return result;
  }
}
