import type { Language, Localized } from '@/shared/language';

import type { CommandCategory } from './model';

/**
 * What the always-visible interface needs to know about each page — its id and title — without
 * pulling in the pages themselves, which only load once the documentation is opened.
 */
export type DocCatalogEntry =
  | {
      readonly kind: 'command';
      readonly id: string;
      readonly title: string;
      readonly category: CommandCategory;
    }
  | { readonly kind: 'guide'; readonly id: string; readonly title: Localized<string> };

function command(id: string, category: CommandCategory, title = `git ${id}`): DocCatalogEntry {
  return { kind: 'command', id, title, category };
}

function guide(id: string, fr: string, en: string): DocCatalogEntry {
  return { kind: 'guide', id, title: { fr, en } };
}

export const DOC_CATALOG: readonly DocCatalogEntry[] = [
  command('init', 'basics'),
  command('status', 'basics'),
  command('add', 'basics'),
  command('commit', 'basics'),
  command('log', 'basics'),
  command('branch', 'branches'),
  command('checkout', 'branches'),
  command('merge', 'branches'),
  command('rebase', 'branches'),
  command('cherry-pick', 'branches'),
  command('tag', 'branches'),
  command('reset', 'undo'),
  command('revert', 'undo'),
  command('stash', 'undo'),
  command('clone', 'remote'),
  command('remote', 'remote'),
  command('fetch', 'remote'),
  command('pull', 'remote'),
  command('push', 'remote'),
  command('shell', 'shell', 'ls · cat · echo · touch · rm'),
  guide('commit-messages', 'Écrire de bons messages de commit', 'Writing good commit messages'),
  guide(
    'branching-strategy',
    'Stratégie de branches : Git Flow simplifié',
    'Branching strategy: simplified Git Flow',
  ),
  guide('merge-vs-rebase', 'Merge ou rebase ?', 'Merge or rebase?'),
  guide('resolving-conflicts', 'Résoudre un conflit', 'Resolving a conflict'),
  guide('gitignore', 'Écrire un bon .gitignore', 'Writing a good .gitignore'),
  guide('semver', 'Semantic Versioning', 'Semantic Versioning'),
  guide('code-review', 'Étiquette de la revue de code', 'Code review etiquette'),
  guide(
    'github-collaboration',
    'Collaborer sur GitHub : fork, pull request, protection',
    'Collaborating on GitHub: fork, pull request, protection',
  ),
  guide(
    'github-platform',
    'GitHub au-delà de Git : issues, Actions, releases',
    'GitHub beyond Git: issues, Actions, releases',
  ),
];

const CATALOG_BY_ID = new Map(DOC_CATALOG.map((entry) => [entry.id, entry]));

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

export function docTitle(id: string, language: Language): string {
  const entry = CATALOG_BY_ID.get(id);
  if (entry === undefined) {
    return id;
  }
  return entry.kind === 'command' ? entry.title : entry.title[language];
}

/** The page explaining what was typed: `git commit -m "…"` leads to the `commit` page. */
export function findDocIdForCommandLine(commandLine: string): string | null {
  const [program, subcommand] = commandLine.trim().split(/\s+/);
  if (program === 'git') {
    const entry = subcommand === undefined ? undefined : CATALOG_BY_ID.get(subcommand);
    return entry?.kind === 'command' ? entry.id : null;
  }
  return program !== undefined && SHELL_PROGRAMS.includes(program) ? 'shell' : null;
}
