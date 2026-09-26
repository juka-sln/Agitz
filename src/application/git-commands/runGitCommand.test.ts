import { createWorkspace, writeFile } from '@/domain/entities/Workspace';
import { NotAGitRepositoryError } from '@/domain/errors/RepositoryErrors';

import { explain, succeed } from './GitCommand';
import { runGitCommand } from './runGitCommand';

const workspace = createWorkspace('/home/alice/project', { name: 'Alice', email: 'a@example.com' });

describe('runGitCommand', () => {
  it('attaches a state diff to a successful outcome', () => {
    const result = runGitCommand(workspace, (current) =>
      succeed(writeFile(current, 'a.txt', 'a'), '', explain('test.done')),
    );

    expect(result.exitCode).toBe(0);
    expect(result.diffState.workingTreeChanged).toBe(true);
    expect(result.diffState.repositoryCreated).toBe(false);
  });

  it('turns a Git error into a failed result that leaves the workspace untouched', () => {
    const result = runGitCommand(workspace, () => {
      throw new NotAGitRepositoryError();
    });

    expect(result.workspace).toBe(workspace);
    expect(result.exitCode).toBe(128);
    expect(result.output).toBe(
      'fatal: not a git repository (or any of the parent directories): .git',
    );
    expect(result.explanation).toEqual({ key: 'error.notAGitRepository', params: {} });
  });

  it('rethrows unexpected errors', () => {
    expect(() =>
      runGitCommand(workspace, () => {
        throw new TypeError('bug');
      }),
    ).toThrow(TypeError);
  });
});
