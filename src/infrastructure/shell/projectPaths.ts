import type { Workspace } from '@/domain/entities/Workspace';
import { normalizePath, parentDirectories } from '@/domain/value-objects/FilePath';

export { normalizePath as toProjectPath };

export function isFile(workspace: Workspace, path: string): boolean {
  return Object.hasOwn(workspace.files, path);
}

/** Directories are implicit: one exists as soon as a file lives below it. The root always exists. */
export function isDirectory(workspace: Workspace, path: string): boolean {
  return (
    path === '' || Object.keys(workspace.files).some((filePath) => filePath.startsWith(`${path}/`))
  );
}

/** A path cannot be created below something that is a file (`a.txt/b.txt`). */
export function hasFileAncestor(workspace: Workspace, path: string): boolean {
  return parentDirectories(path).some((directory) => isFile(workspace, directory));
}

/** Direct children of a directory; sub-directories end with `/`. */
export function listDirectory(workspace: Workspace, directory: string): string[] {
  const prefix = directory === '' ? '' : `${directory}/`;
  const children = new Set<string>();
  for (const path of Object.keys(workspace.files)) {
    if (path.startsWith(prefix)) {
      const [child = '', ...deeper] = path.slice(prefix.length).split('/');
      children.add(deeper.length > 0 ? `${child}/` : child);
    }
  }
  return [...children].sort();
}
