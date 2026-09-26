import { explain, type CommandOutcome } from '@/application/git-commands/GitCommand';
import { deletePath, writeFile, type Workspace } from '@/domain/entities/Workspace';

import { hasFileAncestor, isDirectory, isFile, listDirectory, toProjectPath } from './projectPaths';

export interface Redirect {
  readonly target: string;
  readonly append: boolean;
}

export interface BuiltinInvocation {
  readonly args: readonly string[];
  readonly workspace: Workspace;
  readonly redirect: Redirect | null;
}

export interface Builtin {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  readonly acceptsRedirect?: boolean;
  run(invocation: BuiltinInvocation): CommandOutcome;
}

function outcome(
  workspace: Workspace,
  output: string,
  exitCode: number,
  key: string,
  params: Readonly<Record<string, string | number>> = {},
): CommandOutcome {
  return { workspace, output, exitCode, explanation: explain(key, params) };
}

/** Splits `-rf` style flags from operands. */
function splitFlags(args: readonly string[]): { flags: Set<string>; operands: string[] } {
  const flags = new Set<string>();
  const operands: string[] = [];
  for (const arg of args) {
    if (arg.startsWith('-') && arg.length > 1) {
      for (const flag of arg.slice(1)) {
        flags.add(flag);
      }
    } else {
      operands.push(arg);
    }
  }
  return { flags, operands };
}

/** Checks that a file can be written at `raw`, returning its normalized path or an error line. */
function writablePath(
  workspace: Workspace,
  command: string,
  raw: string,
): { path: string } | { error: string } {
  const path = toProjectPath(raw);
  if (path === null || path === '') {
    return { error: `${command}: ${raw}: outside the project` };
  }
  if (isDirectory(workspace, path)) {
    return { error: `${command}: ${raw}: Is a directory` };
  }
  if (hasFileAncestor(workspace, path)) {
    return { error: `${command}: ${raw}: Not a directory` };
  }
  return { path };
}

const echo: Builtin = {
  name: 'echo',
  usage: 'echo [-n] <text> [> <file> | >> <file>]',
  description: 'print text, or write it to a file (>> appends)',
  acceptsRedirect: true,
  run({ args, workspace, redirect }) {
    const omitNewline = args[0] === '-n';
    const text = (omitNewline ? args.slice(1) : args).join(' ');
    if (redirect === null) {
      return outcome(workspace, text, 0, 'shell.printed');
    }

    const target = writablePath(workspace, 'agitz', redirect.target);
    if ('error' in target) {
      return outcome(workspace, target.error, 1, 'shell.error', { command: 'echo' });
    }
    const content = `${text}${omitNewline ? '' : '\n'}`;
    const previous = redirect.append ? (workspace.files[target.path] ?? '') : '';
    return outcome(
      writeFile(workspace, target.path, previous + content),
      '',
      0,
      redirect.append ? 'shell.fileAppended' : 'shell.fileWritten',
      { path: target.path },
    );
  },
};

const touch: Builtin = {
  name: 'touch',
  usage: 'touch <file>...',
  description: 'create empty files',
  run({ args, workspace }) {
    if (args.length === 0) {
      return outcome(workspace, 'touch: missing file operand', 1, 'shell.error', {
        command: 'touch',
      });
    }
    let current = workspace;
    const errors: string[] = [];
    for (const raw of args) {
      const target = writablePath(current, 'touch', raw);
      if ('error' in target) {
        errors.push(target.error.replace('Is a directory', 'Is a directory (nothing to create)'));
      } else if (!isFile(current, target.path)) {
        current = writeFile(current, target.path, '');
      }
    }
    return outcome(current, errors.join('\n'), errors.length > 0 ? 1 : 0, 'shell.fileCreated', {
      path: args.join(', '),
    });
  },
};

const cat: Builtin = {
  name: 'cat',
  usage: 'cat <file>...',
  description: 'print the content of files',
  run({ args, workspace }) {
    const parts: string[] = [];
    let failed = false;
    for (const raw of args) {
      const path = toProjectPath(raw);
      if (path !== null && isFile(workspace, path)) {
        parts.push(workspace.files[path] ?? '');
      } else {
        failed = true;
        const reason =
          path !== null && isDirectory(workspace, path)
            ? 'Is a directory'
            : 'No such file or directory';
        parts.push(`cat: ${raw}: ${reason}\n`);
      }
    }
    return outcome(workspace, parts.join('').replace(/\n$/, ''), failed ? 1 : 0, 'shell.printed');
  },
};

const ls: Builtin = {
  name: 'ls',
  usage: 'ls [-a] [<path>]',
  description: 'list files and folders (-a also shows .git)',
  run({ args, workspace }) {
    const { flags, operands } = splitFlags(args);
    const raw = operands[0] ?? '.';
    const path = toProjectPath(raw);

    if (path !== null && isFile(workspace, path)) {
      return outcome(workspace, raw, 0, 'shell.listed');
    }
    if (path === null || !isDirectory(workspace, path)) {
      return outcome(
        workspace,
        `ls: cannot access '${raw}': No such file or directory`,
        2,
        'shell.error',
        {
          command: 'ls',
        },
      );
    }
    const entries = listDirectory(workspace, path);
    if (flags.has('a') && path === '' && workspace.repository !== null) {
      entries.unshift('.git/');
    }
    return outcome(workspace, entries.join('  '), 0, 'shell.listed');
  },
};

const rm: Builtin = {
  name: 'rm',
  usage: 'rm [-r] [-f] <path>...',
  description: 'delete files, or folders with -r',
  run({ args, workspace }) {
    const { flags, operands } = splitFlags(args);
    const recursive = flags.has('r') || flags.has('R');
    const force = flags.has('f');
    if (operands.length === 0) {
      return outcome(workspace, 'rm: missing operand', 1, 'shell.error', { command: 'rm' });
    }

    let current = workspace;
    const errors: string[] = [];
    for (const raw of operands) {
      const path = toProjectPath(raw);
      if (path !== null && path !== '' && isFile(current, path)) {
        current = deletePath(current, path);
      } else if (path !== null && path !== '' && isDirectory(current, path)) {
        if (recursive) {
          current = deletePath(current, path);
        } else {
          errors.push(`rm: cannot remove '${raw}': Is a directory`);
        }
      } else if (!force) {
        errors.push(`rm: cannot remove '${raw}': No such file or directory`);
      }
    }
    return outcome(current, errors.join('\n'), errors.length > 0 ? 1 : 0, 'shell.fileRemoved', {
      path: operands.join(', '),
    });
  },
};

const mkdir: Builtin = {
  name: 'mkdir',
  usage: 'mkdir <folder>',
  description: 'folders are created automatically with their first file',
  run({ args, workspace }) {
    const example = args[0] === undefined ? 'src' : args[0].replace(/\/$/, '');
    return outcome(
      workspace,
      [
        'agitz: folders exist as soon as they contain a file, and Git only tracks files.',
        `Create one inside it instead, for example: touch ${example}/index.ts`,
      ].join('\n'),
      0,
      'shell.implicitDirectories',
    );
  },
};

const pwd: Builtin = {
  name: 'pwd',
  usage: 'pwd',
  description: 'print the project folder',
  run({ workspace }) {
    return outcome(workspace, workspace.path, 0, 'shell.printed');
  },
};

export const FILE_BUILTINS: readonly Builtin[] = [ls, cat, echo, touch, rm, mkdir, pwd];
