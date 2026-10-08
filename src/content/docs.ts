import { addDoc } from './commands/add';
import { branchDoc } from './commands/branch';
import { checkoutDoc } from './commands/checkout';
import { cherryPickDoc } from './commands/cherryPick';
import { cloneDoc } from './commands/clone';
import { commitDoc } from './commands/commit';
import { fetchDoc } from './commands/fetch';
import { initDoc } from './commands/init';
import { logDoc } from './commands/log';
import { mergeDoc } from './commands/merge';
import { pullDoc } from './commands/pull';
import { pushDoc } from './commands/push';
import { rebaseDoc } from './commands/rebase';
import { remoteDoc } from './commands/remote';
import { resetDoc } from './commands/reset';
import { revertDoc } from './commands/revert';
import { shellDoc } from './commands/shell';
import { stashDoc } from './commands/stash';
import { statusDoc } from './commands/status';
import { tagDoc } from './commands/tag';
import { branchingStrategyGuide } from './guides/branchingStrategy';
import { codeReviewGuide } from './guides/codeReview';
import { commitMessagesGuide } from './guides/commitMessages';
import { githubCollaborationGuide } from './guides/githubCollaboration';
import { githubPlatformGuide } from './guides/githubPlatform';
import { gitignoreGuide } from './guides/gitignore';
import { mergeVsRebaseGuide } from './guides/mergeVsRebase';
import { semverGuide } from './guides/semver';
import type { CommandCategory, CommandDoc, Doc, GuideDoc } from './model';

export const COMMAND_CATEGORIES: readonly CommandCategory[] = [
  'basics',
  'branches',
  'undo',
  'remote',
  'shell',
];

export const COMMAND_DOCS: readonly CommandDoc[] = [
  initDoc,
  statusDoc,
  addDoc,
  commitDoc,
  logDoc,
  branchDoc,
  checkoutDoc,
  mergeDoc,
  rebaseDoc,
  cherryPickDoc,
  tagDoc,
  resetDoc,
  revertDoc,
  stashDoc,
  cloneDoc,
  remoteDoc,
  fetchDoc,
  pullDoc,
  pushDoc,
  shellDoc,
];

export const GUIDE_DOCS: readonly GuideDoc[] = [
  commitMessagesGuide,
  branchingStrategyGuide,
  mergeVsRebaseGuide,
  gitignoreGuide,
  semverGuide,
  codeReviewGuide,
  githubCollaborationGuide,
  githubPlatformGuide,
];

export const ALL_DOCS: readonly Doc[] = [...COMMAND_DOCS, ...GUIDE_DOCS];

const DOCS_BY_ID = new Map(ALL_DOCS.map((doc) => [doc.id, doc]));

/** Programs of the simulated shell, all documented on the same page. */
export const SHELL_PROGRAMS: readonly string[] = [
  'cat',
  'clear',
  'echo',
  'help',
  'ls',
  'mkdir',
  'pwd',
  'rm',
  'touch',
];

export function findDoc(id: string): Doc | undefined {
  return DOCS_BY_ID.get(id);
}

/** The page explaining what was typed: `git commit -m "…"` leads to the `commit` page. */
export function findDocIdForCommandLine(commandLine: string): string | null {
  const [program, subcommand] = commandLine.trim().split(/\s+/);
  if (program === 'git') {
    const doc = subcommand === undefined ? undefined : DOCS_BY_ID.get(subcommand);
    return doc?.kind === 'command' ? doc.id : null;
  }
  return program !== undefined && SHELL_PROGRAMS.includes(program) ? shellDoc.id : null;
}
