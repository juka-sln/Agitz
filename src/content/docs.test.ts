import { createGitEngine } from '@/infrastructure/git-engine/GitEngine';
import { createShell } from '@/infrastructure/shell/Shell';
import { LANGUAGES } from '@/shared/language';

import { DOC_CATALOG } from './catalog';
import {
  ALL_DOCS,
  COMMAND_DOCS,
  findDoc,
  findDocIdForCommandLine,
  GUIDE_DOCS,
  SHELL_PROGRAMS,
} from './docs';
import type { Doc } from './model';

function allText(doc: Doc): string[] {
  return LANGUAGES.flatMap((language) => {
    if (doc.kind === 'command') {
      const text = doc.text[language];
      return [
        text.summary,
        ...text.description,
        ...text.options.flatMap((option) => [option.syntax, option.text]),
        ...text.examples.map((example) => example.text),
        ...text.underTheHood,
        ...text.pitfalls,
      ];
    }
    const text = doc.text[language];
    return [
      text.summary,
      ...text.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
          block.type === 'paragraph' ? [block.text] : block.type === 'list' ? block.items : [],
        ),
      ),
    ];
  });
}

describe('documentation catalog', () => {
  it('gives every document a unique id', () => {
    const ids = ALL_DOCS.map((doc) => doc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('documents every command the engine runs', () => {
    const documented = new Set(COMMAND_DOCS.map((doc) => doc.id));
    expect(createGitEngine().availableCommands.filter((name) => !documented.has(name))).toEqual([]);
  });

  it('documents every shell program', () => {
    const programs = createShell().commandNames.filter((name) => name !== 'git');
    expect([...SHELL_PROGRAMS].sort()).toEqual([...programs].sort());
  });

  it('includes the mandatory guides', () => {
    expect(GUIDE_DOCS.map((guide) => guide.id)).toEqual(
      expect.arrayContaining([
        'commit-messages',
        'branching-strategy',
        'merge-vs-rebase',
        'gitignore',
        'semver',
        'code-review',
        'github-collaboration',
        'github-platform',
      ]),
    );
  });

  it.each(ALL_DOCS.map((doc) => [doc.id, doc] as const))(
    'links %s only to existing pages',
    (id, doc) => {
      expect(doc.related.length).toBeGreaterThan(0);
      for (const related of doc.related) {
        expect(related).not.toBe(id);
        expect(findDoc(related)).toBeDefined();
      }
    },
  );

  it.each(COMMAND_DOCS.map((doc) => [doc.id, doc] as const))(
    'fills every section of %s in both languages',
    (_id, doc) => {
      const [fr, en] = [doc.text.fr, doc.text.en];
      for (const text of [fr, en]) {
        expect(text.description.length).toBeGreaterThan(0);
        expect(text.options.length).toBeGreaterThan(0);
        expect(text.examples.length).toBeGreaterThan(0);
        expect(text.underTheHood.length).toBeGreaterThan(0);
        expect(text.pitfalls.length).toBeGreaterThan(0);
      }
      expect(en.examples.map((example) => example.command)).toEqual(
        fr.examples.map((example) => example.command),
      );
      expect(en.options).toHaveLength(fr.options.length);
      expect(en.description).toHaveLength(fr.description.length);
      expect(en.underTheHood).toHaveLength(fr.underTheHood.length);
      expect(en.pitfalls).toHaveLength(fr.pitfalls.length);
    },
  );

  it.each(GUIDE_DOCS.map((doc) => [doc.id, doc] as const))(
    'translates every block of %s',
    (_id, doc) => {
      const shape = (language: 'fr' | 'en') =>
        doc.text[language].sections.map((section) =>
          section.blocks.map((block) =>
            block.type === 'list' ? `list:${block.items.length}` : block.type,
          ),
        );
      expect(shape('en')).toEqual(shape('fr'));
    },
  );

  it('only shows examples the terminal understands', () => {
    const gitCommands = new Set(createGitEngine().availableCommands);
    for (const doc of COMMAND_DOCS) {
      for (const { command } of doc.text.fr.examples) {
        const [program, subcommand = ''] = command.split(' ');
        if (program === 'git') {
          expect(gitCommands, command).toContain(subcommand);
        } else {
          expect(SHELL_PROGRAMS, command).toContain(program);
        }
      }
    }
  });

  it('keeps the commit message examples under 50 characters', () => {
    const examples = findDoc('commit-messages');
    if (examples?.kind !== 'guide') {
      throw new Error('missing commit messages guide');
    }
    const subjects = examples.text.en.sections[3]?.blocks[0];
    expect(subjects?.type).toBe('code');
    for (const line of subjects?.type === 'code' ? subjects.code.split('\n') : []) {
      expect(line.length, line).toBeLessThanOrEqual(50);
    }
  });

  it.each(ALL_DOCS.map((doc) => [doc.id, doc] as const))(
    'closes every code and emphasis mark in %s',
    (_id, doc) => {
      for (const text of allText(doc)) {
        expect(text.split('`').length % 2, text).toBe(1);
        expect(text.replace(/`[^`]*`/g, '').split('**').length % 2, text).toBe(1);
      }
    },
  );
});

describe('DOC_CATALOG', () => {
  it('lists every page with its real title and category, in order', () => {
    const fromPages = ALL_DOCS.map((doc) =>
      doc.kind === 'command'
        ? { kind: doc.kind, id: doc.id, title: doc.title, category: doc.category }
        : { kind: doc.kind, id: doc.id, title: { fr: doc.text.fr.title, en: doc.text.en.title } },
    );

    expect(DOC_CATALOG).toEqual(fromPages);
  });
});

describe('findDocIdForCommandLine', () => {
  it.each([
    ['git commit -m "feat: add form"', 'commit'],
    ['git cherry-pick a1b2c3d', 'cherry-pick'],
    ['  git   status ', 'status'],
    ['echo "hello" > a.txt', 'shell'],
    ['ls -a', 'shell'],
    ['git push -u origin main', 'push'],
    ['git restore a.txt', null],
    ['git', null],
    ['git commit-messages', null],
    ['vim notes.txt', null],
    ['', null],
  ])('finds the page for %j', (commandLine, expected) => {
    expect(findDocIdForCommandLine(commandLine)).toBe(expected);
  });
});
