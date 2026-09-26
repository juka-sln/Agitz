/**
 * Normalizes a path relative to the repository root: `./a//b/` becomes `a/b`.
 * Returns `null` when the path escapes the repository (`..`) or targets `.git`.
 * An empty string designates the repository root itself.
 */
export function normalizePath(raw: string): string | null {
  const components = raw.split('/').filter((component) => component !== '' && component !== '.');

  if (components.some((component) => component === '..')) {
    return null;
  }
  if (components[0] === '.git') {
    return null;
  }
  return components.join('/');
}

export function parentDirectories(path: string): string[] {
  const components = path.split('/');
  return components.slice(0, -1).map((_, index) => components.slice(0, index + 1).join('/'));
}

export function compareByteOrder(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}
