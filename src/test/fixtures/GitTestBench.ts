import type { GitCommand, GitCommandContext } from '@/application/git-commands/GitCommand';
import { runGitCommand, type CommandResult } from '@/application/git-commands/runGitCommand';
import type { Repository } from '@/domain/entities/Repository';
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

  run<TInput>(command: GitCommand<TInput>, input: TInput): CommandResult {
    const result = runGitCommand(this.workspace, (workspace) => command.execute(workspace, input));
    this.workspace = result.workspace;
    return result;
  }
}
