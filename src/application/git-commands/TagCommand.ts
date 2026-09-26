import { findTag, type Repository } from '@/domain/entities/Repository';
import type { Tag } from '@/domain/entities/Tag';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import type { GitError } from '@/domain/errors/GitError';
import { InvalidObjectNameError } from '@/domain/errors/RepositoryErrors';
import {
  EmptyTagMessageError,
  InvalidTagNameError,
  TagAlreadyExistsError,
  TagNotFoundError,
} from '@/domain/errors/TagErrors';
import { tryResolveRevision } from '@/domain/services/revision';
import { isValidBranchName } from '@/domain/value-objects/BranchName';
import { createCommitMessage } from '@/domain/value-objects/CommitMessage';
import { compareByteOrder } from '@/domain/value-objects/FilePath';
import { shortHash } from '@/domain/value-objects/Hash';

import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';

export type TagInput =
  | { readonly action: 'list'; readonly pattern?: string | undefined }
  | {
      readonly action: 'create';
      readonly name: string;
      readonly target?: string | undefined;
      /** Present for annotated tags (`-a -m`), the kind used for releases. */
      readonly message?: string | undefined;
      readonly annotated?: boolean;
      readonly force?: boolean;
    }
  | { readonly action: 'delete'; readonly names: readonly string[] };

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|\\/-]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export class TagCommand implements GitCommand<TagInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: TagInput): CommandOutcome {
    const repository = requireRepository(workspace);
    switch (input.action) {
      case 'list':
        return this.list(workspace, repository, input.pattern);
      case 'create':
        return this.create(workspace, repository, input);
      case 'delete':
        return this.delete(workspace, repository, input.names);
    }
  }

  private list(workspace: Workspace, repository: Repository, pattern: string | undefined) {
    const matcher = pattern === undefined ? null : globToRegExp(pattern);
    const names = Object.keys(repository.tags)
      .filter((name) => matcher === null || matcher.test(name))
      .sort(compareByteOrder);
    return succeed(workspace, names.join('\n'), explain('tag.listed', { count: names.length }));
  }

  private create(
    workspace: Workspace,
    repository: Repository,
    input: Extract<TagInput, { action: 'create' }>,
  ): CommandOutcome {
    const { name } = input;
    if (!isValidBranchName(name)) {
      throw new InvalidTagNameError(name);
    }
    if (findTag(repository, name) !== undefined && input.force !== true) {
      throw new TagAlreadyExistsError(name);
    }
    const target = tryResolveRevision(repository, input.target ?? 'HEAD');
    if (target === null) {
      throw new InvalidObjectNameError(input.target ?? 'HEAD');
    }

    const annotated = input.annotated === true || input.message !== undefined;
    let tag: Tag = { target, annotation: null };
    if (annotated) {
      if (input.message === undefined) {
        throw new EmptyTagMessageError();
      }
      let message: string;
      try {
        message = createCommitMessage(input.message);
      } catch {
        throw new EmptyTagMessageError();
      }
      tag = {
        target,
        annotation: { message, tagger: workspace.identity, taggedAt: this.context.clock.now() },
      };
    }

    return succeed(
      { ...workspace, repository: { ...repository, tags: { ...repository.tags, [name]: tag } } },
      '',
      explain(annotated ? 'tag.createdAnnotated' : 'tag.created', {
        name,
        commit: shortHash(target),
      }),
    );
  }

  private delete(
    workspace: Workspace,
    repository: Repository,
    names: readonly string[],
  ): CommandOutcome {
    const tags: Record<string, Tag> = { ...repository.tags };
    const lines: string[] = [];
    let firstError: GitError | null = null;

    for (const name of names) {
      const tag = Object.hasOwn(tags, name) ? tags[name] : undefined;
      if (tag === undefined) {
        const error = new TagNotFoundError(name);
        firstError ??= error;
        lines.push(error.message);
        continue;
      }
      lines.push(`Deleted tag '${name}' (was ${shortHash(tag.target)})`);
      Reflect.deleteProperty(tags, name);
    }

    return {
      workspace: { ...workspace, repository: { ...repository, tags } },
      output: lines.join('\n'),
      exitCode: firstError === null ? 0 : 1,
      explanation:
        firstError === null
          ? explain('tag.deleted', { names: names.join(', ') })
          : explain(`error.${firstError.code}`, firstError.params),
    };
  }
}
