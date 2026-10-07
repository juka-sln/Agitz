import type { Network } from '@/domain/entities/Network';
import type { Workspace } from '@/domain/entities/Workspace';

import type { Clock } from '../ports/Clock';
import type { ObjectHasher } from '../ports/ObjectHasher';

export interface GitCommandContext {
  readonly hasher: ObjectHasher;
  readonly clock: Clock;
}

export type ExplanationParams = Readonly<Record<string, string | number>>;

/** Identifies a pedagogical explanation; the presentation layer turns it into localized text. */
export interface Explanation {
  readonly key: string;
  readonly params: ExplanationParams;
}

export interface CommandOutcome {
  readonly workspace: Workspace;
  readonly output: string;
  readonly exitCode: number;
  readonly explanation: Explanation;
  /** The hosted repositories after the command, set only by commands that talk to a remote. */
  readonly network?: Network | undefined;
}

export interface GitCommand<TInput> {
  execute(workspace: Workspace, input: TInput): CommandOutcome;
}

export function explain(key: string, params: ExplanationParams = {}): Explanation {
  return { key, params };
}

export function succeed(
  workspace: Workspace,
  output: string,
  explanation: Explanation,
): CommandOutcome {
  return { workspace, output, exitCode: 0, explanation };
}
