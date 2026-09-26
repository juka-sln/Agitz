import { NotAGitRepositoryError } from '../errors/RepositoryErrors';
import { InvalidPathError } from '../errors/WorkingTreeErrors';
import { normalizePath } from '../value-objects/FilePath';
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
