import { suggestCommands } from './suggestCommands';

describe('suggestCommands', () => {
  const known = ['add', 'branch', 'checkout', 'commit', 'status', 'stash'];

  it('suggests the closest commands', () => {
    expect(suggestCommands('comit', known)).toEqual(['commit']);
    expect(suggestCommands('stats', known)).toEqual(['status']);
    expect(suggestCommands('stah', known)).toEqual(['stash']);
  });

  it('suggests nothing for unrelated words', () => {
    expect(suggestCommands('deploy', known)).toEqual([]);
    expect(suggestCommands('a', known)).toEqual([]);
  });
});
