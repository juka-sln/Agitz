import { CloneCommand } from '@/application/git-commands/CloneCommand';
import { FetchCommand } from '@/application/git-commands/FetchCommand';
import type { GitCommandContext } from '@/application/git-commands/GitCommand';
import { PullCommand } from '@/application/git-commands/PullCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { RemoteCommand } from '@/application/git-commands/RemoteCommand';

import type { CliCommand } from '../CliCommand';
import { CommandLineError, NotSupportedError, UsageError } from '../CommandLineErrors';
import { hasOption } from '../parseArguments';

const REMOTE_USAGE = [
  'git remote [-v | --verbose]',
  '   or: git remote add <name> <url>',
  '   or: git remote rename <old> <new>',
  '   or: git remote remove <name>',
  '   or: git remote get-url <name>',
  '   or: git remote set-url <name> <newurl>',
].join('\n');

export function createRemoteCliCommand(): CliCommand {
  const command = new RemoteCommand();
  return {
    name: 'remote',
    summary: 'Manage set of tracked repositories',
    usage: REMOTE_USAGE,
    options: [{ name: 'verbose', short: 'v', long: 'verbose' }],
    execute(args, workspace) {
      const [subcommand, ...operands] = args.positionals;
      const expect = (count: number): string[] => {
        if (operands.length !== count) {
          throw new UsageError('error: wrong number of arguments', REMOTE_USAGE);
        }
        return operands;
      };
      switch (subcommand) {
        case undefined:
          return command.execute(workspace, {
            action: 'list',
            verbose: hasOption(args, 'verbose'),
          });
        case 'add': {
          const [name = '', url = ''] = expect(2);
          return command.execute(workspace, { action: 'add', name, url });
        }
        case 'remove':
        case 'rm': {
          const [name = ''] = expect(1);
          return command.execute(workspace, { action: 'remove', name });
        }
        case 'rename': {
          const [oldName = '', newName = ''] = expect(2);
          return command.execute(workspace, { action: 'rename', oldName, newName });
        }
        case 'get-url': {
          const [name = ''] = expect(1);
          return command.execute(workspace, { action: 'get-url', name });
        }
        case 'set-url': {
          const [name = '', url = ''] = expect(2);
          return command.execute(workspace, { action: 'set-url', name, url });
        }
        case 'show':
        case 'prune':
        case 'update':
        case 'set-head':
        case 'set-branches':
          throw new NotSupportedError(`'git remote ${subcommand}'`);
        default:
          throw new UsageError(`error: unknown subcommand: \`${subcommand}'`, REMOTE_USAGE);
      }
    },
  };
}

export function createCloneCliCommand(): CliCommand {
  const command = new CloneCommand();
  return {
    name: 'clone',
    summary: 'Clone a repository into a new directory',
    usage: 'git clone <repo> [<dir>]',
    options: [],
    execute(args, workspace, network) {
      const [url, directory, ...extra] = args.positionals;
      if (url === undefined) {
        throw new CommandLineError('fatal: You must specify a repository to clone.', 129);
      }
      if (extra.length > 0) {
        throw new CommandLineError('fatal: Too many arguments.', 129);
      }
      if (directory?.replace(/\/+$/, '').includes('/') === true) {
        throw new NotSupportedError('cloning into a nested directory');
      }
      return command.execute(workspace, { network, url, directory });
    },
  };
}

export function createFetchCliCommand(): CliCommand {
  const command = new FetchCommand();
  return {
    name: 'fetch',
    summary: 'Download objects and refs from another repository',
    usage: 'git fetch [--all] [-p | --prune] [<remote> [<branch>...]]',
    options: [
      { name: 'all', long: 'all' },
      { name: 'prune', short: 'p', long: 'prune' },
    ],
    execute(args, workspace, network) {
      const [remote, ...branches] = args.positionals;
      if (hasOption(args, 'all') && remote !== undefined) {
        throw new CommandLineError('fatal: fetch --all does not take a repository argument');
      }
      return command.execute(workspace, {
        network,
        remote,
        branches,
        all: hasOption(args, 'all'),
        prune: hasOption(args, 'prune'),
      });
    },
  };
}

export function createPullCliCommand(context: GitCommandContext): CliCommand {
  const command = new PullCommand(context);
  return {
    name: 'pull',
    summary: 'Fetch from and integrate with another repository or a local branch',
    usage: 'git pull [--rebase | --no-rebase | --ff-only] [<remote> [<branch>]]',
    options: [
      { name: 'rebase', short: 'r', long: 'rebase' },
      { name: 'noRebase', long: 'no-rebase' },
      { name: 'fastForwardOnly', long: 'ff-only' },
    ],
    execute(args, workspace, network) {
      const [remote, branch, ...extra] = args.positionals;
      if (extra.length > 0) {
        throw new NotSupportedError('pulling several branches at once');
      }
      let mode: 'merge' | 'rebase' | undefined;
      if (hasOption(args, 'rebase')) {
        mode = 'rebase';
      } else if (hasOption(args, 'noRebase')) {
        mode = 'merge';
      }
      return command.execute(workspace, {
        network,
        remote,
        branch,
        mode,
        fastForwardOnly: hasOption(args, 'fastForwardOnly'),
      });
    },
  };
}

export function createPushCliCommand(): CliCommand {
  const command = new PushCommand();
  return {
    name: 'push',
    summary: 'Update remote refs along with associated objects',
    usage: [
      'git push [-u | --set-upstream] [-f | --force | --force-with-lease] [--tags]',
      '         [<remote> [<refspec>...]]',
      '   or: git push (-d | --delete) <remote> <ref>...',
    ].join('\n'),
    options: [
      { name: 'setUpstream', short: 'u', long: 'set-upstream' },
      { name: 'force', short: 'f', long: 'force' },
      { name: 'forceWithLease', long: 'force-with-lease' },
      { name: 'tags', long: 'tags' },
      { name: 'delete', short: 'd', long: 'delete' },
    ],
    execute(args, workspace, network) {
      const [remote, ...refspecs] = args.positionals;
      if (hasOption(args, 'delete') && refspecs.length === 0) {
        throw new CommandLineError("fatal: --delete doesn't make sense without any refs");
      }
      return command.execute(workspace, {
        network,
        remote,
        refspecs,
        setUpstream: hasOption(args, 'setUpstream'),
        force: hasOption(args, 'force'),
        forceWithLease: hasOption(args, 'forceWithLease'),
        tags: hasOption(args, 'tags'),
        delete: hasOption(args, 'delete'),
      });
    },
  };
}
