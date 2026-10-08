import { branchNames } from '@/domain/entities/Repository';
import type { Workspace } from '@/domain/entities/Workspace';

import { isDirectory, listDirectory } from './projectPaths';

export interface Completion {
  /** The partial word being completed (the text after the last space). */
  readonly word: string;
  readonly candidates: readonly string[];
}

const GIT_COMMANDS_TAKING_REVISIONS = new Set([
  'checkout',
  'branch',
  'log',
  'switch',
  'merge',
  'rebase',
]);
const GIT_COMMANDS_TAKING_PATHS = new Set(['add', 'checkout', 'diff', 'reset', 'restore', 'rm']);
const SHELL_COMMANDS_TAKING_PATHS = new Set(['ls', 'cat', 'touch', 'rm', 'echo']);

function pathCandidates(workspace: Workspace, word: string): string[] {
  const slash = word.lastIndexOf('/');
  const directory = slash === -1 ? '' : word.slice(0, slash);
  if (!isDirectory(workspace, directory)) {
    return [];
  }
  const prefix = slash === -1 ? '' : `${directory}/`;
  return listDirectory(workspace, directory).map((entry) => `${prefix}${entry}`);
}

/** Candidates for the last word of a partially typed command line. */
export function completeCommandLine(
  line: string,
  workspace: Workspace,
  shellCommands: readonly string[],
  gitCommands: readonly string[],
): Completion {
  const words = line.trimStart().split(/\s+/);
  const word = words.at(-1) ?? '';
  const position = words.length - 1;
  const [program, subcommand] = words;

  let pool: string[] = [];
  if (position === 0) {
    pool = ['git', ...shellCommands];
  } else if (program === 'git' && position === 1) {
    pool = [...gitCommands];
  } else if (program === 'git' && subcommand !== undefined) {
    if (GIT_COMMANDS_TAKING_REVISIONS.has(subcommand) && workspace.repository) {
      pool.push(...branchNames(workspace.repository), ...Object.keys(workspace.repository.tags));
    }
    if (GIT_COMMANDS_TAKING_PATHS.has(subcommand)) {
      pool.push(...pathCandidates(workspace, word));
    }
  } else if (program !== undefined && SHELL_COMMANDS_TAKING_PATHS.has(program)) {
    pool = pathCandidates(workspace, word);
  }

  const candidates = [...new Set(pool)].filter((candidate) => candidate.startsWith(word)).sort();
  return { word, candidates };
}
