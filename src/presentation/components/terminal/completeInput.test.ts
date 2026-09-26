import { completeInput } from './completeInput';

describe('completeInput', () => {
  it('completes a unique candidate and adds a space', () => {
    expect(completeInput('git sta', { word: 'sta', candidates: ['status'] })).toEqual({
      input: 'git status ',
      suggestions: [],
    });
  });

  it('does not add a space after a folder', () => {
    expect(completeInput('cat s', { word: 's', candidates: ['src/'] }).input).toBe('cat src/');
  });

  it('extends to the common prefix and lists candidates', () => {
    expect(completeInput('git co', { word: 'co', candidates: ['commit', 'config'] })).toEqual({
      input: 'git co',
      suggestions: ['commit', 'config'],
    });
    expect(completeInput('git s', { word: 's', candidates: ['stash', 'status'] }).input).toBe(
      'git sta',
    );
  });
});
