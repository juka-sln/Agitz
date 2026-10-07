import { LANGUAGES } from '@/shared/language';

import { EXPLANATION_KEYS, formatExplanation } from './index';

const SOURCES = import.meta.glob<string>(
  ['/src/{domain,application,infrastructure}/**/*.ts', '!/src/**/*.test.ts'],
  { query: '?raw', import: 'default', eager: true },
);

const NAMESPACES = [
  'init',
  'add',
  'status',
  'commit',
  'log',
  'branch',
  'checkout',
  'merge',
  'rebase',
  'cherry-pick',
  'revert',
  'reset',
  'stash',
  'tag',
  'clone',
  'remote',
  'fetch',
  'pull',
  'push',
  'shell',
];

/** The sequencer builds these keys from the kind of operation it replays. */
const SEQUENCER_KEYS = ['cherry-pick', 'revert', 'rebase'].flatMap((kind) =>
  ['done', 'conflicts', 'aborted'].map((outcome) => `${kind}.${outcome}`),
);

/** Configuration names quoted inside real Git messages, which look like keys but are not. */
const GIT_CONFIG_NAMES = new Set(['push.autoSetupRemote']);

function emittedKeys(): Set<string> {
  const keys = new Set(SEQUENCER_KEYS);
  const literal = new RegExp(`'((?:${NAMESPACES.join('|')})\\.[a-zA-Z]+)'`, 'g');
  for (const source of Object.values(SOURCES)) {
    for (const [, key = ''] of source.matchAll(literal)) {
      if (!GIT_CONFIG_NAMES.has(key)) {
        keys.add(key);
      }
    }
    for (const [, code] of source.matchAll(/readonly code = '(\w+)'/g)) {
      keys.add(`error.${code ?? ''}`);
    }
  }
  return keys;
}

describe('explanation catalog', () => {
  it('explains every key the engine emits', () => {
    const emitted = emittedKeys();
    expect(emitted.size).toBeGreaterThan(100);
    const known = new Set<string>(EXPLANATION_KEYS);
    expect([...emitted].filter((key) => !known.has(key))).toEqual([]);
  });

  it('has no explanation the engine never emits', () => {
    const emitted = emittedKeys();
    expect(EXPLANATION_KEYS.filter((key) => !emitted.has(key))).toEqual([]);
  });

  it('fills in the parameters', () => {
    expect(formatExplanation('branch.created', { name: 'feature', commit: 'a1b2c3d' }, 'en')).toBe(
      'The branch `feature` was created on `a1b2c3d`. It is just a label: no file is copied and you stay on your current branch.',
    );
  });

  it('agrees nouns with counts', () => {
    expect(formatExplanation('log.shown', { count: 1 }, 'fr')).toMatch(/^1 commit affiché,/);
    expect(formatExplanation('log.shown', { count: 3 }, 'fr')).toMatch(/^3 commits affichés,/);
  });

  it('returns an empty string for unknown keys', () => {
    expect(formatExplanation('nope.unknown', {}, 'fr')).toBe('');
  });

  it.each(LANGUAGES)('leaves no placeholder unfilled in %s', (language) => {
    const params = new Proxy<Record<string, string>>({}, { get: () => 'x' });
    for (const key of EXPLANATION_KEYS) {
      expect(formatExplanation(key, params, language)).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });
});
