import { GitError } from './GitError';

const ACCESS_ADVICE = [
  'fatal: Could not read from remote repository.',
  '',
  'Please make sure you have the correct access rights',
  'and the repository exists.',
];

export class RemoteAlreadyExistsError extends GitError {
  readonly code = 'remoteAlreadyExists';

  constructor(name: string) {
    super(`error: remote ${name} already exists.`, 3, { name });
  }
}

export class NoSuchRemoteError extends GitError {
  readonly code = 'noSuchRemote';

  constructor(name: string) {
    super(`error: No such remote: '${name}'`, 2, { name });
  }
}

/** A name that is neither a configured remote nor a URL. */
export class NotARemoteRepositoryError extends GitError {
  readonly code = 'notARemoteRepository';

  constructor(name: string) {
    super(
      [`fatal: '${name}' does not appear to be a git repository`, ...ACCESS_ADVICE].join('\n'),
      128,
      { name },
    );
  }
}

/** What GitHub answers for a URL that leads nowhere. */
export class RepositoryNotFoundError extends GitError {
  readonly code = 'repositoryNotFound';

  constructor(url: string) {
    super(
      ['remote: Repository not found.', `fatal: repository '${url}/' not found`].join('\n'),
      128,
      { url },
    );
  }
}

export class CloneDestinationNotEmptyError extends GitError {
  readonly code = 'cloneDestinationNotEmpty';

  constructor(directory: string) {
    super(
      `fatal: destination path '${directory}' already exists and is not an empty directory.`,
      128,
      { directory },
    );
  }
}

export class RemoteRefNotFoundError extends GitError {
  readonly code = 'remoteRefNotFound';

  constructor(ref: string) {
    super(`fatal: couldn't find remote ref ${ref}`, 128, { ref });
  }
}

export class NoPushDestinationError extends GitError {
  readonly code = 'noPushDestination';

  constructor() {
    super(
      [
        'fatal: No configured push destination.',
        'Either specify the URL from the command-line or configure a remote repository using',
        '',
        '    git remote add <name> <url>',
        '',
        'and then push using the remote name',
        '',
        '    git push <name>',
      ].join('\n'),
      128,
    );
  }
}

export class NoUpstreamBranchError extends GitError {
  readonly code = 'noUpstreamBranch';

  constructor(branch: string, remote: string) {
    super(
      [
        `fatal: The current branch ${branch} has no upstream branch.`,
        'To push the current branch and set the remote as upstream, use',
        '',
        `    git push --set-upstream ${remote} ${branch}`,
        '',
        'To have this happen automatically for branches without a tracking',
        "upstream, see 'push.autoSetupRemote' in 'git help config'.",
      ].join('\n'),
      128,
      { branch, remote },
    );
  }
}

export class PushFromDetachedHeadError extends GitError {
  readonly code = 'pushFromDetachedHead';

  constructor(remote: string) {
    super(
      [
        'fatal: You are not currently on a branch.',
        'To push the history leading to the current (detached HEAD)',
        'state now, use',
        '',
        `    git push ${remote} HEAD:<name-of-remote-branch>`,
      ].join('\n'),
      128,
      { remote },
    );
  }
}

export class SourceRefspecError extends GitError {
  readonly code = 'sourceRefspec';

  constructor(refspec: string, url: string) {
    super(
      [
        `error: src refspec ${refspec} does not match any`,
        `error: failed to push some refs to '${url}'`,
      ].join('\n'),
      1,
      { refspec },
    );
  }
}

export class NoTrackingInformationError extends GitError {
  readonly code = 'noTrackingInformation';

  constructor(branch: string, remote: string | null) {
    super(
      [
        'There is no tracking information for the current branch.',
        'Please specify which branch you want to merge with.',
        'See git-pull(1) for details.',
        '',
        '    git pull <remote> <branch>',
        '',
        'If you wish to set tracking information for this branch you can do so with:',
        '',
        `    git branch --set-upstream-to=${remote ?? '<remote>'}/<branch> ${branch}`,
      ].join('\n'),
      1,
      { branch },
    );
  }
}

export class PullFromDetachedHeadError extends GitError {
  readonly code = 'pullFromDetachedHead';

  constructor() {
    super(
      [
        'You are not currently on a branch.',
        'Please specify which branch you want to merge with.',
        'See git-pull(1) for details.',
        '',
        '    git pull <remote> <branch>',
      ].join('\n'),
      1,
    );
  }
}

export class UpstreamRefNotFetchedError extends GitError {
  readonly code = 'upstreamRefNotFetched';

  constructor(branch: string) {
    super(
      [
        `Your configuration specifies to merge with the ref 'refs/heads/${branch}'`,
        'from the remote, but no such ref was fetched.',
      ].join('\n'),
      1,
      { branch },
    );
  }
}

export class UpstreamBranchNotFoundError extends GitError {
  readonly code = 'upstreamBranchNotFound';

  constructor(name: string) {
    super(
      [
        `fatal: the requested upstream branch '${name}' does not exist`,
        'hint: ',
        'hint: If you are planning on basing your work on an upstream',
        'hint: branch that already exists at the remote, you may need to',
        'hint: run "git fetch" to retrieve it.',
        'hint: ',
        'hint: If you are planning to push out a new local branch that',
        'hint: will track its remote counterpart, you may want to use',
        'hint: "git push -u" to set the upstream config as you push.',
      ].join('\n'),
      128,
      { name },
    );
  }
}

export class NoUpstreamConfiguredError extends GitError {
  readonly code = 'noUpstreamConfigured';

  constructor(branch: string) {
    super(`fatal: branch '${branch}' has no upstream information`, 128, { branch });
  }
}

export class NoUpstreamForBranchError extends GitError {
  readonly code = 'noUpstreamForBranch';

  constructor(branch: string) {
    super(`fatal: no upstream configured for branch '${branch}'`, 128, { branch });
  }
}

export class InvalidRemoteNameError extends GitError {
  readonly code = 'invalidRemoteName';

  constructor(name: string) {
    super(`fatal: '${name}' is not a valid remote name`, 128, { name });
  }
}

export class PullBranchNotSpecifiedError extends GitError {
  readonly code = 'pullBranchNotSpecified';

  constructor(remote: string) {
    super(
      [
        `You asked to pull from the remote '${remote}', but did not specify`,
        'a branch. Because this is not the default configured remote',
        'for your current branch, you must specify a branch on the command line.',
      ].join('\n'),
      1,
      { remote },
    );
  }
}

export class LocalUpstreamNotSupportedError extends GitError {
  readonly code = 'localUpstreamNotSupported';

  constructor(name: string) {
    super(
      `agitz: tracking the local branch '${name}' is not supported yet; track a remote-tracking branch such as 'origin/${name}'`,
      1,
      { name },
    );
  }
}

export class DetachedHeadUpstreamError extends GitError {
  readonly code = 'detachedHeadUpstream';

  constructor(upstream: string) {
    super(
      `fatal: could not set upstream of HEAD to ${upstream} when it does not point to any branch.`,
      128,
      { upstream },
    );
  }
}
