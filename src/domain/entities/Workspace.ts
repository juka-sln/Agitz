import { NotAGitRepositoryError } from '../errors/RepositoryErrors';
import { InvalidPathError } from '../errors/WorkingTreeErrors';
import { normalizePath, parentDirectories } from '../value-objects/FilePath';
import type { Identity } from '../value-objects/Identity';

import type { Repository } from './Repository';

/** Files on disk: normalized path mapped to content. Directories are implicit. */
export type WorkingTree = Readonly<Record<string, string>>;

/** A simulated workstation: a directory, the person working in it and, once initialized, its repository. */
export interface Workspace {
  readonly path: string;
  readonly identity: Identity;
  readonly files: WorkingTree;
  readonly repository: Repository | null;
}

export function createWorkspace(path: string, identity: Identity): Workspace {
  return { path, identity, files: {}, repository: null };
}

export function requireRepository(workspace: Workspace): Repository {
  if (!workspace.repository) {
    throw new NotAGitRepositoryError();
  }
  return workspace.repository;
}

export function resolveFilePath(workspace: Workspace, rawPath: string): string {
  const path = normalizePath(rawPath);
  if (path === null || path === '') {
    throw new InvalidPathError(rawPath, workspace.path);
  }
  return path;
}

export function writeFile(workspace: Workspace, rawPath: string, content: string): Workspace {
  const path = resolveFilePath(workspace, rawPath);
  return { ...workspace, files: { ...workspace.files, [path]: content } };
}

/** Deletes a file, or every file below a directory. */
export function deletePath(workspace: Workspace, rawPath: string): Workspace {
  const path = resolveFilePath(workspace, rawPath);
  const files = Object.fromEntries(
    Object.entries(workspace.files).filter(
      ([filePath]) => filePath !== path && !filePath.startsWith(`${path}/`),
    ),
  );
  return { ...workspace, files };
}

export type FileWriteProblem = 'invalidPath' | 'isDirectory' | 'parentIsFile';

/** Why a file cannot be written at this path, or `null` when it can. */
export function findFileWriteProblem(
  workspace: Workspace,
  rawPath: string,
): FileWriteProblem | null {
  const path = normalizePath(rawPath);
  if (path === null || path === '') {
    return 'invalidPath';
  }
  const paths = Object.keys(workspace.files);
  if (paths.some((filePath) => filePath.startsWith(`${path}/`))) {
    return 'isDirectory';
  }
  return parentDirectories(path).some((parent) => Object.hasOwn(workspace.files, parent))
    ? 'parentIsFile'
    : null;
}
