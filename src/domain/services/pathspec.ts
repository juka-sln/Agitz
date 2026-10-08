import { InvalidPathError } from '../errors/WorkingTreeErrors';
import { normalizePath } from '../value-objects/FilePath';

export interface Pathspec {
  readonly original: string;
  readonly matches: (path: string) => boolean;
}

const GLOB_CHARACTERS = /[*?[]/;

function globToRegExp(glob: string): RegExp {
  let pattern = '';
  for (const character of glob) {
    if (character === '*') {
      pattern += '.*';
    } else if (character === '?') {
      pattern += '.';
    } else if (character === '[' || character === ']') {
      pattern += character;
    } else {
      pattern += character.replace(/[.+^${}()|\\/-]/g, '\\$&');
    }
  }
  return new RegExp(`^${pattern}$`);
}

/**
 * A pathspec designates either the whole repository (`.`), a file, a directory
 * (matching everything below it) or a glob such as `*.ts` (where `*` also crosses `/`).
 */
export function parsePathspec(raw: string, repositoryPath: string): Pathspec {
  const normalized = normalizePath(raw);
  if (normalized === null) {
    throw new InvalidPathError(raw, repositoryPath);
  }
  if (normalized === '') {
    return { original: raw, matches: () => true };
  }
  if (GLOB_CHARACTERS.test(normalized)) {
    const regExp = globToRegExp(normalized);
    return { original: raw, matches: (path) => regExp.test(path) };
  }
  return {
    original: raw,
    matches: (path) => path === normalized || path.startsWith(`${normalized}/`),
  };
}
