import { interpolate } from './interpolate';

describe('interpolate', () => {
  it('replaces placeholders with their values', () => {
    expect(interpolate('{count} commits on {branch}', { count: 3, branch: 'main' })).toBe(
      '3 commits on main',
    );
  });

  it('keeps unknown placeholders', () => {
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
  });
});
