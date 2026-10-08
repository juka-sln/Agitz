import { PROBLEM_CODES } from './problemMessages';

const SOURCES = import.meta.glob<string>(
  ['/src/{domain,application}/**/*.ts', '!/src/**/*.test.ts'],
  { query: '?raw', import: 'default', eager: true },
);

function refusedCodes(): Set<string> {
  const codes = new Set<string>();
  for (const source of Object.values(SOURCES)) {
    // The code is the first argument, possibly chosen by a conditional between two literals.
    for (const [, argument = ''] of source.matchAll(/GitHubRuleError\(([^,)]*)/g)) {
      for (const [, code = ''] of argument.matchAll(/(?:^\s*|[?:]\s*)'(\w+)'/g)) {
        codes.add(code);
      }
    }
  }
  return codes;
}

describe('GitHub problem messages', () => {
  it('words every refusal of the virtual GitHub', () => {
    const codes = refusedCodes();
    expect(codes.size).toBeGreaterThan(20);
    expect([...codes].filter((code) => !PROBLEM_CODES.includes(code))).toEqual([]);
    expect(PROBLEM_CODES.filter((code) => !codes.has(code))).toEqual([]);
  });
});
