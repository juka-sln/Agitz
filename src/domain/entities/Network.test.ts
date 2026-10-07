import {
  canonicalRepositoryUrl,
  createHostedRepository,
  displayRepositoryUrl,
  EMPTY_NETWORK,
  findHostedRepository,
  repositoryDirectoryName,
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
});
