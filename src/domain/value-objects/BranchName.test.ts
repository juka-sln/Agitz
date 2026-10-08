import { InvalidBranchNameError } from '../errors/BranchErrors';

import { isValidBranchName, parseBranchName } from './BranchName';

describe('BranchName', () => {
  it.each(['main', 'feature/login', 'fix-42', 'release/1.2.0', 'user.name'])(
    'accepts %s',
    (name) => {
      expect(isValidBranchName(name)).toBe(true);
    },
  );

  it.each([
    '',
    'HEAD',
    '@',
    '-feature',
    'feature/',
    '/feature',
    'a..b',
    'a b',
    'a~1',
    'a^',
    'a:b',
    'what?',
    'star*',
    'a[b',
    'back\\slash',
    'double//slash',
    '.hidden',
    'feature/.hidden',
    'ends.',
    'refs.lock',
    'at@{brace',
  ])('rejects %j', (name) => {
    expect(isValidBranchName(name)).toBe(false);
  });

  it('throws the message Git prints for an invalid name', () => {
    expect(() => parseBranchName('my branch')).toThrow(InvalidBranchNameError);
    expect(() => parseBranchName('my branch')).toThrow(
      "fatal: 'my branch' is not a valid branch name",
    );
  });
});
