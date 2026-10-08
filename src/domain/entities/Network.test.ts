import { DEFAULT_BRANCH_PROTECTION, findProtectedPushViolation } from './BranchProtection';
import {
  canonicalRepositoryUrl,
  createHostedRepository,
  displayRepositoryUrl,
  EMPTY_NETWORK,
  findBranchProtection,
  findHostedRepository,
  repositoryDirectoryName,
  setBranchProtection,
} from './Network';

const URL = 'https://github.com/alice/project.git';

describe('Network', () => {
  it.each([
    'https://github.com/alice/project',
    'https://github.com/alice/project.git',
    'https://github.com/alice/project.git/',
  ])('finds a hosted repository from %s', (url) => {
    const network = createHostedRepository(EMPTY_NETWORK, URL);
    expect(canonicalRepositoryUrl(url)).toBe(URL);
    expect(findHostedRepository(network, url)).toBeDefined();
  });

  it('creates empty repositories on the default branch', () => {
    const repository = findHostedRepository(createHostedRepository(EMPTY_NETWORK, URL), URL);
    expect(repository?.commits).toEqual({});
    expect(repository?.head).toEqual({ type: 'attached', branch: 'main' });
  });

  it('knows nothing about other URLs', () => {
    expect(findHostedRepository(EMPTY_NETWORK, URL)).toBeUndefined();
  });

  it('derives the display URL and the clone directory', () => {
    expect(displayRepositoryUrl(URL)).toBe('https://github.com/alice/project');
    expect(repositoryDirectoryName(URL)).toBe('project');
    expect(repositoryDirectoryName('git@github.com:bob/website.git')).toBe('website');
  });

  it('protects branches and lifts their protection', () => {
    const network = setBranchProtection(EMPTY_NETWORK, URL, 'main', DEFAULT_BRANCH_PROTECTION);
    expect(findBranchProtection(network, 'https://github.com/alice/project', 'main')).toBe(
      DEFAULT_BRANCH_PROTECTION,
    );
    expect(findBranchProtection(network, URL, 'develop')).toBeUndefined();
    expect(
      findBranchProtection(setBranchProtection(network, URL, 'main', null), URL, 'main'),
    ).toBeUndefined();
  });

  it('never lets a protected branch be deleted or rewritten', () => {
    const open = { requirePullRequest: false, requiredApprovals: 0, requireStatusChecks: false };
    expect(findProtectedPushViolation(open, { deletes: true, fastForward: false })).toBe('delete');
    expect(findProtectedPushViolation(open, { deletes: false, fastForward: false })).toBe(
      'forcePush',
    );
    expect(findProtectedPushViolation(open, { deletes: false, fastForward: true })).toBeNull();
    expect(
      findProtectedPushViolation(DEFAULT_BRANCH_PROTECTION, { deletes: false, fastForward: true }),
    ).toBe('pullRequest');
  });
});
